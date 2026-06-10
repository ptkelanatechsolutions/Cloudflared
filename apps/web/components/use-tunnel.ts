"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useReducedMotion } from "motion/react";
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
import type { TunnelSettings, TunnelStatus } from "@cloudflared/core";
import { POLL_MS, LOG_FOLLOW_THRESHOLD, STATE_META, settingsEqual } from "@/lib/tunnel";

export interface Tunnel {
  state: DashboardState;
  tokenInput: string;
  setTokenInput: Dispatch<SetStateAction<string>>;
  draftSettings: TunnelSettings;
  draftMetricsPort: string;
  setDraftMetricsPort: Dispatch<SetStateAction<string>>;
  isEditingSettings: boolean;
  setIsEditingSettings: Dispatch<SetStateAction<boolean>>;
  visibleSettings: TunnelSettings;
  visibleMetricsPort: string;
  dirtySettings: boolean;
  metricsPortValue: number;
  metricsPortInvalid: boolean;
  metricsHost: string | null;
  metricsUrl: string | null;
  status: TunnelStatus;
  meta: (typeof STATE_META)[TunnelStatus["state"]];
  online: boolean;
  busy: boolean;
  pendingRestart: boolean;
  tokenReady: boolean;
  subline: string;
  statusBadgeVariant: "default" | "secondary" | "destructive";
  followLogs: boolean;
  setFollowLogs: Dispatch<SetStateAction<boolean>>;
  logViewportRootRef: React.RefObject<HTMLDivElement | null>;
  logs: string[];
  logDialogOpen: boolean;
  setLogDialogOpen: Dispatch<SetStateAction<boolean>>;
  reducedMotion: boolean;
  handleDraftChange: (patch: Partial<TunnelSettings>) => void;
  handleMetricsPortChange: (next: string) => void;
  handleSaveToken: () => void;
  handleToggleTunnel: () => void;
  handleRestartTunnel: () => void;
  handleSaveSettings: () => void;
  handleSaveAndRestart: () => void;
  handleDiscardDraft: () => void;
  handleExportLogs: () => void;
  jumpToLatest: () => void;
}

export function useTunnel(initial: DashboardState): Tunnel {
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

  return {
    state,
    tokenInput,
    setTokenInput,
    draftSettings,
    draftMetricsPort,
    setDraftMetricsPort,
    isEditingSettings,
    setIsEditingSettings,
    visibleSettings,
    visibleMetricsPort,
    dirtySettings,
    metricsPortValue,
    metricsPortInvalid,
    metricsHost,
    metricsUrl,
    status,
    meta,
    online,
    busy,
    pendingRestart,
    tokenReady,
    subline,
    statusBadgeVariant,
    followLogs,
    setFollowLogs,
    logViewportRootRef,
    logs,
    logDialogOpen,
    setLogDialogOpen,
    reducedMotion,
    handleDraftChange,
    handleMetricsPortChange,
    handleSaveToken,
    handleToggleTunnel,
    handleRestartTunnel,
    handleSaveSettings,
    handleSaveAndRestart,
    handleDiscardDraft,
    handleExportLogs,
    jumpToLatest,
  };
}
