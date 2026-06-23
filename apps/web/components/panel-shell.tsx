"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/tunnel";

export function PanelShell({
  children,
  className,
  delay,
  reducedMotion,
}: {
  children: React.ReactNode;
  className?: string;
  delay: number;
  reducedMotion: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: reducedMotion ? 0 : delay,
        ease: EASE,
      }}
      className={cn("rounded-2xl border border-border/50 bg-card shadow-xs", className)}
    >
      {children}
    </motion.section>
  );
}
