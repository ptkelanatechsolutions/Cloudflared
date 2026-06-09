"use client";

import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

const TUNNEL_RINGS = [
  { rx: 90, ry: 25, opacity: 0.12, width: 0.8, delay: 0 },
  { rx: 68, ry: 19, opacity: 0.18, width: 1, delay: 0.1 },
  { rx: 45, ry: 12, opacity: 0.28, width: 1.2, delay: 0.2 },
  { rx: 22, ry: 6, opacity: 0.45, width: 1.5, delay: 0.3 },
] as const;

export function NotFoundPage() {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-8 overflow-hidden px-6">
      {/* Animated tunnel SVG */}
      <div className="size-36 md:size-48" aria-hidden="true">
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full text-foreground"
        >
          <motion.g
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <motion.g
              animate={{ rotate: [0, 2.5, -1.5, 3, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "100px 100px" }}
            >
              {TUNNEL_RINGS.map((ring) => (
                <motion.ellipse
                  key={ring.rx}
                  cx={100}
                  cy={100}
                  rx={ring.rx}
                  ry={ring.ry}
                  stroke="currentColor"
                  strokeWidth={ring.width}
                  strokeLinecap="round"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: ring.opacity }}
                  transition={{
                    scale: { duration: 0.6, ease: EASE, delay: ring.delay },
                    opacity: { duration: 0.6, ease: EASE, delay: ring.delay },
                  }}
                />
              ))}
            </motion.g>
          </motion.g>
        </svg>
      </div>

      {/* 404 heading + subtitle */}
      <div className="text-center">
        <motion.h1
          initial={{ y: -16, opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
          className="font-heading text-7xl font-bold tracking-tighter text-foreground md:text-8xl"
        >
          404
        </motion.h1>
        <motion.p
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.65 }}
          className="mt-3 text-sm text-muted-foreground md:text-base"
        >
          This page doesn&apos;t exist
        </motion.p>
      </div>

      {/* Back to Dashboard */}
      <motion.div
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.8 }}
      >
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
        </Button>
      </motion.div>
    </main>
  );
}
