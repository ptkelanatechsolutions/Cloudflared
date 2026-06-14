"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
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
      initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0.2 : 0.8,
        delay: reducedMotion ? 0 : delay,
        ease: EASE,
      }}
      className={cn(
        "min-h-0 rounded-5xl border border-border bg-muted/35 p-2 shadow-sm",
        className,
      )}
    >
      <Card className="h-full min-h-0 rounded-4xl border-0 bg-card ring-1 ring-border/70">
        {children}
      </Card>
    </motion.section>
  );
}
