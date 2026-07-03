import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { resolve4 } from "node:dns/promises";
import { connect } from "node:net";
import type { TunnelSettings } from "../schema/config";

export type TunnelState = "stopped" | "starting" | "running" | "stopping" | "error";

export interface TunnelStatus {
  state: TunnelState;
  pid: number | null;
  startedAt: string | null;
  exitCode: number | null;
  exitSignal: string | null;
  lastError: string | null;
}

export interface ConnectorInfo {
  id: string | null;
  location: string | null;
}

export interface StateTransition {
  state: TunnelState;
  timestamp: string;
}

export interface TunnelMetrics {
  connections: number;
  totalEgressBytes: number;
  totalIngressBytes: number;
  egressRate: number;
  ingressRate: number;
}

export interface TunnelMetricsSnapshot {
  timestamp: string;
  metrics: TunnelMetrics;
}

export interface DiagnosticsResult {
  binary: { ok: boolean; message: string };
  dns: { ok: boolean; message: string };
  edge: { ok: boolean; message: string };
  metrics: { ok: boolean; message: string };
  environment: { node: string; platform: string; arch: string };
}

const MAX_LOG_LINES = 500;
const SPAWN_TIMEOUT_MS = 30_000;
const MAX_STATE_HISTORY = 50;
const MAX_METRICS_HISTORY = 120;
const METRICS_POLL_MS = 10_000;

/**
 * Owns the single long-lived `cloudflared` child process. Held as a
 * module-level singleton so it survives across Next.js requests for the
 * lifetime of the server process.
 */
export class CloudflaredManager {
  private child: ChildProcess | null = null;
  private state: TunnelState = "stopped";
  private startedAt: string | null = null;
  private exitCode: number | null = null;
  private exitSignal: string | null = null;
  private lastError: string | null = null;
  private logs: string[] = [];
  private partialLine = "";
  private spawnTimeoutId: ReturnType<typeof setTimeout> | undefined;
  private pendingRestart: { token: string; settings: TunnelSettings } | null = null;
  private lastToken = "";
  private lastSettings: TunnelSettings = {
    protocol: "auto",
    region: "auto",
    edgeIpVersion: "auto",
    metricsEnabled: false,
    metricsPort: 60123,
    autoStart: true,
    gracePeriod: 0,
    logLevel: "info",
    scheduledRestartHours: 0,
  };
  private restartTimer: ReturnType<typeof setInterval> | undefined;
  private metricsPollTimer: ReturnType<typeof setInterval> | undefined;
  private metricsCache: TunnelMetricsSnapshot | null = null;
  private metricsHistory: TunnelMetricsSnapshot[] = [];
  private connectorId: string | null = null;
  private edgeLocation: string | null = null;
  private stateHistory: StateTransition[] = [];

