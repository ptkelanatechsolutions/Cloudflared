"use client";

import { Activity, Clock, Loader2 } from "lucide-react";

interface MetricsPoint {
  timestamp: string;
  metrics: {
    connections: number;
    totalEgressBytes: number;
    totalIngressBytes: number;
    egressRate: number;
    ingressRate: number;
  };
}

interface PerformanceGraphProps {
  history: MetricsPoint[];
  tunnelOnline: boolean;
}

const WIDTH = 300;
const HEIGHT = 120;
const PAD = 4;

function formatTime(timestamp: string): string {
  const s = Math.floor((Date.now() - Date.parse(timestamp)) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

function buildPath(data: number[], scale: (v: number) => number): string {
  if (data.length < 2) return "";
  return data
    .map((v, i) => {
      const x = PAD + (i / Math.max(data.length - 1, 1)) * (WIDTH - PAD * 2);
      const y = scale(v);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join("");
}

function autoScale(data: number[]): { max: number; unit: string } {
  const max = Math.max(...data, 1);
  if (max < 1024) return { max, unit: "" };
  if (max < 1024 * 1024) return { max: max / 1024, unit: "KB" };
  return { max: max / (1024 * 1024), unit: "MB" };
}

export function PerformanceGraph({ history, tunnelOnline }: PerformanceGraphProps) {
  if (history.length < 2) {
    if (!tunnelOnline) {
      return (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Activity className="size-4" strokeWidth={1.8} />
          <span>Tunnel is offline. Metrics will appear when connected.</span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
        <span>Collecting metrics data...</span>
      </div>
    );
  }

  const connData = history.map((p) => p.metrics.connections);
  const egressData = history.map((p) => p.metrics.egressRate);

  const connMax = Math.max(...connData, 1);
  const { max: bwMax, unit: bwUnit } = autoScale(egressData.map((v) => Math.round(v)));

  const scale = (v: number, max: number) => HEIGHT - PAD - (v / max) * (HEIGHT - PAD * 2);
  const connScale = (v: number) => scale(v, connMax);
  const bwScale = (v: number) => scale(v, bwMax);

  const connPath = buildPath(connData, connScale);
  const bwPath = buildPath(egressData, bwScale);

  const labels = [0, Math.floor(history.length / 2), history.length - 1].map(
    (i) => history[i]?.timestamp ?? "",
  );

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        aria-label="Tunnel performance graph"
        role="img"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD}
            y1={HEIGHT - PAD - (HEIGHT - PAD * 2) * f}
            x2={WIDTH - PAD}
            y2={HEIGHT - PAD - (HEIGHT - PAD * 2) * f}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        ))}

        {/* Connections path */}
        {connPath && (
          <path
            d={connPath}
            fill="none"
            stroke="var(--color-chart-primary, #3b82f6)"
            strokeWidth={1.5}
          />
        )}
        {/* Bandwidth path */}
        {bwPath && (
          <path
            d={bwPath}
            fill="none"
            stroke="var(--color-chart-secondary, #10b981)"
            strokeWidth={1.5}
          />
        )}
      </svg>

      {/* Legend + labels */}
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Activity className="size-3" strokeWidth={1.8} />
            {connMax} conn
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" strokeWidth={1.8} />
            {bwMax.toFixed(1)} {bwUnit}/s
          </span>
        </div>
        <div className="flex gap-3">
          {labels.map((t, i) => (
            <span key={i}>{t ? formatTime(t) : ""}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
