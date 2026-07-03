"use server";

import {
  cloudflaredManager,
  configStore,
  tunnelSettingsSchema,
  appConfigSchema,
  type TunnelSettings,
} from "@cloudflared/core";
import type { DashboardState } from "@/lib/dashboard";

async function snapshot(): Promise<DashboardState> {
  const config = await configStore.read();
  return {
    status: cloudflaredManager.status(),
    settings: config.settings,
    tokenSet: config.token.length > 0,
    logs: cloudflaredManager.getLogs(),
    connectorInfo: cloudflaredManager.getConnectorInfo(),
    stateHistory: cloudflaredManager.getStateHistory(),
    metrics: cloudflaredManager.getMetrics().latest,
  };
}

export async function getState(): Promise<DashboardState> {
  return snapshot();
}

export async function saveToken(token: string): Promise<DashboardState> {
  await configStore.update({ token: token.trim() });
  return snapshot();
}

export async function saveSettings(input: TunnelSettings): Promise<DashboardState> {
  const settings = tunnelSettingsSchema.parse(input);
  await configStore.update({ settings });
  return snapshot();
}

export async function startTunnel(): Promise<DashboardState> {
  const config = await configStore.read();
  cloudflaredManager.start(config.token, config.settings);
  return snapshot();
}

export async function stopTunnel(): Promise<DashboardState> {
  cloudflaredManager.stop();
  return snapshot();
}

export async function restartTunnel(): Promise<DashboardState> {
  const config = await configStore.read();
  cloudflaredManager.restart(config.token, config.settings);
  return snapshot();
}

export async function saveSettingsAndRestart(input: TunnelSettings): Promise<DashboardState> {
  const settings = tunnelSettingsSchema.parse(input);
  const config = await configStore.update({ settings });
  cloudflaredManager.restart(config.token, config.settings);
  return snapshot();
}

/* ── Export / Import config ──────────────────────────── */

export async function exportConfig(includeToken: boolean): Promise<string> {
  const config = await configStore.read();
  if (!includeToken) {
    return JSON.stringify({ settings: config.settings }, null, 2);
  }
  return JSON.stringify(config, null, 2);
}

export async function importConfig(json: string): Promise<DashboardState> {
  const parsed = JSON.parse(json);
  const config = appConfigSchema.parse(parsed);
  await configStore.write(config);
  if (cloudflaredManager.isRunning()) {
    cloudflaredManager.restart(config.token, config.settings);
  }
  return snapshot();
}

/* ── Diagnostics ─────────────────────────────────────── */

export async function runDiagnostics() {
  return cloudflaredManager.runDiagnostics();
}

/* ── Version checker ────────────────────────────────── */

const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0-dev";
const GITHUB_RELEASES_API =
  "https://api.github.com/repos/ptkelanatechsolutions/Cloudflared/releases/latest";

export interface VersionCheck {
  current: string;
  latest: string | null;
  hasUpdate: boolean;
}

function semverGt(a: string, b: string): boolean {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return true;
    if (pa[i] < pb[i]) return false;
  }
  return false;
}

export async function checkVersion(): Promise<VersionCheck> {
  try {
    const res = await fetch(GITHUB_RELEASES_API, {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) {
      return { current: CURRENT_VERSION, latest: null, hasUpdate: false };
    }
    const data = (await res.json()) as { tag_name?: string };
    const tag = data.tag_name;
    if (!tag || !/^\d+\.\d+\.\d+$/.test(tag)) {
      return { current: CURRENT_VERSION, latest: null, hasUpdate: false };
    }
    const hasUpdate = semverGt(tag, CURRENT_VERSION);
    return { current: CURRENT_VERSION, latest: tag, hasUpdate };
  } catch {
    return { current: CURRENT_VERSION, latest: null, hasUpdate: false };
  }
}
