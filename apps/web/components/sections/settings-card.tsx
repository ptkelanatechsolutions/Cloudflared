"use client";

import { Database, Gauge, Globe, Network } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelShell } from "@/components/panel-shell";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Eyebrow } from "@/components/eyebrow";
import { SwitchField } from "@/components/switch-field";
import { EDGE_OPTIONS, PROTOCOL_OPTIONS, REGION_OPTIONS } from "@/lib/tunnel";
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
                <div className="rounded-xl border border-border/50 bg-muted/15 p-1.5">
                  <div className="rounded-lg bg-card p-1">
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
                  </div>
                </div>
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

        <p className="text-xs leading-5 text-muted-foreground">
          Changes are saved once you click <strong>Save Settings</strong> in the Token card.
        </p>
      </CardContent>
    </PanelShell>
  );
}
