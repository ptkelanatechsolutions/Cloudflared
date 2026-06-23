"use client";

import { AnimatePresence, motion } from "motion/react";
import { Loader2, Power, Radio, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { PanelShell } from "@/components/panel-shell";
import { Eyebrow } from "@/components/eyebrow";
import { PulseDot } from "@/components/pulse-dot";
import { RuntimeChip } from "@/components/runtime-chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EASE, TONE_TEXT } from "@/lib/tunnel";
import type { Tunnel } from "@/components/use-tunnel";

export function HeroCard({ t }: { t: Tunnel }) {
  return (
    <PanelShell reducedMotion={t.reducedMotion} delay={0} className="xl:col-span-7">
      <CardHeader className="gap-4 px-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2.5">
            <Eyebrow icon={Radio}>Tunnel Runtime</Eyebrow>
            <div className="flex items-center gap-3">
              <PulseDot tone={t.meta.tone} />
              <h1
                id="tunnel-status-label"
                className={cn(
                  "font-heading text-3xl font-semibold tracking-tight sm:text-4xl",
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
                initial={{ opacity: 0, y: t.reducedMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: t.reducedMotion ? 0 : -6 }}
                transition={{ duration: 0.3, ease: EASE }}
                className={cn(
                  "max-w-lg text-sm leading-6",
                  t.status.state === "error" ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {t.subline}
              </motion.p>
            </AnimatePresence>
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
      <CardContent className="flex flex-col gap-4 px-5 pb-5">
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Operational posture</p>
              <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{t.meta.detail}</p>
            </div>
            {t.pendingRestart ? (
              <Badge variant="outline" className="rounded-full px-2.5 text-xs">
                Pending restart
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {t.online ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  disabled={t.busy}
                  variant="secondary"
                  className="h-10 rounded-xl px-4 text-sm"
                >
                  {t.busy ? (
                    <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
                  ) : (
                    <Power className="size-4" strokeWidth={1.8} />
                  )}
                  Stop tunnel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Stop tunnel?</DialogTitle>
                  <DialogDescription>
                    This will disconnect the tunnel and stop serving traffic. You can start it again
                    at any time.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={t.handleToggleTunnel}
                    className="h-10 rounded-xl px-4"
                  >
                    Stop tunnel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              onClick={t.handleToggleTunnel}
              disabled={t.busy || !t.tokenReady}
              variant="default"
              className="h-10 rounded-xl px-4 text-sm"
            >
              {t.busy ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
              ) : (
                <Power className="size-4" strokeWidth={1.8} />
              )}
              Start tunnel
            </Button>
          )}
          <Button
            onClick={t.handleRestartTunnel}
            disabled={t.busy || !t.tokenReady}
            variant="ghost"
            className="h-10 rounded-xl border border-border bg-card px-4"
          >
            <RotateCw className="size-4" strokeWidth={1.8} />
            Restart
          </Button>
        </div>
      </CardContent>
    </PanelShell>
  );
}
