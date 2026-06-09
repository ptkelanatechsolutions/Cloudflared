"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, KeyRound, Loader2, Power, Settings } from "lucide-react";
import { getState, saveSettings, saveToken, startTunnel, stopTunnel } from "@/app/actions";
import type { DashboardState } from "@/lib/dashboard";
import type { TunnelSettings, TunnelState } from "@cloudflared/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CloudflareIcon } from "./logo";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const POLL_MS = 3000;

type Tone = "active" | "idle" | "error";

const STATE_META: Record<TunnelState, { label: string; tone: Tone }> = {
  running: { label: "Online", tone: "active" },
  starting: { label: "Connecting", tone: "active" },
  stopping: { label: "Stopping", tone: "active" },
  stopped: { label: "Offline", tone: "idle" },
  error: { label: "Error", tone: "error" },
};

const TONE_TEXT: Record<Tone, string> = {
  active: "text-foreground",
  idle: "text-muted-foreground",
  error: "text-destructive",
};

const TONE_DOT: Record<Tone, string> = {
  active: "bg-primary",
  idle: "bg-muted-foreground",
  error: "bg-destructive",
};

export function TunnelControl({ initial }: { initial: DashboardState }) {
  const [state, setState] = useState<DashboardState>(initial);
  const [tokenInput, setTokenInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    setState(await getState());
  }, []);

  useEffect(() => {
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const { status, settings } = state;
  const meta = STATE_META[status.state];
  const online = status.state === "running" || status.state === "starting";
  const busy = isPending || status.state === "starting" || status.state === "stopping";

  const subline =
    status.state === "error"
      ? (status.lastError ?? "Something went wrong")
      : status.state === "running"
        ? `Connected${status.pid ? ` · PID ${status.pid}` : ""}`
        : status.state === "starting"
          ? "Establishing connection…"
          : status.state === "stopping"
            ? "Shutting down…"
            : state.tokenSet
              ? "Ready to connect"
              : "Add a token to begin";

  function handleSaveToken() {
    const token = tokenInput.trim();
    if (!token) return;
    startTransition(async () => {
      setState(await saveToken(token));
      setTokenInput("");
    });
  }

  function handleToggle() {
    startTransition(async () => {
      setState(online ? await stopTunnel() : await startTunnel());
    });
  }

  function updateSettings(patch: Partial<TunnelSettings>) {
    startTransition(async () => {
      setState(await saveSettings({ ...settings, ...patch }));
    });
  }

  const canStart = state.tokenSet && !busy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: EASE }}
      className="w-full max-w-md"
    >
      {/* Outer shell */}
      <div className="rounded-2xl border border-border bg-muted/30 p-2 shadow-sm">
        {/* Inner core */}
        <div className="rounded-xl border border-border bg-card p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg">
                <CloudflareIcon size={40} />
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  Cloudflared
                </p>
                <p className="text-sm font-medium text-foreground">Tunnel Control</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings((v) => !v)}
              aria-label="Settings"
              aria-expanded={showSettings}
              className={cn(
                "duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                showSettings && "rotate-90",
              )}
            >
              <Settings className="size-4" />
            </Button>
          </div>

          {/* Status hero */}
          <div className="mt-8">
            <div className="flex items-center gap-3">
              <PulseDot tone={meta.tone} />
              <h1
                className={cn(
                  "font-mono text-3xl font-semibold tracking-tight",
                  TONE_TEXT[meta.tone],
                )}
              >
                {meta.label}
              </h1>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={subline}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: EASE }}
                className={cn(
                  "mt-2 text-[13px]",
                  status.state === "error" ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {subline}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Token */}
          <div className="mt-7 space-y-2">
            <label
              htmlFor="tunnel-token"
              className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase"
            >
              <KeyRound className="size-3.5" />
              Tunnel token
            </label>
            <div className="flex gap-2">
              <Input
                id="tunnel-token"
                type="password"
                autoComplete="off"
                value={tokenInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw.includes(" ")) {
                    const parts = raw.trim().split(/\s+/);
                    setTokenInput(parts[parts.length - 1]);
                  } else {
                    setTokenInput(raw);
                  }
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSaveToken()}
                placeholder={
                  state.tokenSet
                    ? "•••••••• saved — paste to replace"
                    : "Paste your cloudflared token"
                }
                className="h-9 font-mono"
              />
              <Button
                variant="secondary"
                onClick={handleSaveToken}
                disabled={!tokenInput.trim() || busy}
                className="h-9"
              >
                Save
              </Button>
            </div>
          </div>

          {/* Settings */}
          <AnimatePresence initial={false}>
            {showSettings && (
              <motion.div
                key="settings"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="mt-5 grid gap-3.5 rounded-xl border border-border bg-muted/30 p-4">
                  <Segmented
                    label="Protocol"
                    value={settings.protocol}
                    options={["auto", "http2", "quic"]}
                    onChange={(v) => updateSettings({ protocol: v as TunnelSettings["protocol"] })}
                    disabled={busy}
                  />
                  <Segmented
                    label="Region"
                    value={settings.region}
                    options={["auto", "us"]}
                    onChange={(v) => updateSettings({ region: v as TunnelSettings["region"] })}
                    disabled={busy}
                  />
                  <ToggleRow
                    label="Metrics"
                    checked={settings.metricsEnabled}
                    onChange={(c) => updateSettings({ metricsEnabled: c })}
                    disabled={busy}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <Button
            onClick={handleToggle}
            disabled={!online && !canStart}
            variant={online ? "secondary" : "default"}
            className="group/cta mt-7 h-11 w-full justify-between rounded-full pr-2 pl-5"
          >
            <span className="flex items-center gap-2">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
              {online ? "Stop tunnel" : "Start tunnel"}
            </span>
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-px",
                online ? "bg-secondary-foreground/10" : "bg-primary-foreground/15",
              )}
            >
              <ArrowUpRight className="size-4" />
            </span>
          </Button>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{settings.protocol}</span>
            <Dot />
            <span>region {settings.region}</span>
            <Dot />
            <span>metrics {settings.metricsEnabled ? "on" : "off"}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PulseDot({ tone }: { tone: Tone }) {
  const color = TONE_DOT[tone];
  return (
    <span className="relative flex size-2.5">
      {tone === "active" && (
        <motion.span
          className={cn("absolute inline-flex size-full rounded-full", color)}
          animate={{ scale: [1, 2.4], opacity: [0.5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <span className={cn("relative inline-flex size-2.5 rounded-full", color)} />
    </span>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex rounded-lg bg-muted p-0.5">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt)}
              className={cn(
                "relative rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors duration-300 disabled:opacity-50",
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`seg-${label}`}
                  className="absolute inset-0 rounded-md bg-primary"
                  transition={{ duration: 0.4, ease: EASE }}
                />
              )}
              <span className="relative z-10">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors duration-300 disabled:opacity-50",
          checked ? "justify-end bg-primary" : "justify-start bg-input",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 520, damping: 34 }}
          className="block size-5 rounded-full bg-background shadow-sm"
        />
      </button>
    </div>
  );
}

function Dot() {
  return <span className="size-0.5 rounded-full bg-muted-foreground/40" />;
}
