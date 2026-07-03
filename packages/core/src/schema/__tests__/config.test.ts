import { describe, it, expect } from "vitest";
import { tunnelSettingsSchema, appConfigSchema } from "../config";

/* ─── tunnelSettingsSchema ───────────────────────────── */

describe("tunnelSettingsSchema", () => {
  it("applies defaults when input is empty", () => {
    const result = tunnelSettingsSchema.parse({});
    expect(result).toEqual({
      protocol: "auto",
      region: "auto",
      edgeIpVersion: "auto",
      metricsEnabled: false,
      metricsPort: 60123,
      autoStart: true,
      gracePeriod: 0,
      logLevel: "info",
      scheduledRestartHours: 0,
    });
  });

  it("accepts valid custom values", () => {
    const result = tunnelSettingsSchema.parse({
      protocol: "quic",
      region: "us",
      edgeIpVersion: "6",
      metricsEnabled: true,
      metricsPort: 8080,
      autoStart: false,
      gracePeriod: 30,
      logLevel: "debug",
      scheduledRestartHours: 6,
    });
    expect(result).toEqual({
      protocol: "quic",
      region: "us",
      edgeIpVersion: "6",
      metricsEnabled: true,
      metricsPort: 8080,
      autoStart: false,
      gracePeriod: 30,
      logLevel: "debug",
      scheduledRestartHours: 6,
    });
  });

  it("rejects invalid protocol", () => {
    expect(() => tunnelSettingsSchema.parse({ protocol: "spdy" })).toThrow();
  });

  it("rejects invalid region", () => {
    expect(() => tunnelSettingsSchema.parse({ region: "eu" })).toThrow();
  });

  it("rejects invalid edgeIpVersion", () => {
    expect(() => tunnelSettingsSchema.parse({ edgeIpVersion: "5" })).toThrow();
  });

  it("rejects invalid metrics port (0)", () => {
    expect(() => tunnelSettingsSchema.parse({ metricsPort: 0 })).toThrow();
  });

  it("rejects invalid metrics port (70000)", () => {
    expect(() => tunnelSettingsSchema.parse({ metricsPort: 70000 })).toThrow();
  });

  it("rejects string port", () => {
    expect(() => tunnelSettingsSchema.parse({ metricsPort: "12345" })).toThrow();
  });
});

/* ─── appConfigSchema ────────────────────────────────── */

describe("appConfigSchema", () => {
  it("applies defaults when input is empty", () => {
    const result = appConfigSchema.parse({});
    expect(result.token).toBe("");
    expect(result.settings.protocol).toBe("auto");
    expect(result.settings.autoStart).toBe(true);
  });

  it("accepts a full valid config", () => {
    const result = appConfigSchema.parse({
      token: "some-tunnel-token",
      settings: {
        protocol: "http2",
        region: "us",
        edgeIpVersion: "4",
        metricsEnabled: true,
        metricsPort: 9999,
        autoStart: false,
      },
    });
    expect(result.token).toBe("some-tunnel-token");
    expect(result.settings.protocol).toBe("http2");
    expect(result.settings.autoStart).toBe(false);
  });

  it("strips unknown keys", () => {
    const result = appConfigSchema.parse({
      token: "abc",
      unknownField: "should-be-stripped",
    });
    expect(result).not.toHaveProperty("unknownField");
  });
});
