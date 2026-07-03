import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock child_process BEFORE importing the module under test
vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

// Need to re-import after mocking
const { spawn } = await import("node:child_process");
const { CloudflaredManager, buildArgs } = await import("../manager");

import type { TunnelSettings } from "../../schema/config";
import type { CloudflaredManager as CloudflaredManagerType } from "../manager";
import { EventEmitter } from "node:events";

/* ─── buildArgs ──────────────────────────────────────── */

describe("buildArgs", () => {
  const base: TunnelSettings = {
    protocol: "auto",
    region: "auto",
    edgeIpVersion: "auto",
    metricsEnabled: false,
    metricsPort: 60123,
    autoStart: true,
    gracePeriod: 0,
    logLevel: "info",
    scheduledRestartHours: 0,
  };

  it('returns basic args for default settings (just "tunnel", "run")', () => {
    const args = buildArgs(base);
    expect(args).toEqual(["tunnel", "run"]);
  });

  it("adds --metrics flag when metricsEnabled is true", () => {
    const args = buildArgs({ ...base, metricsEnabled: true });
    expect(args).toContain("--metrics");
    expect(args).toContain("0.0.0.0:60123");
    // --metrics must come before "tunnel run"
    const metricsIdx = args.indexOf("--metrics");
    const tunnelIdx = args.indexOf("tunnel");
    expect(metricsIdx).toBeLessThan(tunnelIdx);
  });

  it("adds --protocol when protocol is not auto", () => {
    const args = buildArgs({ ...base, protocol: "quic" });
    expect(args).toContain("--protocol");
    expect(args).toContain("quic");
  });

  it("omits --protocol when protocol is auto", () => {
    const args = buildArgs(base);
    expect(args).not.toContain("--protocol");
  });

  it("adds --region us when region is us", () => {
    const args = buildArgs({ ...base, region: "us" });
    expect(args).toContain("--region");
    expect(args).toContain("us");
  });

  it("omits --region when region is auto", () => {
    const args = buildArgs(base);
    expect(args).not.toContain("--region");
  });

  it("adds --edge-ip-version when set to 4 or 6", () => {
    const args4 = buildArgs({ ...base, edgeIpVersion: "4" });
    expect(args4).toContain("--edge-ip-version");
    expect(args4).toContain("4");

    const args6 = buildArgs({ ...base, edgeIpVersion: "6" });
    expect(args6).toContain("--edge-ip-version");
    expect(args6).toContain("6");
  });

  it("omits --edge-ip-version when set to auto", () => {
    const args = buildArgs(base);
    expect(args).not.toContain("--edge-ip-version");
  });
});

/* ─── CloudflaredManager ─────────────────────────────── */

