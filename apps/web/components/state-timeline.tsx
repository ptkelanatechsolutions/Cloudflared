"use client";

import { motion } from "motion/react";
import { TONE_DOT } from "@/lib/tunnel";
import type { StateTransition } from "@cloudflared/core";
import { formatTimeAgo } from "@/lib/tunnel";

interface StateTimelineProps {
  history: StateTransition[];
  labelMap: Record<string, { label: string; tone: "active" | "idle" | "error" }>;
}

export function StateTimeline({ history, labelMap }: StateTimelineProps) {
  const recent = history.slice(-10).reverse();

  if (recent.length === 0) {
    return (
      <p className="py-3 text-center text-sm leading-5 text-muted-foreground">
        No state changes yet.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {recent.map((entry, i) => {
        const meta = labelMap[entry.state];
        const dotColor = meta ? TONE_DOT[meta.tone] : "bg-muted-foreground";
        const label = meta?.label ?? entry.state;

        return (
          <motion.div
            key={`${entry.timestamp}-${entry.state}`}
            initial={{ opacity: 0, x: i === 0 ? -6 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className="flex items-center gap-3 px-1 py-1"
          >
            <div className={`size-2 shrink-0 rounded-full ${dotColor}`} />
            <span className="flex-1 text-sm text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">{formatTimeAgo(entry.timestamp)}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
