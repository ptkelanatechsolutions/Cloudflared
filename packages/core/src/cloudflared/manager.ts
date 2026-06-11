import { spawn, type ChildProcess } from "node:child_process";
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

const MAX_LOG_LINES = 500;
const SPAWN_TIMEOUT_MS = 30_000;

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
    this.state = "starting";

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
      }, SPAWN_TIMEOUT_MS);

      child.on("spawn", () => {
        clearTimeout(this.spawnTimeoutId);
        this.spawnTimeoutId = undefined;
        this.startedAt = new Date().toISOString();
        if (this.state === "starting") this.state = "running";
      });

      child.on("error", (err) => {
        clearTimeout(this.spawnTimeoutId);
        this.spawnTimeoutId = undefined;
        this.pendingRestart = null;
        this.state = "error";
        this.lastError = err.message;
        this.child = null;
      });

      child.on("exit", (code, signal) => {
        clearTimeout(this.spawnTimeoutId);
        this.spawnTimeoutId = undefined;
        this.exitCode = code;
        this.exitSignal = signal;
        this.child = null;
        const restart = this.pendingRestart;
        this.pendingRestart = null;

        if (restart) {
          this.state = "stopped";
          this.start(restart.token, restart.settings);
          return;
        }

        if (this.state === "stopping" || code === 0) {
          this.state = "stopped";
        } else {
          this.state = "error";
          this.lastError = `cloudflared exited with code ${code ?? signal}`;
        }
      });
    } catch (err) {
      clearTimeout(this.spawnTimeoutId);
      this.spawnTimeoutId = undefined;
      this.state = "error";
      this.lastError = err instanceof Error ? err.message : String(err);
      this.child = null;
    }

    return this.status();
  }

  stop(): TunnelStatus {
    this.pendingRestart = null;
    if (this.child) {
      this.state = "stopping";
      try {
        this.child.kill("SIGTERM");
      } catch {
        // Process may have already exited — handle is stale on Windows.
        this.state = "stopped";
        this.child = null;
      }
    } else {
      this.state = "stopped";
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
      try {
        this.child.kill("SIGTERM");
      } catch {
        // child already exited — the exit handler will pick up pendingRestart
        // after the error handler runs first.
      }
    }
    return this.status();
  }

  private appendLog(chunk: Buffer): void {
    const text = this.partialLine + chunk.toString();
    const lines = text.split(/\r?\n/);
    // The last element is either an empty string (text ended with \n) or
    // an incomplete line fragment that belongs to the next chunk.
    this.partialLine = lines.pop() ?? "";
    for (const line of lines) {
      if (line.length > 0) {
        this.logs.push(line);
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
  // --metrics is a top-level cloudflared flag and must precede the subcommand.
  if (settings.metricsEnabled) {
    args.push("--metrics", `0.0.0.0:${settings.metricsPort}`);
  }
  args.push("tunnel", "run");
  if (settings.protocol !== "auto") args.push("--protocol", settings.protocol);
  if (settings.region === "us") args.push("--region", "us");
  if (settings.edgeIpVersion !== "auto") args.push("--edge-ip-version", settings.edgeIpVersion);
  // Token is passed via TUNNEL_TOKEN env var in spawn() — never on the CLI.
  return args;
}

// Module-level singleton — one manager per Next.js server process.
const globalRef = globalThis as unknown as { __cloudflaredManager?: CloudflaredManager };
export const cloudflaredManager: CloudflaredManager =
  globalRef.__cloudflaredManager ?? (globalRef.__cloudflaredManager = new CloudflaredManager());
