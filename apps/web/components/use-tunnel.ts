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
import { toast } from "sonner";
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
import {
  POLL_MS,
  CONNECTION_TIMEOUT_MS,
  LOG_FOLLOW_THRESHOLD,
  STATE_META,
  settingsEqual,
} from "@/lib/tunnel";

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
  connectionLost: boolean;
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

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
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
  const [connectionLost, setConnectionLost] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const logViewportRootRef = useRef<HTMLDivElement | null>(null);
  const logs = useDeferredValue(state.logs);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const lastPollTimeRef = useRef(0);

  // Initialize poll timestamp after first render
  useEffect(() => {
    lastPollTimeRef.current = Date.now();
  }, []);

  const refresh = useEffectEvent(async () => {
    try {
      const next = await getState();
      lastPollTimeRef.current = Date.now();
      setConnectionLost(false);
      startTransition(() => {
        setState(next);
      });
    } catch {
      const elapsed = Date.now() - lastPollTimeRef.current;
      if (elapsed >= CONNECTION_TIMEOUT_MS) {
        setConnectionLost(true);
      }
    }
  });

  // Polling with tab-visibility pause
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) void refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Refresh immediately when tab becomes visible
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Update screen reader live region when tunnel status changes
  useEffect(() => {
    const statusText =
      state.status.state === "running"
        ? "Tunnel is online and connected."
        : state.status.state === "starting"
          ? "Tunnel is connecting."
          : state.status.state === "stopping"
            ? "Tunnel is stopping."
            : state.status.state === "error"
              ? `Tunnel encountered an error: ${state.status.lastError ?? "Unknown error"}`
              : "Tunnel is offline.";

    const el = document.querySelector<HTMLElement>("[data-status-region]");
    if (el) {
      el.textContent = statusText;
    }
  }, [state.status]);

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
      try {
        const next = await saveToken(token);
        setState(next);
        setTokenInput("");
        toast.success("Token saved successfully");
      } catch (err) {
        console.error("[tunnel] saveToken failed:", err);
        toast.error(getErrorMessage(err), {
          description: "Failed to save token. Please check the value and try again.",
        });
      }
    });
  }

  function handleToggleTunnel() {
    startMutation(async () => {
      try {
        const next = online ? await stopTunnel() : await startTunnel();
        setState(next);
        if (online) {
          toast.success("Tunnel stopped");
        } else {
          toast.success("Tunnel started");
        }
      } catch (err) {
        console.error("[tunnel] toggleTunnel failed:", err);
        toast.error(getErrorMessage(err), {
          description: online ? "Failed to stop the tunnel." : "Failed to start the tunnel.",
        });
      }
    });
  }

  function handleRestartTunnel() {
    startMutation(async () => {
      try {
        const next = await restartTunnel();
        setState(next);
        toast.success("Tunnel restarted");
      } catch (err) {
        console.error("[tunnel] restartTunnel failed:", err);
        toast.error(getErrorMessage(err), { description: "Failed to restart the tunnel." });
      }
    });
  }

  function handleSaveSettings() {
    if (metricsPortInvalid) return;

    startMutation(async () => {
      try {
        const next = await saveSettings(draftSettings);
        setState(next);
        setDraftSettings(next.settings);
        setDraftMetricsPort(String(next.settings.metricsPort));
        setIsEditingSettings(false);
        toast.success("Settings saved");
      } catch (err) {
        console.error("[tunnel] saveSettings failed:", err);
        toast.error(getErrorMessage(err), { description: "Failed to save settings." });
      }
    });
  }

  function handleSaveAndRestart() {
    if (metricsPortInvalid) return;

    startMutation(async () => {
      try {
        const next = await saveSettingsAndRestart(draftSettings);
        setState(next);
        setDraftSettings(next.settings);
        setDraftMetricsPort(String(next.settings.metricsPort));
        setIsEditingSettings(false);
        toast.success("Settings saved and tunnel restarted");
      } catch (err) {
        console.error("[tunnel] saveAndRestart failed:", err);
        toast.error(getErrorMessage(err), {
          description: "Failed to save settings and restart tunnel.",
        });
      }
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
    toast.success("Logs exported");
  }

  function jumpToLatest() {
    const viewport = logViewportRootRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;

    viewport.scrollTop = viewport.scrollHeight;
    setFollowLogs(true);
  }

  // Keyboard shortcuts
  const handleKeyboardShortcuts = useEffectEvent((e: KeyboardEvent) => {
    // Ctrl/Cmd + Enter: toggle tunnel
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleToggleTunnel();
    }
    // Ctrl/Cmd + L: open logs
    if ((e.metaKey || e.ctrlKey) && e.key === "l") {
      e.preventDefault();
      setLogDialogOpen(true);
    }
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => handleKeyboardShortcuts(e);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

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
    connectionLost,
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
