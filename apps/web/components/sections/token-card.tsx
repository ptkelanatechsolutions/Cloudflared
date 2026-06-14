"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelShell } from "@/components/panel-shell";
import { Separator } from "@/components/ui/separator";
import { SwitchField } from "@/components/switch-field";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Tunnel } from "@/components/use-tunnel";

export function TokenCard({ t }: { t: Tunnel }) {
  return (
    <PanelShell
      reducedMotion={t.reducedMotion}
      delay={0.08}
      className="md:col-span-4 xl:col-span-12"
    >
      <CardContent className="flex flex-col gap-5 px-6 pt-5 pb-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label
              htmlFor="tunnel-token"
              className="text-xs tracking-[0.18em] text-muted-foreground uppercase"
            >
              <KeyRound className="size-3.5" strokeWidth={1.8} />
              Tunnel token
            </Label>
            {t.state.tokenSet ? (
              <Badge variant="outline" className="rounded-full px-2.5 text-xs">
                Stored
              </Badge>
            ) : null}
          </div>

          <div className="rounded-3xl border border-border bg-muted/35 p-1.5">
            <div className="flex gap-2 rounded-2xl bg-card p-1">
              <Input
                id="tunnel-token"
                type="password"
                autoComplete="off"
                value={t.tokenInput}
                onChange={(event) => {
                  const raw = event.currentTarget.value;
                  if (raw.includes(" ")) {
                    const parts = raw.trim().split(/\s+/);
                    t.setTokenInput(parts.at(-1) ?? "");
                    return;
                  }
                  t.setTokenInput(raw);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") t.handleSaveToken();
                }}
                placeholder={
                  t.state.tokenSet
                    ? "•••••••• saved — paste to replace"
                    : "Paste your cloudflared token"
                }
                className="h-11 border-0 bg-transparent px-4 font-mono shadow-none focus-visible:ring-0"
              />
              <Button
                variant="secondary"
                onClick={t.handleSaveToken}
                disabled={!t.tokenInput.trim() || t.busy}
                className="h-11 rounded-full px-4 active:scale-[0.98]"
              >
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Auto-start</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Bring the tunnel back automatically when the server process boots.
            </p>
          </div>
          <SwitchField
            label=""
            description=""
            checked={t.visibleSettings.autoStart}
            disabled={t.busy}
            onCheckedChange={(checked) => t.handleDraftChange({ autoStart: checked })}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          {t.pendingRestart ? (
            <p className="text-sm leading-6 text-muted-foreground">
              Changes are staged locally. Save once and restart the active child to apply them.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="ghost"
              onClick={t.handleDiscardDraft}
              disabled={t.busy || !t.dirtySettings}
              className="h-11 rounded-full border border-border bg-card active:scale-[0.98]"
            >
              Discard
            </Button>

            {t.pendingRestart ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button
                      onClick={t.handleSaveAndRestart}
                      disabled={t.busy || !t.dirtySettings || t.metricsPortInvalid}
                      className="group/cta h-11 w-full rounded-full px-3 active:scale-[0.98]"
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
                  <span tabIndex={0}>
                    <Button
                      onClick={t.handleSaveSettings}
                      disabled={t.busy || !t.dirtySettings || t.metricsPortInvalid}
                      className="group/cta h-11 w-full rounded-full px-3 active:scale-[0.98]"
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
