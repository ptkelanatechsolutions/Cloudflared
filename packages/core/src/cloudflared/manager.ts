import { spawn, type ChildProcess } from "node:child_process";
import type { TunnelSettings } from "../schema/config";

export type TunnelState = "stopped" | "starting" | "running" | "stopping" | "error";

export interface TunnelStatus {
  state: TunnelState;
  pid: number | null;
  startedAt: string | null;
  exitCode: number | null;
  lastError: string | null;
}

const MAX_LOG_LINES = 500;
/** Overridable for tests / non-standard installs; defaults to PATH lookup. */
const CLOUDFLARED_BIN = process.env.CLOUDFLARED_BIN ?? "cloudflared";

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
  private lastError: string | null = null;
  private logs: string[] = [];
  private pendingRestart: { token: string; settings: TunnelSettings } | null = null;

  status(): TunnelStatus {
    return {
      state: this.state,
      pid: this.child?.pid ?? null,
      startedAt: this.startedAt,
      exitCode: this.exitCode,
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
    this.exitCode = null;
    this.lastError = null;
    this.state = "starting";
    this.startedAt = new Date().toISOString();

    try {
      const child = spawn(CLOUDFLARED_BIN, buildArgs(token, settings), {
        stdio: ["ignore", "pipe", "pipe"],
      });
      this.child = child;

      child.stdout?.on("data", (chunk: Buffer) => this.appendLog(chunk));
      child.stderr?.on("data", (chunk: Buffer) => this.appendLog(chunk));

      child.on("spawn", () => {
        if (this.state === "starting") this.state = "running";
      });

      child.on("error", (err) => {
        this.pendingRestart = null;
        this.state = "error";
        this.lastError = err.message;
        this.child = null;
      });

      child.on("exit", (code, signal) => {
        this.exitCode = code;
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
      this.child.kill("SIGTERM");
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
      this.child.kill("SIGTERM");
    }
    return this.status();
  }

  private appendLog(chunk: Buffer): void {
    const lines = chunk
      .toString()
      .split(/\r?\n/)
      .filter((line) => line.length > 0);
    this.logs.push(...lines);
    if (this.logs.length > MAX_LOG_LINES) {
      this.logs = this.logs.slice(-MAX_LOG_LINES);
    }
  }
}

/** Translate stored settings into `cloudflared tunnel run` CLI arguments. */
function buildArgs(token: string, settings: TunnelSettings): string[] {
  const args: string[] = [];
  // --metrics is a top-level cloudflared flag and must precede the subcommand.
  if (settings.metricsEnabled) {
    args.push("--metrics", `0.0.0.0:${settings.metricsPort}`);
  }
  args.push("tunnel", "run");
  if (settings.protocol !== "auto") args.push("--protocol", settings.protocol);
  if (settings.region === "us") args.push("--region", "us");
  if (settings.edgeIpVersion !== "auto") args.push("--edge-ip-version", settings.edgeIpVersion);
  args.push("--token", token);
  return args;
}

// Module-level singleton — one manager per Next.js server process.
const globalRef = globalThis as unknown as { __cloudflaredManager?: CloudflaredManager };
export const cloudflaredManager: CloudflaredManager =
  globalRef.__cloudflaredManager ?? (globalRef.__cloudflaredManager = new CloudflaredManager());
