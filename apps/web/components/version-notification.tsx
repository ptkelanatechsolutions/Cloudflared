"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { checkVersion } from "@/app/actions";
import type { VersionCheck } from "@/app/actions";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const RELEASES_URL = "https://github.com/ptkelanatechsolutions/Cloudflared/releases";

export function VersionNotification() {
  const [info, setInfo] = useState<VersionCheck | null>(null);
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "error">("idle");
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasUpdate = info?.hasUpdate ?? false;

  const fetchVersion = () => {
    setFetchState("loading");
    checkVersion()
      .then(setInfo)
      .catch(() => setFetchState("error"))
      .finally(() => setFetchState("idle"));
  };

  useEffect(() => {
    let cancelled = false;
    checkVersion()
      .then((result) => {
        if (!cancelled) setInfo(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpen = () => {
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleClose = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  const handleClick = () => {
    clearTimeout(timeoutRef.current);
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative" onMouseEnter={handleOpen} onMouseLeave={handleClose}>
      <button
        type="button"
        onFocus={handleOpen}
        onBlur={handleClose}
        onClick={handleClick}
        className="flex items-center gap-1 rounded-full bg-muted/50 px-2 py-px text-[11px] font-medium tracking-tight text-muted-foreground/70 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted hover:text-foreground"
        aria-label={
          hasUpdate
            ? `Update available: version ${info?.latest}`
            : `Version ${info?.current ?? "loading"}`
        }
      >
        <span>v{info?.current ?? "..."}</span>
        {hasUpdate && <PulseDot />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <Tooltip
            info={info}
            hasUpdate={hasUpdate}
            fetchState={fetchState}
            onRefresh={fetchVersion}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PulseDot() {
  return (
    <span className="flex size-1.5" aria-hidden="true">
      <motion.span
        className="inline-flex size-1.5 rounded-full bg-update"
        animate={{ scale: [1, 1.7, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}

interface TooltipProps {
  info: VersionCheck | null;
  hasUpdate: boolean;
  fetchState: "idle" | "loading" | "error";
  onRefresh: () => void;
}

function Tooltip({ info, hasUpdate, fetchState, onRefresh }: TooltipProps) {
  const latest = info?.latest;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="absolute top-full left-1/2 z-50 mt-2 w-44 -translate-x-1/2 rounded-xl border border-border bg-popover p-3 shadow-sm"
    >
      {fetchState === "loading" ? (
        <div className="flex items-center gap-2">
          <RefreshCw className="size-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Checking...</span>
        </div>
      ) : fetchState === "error" ? (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Check failed</p>
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            <RefreshCw className="size-3" />
            Retry
          </button>
        </div>
      ) : hasUpdate ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Update available</p>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-foreground">{latest}</span>
            <span className="text-[10px] text-muted-foreground/60 line-through">
              v{info?.current}
            </span>
          </div>
          <a
            href={latest ? `${RELEASES_URL}/tag/${latest}` : RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
          >
            View Release
            <ArrowUpRight className="size-3 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/link:translate-x-px group-hover/link:-translate-y-px" />
          </a>
        </div>
      ) : (
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Up to date</p>
          <p className="text-xs font-medium text-foreground">v{info?.current}</p>
        </div>
      )}
    </motion.div>
  );
}
