"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  Clock3,
  Gauge,
  KeyRound,
  Loader2,
  Logs,
  Maximize2,
  Minimize2,
  Power,
  Radio,
  RotateCw,
  Waypoints,
} from "lucide-react";
import {
  getState,
  restartTunnel,
  saveSettings,
  saveSettingsAndRestart,
  saveToken,
  startTunnel,
  stopTunnel,
} from "@/app/actions";
import type { DashboardState } from "@/lib/dashboard";
import type { TunnelSettings } from "@cloudflared/core";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PanelShell } from "@/components/panel-shell";
import { Eyebrow } from "@/components/eyebrow";
import { PulseDot } from "@/components/pulse-dot";
import { RuntimeChip } from "@/components/runtime-chip";
import { RuntimeField } from "@/components/runtime-field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SwitchField } from "@/components/switch-field";
import {
  EASE,
  POLL_MS,
  LOG_FOLLOW_THRESHOLD,
  PROTOCOL_OPTIONS,
  REGION_OPTIONS,
  EDGE_OPTIONS,
  STATE_META,
  TONE_TEXT,
  settingsEqual,
  formatUptime,
  formatTimestamp,
} from "@/lib/tunnel";

export function TunnelControl({ initial }: { initial: DashboardState }) {
  const [state, setState] = useState<DashboardState>(initial);
  const [tokenInput, setTokenInput] = useState("");
  const [draftSettings, setDraftSettings] = useState<TunnelSettings>(initial.settings);
  const [draftMetricsPort, setDraftMetricsPort] = useState(String(initial.settings.metricsPort));
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [metricsHost] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.location.hostname,
  );
  const [followLogs, setFollowLogs] = useState(true);
  const [isMutating, startMutation] = useTransition();
  const reducedMotion = useReducedMotion() ?? false;
  const logViewportRootRef = useRef<HTMLDivElement | null>(null);
  const logs = useDeferredValue(state.logs);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  const refresh = useEffectEvent(async () => {
    const next = await getState();
    startTransition(() => {
      setState(next);
    });
  });

  useEffect(() => {
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(id);
  }, []);

  const visibleSettings = isEditingSettings ? draftSettings : state.settings;
  const visibleMetricsPort = isEditingSettings
    ? draftMetricsPort
    : String(state.settings.metricsPort);
  const dirtySettings = isEditingSettings && !settingsEqual(draftSettings, state.settings);
  const metricsPortValue = Number(draftMetricsPort);
  const metricsPortInvalid =
    isEditingSettings &&
    draftSettings.metricsEnabled &&
    (draftMetricsPort.trim().length === 0 ||
      !Number.isInteger(metricsPortValue) ||
      metricsPortValue < 1 ||
      metricsPortValue > 65535);

  const updateFollowState = useEffectEvent(() => {
    const viewport = logViewportRootRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;

    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    setFollowLogs(distanceFromBottom <= LOG_FOLLOW_THRESHOLD);
  });

  useEffect(() => {
    const viewport = logViewportRootRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;

    const handleScroll = () => updateFollowState();
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    updateFollowState();

    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const viewport = logViewportRootRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport || !followLogs) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [followLogs, logs]);

  const { status } = state;
  const meta = STATE_META[status.state];
  const online = status.state === "running" || status.state === "starting";
  const runtimeBusy = status.state === "starting" || status.state === "stopping";
  const busy = isMutating || runtimeBusy;
  const pendingRestart = dirtySettings && online;
  const tokenReady = state.tokenSet;
  const subline =
    status.state === "error"
      ? (status.lastError ?? "Cloudflared reported an unknown failure.")
      : status.state === "running"
        ? `Connected${status.pid ? ` · PID ${status.pid}` : ""}`
        : status.state === "starting"
          ? "Negotiating cloudflared with the configured transport."
          : status.state === "stopping"
            ? "Gracefully stopping the active child process."
            : state.tokenSet
              ? "Token stored. Ready to reconnect."
              : "Paste a tunnel token to begin.";
  const metricsUrl =
    state.settings.metricsEnabled && metricsHost
      ? `http://${metricsHost}:${state.settings.metricsPort}/metrics`
      : null;
  const statusBadgeVariant =
    status.state === "error" ? "destructive" : status.state === "running" ? "default" : "secondary";

  function handleDraftChange(patch: Partial<TunnelSettings>) {
    const base = isEditingSettings ? draftSettings : state.settings;
    setIsEditingSettings(true);
    setDraftSettings({ ...base, ...patch });
  }

  function handleMetricsPortChange(next: string) {
    const digits = next.replace(/\D+/g, "");
    const base = isEditingSettings ? draftSettings : state.settings;
    setIsEditingSettings(true);
    setDraftMetricsPort(digits);

    if (digits.length > 0) {
      setDraftSettings({
        ...base,
        metricsPort: Number(digits),
      });
    }
  }

  function handleSaveToken() {
    const token = tokenInput.trim();
    if (!token) return;

    startMutation(async () => {
      const next = await saveToken(token);
      setState(next);
      setTokenInput("");
    });
  }

  function handleToggleTunnel() {
    startMutation(async () => {
      const next = online ? await stopTunnel() : await startTunnel();
      setState(next);
    });
  }

  function handleRestartTunnel() {
    startMutation(async () => {
      const next = await restartTunnel();
      setState(next);
    });
  }

  function handleSaveSettings() {
    if (metricsPortInvalid) return;

    startMutation(async () => {
      const next = await saveSettings(draftSettings);
      setState(next);
      setDraftSettings(next.settings);
      setDraftMetricsPort(String(next.settings.metricsPort));
      setIsEditingSettings(false);
    });
  }

  function handleSaveAndRestart() {
    if (metricsPortInvalid) return;

    startMutation(async () => {
      const next = await saveSettingsAndRestart(draftSettings);
      setState(next);
      setDraftSettings(next.settings);
      setDraftMetricsPort(String(next.settings.metricsPort));
      setIsEditingSettings(false);
    });
  }

  function handleDiscardDraft() {
    setDraftSettings(state.settings);
    setDraftMetricsPort(String(state.settings.metricsPort));
    setIsEditingSettings(false);
  }

  function handleExportLogs() {
    if (logs.length === 0) return;

    const file = new Blob([`${logs.join("\n")}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cloudflared-${new Date().toISOString().replaceAll(":", "-")}.log`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function jumpToLatest() {
    const viewport = logViewportRootRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;

    viewport.scrollTop = viewport.scrollHeight;
    setFollowLogs(true);
  }

  return (
    <>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[88rem] flex-col">
        <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-12 xl:grid-rows-[auto_auto_1fr]">
          <PanelShell
            reducedMotion={reducedMotion}
            delay={0}
            className="md:col-span-4 xl:col-span-6"
          >
            <CardHeader className="gap-5 px-6 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <Eyebrow icon={Radio}>Tunnel Runtime</Eyebrow>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <PulseDot tone={meta.tone} />
                      <h1
                        className={cn(
                          "font-mono text-4xl font-semibold tracking-tight sm:text-5xl",
                          TONE_TEXT[meta.tone],
                        )}
                      >
                        {meta.label}
                      </h1>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={subline}
                        initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reducedMotion ? 0 : -10 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className={cn(
                          "max-w-xl text-sm leading-6",
                          status.state === "error" ? "text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {subline}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>

                <Badge variant={statusBadgeVariant} className="rounded-full px-3 py-1 text-xs">
                  {meta.badge}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <RuntimeChip label="Protocol" value={state.settings.protocol} />
                <RuntimeChip label="Region" value={state.settings.region} />
                <RuntimeChip
                  label="Metrics"
                  value={state.settings.metricsEnabled ? "Enabled" : "Disabled"}
                />
              </div>
            </CardHeader>

            <CardContent className="flex h-full flex-col gap-6 px-6 pb-6">
              <div className="rounded-[1.6rem] border border-border bg-muted/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Operational posture</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{meta.detail}</p>
                  </div>
                  {pendingRestart ? (
                    <Badge variant="outline" className="rounded-full px-2.5 text-[11px]">
                      Pending restart
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="mt-auto grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Button
                  onClick={handleToggleTunnel}
                  disabled={busy || (!online && !state.tokenSet)}
                  variant={online ? "secondary" : "default"}
                  className="group/cta h-12 rounded-full pr-2 pl-5 text-sm active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
                    ) : (
                      <Power className="size-4" strokeWidth={1.8} />
                    )}
                    {online ? "Stop tunnel" : "Start tunnel"}
                  </span>
                  <span
                    className={cn(
                      "ml-auto flex size-8 items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/cta:translate-x-1 group-hover/cta:-translate-y-px",
                      online ? "bg-secondary-foreground/10" : "bg-primary-foreground/15",
                    )}
                  >
                    <ArrowUpRight className="size-4" strokeWidth={1.8} />
                  </span>
                </Button>

                <Button
                  onClick={handleRestartTunnel}
                  disabled={busy || !tokenReady}
                  variant="ghost"
                  className="h-12 rounded-full border border-border bg-card px-4 active:scale-[0.98]"
                >
                  <RotateCw className="size-4" strokeWidth={1.8} />
                  Restart
                </Button>
              </div>
            </CardContent>
          </PanelShell>

          <PanelShell
            reducedMotion={reducedMotion}
            delay={0.02}
            className="md:col-span-1 xl:col-span-2"
          >
            <CardContent className="flex flex-col gap-4 px-5 pt-5 pb-5">
              <div className="space-y-1">
                <Label className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                  Protocol
                </Label>
                <p className="text-xs leading-5 text-muted-foreground">Tunnel transport.</p>
              </div>
              <ToggleGroup
                type="single"
                value={visibleSettings.protocol}
                disabled={busy}
                onValueChange={(next) => {
                  if (next) handleDraftChange({ protocol: next as TunnelSettings["protocol"] });
                }}
                className="grid w-full grid-cols-3 gap-0 rounded-[1rem] bg-card p-1"
              >
                {PROTOCOL_OPTIONS.map((o) => (
                  <ToggleGroupItem
                    key={o.value}
                    value={o.value}
                    className="h-9 rounded-full text-xs font-medium uppercase data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {o.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </CardContent>
          </PanelShell>

          <PanelShell
            reducedMotion={reducedMotion}
            delay={0.04}
            className="md:col-span-1 xl:col-span-2"
          >
            <CardContent className="flex flex-col gap-4 px-5 pt-5 pb-5">
              <div className="space-y-1">
                <Label className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                  Region
                </Label>
                <p className="text-xs leading-5 text-muted-foreground">Edge preference.</p>
              </div>
              <ToggleGroup
                type="single"
                value={visibleSettings.region}
                disabled={busy}
                onValueChange={(next) => {
                  if (next) handleDraftChange({ region: next as TunnelSettings["region"] });
                }}
                className="grid w-full grid-cols-2 gap-0 rounded-[1rem] bg-card p-1"
              >
                {REGION_OPTIONS.map((o) => (
                  <ToggleGroupItem
                    key={o.value}
                    value={o.value}
                    className="h-9 rounded-full text-xs font-medium uppercase data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {o.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </CardContent>
          </PanelShell>

          <PanelShell
            reducedMotion={reducedMotion}
            delay={0.06}
            className="md:col-span-2 xl:col-span-2"
          >
            <CardContent className="flex flex-col gap-5 px-5 pt-5 pb-5">
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                    Edge IP
                  </Label>
                  <p className="text-xs leading-5 text-muted-foreground">Force IPv4 or IPv6.</p>
                </div>
                <ToggleGroup
                  type="single"
                  value={visibleSettings.edgeIpVersion}
                  disabled={busy}
                  onValueChange={(next) => {
                    if (next)
                      handleDraftChange({ edgeIpVersion: next as TunnelSettings["edgeIpVersion"] });
                  }}
                  className="grid w-full grid-cols-3 gap-0 rounded-[1rem] bg-card p-1"
                >
                  {EDGE_OPTIONS.map((o) => (
                    <ToggleGroupItem
                      key={o.value}
                      value={o.value}
                      className="h-9 rounded-full text-xs font-medium uppercase data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      {o.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <Separator />
              <SwitchField
                label="Metrics"
                description="Expose endpoint."
                checked={visibleSettings.metricsEnabled}
                disabled={busy}
                onCheckedChange={(checked) => handleDraftChange({ metricsEnabled: checked })}
              />
            </CardContent>
          </PanelShell>

          <PanelShell
            reducedMotion={reducedMotion}
            delay={0.08}
            className="md:col-span-3 xl:col-span-8"
          >
            <CardContent className="flex flex-col gap-5 px-6 pt-5 pb-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="tunnel-token"
                    className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase"
                  >
                    <KeyRound className="size-3.5" strokeWidth={1.8} />
                    Tunnel token
                  </Label>
                  {state.tokenSet ? (
                    <Badge variant="outline" className="rounded-full px-2.5 text-[11px]">
                      Stored
                    </Badge>
                  ) : null}
                </div>

                <div className="rounded-[1.6rem] border border-border bg-muted/35 p-1.5">
                  <div className="flex gap-2 rounded-[1.15rem] bg-card p-1">
                    <Input
                      id="tunnel-token"
                      type="password"
                      autoComplete="off"
                      value={tokenInput}
                      onChange={(event) => {
                        const raw = event.currentTarget.value;
                        if (raw.includes(" ")) {
                          const parts = raw.trim().split(/\s+/);
                          setTokenInput(parts.at(-1) ?? "");
                          return;
                        }
                        setTokenInput(raw);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleSaveToken();
                      }}
                      placeholder={
                        state.tokenSet
                          ? "•••••••• saved — paste to replace"
                          : "Paste your cloudflared token"
                      }
                      className="h-11 border-0 bg-transparent px-4 font-mono shadow-none focus-visible:ring-0"
                    />
                    <Button
                      variant="secondary"
                      onClick={handleSaveToken}
                      disabled={!tokenInput.trim() || busy}
                      className="h-11 rounded-full px-4 active:scale-[0.98]"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Auto-start</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Bring the tunnel back automatically when the server process boots.
                  </p>
                </div>
                <SwitchField
                  label=""
                  description=""
                  checked={visibleSettings.autoStart}
                  disabled={busy}
                  onCheckedChange={(checked) => handleDraftChange({ autoStart: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                {pendingRestart ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Changes are staged locally. Save once and restart the active child to apply
                    them.
                  </p>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="ghost"
                    onClick={handleDiscardDraft}
                    disabled={busy || !dirtySettings}
                    className="h-11 rounded-full border border-border bg-card active:scale-[0.98]"
                  >
                    Discard
                  </Button>

                  {pendingRestart ? (
                    <Button
                      onClick={handleSaveAndRestart}
                      disabled={busy || !dirtySettings || metricsPortInvalid}
                      className="group/cta h-11 w-full rounded-full px-3 active:scale-[0.98]"
                    >
                      {busy && <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />}
                      Save &amp; Restart
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSaveSettings}
                      disabled={busy || !dirtySettings || metricsPortInvalid}
                      className="group/cta h-11 w-full rounded-full px-3 active:scale-[0.98]"
                    >
                      {busy && <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />}
                      Save Settings
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </PanelShell>

          <PanelShell
            reducedMotion={reducedMotion}
            delay={0.1}
            className="md:col-span-1 xl:col-span-4"
          >
            <CardContent className="flex flex-col gap-4 px-5 pt-5 pb-5">
              <div className="space-y-1">
                <Label
                  htmlFor="metrics-port"
                  className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase"
                >
                  Metrics port
                </Label>
                <p className="text-sm leading-6 text-muted-foreground">
                  Keep the port predictable for your scraper or local health tooling.
                </p>
              </div>

              <div className="rounded-[1.3rem] border border-border bg-muted/30 p-1.5">
                <Input
                  id="metrics-port"
                  type="text"
                  inputMode="numeric"
                  value={visibleMetricsPort}
                  disabled={busy || !visibleSettings.metricsEnabled}
                  aria-invalid={metricsPortInvalid}
                  onChange={(event) => handleMetricsPortChange(event.currentTarget.value)}
                  className="h-11 rounded-[1rem] bg-card px-4 font-mono"
                  placeholder="60123"
                />
              </div>

              {metricsPortInvalid ? (
                <p className="text-sm text-destructive">
                  Metrics port must be between 1 and 65535.
                </p>
              ) : null}
            </CardContent>
          </PanelShell>

          <PanelShell
            reducedMotion={reducedMotion}
            delay={0.12}
            className="min-h-0 md:col-span-4 xl:col-span-12"
          >
            <CardContent className="flex h-full min-h-0 flex-col gap-5 px-6 pt-6 pb-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <Eyebrow icon={Logs}>Observability</Eyebrow>
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Diagnostics &amp; live tail</CardTitle>
                    <CardDescription className="leading-6">
                      Runtime metadata stays pinned above the rolling current-session log buffer.
                    </CardDescription>
                  </div>
                </div>

                <Badge variant="outline" className="rounded-full px-2.5">
                  {logs.length} lines
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <RuntimeField icon={Activity} label="State" value={meta.badge} hint={meta.detail} />
                <RuntimeField
                  icon={Clock3}
                  label="Uptime"
                  value={formatUptime(status.startedAt, status.state)}
                  hint={
                    formatTimestamp(status.startedAt) ?? "Waiting for the first successful start."
                  }
                />
                <RuntimeField
                  icon={Waypoints}
                  label="PID / Exit"
                  value={`${status.pid ?? "—"} / ${status.exitCode ?? "—"}`}
                  hint="Current child PID and the last recorded exit code."
                />
                <RuntimeField
                  icon={Gauge}
                  label="Metrics"
                  value={
                    state.settings.metricsEnabled ? `:${state.settings.metricsPort}` : "Disabled"
                  }
                  hint={metricsUrl ?? "Enable metrics to expose a scrape target."}
                />
              </div>

              {status.lastError ? (
                <div className="rounded-[1.5rem] border border-destructive/25 bg-destructive/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <Activity className="size-4" strokeWidth={1.8} />
                    Last error
                  </div>
                  <p className="mt-2 text-sm leading-6 text-destructive">{status.lastError}</p>
                </div>
              ) : null}

              <Separator />

              <div className="flex min-h-0 flex-1 flex-col rounded-[1.7rem] border border-border bg-muted/25 p-1.5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] bg-card px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">Live session logs</p>
                      <Badge
                        variant={followLogs ? "default" : "secondary"}
                        className="rounded-full"
                      >
                        {followLogs ? "Following" : "Reviewing"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Buffer resets on every fresh cloudflared start.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!followLogs && logs.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={jumpToLatest}
                        className="rounded-full border border-border bg-background px-3"
                      >
                        Jump to latest
                      </Button>
                    ) : null}

                    {logs.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLogDialogOpen(true)}
                        className="rounded-full border border-border bg-background px-3"
                      >
                        <Maximize2 className="size-4" strokeWidth={1.8} />
                        View all
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportLogs}
                      disabled={logs.length === 0}
                      className="rounded-full border border-border bg-background px-3"
                    >
                      <ArrowDownToLine className="size-4" strokeWidth={1.8} />
                      Export Logs
                    </Button>
                  </div>
                </div>

                <div
                  ref={logViewportRootRef}
                  className={cn("relative min-h-0", logs.length > 0 && "max-h-[17rem]")}
                >
                  <ScrollArea className="h-full rounded-[1.35rem] bg-card">
                    {logs.length === 0 ? (
                      <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-3 px-6 text-center">
                        <div className="flex size-11 items-center justify-center rounded-full border border-border bg-muted/50">
                          <Logs className="size-5 text-muted-foreground" strokeWidth={1.8} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">No logs yet</p>
                          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                            Start or restart the tunnel to capture the next cloudflared session
                            output.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <pre className="px-4 py-4 font-mono text-[12px] leading-6 whitespace-pre-wrap text-muted-foreground">
                        {logs.map((line, index) => (
                          <span key={`${index}-${line.slice(0, 24)}`} className="block">
                            {line}
                          </span>
                        ))}
                      </pre>
                    )}
                  </ScrollArea>

                  {logs.length > 10 && (
                    <div className="pointer-events-none absolute right-3 bottom-3">
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2.5 text-[11px] opacity-90 shadow-xs"
                      >
                        +{logs.length - 10} more
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </PanelShell>
        </div>
      </div>

      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent
          className="flex max-h-[85vh] max-w-[90vw] flex-col gap-0 p-0 sm:max-w-[90vw]"
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base">Live session logs</DialogTitle>
              <Badge variant="outline" className="rounded-full px-2.5">
                {logs.length} lines
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportLogs}
                disabled={logs.length === 0}
                className="rounded-full border border-border bg-background px-3"
              >
                <ArrowDownToLine className="size-4" strokeWidth={1.8} />
                Export Logs
              </Button>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full border border-border bg-background px-3"
                >
                  <Minimize2 className="size-4" strokeWidth={1.8} />
                  Close
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 py-4">
            {logs.length === 0 ? (
              <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-11 items-center justify-center rounded-full border border-border bg-muted/50">
                  <Logs className="size-5 text-muted-foreground" strokeWidth={1.8} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">No logs yet</p>
                  <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                    Start or restart the tunnel to capture the next cloudflared session output.
                  </p>
                </div>
              </div>
            ) : (
              <pre className="font-mono text-[12px] leading-6 whitespace-pre-wrap text-muted-foreground">
                {logs.map((line, index) => (
                  <span key={`${index}-${line.slice(0, 24)}`} className="block">
                    {line}
                  </span>
                ))}
              </pre>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
