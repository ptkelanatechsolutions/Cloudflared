"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tunnel";
import { TONE_DOT } from "@/lib/tunnel";

export function PulseDot({ tone }: { tone: Tone }) {
  const color = TONE_DOT[tone];

  return (
    <span className="relative flex size-3">
      {tone === "active" ? (
        <motion.span
          className={cn("absolute inline-flex size-full rounded-full", color)}
          animate={{ scale: [1, 2.3], opacity: [0.5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      ) : null}
      <span className={cn("relative inline-flex size-3 rounded-full", color)} />
    </span>
  );
}
