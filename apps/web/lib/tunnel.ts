import type { TunnelSettings, TunnelState } from "@cloudflared/core";

export const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
export const POLL_MS = 3000;
export const CONNECTION_TIMEOUT_MS = POLL_MS * 4;
export const LOG_FOLLOW_THRESHOLD = 24;

export type Tone = "active" | "idle" | "error";
export type ToggleOption<T extends string> = {
  value: T;
  label: string;
};

export const PROTOCOL_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "http2", label: "HTTP2" },
  { value: "quic", label: "QUIC" },
] as const satisfies ReadonlyArray<ToggleOption<TunnelSettings["protocol"]>>;

export const REGION_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "us", label: "US" },
] as const satisfies ReadonlyArray<ToggleOption<TunnelSettings["region"]>>;

export const EDGE_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "4", label: "IPv4" },
  { value: "6", label: "IPv6" },
] as const satisfies ReadonlyArray<ToggleOption<TunnelSettings["edgeIpVersion"]>>;

export const LOG_LEVEL_OPTIONS: ToggleOption<TunnelSettings["logLevel"]>[] = [
  { value: "debug", label: "Debug" },
  { value: "info", label: "Info" },
  { value: "warn", label: "Warn" },
  { value: "error", label: "Error" },
  { value: "fatal", label: "Fatal" },
] as const;

export const STATE_META: Record<
  TunnelState,
  {
    label: string;
    tone: Tone;
    badge: string;
    detail: string;
  }
> = {
  running: {
    label: "Online",
    tone: "active",
    badge: "Connected",
    detail: "Tunnel is serving traffic.",
  },
  starting: {
    label: "Connecting",
    tone: "active",
    badge: "Launching",
    detail: "Cloudflared is negotiating the edge session.",
  },
  stopping: {
    label: "Stopping",
    tone: "active",
    badge: "Stopping",
    detail: "Gracefully shutting the current child process down.",
  },
  stopped: {
    label: "Offline",
    tone: "idle",
    badge: "Idle",
    detail: "Tunnel is not running.",
  },
  error: {
    label: "Error",
    tone: "error",
    badge: "Attention",
    detail: "Review diagnostics and logs to recover cleanly.",
  },
};

export const TONE_TEXT: Record<Tone, string> = {
  active: "text-foreground",
  idle: "text-muted-foreground",
  error: "text-destructive",
};

export const TONE_DOT: Record<Tone, string> = {
  active: "bg-status-active",
  idle: "bg-muted-foreground",
  error: "bg-destructive",
};

export function settingsEqual(a: TunnelSettings, b: TunnelSettings): boolean {
  return (
    a.protocol === b.protocol &&
    a.region === b.region &&
    a.edgeIpVersion === b.edgeIpVersion &&
    a.metricsEnabled === b.metricsEnabled &&
    a.metricsPort === b.metricsPort &&
    a.autoStart === b.autoStart &&
    a.gracePeriod === b.gracePeriod &&
    a.logLevel === b.logLevel &&
    a.scheduledRestartHours === b.scheduledRestartHours
  );
}

export function formatTimestamp(value: string | null): string | null {
  if (!value) return null;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatUptime(startedAt: string | null, state: TunnelState): string {
  if (!startedAt || (state !== "running" && state !== "starting")) return "Offline";

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatTimeAgo(iso: string): string {
  const elapsed = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (elapsed < 60) return `${elapsed}s ago`;
  if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
  if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`;
  return `${Math.floor(elapsed / 86400)}d ago`;
}

export function formatConnectorId(id: string | null): string | null {
  if (!id || id.length <= 8) return id;
  return `${id.slice(0, 8)}...`;
}
