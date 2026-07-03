"use client";

import { AlertCircle, CheckCircle2, Loader2, Network, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Eyebrow } from "@/components/eyebrow";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DiagnosticsResult } from "@cloudflared/core";

interface NetworkDiagnosticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  running: boolean;
  result: DiagnosticsResult | null;
  onRun: () => void;
}

function CheckRow({ label, ok, message }: { label: string; ok: boolean; message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/15 p-3">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-active" strokeWidth={1.8} />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" strokeWidth={1.8} />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs leading-5 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function NetworkDiagnosticsDialog({
  open,
  onOpenChange,
  running,
  result,
  onRun,
}: NetworkDiagnosticsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Network Diagnostics</DialogTitle>
          <Eyebrow icon={Network}>Network Diagnostics</Eyebrow>
        </DialogHeader>

        <div className="space-y-4 px-6 pt-2 pb-6">
          <Button variant="outline" disabled={running} onClick={onRun} className="w-full">
            {running ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
            ) : (
              <RefreshCw className="size-4" strokeWidth={1.8} />
            )}
            {running ? "Running diagnostics..." : "Run diagnostics"}
          </Button>

          {result && (
            <>
              <Separator />
              <div className="space-y-2">
                <CheckRow label="Binary" ok={result.binary.ok} message={result.binary.message} />
                <CheckRow label="DNS" ok={result.dns.ok} message={result.dns.message} />
                <CheckRow
                  label="Edge connectivity"
                  ok={result.edge.ok}
                  message={result.edge.message}
                />
                <CheckRow
                  label="Metrics endpoint"
                  ok={result.metrics.ok}
                  message={result.metrics.message}
                />
                <div className="rounded-xl border border-border/50 bg-muted/15 p-3">
                  <p className="text-xs text-muted-foreground">
                    Node {result.environment.node} · {result.environment.platform} (
                    {result.environment.arch})
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
