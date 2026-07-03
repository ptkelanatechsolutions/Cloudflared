import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogDialog } from "@/components/sections/log-dialog";
import type { Tunnel } from "@/components/use-tunnel";

/* ─── Helpers ────────────────────────────────────────── */

function createMockTunnel(overrides: Partial<Tunnel> = {}): Tunnel {
  return {
    state: {
      status: {
        state: "running",
        pid: 123,
        startedAt: new Date().toISOString(),
        exitCode: null,
        exitSignal: null,
        lastError: null,
      },
      settings: {
        protocol: "auto",
        region: "auto",
        edgeIpVersion: "auto",
        metricsEnabled: false,
        metricsPort: 60123,
        autoStart: true,
        gracePeriod: 0,
        logLevel: "info",
        scheduledRestartHours: 0,
      },
      tokenSet: true,
      logs: [],
      connectorInfo: { id: null, location: null },
      stateHistory: [],
      metrics: null,
    },
    logs: [],
    status: {
      state: "running",
      pid: 123,
      startedAt: new Date().toISOString(),
      exitCode: null,
      exitSignal: null,
      lastError: null,
    },
    meta: {
      label: "Online",
      tone: "active",
      badge: "Connected",
      detail: "Tunnel is serving traffic.",
    },
    online: true,
    busy: false,
    pendingRestart: false,
    tokenReady: true,
    subline: "Connected",
    statusBadgeVariant: "default",
    reducedMotion: false,
    connectionLost: false,
    logDialogOpen: false,
    followLogs: true,
    setFollowLogs: vi.fn(),
    setLogDialogOpen: vi.fn(),
    handleExportLogs: vi.fn(),
    jumpToLatest: vi.fn(),

    // Tunnel shaping props
    tokenInput: "",
    setTokenInput: vi.fn(),
    draftSettings: {
      protocol: "auto",
      region: "auto",
      edgeIpVersion: "auto",
      metricsEnabled: false,
      metricsPort: 60123,
      autoStart: true,
      gracePeriod: 0,
      logLevel: "info",
      scheduledRestartHours: 0,
    },
    draftMetricsPort: "60123",
    setDraftMetricsPort: vi.fn(),
    isEditingSettings: false,
    setIsEditingSettings: vi.fn(),
    visibleSettings: {
      protocol: "auto",
      region: "auto",
      edgeIpVersion: "auto",
      metricsEnabled: false,
      metricsPort: 60123,
      autoStart: true,
      gracePeriod: 0,
      logLevel: "info",
      scheduledRestartHours: 0,
    },
    visibleMetricsPort: "60123",
    dirtySettings: false,
    metricsPortValue: 60123,
    metricsPortInvalid: false,
    metricsHost: "localhost",
    metricsUrl: null,
    logViewportRootRef: { current: null },
    handleDraftChange: vi.fn(),
    handleMetricsPortChange: vi.fn(),
    handleSaveToken: vi.fn(),
    handleToggleTunnel: vi.fn(),
    handleRestartTunnel: vi.fn(),
    handleSaveSettings: vi.fn(),
    handleSaveAndRestart: vi.fn(),
    handleDiscardDraft: vi.fn(),
    connectorInfo: { id: null, location: null },
    stateHistory: [],
    metrics: null,
    metricsHistory: [],
    handleCopyConnectorId: vi.fn(),
    exportImportDialogOpen: false,
    setExportImportDialogOpen: vi.fn(),
    handleExportConfig: vi.fn(),
    handleImportConfig: vi.fn(),
    diagnosticsResult: null,
    diagnosticsRunning: false,
    handleRunDiagnostics: vi.fn(),
    diagnosticsDialogOpen: false,
    setDiagnosticsDialogOpen: vi.fn(),
    ...overrides,
  };
}

function createLogLines(count: number): string[] {
  return Array.from(
    { length: count },
    (_, i) => `2026-06-23T12:00:${String(i).padStart(2, "0")}Z [INFO] Log line #${i + 1}`,
  );
}

/* ─── Tests ──────────────────────────────────────────── */