  status(): TunnelStatus {
    return {
      state: this.state,
      pid: this.child?.pid ?? null,
      startedAt: this.startedAt,
      exitCode: this.exitCode,
      exitSignal: this.exitSignal,
      lastError: this.lastError,
    };
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  isRunning(): boolean {
    return this.state === "starting" || this.state === "running";
  }

  getConnectorInfo(): ConnectorInfo {
    return { id: this.connectorId, location: this.edgeLocation };
  }

  getStateHistory(): StateTransition[] {
    return [...this.stateHistory];
  }

  getMetrics(): { latest: TunnelMetrics | null; history: TunnelMetricsSnapshot[] } {
    return { latest: this.metricsCache?.metrics ?? null, history: [...this.metricsHistory] };
  }

  start(token: string, settings: TunnelSettings): TunnelStatus {
    // `child` stays non-null through starting/running/stopping, so this also
    // blocks a restart while a previous process is still shutting down.
    if (this.child || this.isRunning()) return this.status();

    if (!token) {
      this.state = "error";
      this.lastError = "Tunnel token is empty.";
      return this.status();
    }

    this.logs = [];
    this.partialLine = "";
    this.exitCode = null;
    this.exitSignal = null;
    this.lastError = null;
    this.connectorId = null;
    this.edgeLocation = null;
    this.metricsCache = null;
    this.metricsHistory = [];
    this.recordTransition("starting");

    try {
      const bin = process.env.CLOUDFLARED_BIN ?? "cloudflared";
      const child = spawn(bin, buildArgs(settings), {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, TUNNEL_TOKEN: token },
      });
      this.child = child;

      child.stdout?.on("data", (chunk: Buffer) => this.appendLog(chunk));
      child.stderr?.on("data", (chunk: Buffer) => this.appendLog(chunk));

      this.spawnTimeoutId = setTimeout(() => {
        if (this.state !== "starting") return;
        this.state = "error";
        this.lastError = "cloudflared failed to start within 30s";
        this.child = null;
        this.pendingRestart = null;
        this.spawnTimeoutId = undefined;
        this.recordTransition("error");
      }, SPAWN_TIMEOUT_MS);

      child.on("spawn", () => {
        clearTimeout(this.spawnTimeoutId);
        this.spawnTimeoutId = undefined;
        this.startedAt = new Date().toISOString();
        if (this.state === "starting") {
          this.state = "running";
          this.recordTransition("running");
          this.lastToken = token;
          this.lastSettings = settings;
          this.scheduleRestart(settings);
          this.startMetricsPolling(settings);
        }
      });

      child.on("error", (err) => {
        clearTimeout(this.spawnTimeoutId);
        this.spawnTimeoutId = undefined;
        this.pendingRestart = null;
        this.state = "error";
        this.lastError = err.message;
        this.child = null;
        this.recordTransition("error");
      });

      child.on("exit", (code, signal) => {
        clearTimeout(this.spawnTimeoutId);
        this.spawnTimeoutId = undefined;
        this.exitCode = code;
        this.exitSignal = signal;
        this.child = null;
        this.clearTimers();
        const restart = this.pendingRestart;
        this.pendingRestart = null;

        if (restart) {
          this.state = "stopped";
          this.recordTransition("stopped");
          this.start(restart.token, restart.settings);
          return;
        }

        if (this.state === "stopping" || code === 0) {
          this.state = "stopped";
          this.recordTransition("stopped");
        } else {
          this.state = "error";
          this.lastError = `cloudflared exited with code ${code ?? signal}`;
          this.recordTransition("error");
        }
      });
    } catch (err) {
      clearTimeout(this.spawnTimeoutId);
      this.spawnTimeoutId = undefined;
      this.state = "error";
      this.lastError = err instanceof Error ? err.message : String(err);
      this.child = null;
      this.recordTransition("error");
    }

    return this.status();
  }

  stop(): TunnelStatus {
    this.pendingRestart = null;
    this.clearTimers();
    if (this.child) {
      this.state = "stopping";
      this.recordTransition("stopping");
      try {
        this.child.kill("SIGTERM");
      } catch {
        this.state = "stopped";
        this.child = null;
      }
    } else {
      this.state = "stopped";
      this.recordTransition("stopped");
    }
    return this.status();
  }

  restart(token: string, settings: TunnelSettings): TunnelStatus {
    if (!token) {
      this.pendingRestart = null;
      this.state = "error";
      this.lastError = "Tunnel token is empty.";
      return this.status();
    }

    if (!this.child) {
      return this.start(token, settings);
    }

    this.pendingRestart = { token, settings };
    if (this.state !== "stopping") {
      this.state = "stopping";
      this.recordTransition("stopping");
      try {
        this.child.kill("SIGTERM");
      } catch {
        // child already exited — the exit handler will pick up pendingRestart
      }
    }
    return this.status();
  }

  /* ── Diagnostics ──────────────────────────────────── */

