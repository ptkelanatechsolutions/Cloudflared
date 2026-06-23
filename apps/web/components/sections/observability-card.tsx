"use client";

import { Activity, Clock3, Gauge, Logs, Waypoints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { PanelShell } from "@/components/panel-shell";
import { Separator } from "@/components/ui/separator";
import { Eyebrow } from "@/components/eyebrow";
import { RuntimeField } from "@/components/runtime-field";
import { LogDialog } from "@/components/sections/log-dialog";
import { formatTimestamp, formatUptime } from "@/lib/tunnel";
import type { Tunnel } from "@/components/use-tunnel";

export function ObservabilityCard({ t }: { t: Tunnel }) {
  return (
    <PanelShell reducedMotion={t.reducedMotion} delay={0.12} className="xl:col-span-5">
      <CardContent className="flex flex-col gap-4 px-5 pt-5 pb-5">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow icon={Logs}>Observability</Eyebrow>
          {t.online && (
            <Badge variant="outline" className="rounded-full px-2.5 text-xs">
              Live
            </Badge>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <RuntimeField icon={Activity} label="State" value={t.meta.badge} hint={t.meta.detail} />
          <RuntimeField
            icon={Clock3}
            label="Uptime"
            value={formatUptime(t.status.startedAt, t.status.state)}
            hint={
              t.status.startedAt
                ? (formatTimestamp(t.status.startedAt) ?? "")
                : "Waiting for the first successful start."
            }
          />
          <RuntimeField
            icon={Waypoints}
            label="PID / Exit"
            value={`${t.status.pid ?? "-"} / ${t.status.exitCode ?? "-"}`}
            hint="Current child PID and the last recorded exit code."
          />
          <RuntimeField
            icon={Gauge}
            label="Metrics"
            value={
              t.state.settings.metricsEnabled ? `:${t.state.settings.metricsPort}` : "Disabled"
            }
            hint={t.metricsUrl ?? "Enable metrics to expose a scrape target."}
          />
        </div>

        {t.status.lastError ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/25 bg-destructive/10 p-3.5"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <Activity className="size-4" strokeWidth={1.8} />
              Last error
            </div>
            <p className="mt-1 text-sm leading-5 text-destructive">{t.status.lastError}</p>
          </div>
        ) : null}

        <Separator />

        <LogDialog t={t} />
      </CardContent>
    </PanelShell>
  );
}
