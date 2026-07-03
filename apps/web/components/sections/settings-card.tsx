"use client";

import { Database, Gauge, Globe, Loader2, Network, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputContainer } from "@/components/ui/input-container";
import { Label } from "@/components/ui/label";
import { PanelShell } from "@/components/panel-shell";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Eyebrow } from "@/components/eyebrow";
import { SwitchField } from "@/components/switch-field";
import { EDGE_OPTIONS, LOG_LEVEL_OPTIONS, PROTOCOL_OPTIONS, REGION_OPTIONS } from "@/lib/tunnel";
import type { TunnelSettings } from "@cloudflared/core";
import type { Tunnel } from "@/components/use-tunnel";

export function SettingsCard({ t }: { t: Tunnel }) {
  return (
    <PanelShell reducedMotion={t.reducedMotion} delay={0.02} className="xl:col-span-7">
      <CardContent className="flex flex-col gap-4 px-5 pt-5 pb-5">
        <Eyebrow icon={Gauge}>Tunnel Settings</Eyebrow>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Protocol */}
          <div className="space-y-2.5">
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                <Globe className="size-3.5" strokeWidth={1.8} />
                Protocol
              </Label>
              <p className="text-xs leading-5 text-muted-foreground">Tunnel transport.</p>
            </div>
            <ToggleGroup
              type="single"
              value={t.visibleSettings.protocol}
              disabled={t.busy}
              onValueChange={(next) => {
                if (next) t.handleDraftChange({ protocol: next as TunnelSettings["protocol"] });
              }}
              spacing={0}
              className="w-full rounded-lg bg-muted/30 p-0.5"
            >
              {PROTOCOL_OPTIONS.map((o) => (
                <ToggleGroupItem
                  key={o.value}
                  value={o.value}
                  className="h-8 flex-1 rounded-md text-xs font-medium uppercase data-[state=on]:bg-card data-[state=on]:shadow-xs"
                >
                  {o.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Region */}
          <div className="space-y-2.5">
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                <Globe className="size-3.5" strokeWidth={1.8} />
                Region
              </Label>
              <p className="text-xs leading-5 text-muted-foreground">Edge preference.</p>
            </div>
            <ToggleGroup
              type="single"
              value={t.visibleSettings.region}
              disabled={t.busy}
              onValueChange={(next) => {
                if (next) t.handleDraftChange({ region: next as TunnelSettings["region"] });
              }}
              spacing={0}
              className="w-full rounded-lg bg-muted/30 p-0.5"
            >
              {REGION_OPTIONS.map((o) => (
                <ToggleGroupItem
                  key={o.value}
                  value={o.value}
                  className="h-8 flex-1 rounded-md text-xs font-medium uppercase data-[state=on]:bg-card data-[state=on]:shadow-xs"
                >
                  {o.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Edge IP */}
          <div className="space-y-2.5">
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                <Network className="size-3.5" strokeWidth={1.8} />
                Edge IP
              </Label>
              <p className="text-xs leading-5 text-muted-foreground">Force IPv4 or IPv6.</p>
            </div>
            <ToggleGroup
              type="single"
              value={t.visibleSettings.edgeIpVersion}
              disabled={t.busy}
              onValueChange={(next) => {
                if (next)
                  t.handleDraftChange({ edgeIpVersion: next as TunnelSettings["edgeIpVersion"] });
              }}
              spacing={0}
              className="w-full rounded-lg bg-muted/30 p-0.5"
            >
              {EDGE_OPTIONS.map((o) => (
                <ToggleGroupItem
                  key={o.value}
                  value={o.value}
                  className="h-8 flex-1 rounded-md text-xs font-medium uppercase data-[state=on]:bg-card data-[state=on]:shadow-xs"
                >
                  {o.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Metrics */}
          <div className="space-y-2.5">
            <SwitchField
              label="Metrics"
              description="Expose Prometheus endpoint."
              checked={t.visibleSettings.metricsEnabled}
              disabled={t.busy}
              onCheckedChange={(checked) => t.handleDraftChange({ metricsEnabled: checked })}
            />
            {t.visibleSettings.metricsEnabled && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  <Database className="size-3.5" strokeWidth={1.8} />
                  Port
                </Label>
                <InputContainer>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={t.visibleSettings.metricsPort.toString()}
                    disabled={t.busy}
                    onChange={(event) => {
                      let v = event.currentTarget.value.replace(/\D/g, "");
                      if (v.length > 5) v = v.slice(0, 5);
                      t.handleDraftChange({ metricsPort: v ? Number(v) : 0 });
                    }}
                    placeholder="23899"
                    className="h-9 border-0 bg-transparent px-3.5 font-mono text-sm shadow-none focus-visible:ring-0"
                  />
                </InputContainer>
                {t.metricsPortInvalid && (
                  <p role="alert" className="text-xs leading-5 text-destructive">
                    Port must be 1-65535.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Advanced settings */}
        <Eyebrow icon={SlidersHorizontal}>Advanced</Eyebrow>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Log Level */}
          <div className="space-y-2.5">
            <div className="space-y-1">
              <Label className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                <Globe className="size-3.5" strokeWidth={1.8} />
                Log Level
              </Label>
              <p className="text-xs leading-5 text-muted-foreground">Tunnel log verbosity.</p>
            </div>
            <ToggleGroup
              type="single"
              value={t.visibleSettings.logLevel}
              disabled={t.busy}
              onValueChange={(next) => {
                if (next) t.handleDraftChange({ logLevel: next as TunnelSettings["logLevel"] });
              }}
              spacing={0}
              className="w-full rounded-lg bg-muted/30 p-0.5"
            >
              {LOG_LEVEL_OPTIONS.map((o) => (
                <ToggleGroupItem
                  key={o.value}
                  value={o.value}
                  className="h-8 flex-1 rounded-md text-xs font-medium uppercase data-[state=on]:bg-card data-[state=on]:shadow-xs"
                >
                  {o.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Grace Period */}
          <div className="space-y-2.5">
            <Label className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              <Database className="size-3.5" strokeWidth={1.8} />
              Grace Period
            </Label>
            <p className="text-xs leading-5 text-muted-foreground">
              Drain duration (seconds) before shutdown. 0 = disabled.
            </p>
            <InputContainer>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={t.visibleSettings.gracePeriod.toString()}
                disabled={t.busy}
                onChange={(event) => {
                  let v = event.currentTarget.value.replace(/\D/g, "");
                  if (v.length > 3) v = v.slice(0, 3);
                  t.handleDraftChange({ gracePeriod: v ? Number(v) : 0 });
                }}
                placeholder="0"
                className="h-9 border-0 bg-transparent px-3.5 font-mono text-sm shadow-none focus-visible:ring-0"
              />
            </InputContainer>
          </div>

          {/* Scheduled Restart */}
          <div className="space-y-2.5">
            <Label className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              <Database className="size-3.5" strokeWidth={1.8} />
              Scheduled Restart
            </Label>
            <p className="text-xs leading-5 text-muted-foreground">
              Auto-restart every N hours. 0 = disabled.
            </p>
            <InputContainer>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={t.visibleSettings.scheduledRestartHours.toString()}
                disabled={t.busy}
                onChange={(event) => {
                  let v = event.currentTarget.value.replace(/\D/g, "");
                  if (v.length > 3) v = v.slice(0, 3);
                  t.handleDraftChange({ scheduledRestartHours: v ? Number(v) : 0 });
                }}
                placeholder="0"
                className="h-9 border-0 bg-transparent px-3.5 font-mono text-sm shadow-none focus-visible:ring-0"
              />
            </InputContainer>
          </div>
        </div>
        {/* Save / Discard actions */}
        {t.pendingRestart ? (
          <p className="mb-3 text-sm leading-5 text-muted-foreground">
            Changes are staged locally. Save once and restart the active child to apply them.
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={t.handleDiscardDraft}
            disabled={t.busy || !t.dirtySettings}
            className="h-10 flex-1 rounded-xl border border-border bg-card"
          >
            Discard
          </Button>

          <div className="flex-1">
            {t.pendingRestart ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="block">
                    <Button
                      onClick={t.handleSaveAndRestart}
                      disabled={t.busy || !t.dirtySettings || t.metricsPortInvalid}
                      className="h-10 w-full rounded-xl px-3"
                    >
                      {t.busy && <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />}
                      Save &amp; Restart
                    </Button>
                  </span>
                </TooltipTrigger>
                {t.metricsPortInvalid && (
                  <TooltipContent>Fix port validation errors in Settings first.</TooltipContent>
                )}
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="block">
                    <Button
                      onClick={t.handleSaveSettings}
                      disabled={t.busy || !t.dirtySettings || t.metricsPortInvalid}
                      className="h-10 w-full rounded-xl px-3"
                    >
                      {t.busy && <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />}
                      Save Settings
                    </Button>
                  </span>
                </TooltipTrigger>
                {t.metricsPortInvalid && (
                  <TooltipContent>Fix port validation errors in Settings first.</TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        </div>
      </CardContent>
    </PanelShell>
  );
}
