"use client";

import { Activity } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { PanelShell } from "@/components/panel-shell";
import { Eyebrow } from "@/components/eyebrow";
import { PerformanceGraph } from "@/components/performance-graph";
import type { Tunnel } from "@/components/use-tunnel";

export function PerformanceGraphCard({ t }: { t: Tunnel }) {
  return (
    <PanelShell reducedMotion={t.reducedMotion} delay={0.18} className="xl:col-span-12">
      <CardContent className="space-y-3 px-5 pt-5 pb-5">
        <Eyebrow icon={Activity}>Traffic &amp; Connections</Eyebrow>
        <PerformanceGraph history={t.metricsHistory} tunnelOnline={t.online} />
      </CardContent>
    </PanelShell>
  );
}
