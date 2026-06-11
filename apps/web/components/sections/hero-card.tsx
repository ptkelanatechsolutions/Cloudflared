"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Loader2, Power, Radio, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { PanelShell } from "@/components/panel-shell";
import { Eyebrow } from "@/components/eyebrow";
import { PulseDot } from "@/components/pulse-dot";
import { RuntimeChip } from "@/components/runtime-chip";
import { cn } from "@/lib/utils";
import { EASE, TONE_TEXT } from "@/lib/tunnel";
import type { Tunnel } from "@/components/use-tunnel";

export function HeroCard({ t }: { t: Tunnel }) {
  return (
    <PanelShell reducedMotion={t.reducedMotion} delay={0} className="md:col-span-4 xl:col-span-12">
      <CardHeader className="gap-5 px-6 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Eyebrow icon={Radio}>Tunnel Runtime</Eyebrow>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <PulseDot tone={t.meta.tone} />
                <h1
                  id="tunnel-status-label"
                  className={cn(
                    "font-mono text-4xl font-semibold tracking-tight sm:text-5xl",
                    TONE_TEXT[t.meta.tone],
                  )}
                >
                  {t.meta.label}
                </h1>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={t.subline}
                  id="tunnel-status-desc"
                  aria-describedby="tunnel-status-label"
                  initial={{ opacity: 0, y: t.reducedMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: t.reducedMotion ? 0 : -10 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className={cn(
                    "max-w-xl text-sm leading-6",
                    t.status.state === "error" ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {t.subline}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <Badge variant={t.statusBadgeVariant} className="rounded-full px-3 py-1 text-xs">
            {t.meta.badge}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <RuntimeChip label="Protocol" value={t.state.settings.protocol} />
          <RuntimeChip label="Region" value={t.state.settings.region} />
          <RuntimeChip
            label="Metrics"
            value={t.state.settings.metricsEnabled ? "Enabled" : "Disabled"}
          />
        </div>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-6 px-6 pb-6">
        <div className="rounded-[1.6rem] border border-border bg-muted/25 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Operational posture</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{t.meta.detail}</p>
            </div>
            {t.pendingRestart ? (
              <Badge variant="outline" className="rounded-full px-2.5 text-[11px]">
                Pending restart
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="mt-auto grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Button
            onClick={t.handleToggleTunnel}
            disabled={t.busy || (!t.online && !t.tokenReady)}
            variant={t.online ? "secondary" : "default"}
            className="group/cta h-12 rounded-full pr-2 pl-5 text-sm active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              {t.busy ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
              ) : (
                <Power className="size-4" strokeWidth={1.8} />
              )}
              {t.online ? "Stop tunnel" : "Start tunnel"}
            </span>
            <span
              className={cn(
                "ml-auto flex size-8 items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-1 group-hover/cta:-translate-y-px",
                t.online ? "bg-secondary-foreground/10" : "bg-primary-foreground/15",
              )}
            >
              <ArrowUpRight className="size-4" strokeWidth={1.8} />
            </span>
          </Button>
          <Button
            onClick={t.handleRestartTunnel}
            disabled={t.busy || !t.tokenReady}
            variant="ghost"
            className="h-12 rounded-full border border-border bg-card px-4 active:scale-[0.98]"
          >
            <RotateCw className="size-4" strokeWidth={1.8} />
            Restart
          </Button>
        </div>
      </CardContent>
    </PanelShell>
  );
}
