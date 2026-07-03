"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { DashboardState } from "@/lib/dashboard";
import { useTunnel } from "@/components/use-tunnel";
import { HeroCard } from "@/components/sections/hero-card";
import { SettingsCard } from "@/components/sections/settings-card";
import { TokenCard } from "@/components/sections/token-card";
import { ObservabilityCard } from "@/components/sections/observability-card";
import { PerformanceGraphCard } from "@/components/sections/performance-graph-card";
import { ExportImportDialog } from "@/components/sections/export-import-dialog";
import { NetworkDiagnosticsDialog } from "@/components/sections/network-diagnostics-dialog";

export function TunnelControl({ initial }: { initial: DashboardState }) {
  const t = useTunnel(initial);
  const [includeTokenForExport, setIncludeTokenForExport] = useState(false);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-col">
      {t.connectionLost && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="size-4 shrink-0" strokeWidth={1.8} />
          <span>Connection lost. Unable to reach the server.</span>
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-12">
        <HeroCard t={t} />
        <TokenCard t={t} />
        <div className="xl:col-span-12">
          <div className="grid gap-4 xl:grid-cols-12">
            <SettingsCard t={t} />
            <ObservabilityCard t={t} />
          </div>
        </div>
        {/* Performance graph */}
        <div className="xl:col-span-12">
          <PerformanceGraphCard t={t} />
        </div>
      </div>

      {/* Export / Import dialog */}
      <ExportImportDialog
        open={t.exportImportDialogOpen}
        onOpenChange={t.setExportImportDialogOpen}
        onExport={t.handleExportConfig}
        onImport={t.handleImportConfig}
        includeToken={includeTokenForExport}
        onIncludeTokenChange={setIncludeTokenForExport}
        disabled={t.busy}
      />

      {/* Diagnostics dialog */}
      <NetworkDiagnosticsDialog
        open={t.diagnosticsDialogOpen}
        onOpenChange={t.setDiagnosticsDialogOpen}
        running={t.diagnosticsRunning}
        result={t.diagnosticsResult}
        onRun={t.handleRunDiagnostics}
      />
    </div>
  );
}