describe("CloudflaredManager", () => {
  let manager: CloudflaredManagerType;
  const baseSettings: TunnelSettings = {
    protocol: "auto",
    region: "auto",
    edgeIpVersion: "auto",
    metricsEnabled: false,
    metricsPort: 60123,
    autoStart: true,
    gracePeriod: 0,
    logLevel: "info",
    scheduledRestartHours: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new CloudflaredManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in 'stopped' state", () => {
    expect(manager.status().state).toBe("stopped");
  });

  it("status returns correct defaults", () => {
    const status = manager.status();
    expect(status).toMatchObject({
      state: "stopped",
      pid: null,
      startedAt: null,
      exitCode: null,
      exitSignal: null,
      lastError: null,
    });
  });

  it("getLogs returns empty array initially", () => {
    expect(manager.getLogs()).toEqual([]);
  });

  it("isRunning returns false initially", () => {
    expect(manager.isRunning()).toBe(false);
  });

  it("start sets state to 'starting' and spawns cloudflared", () => {
    const mockChild = new EventEmitter() as any;
    mockChild.pid = 42;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();
    (spawn as ReturnType<typeof vi.fn>).mockReturnValue(mockChild);

    const status = manager.start("valid-token", baseSettings);
    expect(status.state).toBe("starting");
    expect(spawn).toHaveBeenCalledOnce();
    expect(spawn).toHaveBeenCalledWith(
      "cloudflared",
      ["tunnel", "run"],
      expect.objectContaining({
        env: expect.objectContaining({ TUNNEL_TOKEN: "valid-token" }),
      }),
    );
  });

  it("start transitions to 'running' on spawn event", () => {
    const mockChild = new EventEmitter() as any;
    mockChild.pid = 42;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();
    (spawn as ReturnType<typeof vi.fn>).mockReturnValue(mockChild);

    manager.start("valid-token", baseSettings);
    mockChild.emit("spawn");

    expect(manager.status().state).toBe("running");
    expect(manager.status().pid).toBe(42);
    expect(manager.status().startedAt).toBeTruthy();
  });

  it("start returns error when token is empty", () => {
    const status = manager.start("", baseSettings);
    expect(status.state).toBe("error");
    expect(status.lastError).toBe("Tunnel token is empty.");
    expect(spawn).not.toHaveBeenCalled();
  });

  it("start does not spawn when already running", () => {
    const mockChild = new EventEmitter() as any;
    mockChild.pid = 42;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();
    (spawn as ReturnType<typeof vi.fn>).mockReturnValue(mockChild);

    manager.start("valid-token", baseSettings);
    mockChild.emit("spawn");

    const secondStatus = manager.start("another-token", baseSettings);
    expect(spawn).toHaveBeenCalledTimes(1); // still only once
    expect(secondStatus.state).toBe("running");
  });

  it("stop transitions to 'stopped' when no child exists", () => {
    const status = manager.stop();
    expect(status.state).toBe("stopped");
  });

  it("stop sends SIGTERM to child", () => {
    const mockChild = new EventEmitter() as any;
    mockChild.pid = 42;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();
    mockChild.kill = vi.fn();
    (spawn as ReturnType<typeof vi.fn>).mockReturnValue(mockChild);

    manager.start("token", baseSettings);
    mockChild.emit("spawn");
    const status = manager.stop();
    expect(mockChild.kill).toHaveBeenCalledWith("SIGTERM");
    expect(status.state).toBe("stopping");
  });

  it("exit with code 0 transitions to 'stopped'", () => {
    const mockChild = new EventEmitter() as any;
    mockChild.pid = 42;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();
    (spawn as ReturnType<typeof vi.fn>).mockReturnValue(mockChild);

    manager.start("token", baseSettings);
    mockChild.emit("spawn");
    mockChild.emit("exit", 0, null);

    expect(manager.status().state).toBe("stopped");
    expect(manager.status().exitCode).toBe(0);
  });

  it("exit with non-zero code transitions to 'error'", () => {
    const mockChild = new EventEmitter() as any;
    mockChild.pid = 42;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();
    (spawn as ReturnType<typeof vi.fn>).mockReturnValue(mockChild);

    manager.start("token", baseSettings);
    mockChild.emit("spawn");
    mockChild.emit("exit", 1, null);

    expect(manager.status().state).toBe("error");
    expect(manager.status().exitCode).toBe(1);
    expect(manager.status().lastError).toContain("exited with code");
  });

  it("error event sets state to error with message", () => {
    const mockChild = new EventEmitter() as any;
    mockChild.pid = 42;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();
    (spawn as ReturnType<typeof vi.fn>).mockReturnValue(mockChild);

    manager.start("token", baseSettings);
    mockChild.emit("error", new Error("EPERM: operation not permitted"));

    expect(manager.status().state).toBe("error");
    expect(manager.status().lastError).toContain("EPERM");
  });

  it("collects log lines from stdout/stderr", () => {
    const mockChild = new EventEmitter() as any;
    mockChild.pid = 42;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();
    (spawn as ReturnType<typeof vi.fn>).mockReturnValue(mockChild);

    manager.start("token", baseSettings);
    mockChild.emit("spawn");

    mockChild.stdout.emit("data", Buffer.from("Infotunnel connection established\n"));
    mockChild.stderr.emit("data", Buffer.from("ERR Warngot error\n"));

    const logs = manager.getLogs();
    expect(logs).toContain("Infotunnel connection established");
    expect(logs).toContain("ERR Warngot error");
  });

  it("produces correct tunnel status when start succeeds", () => {
    const mockChild = new EventEmitter() as any;
    mockChild.pid = 42;
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();
    (spawn as ReturnType<typeof vi.fn>).mockReturnValue(mockChild);

    manager.start("token", baseSettings);
    mockChild.emit("spawn");

    const status = manager.status();
    expect(status.state).toBe("running");
    expect(status.pid).toBe(42);
    expect(status.startedAt).toBeTruthy();
  });
});
