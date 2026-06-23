"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", Icon: Sun, label: "Light" },
  { value: "system", Icon: Monitor, label: "System" },
  { value: "dark", Icon: Moon, label: "Dark" },
] as const;

/** Returns true once the component has mounted on the client. */
function useMounted() {
  return useSyncExternalStore(
    () => {
      /* noop — never subscribes */
      return () => {};
    },
    () => true, // client snapshot
    () => false, // server snapshot
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  // Render inert placeholder during SSR to avoid hydration mismatch.
  // next-themes returns `theme = undefined` on the server, which would
  // make the active state differ between server and client renders.
  if (!mounted) {
    return (
      <div
        role="radiogroup"
        aria-label="Theme"
        className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5"
      >
        {OPTIONS.map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            disabled
            aria-label={label}
            className="relative flex size-7 items-center justify-center rounded-md text-muted-foreground"
          >
            <Icon className="size-3.5" strokeWidth={2} />
          </button>
        ))}
      </div>
    );
  }

  const active = theme ?? "system";

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5"
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
              "relative flex size-7 items-center justify-center rounded-md transition-colors",
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="theme-toggle-active"
                className="absolute inset-0 rounded-md bg-primary shadow-xs"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="relative z-10 size-3.5" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