  async runDiagnostics(): Promise<DiagnosticsResult> {
    const result: DiagnosticsResult = {
      binary: { ok: false, message: "" },
      dns: { ok: false, message: "" },
      edge: { ok: false, message: "" },
      metrics: { ok: false, message: "" },
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    // Binary
    try {
      const bin = process.env.CLOUDFLARED_BIN ?? "cloudflared";
      execFileSync("which", [bin], { timeout: 5000, stdio: "ignore" });
      result.binary = { ok: true, message: `${bin} found in PATH` };
    } catch {
      result.binary = { ok: false, message: `cloudflared binary not found in PATH` };
    }

    // DNS
    try {
      const addrs = await resolve4("api.cloudflare.com");
      result.dns = {
        ok: true,
        message: `api.cloudflare.com resolved to ${addrs.join(", ")}`,
      };
    } catch (err) {
      result.dns = { ok: false, message: `DNS resolution failed: ${(err as Error).message}` };
    }

    // Edge connectivity
    try {
      await new Promise<void>((resolve, reject) => {
        const sock = connect(7844, "region1.v2.argotunnel.com", () => {
          sock.destroy();
          resolve();
        });
        sock.on("error", reject);
        sock.setTimeout(5000, () => {
          sock.destroy();
          reject(new Error("Connection timed out after 5s"));
        });
      });
      result.edge = { ok: true, message: "TCP connection to edge succeeded" };
    } catch (err) {
      result.edge = { ok: false, message: `Edge connection failed: ${(err as Error).message}` };
    }

    // Metrics
    if (this.state === "running" && this.metricsCache) {
      result.metrics = {
        ok: true,
        message: `${this.metricsCache.metrics.connections} active connections`,
      };
    } else {
      result.metrics = {
        ok: false,
        message: this.state !== "running" ? "Tunnel not running" : "No metrics data yet",
      };
    }

    return result;
  }

  /* ── Private: state history ────────────────────────── */

  private recordTransition(state: TunnelState): void {
    this.state = state;
    this.stateHistory.push({ state, timestamp: new Date().toISOString() });
    if (this.stateHistory.length > MAX_STATE_HISTORY) {
      this.stateHistory = this.stateHistory.slice(-MAX_STATE_HISTORY);
    }
  }

  /* ── Private: connector parsing ─────────────────────── */

  private parseConnectorInfo(line: string): void {
    if (!this.connectorId) {
      const idMatch =
        line.match(/connector[=:]\s*([a-f0-9-]{36})/i) ??
        line.match(/connector\s+ID[=:]\s*([a-f0-9-]{36})/i);
      if (idMatch) this.connectorId = idMatch[1];
    }
    if (!this.edgeLocation) {
      const locMatch = line.match(/location[=:]\s*([A-Z]{3,})/i);
      if (locMatch) this.edgeLocation = locMatch[1];
    }
  }

  /* ── Private: scheduled restart ─────────────────────── */

  private scheduleRestart(settings: TunnelSettings): void {
    this.clearRestartTimer();
    if (settings.scheduledRestartHours > 0) {
      const ms = settings.scheduledRestartHours * 3_600_000;
      this.restartTimer = setInterval(() => {
        if (this.isRunning()) {
          this.restart(this.lastToken, this.lastSettings);
        }
      }, ms);
    }
  }

  private clearRestartTimer(): void {
    if (this.restartTimer !== undefined) {
      clearInterval(this.restartTimer);
      this.restartTimer = undefined;
    }
  }

  /* ── Private: metrics polling ───────────────────────── */

  private startMetricsPolling(settings: TunnelSettings): void {
    this.clearMetricsPollTimer();
    if (!settings.metricsEnabled) return;
    const poll = (): void => {
      void this.fetchMetrics(settings.metricsPort);
    };
    poll(); // immediate first fetch
    this.metricsPollTimer = setInterval(poll, METRICS_POLL_MS);
  }

  private async fetchMetrics(port: number): Promise<void> {
    if (this.state !== "running") return;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/metrics`, {
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) return;
      const text = await res.text();
      const lines = text.split("\n");

      let connections = 0;
      let totalEgressBytes = 0;
      let totalIngressBytes = 0;

      for (const line of lines) {
        if (line.startsWith("cloudflared_tunnel_ha_connections")) {
          const parts = line.split(/\s+/);
          connections = Number(parts[parts.length - 1]) || 0;
        } else if (line.startsWith("cloudflared_tunnel_total_egress_bytes")) {
          const parts = line.split(/\s+/);
          totalEgressBytes = Number(parts[parts.length - 1]) || 0;
        } else if (line.startsWith("cloudflared_tunnel_total_ingress_bytes")) {
          const parts = line.split(/\s+/);
          totalIngressBytes = Number(parts[parts.length - 1]) || 0;
        }
      }

      const prev = this.metricsCache?.metrics;
      const egressRate = prev
        ? Math.max(0, totalEgressBytes - prev.totalEgressBytes) / (METRICS_POLL_MS / 1000)
        : 0;
      const ingressRate = prev
        ? Math.max(0, totalIngressBytes - prev.totalIngressBytes) / (METRICS_POLL_MS / 1000)
        : 0;

      const snapshot: TunnelMetricsSnapshot = {
        timestamp: new Date().toISOString(),
        metrics: { connections, totalEgressBytes, totalIngressBytes, egressRate, ingressRate },
      };

      this.metricsCache = snapshot;
      this.metricsHistory.push(snapshot);
      if (this.metricsHistory.length > MAX_METRICS_HISTORY) {
        this.metricsHistory = this.metricsHistory.slice(-MAX_METRICS_HISTORY);
      }
    } catch {
      // Silently ignore fetch errors — metrics are best-effort
    }
  }

  private clearMetricsPollTimer(): void {
    if (this.metricsPollTimer !== undefined) {
      clearInterval(this.metricsPollTimer);
      this.metricsPollTimer = undefined;
    }
  }

  private clearTimers(): void {
    this.clearRestartTimer();
    this.clearMetricsPollTimer();
  }

  /* ── Private: log capture ────────────────────────────── */

  private appendLog(chunk: Buffer): void {
    const text = this.partialLine + chunk.toString();
    const lines = text.split(/\r?\n/);
    // The last element is either an empty string (text ended with \n) or
    // an incomplete line fragment that belongs to the next chunk.
    this.partialLine = lines.pop() ?? "";
    for (const line of lines) {
      if (line.length > 0) {
        this.logs.push(line);
        this.parseConnectorInfo(line);
      }
    }
    if (this.logs.length > MAX_LOG_LINES) {
      this.logs = this.logs.slice(-MAX_LOG_LINES);
    }
  }
}

/** Translate stored settings into `cloudflared tunnel run` CLI arguments. */
export function buildArgs(settings: TunnelSettings): string[] {
  const args: string[] = [];
  // --metrics and --grace-period are top-level cloudflared flags and must precede the subcommand.
  if (settings.metricsEnabled) {
    args.push("--metrics", `0.0.0.0:${settings.metricsPort}`);
  }
  if (settings.gracePeriod > 0) {
    args.push("--grace-period", String(settings.gracePeriod));
  }
  args.push("tunnel", "run");
  if (settings.protocol !== "auto") args.push("--protocol", settings.protocol);
  if (settings.region === "us") args.push("--region", "us");
  if (settings.edgeIpVersion !== "auto") args.push("--edge-ip-version", settings.edgeIpVersion);
  if (settings.logLevel !== "info") args.push("--loglevel", settings.logLevel);
  // Token is passed via TUNNEL_TOKEN env var in spawn() — never on the CLI.
  return args;
}

// Module-level singleton — one manager per Next.js server process.
const globalRef = globalThis as unknown as { __cloudflaredManager?: CloudflaredManager };
export const cloudflaredManager: CloudflaredManager =
  globalRef.__cloudflaredManager ?? (globalRef.__cloudflaredManager = new CloudflaredManager());