describe("LogDialog — preview section", () => {
  it('shows "No log entries yet." when empty and not busy', () => {
    const t = createMockTunnel({ logs: [], busy: false });
    render(<LogDialog t={t} />);
    expect(screen.getByText("No log entries yet.")).toBeInTheDocument();
  });

  it('shows "Connecting..." when empty and busy', () => {
    const t = createMockTunnel({ logs: [], busy: true });
    render(<LogDialog t={t} />);
    expect(screen.getByText("Connecting...")).toBeInTheDocument();
  });

  it("shows the last 10 log lines in preview", () => {
    const lines = createLogLines(20);
    const t = createMockTunnel({ logs: lines });
    render(<LogDialog t={t} />);

    // Should show the last 10 lines (indices 10-19)
    expect(screen.getByText(lines[19])).toBeInTheDocument(); // last line
    // The first line should NOT be rendered
    expect(screen.queryByText(lines[0])).not.toBeInTheDocument();
  });

  it("shows overflow count when logs exceed preview limit", () => {
    const lines = createLogLines(25);
    const t = createMockTunnel({ logs: lines });
    render(<LogDialog t={t} />);
    expect(screen.getByText("+15 more entries")).toBeInTheDocument();
  });

  it('shows "+1 more entry" for exactly 11 logs', () => {
    const lines = createLogLines(11);
    const t = createMockTunnel({ logs: lines });
    render(<LogDialog t={t} />);
    expect(screen.getByText("+1 more entry")).toBeInTheDocument();
  });

  it("does not show overflow badge when logs are 10 or fewer", () => {
    const lines = createLogLines(10);
    const t = createMockTunnel({ logs: lines });
    render(<LogDialog t={t} />);
    expect(screen.queryByText(/more entries?/)).not.toBeInTheDocument();
  });

  it("clicking Expand calls setLogDialogOpen(true)", async () => {
    const user = userEvent.setup();
    const setLogDialogOpen = vi.fn();
    const t = createMockTunnel({ logs: createLogLines(5), setLogDialogOpen });
    render(<LogDialog t={t} />);

    await user.click(screen.getByRole("button", { name: /expand/i }));
    expect(setLogDialogOpen).toHaveBeenCalledWith(true);
  });

  it("clicking overflow badge calls setLogDialogOpen(true)", async () => {
    const user = userEvent.setup();
    const setLogDialogOpen = vi.fn();
    const t = createMockTunnel({ logs: createLogLines(15), setLogDialogOpen });
    render(<LogDialog t={t} />);

    await user.click(screen.getByText("+5 more entries"));
    expect(setLogDialogOpen).toHaveBeenCalledWith(true);
  });
});

describe("LogDialog — dialog section", () => {
  it("is not visible when logDialogOpen is false", () => {
    const t = createMockTunnel({ logs: createLogLines(5), logDialogOpen: false });
    render(<LogDialog t={t} />);

    // Dialog title is sr-only, but dialog content should not be visible
    expect(screen.queryByText("Full tunnel log")).not.toBeInTheDocument();
  });

  it("is visible when logDialogOpen is true", () => {
    const t = createMockTunnel({ logs: createLogLines(5), logDialogOpen: true });
    render(<LogDialog t={t} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows all log lines in the dialog", () => {
    const lines = createLogLines(5);
    const t = createMockTunnel({ logs: lines, logDialogOpen: true });
    render(<LogDialog t={t} />);

    lines.forEach((line) => {
      // Log lines appear both in preview and dialog, so use getAllByText
      const elements = screen.getAllByText(line);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows "No log entries yet." in dialog when empty', () => {
    const t = createMockTunnel({ logs: [], logDialogOpen: true });
    render(<LogDialog t={t} />);
    // Teks muncul baik di preview maupun dialog, jadi pake getAllByText
    const elements = screen.getAllByText("No log entries yet.");
    expect(elements).toHaveLength(2);
    elements.forEach((el) => expect(el).toBeInTheDocument());
  });

  it("shows auto-scroll badge when followLogs is true", () => {
    const t = createMockTunnel({ logs: createLogLines(3), logDialogOpen: true, followLogs: true });
    render(<LogDialog t={t} />);
    expect(screen.getByText("Auto-scroll")).toBeInTheDocument();
  });

  it('shows "Scroll to latest" when followLogs is false', () => {
    const t = createMockTunnel({ logs: createLogLines(3), logDialogOpen: true, followLogs: false });
    render(<LogDialog t={t} />);
    expect(screen.getByText("Scroll to latest")).toBeInTheDocument();
  });

  it('clicking "Scroll to latest" calls jumpToLatest', async () => {
    const user = userEvent.setup();
    const jumpToLatest = vi.fn();
    const t = createMockTunnel({
      logs: createLogLines(3),
      logDialogOpen: true,
      followLogs: false,
      jumpToLatest,
    });
    render(<LogDialog t={t} />);

    await user.click(screen.getByText("Scroll to latest"));
    expect(jumpToLatest).toHaveBeenCalledOnce();
  });

  it("clicking Close calls setLogDialogOpen(false)", async () => {
    const user = userEvent.setup();
    const setLogDialogOpen = vi.fn();
    const t = createMockTunnel({
      logs: createLogLines(3),
      logDialogOpen: true,
      setLogDialogOpen,
    });
    render(<LogDialog t={t} />);

    const closeBtn = screen.getByRole("button", { name: /close/i });
    await user.click(closeBtn);
    expect(setLogDialogOpen).toHaveBeenCalledWith(false);
  });

  it("clicking Export calls handleExportLogs", async () => {
    const user = userEvent.setup();
    const handleExportLogs = vi.fn();
    const t = createMockTunnel({
      logs: createLogLines(3),
      logDialogOpen: true,
      handleExportLogs,
    });
    render(<LogDialog t={t} />);

    const exportBtn = screen.getByRole("button", { name: /export/i });
    await user.click(exportBtn);
    expect(handleExportLogs).toHaveBeenCalledOnce();
  });

  it("Export button is disabled when logs are empty", () => {
    const t = createMockTunnel({ logs: [], logDialogOpen: true });
    render(<LogDialog t={t} />);

    const exportBtn = screen.getByRole("button", { name: /export/i });
    expect(exportBtn).toBeDisabled();
  });
});
