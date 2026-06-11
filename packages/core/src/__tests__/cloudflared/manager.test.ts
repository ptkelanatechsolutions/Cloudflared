import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { CloudflaredManager, buildArgs } from "../../cloudflared/manager";

void describe("CloudflaredManager", () => {
  const TOKEN = "test-token-123";
  const SETTINGS = {
    protocol: "auto" as const,
    region: "auto" as const,
    edgeIpVersion: "auto" as const,
    metricsEnabled: false,
    metricsPort: 60123,
    autoStart: true,
  };

  void it("initial status is stopped", () => {
    const m = new CloudflaredManager();
    const s = m.status();
    assert.equal(s.state, "stopped");
    assert.equal(s.pid, null);
    assert.equal(s.exitCode, null);
    assert.equal(s.exitSignal, null);
    assert.equal(s.lastError, null);
  });

  void it("start() with empty token returns error", () => {
    const m = new CloudflaredManager();
    const s = m.start("", SETTINGS);
    assert.equal(s.state, "error");
    assert.equal(s.lastError, "Tunnel token is empty.");
  });

  void it("start() transitions to starting then error for missing bin", () => {
    const m = new CloudflaredManager();
    process.env.CLOUDFLARED_BIN = "nonexistent-binary-xyz";
    const s = m.start(TOKEN, SETTINGS);
    assert.equal(s.state, "starting");
    // Wait — the error event fires asynchronously
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const st = m.status();
        assert.equal(st.state, "error");
        assert.ok(st.lastError);
        process.env.CLOUDFLARED_BIN = "node";
        resolve();
      }, 200);
    });
  });

  void it("stop() on idle manager returns stopped", () => {
    const m = new CloudflaredManager();
    const s = m.stop();
    assert.equal(s.state, "stopped");
  });

  void it("restart() without token returns error", () => {
    const m = new CloudflaredManager();
    const s = m.restart("", SETTINGS);
    assert.equal(s.state, "error");
    assert.equal(s.lastError, "Tunnel token is empty.");
  });

  void it("restart() without child starts fresh (state=starting)", () => {
    const m = new CloudflaredManager();
    const s = m.restart(TOKEN, SETTINGS);
    assert.equal(s.state, "starting");
  });
});

void describe("buildArgs", () => {
  const BASE = {
    protocol: "auto" as const,
    region: "auto" as const,
    edgeIpVersion: "auto" as const,
    metricsEnabled: false,
    metricsPort: 60123,
    autoStart: true,
  };

  void it("builds minimal args for auto settings without metrics", () => {
    const args = buildArgs(BASE);
    assert.deepEqual(args, ["tunnel", "run"]);
  });

  void it("includes --metrics flag when enabled", () => {
    const args = buildArgs({ ...BASE, metricsEnabled: true, metricsPort: 9999 });
    assert.ok(args.includes("--metrics"));
    const idx = args.indexOf("--metrics");
    assert.equal(args[idx + 1], "0.0.0.0:9999");
    assert.equal(args[args.length - 2], "tunnel");
    assert.equal(args[args.length - 1], "run");
  });

  void it("includes --protocol for non-auto", () => {
    const args = buildArgs({ ...BASE, protocol: "quic" });
    assert.ok(args.includes("--protocol"));
    assert.ok(args.includes("quic"));
  });

  void it("includes --region for us", () => {
    const args = buildArgs({ ...BASE, region: "us" });
    assert.ok(args.includes("--region"));
    assert.ok(args.includes("us"));
  });

  void it("includes --edge-ip-version for non-auto", () => {
    const args = buildArgs({ ...BASE, edgeIpVersion: "4" });
    assert.ok(args.includes("--edge-ip-version"));
    assert.ok(args.includes("4"));
  });

  void it("never includes --token in args", () => {
    const args = buildArgs(BASE);
    assert.ok(!args.includes("--token"));
  });
});
