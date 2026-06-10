import type { TunnelSettings, TunnelStatus } from "@cloudflared/core";

/** Everything the dashboard UI needs in one round-trip. */
export interface DashboardState {
  status: TunnelStatus;
  settings: TunnelSettings;
  /** Whether a token is persisted — the token itself never leaves the server. */
  tokenSet: boolean;
  logs: string[];
}
