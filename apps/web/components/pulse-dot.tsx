"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/tunnel";
import { TONE_DOT } from "@/lib/tunnel";

export function PulseDot({ tone }: { tone: Tone }) {
  const color = TONE_DOT[tone];
  const reducedMotion = useReducedMotion();

  return (
    <span aria-hidden="true" className="relative flex size-2.5">
      {tone === "active" && !reducedMotion ? (
        <motion.span
          className={cn("absolute inline-flex size-full rounded-full", color)}
          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      ) : null}
      <span className={cn("relative inline-flex size-2.5 rounded-full", color)} />
    </span>
  );
}
