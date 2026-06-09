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
