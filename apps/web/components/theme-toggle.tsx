"use client";

import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", Icon: Sun, label: "Light" },
  { value: "system", Icon: Monitor, label: "System" },
  { value: "dark", Icon: Moon, label: "Dark" },
] as const;

/**
 * Segmented theme switch (Light / System / Dark). Defaults to system. The active
 * pill slides between options via a shared `layoutId`. All colors come from the
 * globals.css tokens, so the control itself is theme-aware.
 *
 * `theme` is `undefined` on the server and the first client render, so both
 * resolve to "system" (no hydration mismatch); next-themes then updates it and
 * the pill animates to the real selection.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const active = theme ?? "system";

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex items-center gap-0.5 rounded-full bg-muted p-0.5"
    >
      {OPTIONS.map(({ value, Icon, label }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "relative flex size-9 items-center justify-center rounded-full transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="theme-toggle-active"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 480, damping: 34 }}
              />
            )}
            <Icon className="relative z-10 size-4" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
