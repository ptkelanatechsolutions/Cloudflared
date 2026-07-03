"use client";

import { KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputContainer } from "@/components/ui/input-container";
import { Label } from "@/components/ui/label";
import { PanelShell } from "@/components/panel-shell";
import { SwitchField } from "@/components/switch-field";
import type { Tunnel } from "@/components/use-tunnel";

export function TokenCard({ t }: { t: Tunnel }) {
  return (
    <PanelShell reducedMotion={t.reducedMotion} delay={0.08} className="xl:col-span-5">
      <CardContent className="flex flex-col gap-4 px-5 pt-5 pb-5">
        {/* Token input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label
              htmlFor="tunnel-token"
              className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
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

          <InputContainer>
            <div className="flex gap-2 rounded-lg bg-card p-1">
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
                  t.state.tokenSet ? "Saved — paste to replace" : "Paste your cloudflared token"
                }
                className="h-10 border-0 bg-transparent px-3.5 font-mono text-sm shadow-none focus-visible:ring-0"
              />
              <Button
                variant="secondary"
                onClick={t.handleSaveToken}
                disabled={!t.tokenInput.trim() || t.busy}
                className="h-10 rounded-lg px-4"
              >
                Save
              </Button>
            </div>
          </InputContainer>
        </div>

        {/* Auto-start */}
        <SwitchField
          label="Auto-start"
          description="Bring the tunnel back automatically when the server process boots."
          checked={t.visibleSettings.autoStart}
          disabled={t.busy}
          onCheckedChange={(checked) => t.handleDraftChange({ autoStart: checked })}
        />
      </CardContent>
    </PanelShell>
  );
}
