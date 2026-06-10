"use client";

import type { DashboardState } from "@/lib/dashboard";
import { useTunnel } from "@/components/use-tunnel";
import { HeroCard } from "@/components/sections/hero-card";
import { SettingsCard } from "@/components/sections/settings-card";
import { TokenCard } from "@/components/sections/token-card";
import { ObservabilityCard } from "@/components/sections/observability-card";

export function TunnelControl({ initial }: { initial: DashboardState }) {
  const t = useTunnel(initial);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[88rem] flex-col">
      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-12">
        <HeroCard t={t} />
        <TokenCard t={t} />
        <SettingsCard t={t} />
        <ObservabilityCard t={t} />
      </div>
    </div>
  );
}
