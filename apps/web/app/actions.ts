"use server";

import {
  cloudflaredManager,
  configStore,
  tunnelSettingsSchema,
  type TunnelSettings,
} from "@cloudflared/core";
import type { DashboardState } from "@/lib/dashboard";

async function snapshot(): Promise<DashboardState> {
  const config = await configStore.read();
  return {
    status: cloudflaredManager.status(),
    settings: config.settings,
    tokenSet: config.token.length > 0,
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

/* ── Version checker ────────────────────────────────── */

const CURRENT_VERSION = "1.2.0";
const GHCR_TAGS_URL = "https://ghcr.io/v2/ptkelanatechsolutions/cloudflared/tags/list";

export interface VersionCheck {
  current: string;
  latest: string | null;
  hasUpdate: boolean;
}

function isValidSemver(s: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(s);
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
    const res = await fetch(GHCR_TAGS_URL, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { current: CURRENT_VERSION, latest: null, hasUpdate: false };
    }
    const data = (await res.json()) as { tags?: string[] };
    const tags = (data.tags ?? []).filter(isValidSemver);
    if (tags.length === 0) {
      return { current: CURRENT_VERSION, latest: null, hasUpdate: false };
    }
    const sorted = tags.sort((a, b) => (semverGt(a, b) ? -1 : 1));
    const latest = sorted[0] ?? null;
    const hasUpdate = latest ? semverGt(latest, CURRENT_VERSION) : false;
    return { current: CURRENT_VERSION, latest, hasUpdate };
  } catch {
    return { current: CURRENT_VERSION, latest: null, hasUpdate: false };
  }
}
