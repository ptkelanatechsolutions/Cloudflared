import { describe, it, expect } from "vitest";
import {
  PROTOCOL_OPTIONS,
  REGION_OPTIONS,
  EDGE_OPTIONS,
  STATE_META,
  settingsEqual,
  formatTimestamp,
  formatUptime,
} from "@/lib/tunnel";
import type { TunnelSettings } from "@cloudflared/core";

/* ─── Tunnel constants ───────────────────────────────── */

describe("tunnel constants", () => {
  it("has protocol options", () => {
    expect(PROTOCOL_OPTIONS).toHaveLength(3);
    expect(PROTOCOL_OPTIONS.map((o) => o.value)).toEqual(["auto", "http2", "quic"]);
  });

  it("has region options", () => {
    expect(REGION_OPTIONS).toHaveLength(2);
    expect(REGION_OPTIONS.map((o) => o.value)).toEqual(["auto", "us"]);
  });

  it("has edge IP options", () => {
    expect(EDGE_OPTIONS).toHaveLength(3);
    expect(EDGE_OPTIONS.map((o) => o.value)).toEqual(["auto", "4", "6"]);
  });

  it("has state metadata for every tunnel state", () => {
    const states = Object.keys(STATE_META);
    expect(states).toEqual(["running", "starting", "stopping", "stopped", "error"]);
  });

  it("running state has active tone", () => {
    expect(STATE_META["running"].tone).toBe("active");
    expect(STATE_META["running"].label).toBe("Online");
  });

  it("error state has error tone", () => {
    expect(STATE_META["error"].tone).toBe("error");
    expect(STATE_META["error"].badge).toBe("Attention");
  });

  it("stopped state has idle tone", () => {
    expect(STATE_META["stopped"].tone).toBe("idle");
    expect(STATE_META["stopped"].label).toBe("Offline");
  });
});

/* ─── settingsEqual ──────────────────────────────────── */

describe("settingsEqual", () => {
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

  it("returns true for identical settings", () => {
    expect(settingsEqual(base, { ...base })).toBe(true);
  });

  it("returns false when protocol differs", () => {
    const other = { ...base, protocol: "quic" as const };
    expect(settingsEqual(base, other)).toBe(false);
  });

  it("returns false when region differs", () => {
    const other = { ...base, region: "us" as const };
    expect(settingsEqual(base, other)).toBe(false);
  });

  it("returns false when edgeIpVersion differs", () => {
    const other = { ...base, edgeIpVersion: "6" as const };
    expect(settingsEqual(base, other)).toBe(false);
  });

  it("returns false when metricsEnabled differs", () => {
    const other = { ...base, metricsEnabled: true };
    expect(settingsEqual(base, other)).toBe(false);
  });

  it("returns false when metricsPort differs", () => {
    const other = { ...base, metricsPort: 9999 };
    expect(settingsEqual(base, other)).toBe(false);
  });

  it("returns false when autoStart differs", () => {
    const other = { ...base, autoStart: false };
    expect(settingsEqual(base, other)).toBe(false);
  });
});

/* ─── formatTimestamp ────────────────────────────────── */

describe("formatTimestamp", () => {
  it("returns null for null input", () => {
    expect(formatTimestamp(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(formatTimestamp("")).toBeNull();
  });

  it("formats a valid ISO timestamp", () => {
    const result = formatTimestamp("2026-06-23T12:34:56Z");
    expect(result).toBeTruthy();
    expect(result).toContain("2026");
  });
});

/* ─── formatUptime ───────────────────────────────────── */

describe("formatUptime", () => {
  it('returns "Offline" when state is stopped', () => {
    expect(formatUptime("2026-06-23T12:00:00Z", "stopped")).toBe("Offline");
  });

  it('returns "Offline" when startedAt is null', () => {
    expect(formatUptime(null, "running")).toBe("Offline");
  });

  it('returns "Offline" when state is error', () => {
    expect(formatUptime("2026-06-23T12:00:00Z", "error")).toBe("Offline");
  });

  it("returns seconds for recent start", () => {
    const recent = new Date(Date.now() - 30_000).toISOString();
    const result = formatUptime(recent, "running");
    expect(result).toMatch(/\d+s/);
    expect(result).not.toContain("h");
    expect(result).not.toContain("m");
  });

  it("returns minutes for start ~2 minutes ago", () => {
    const twoMinAgo = new Date(Date.now() - 120_000).toISOString();
    expect(formatUptime(twoMinAgo, "running")).toMatch(/\d+m \d+s/);
  });

  it("returns hours for start ~3 hours ago", () => {
    const threeHAgo = new Date(Date.now() - 3 * 3600_000).toISOString();
    expect(formatUptime(threeHAgo, "running")).toMatch(/\dh \d+m/);
  });
});
