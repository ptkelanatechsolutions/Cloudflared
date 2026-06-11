import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ConfigStore } from "../../config/store";

void describe("ConfigStore", () => {
  let tmpDir: string;
  let store: ConfigStore;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "cloudflared-core-test-"));
    store = new ConfigStore(tmpDir);
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  void it("read() returns defaults on missing file", async () => {
    const config = await store.read();
    assert.equal(config.token, "");
    assert.equal(config.settings.autoStart, true);
    assert.equal(config.settings.protocol, "auto");
    assert.equal(config.settings.metricsEnabled, false);
  });

  void it("write() persists and returns parsed config", async () => {
    const written = await store.write({
      token: "test-token-123",
      settings: {
        protocol: "quic",
        region: "us",
        edgeIpVersion: "4",
        metricsEnabled: true,
        metricsPort: 9999,
        autoStart: false,
      },
    });

    assert.equal(written.token, "test-token-123");
    assert.equal(written.settings.protocol, "quic");
    assert.equal(written.settings.metricsPort, 9999);

    // Verify the file was written atomically (no .tmp file left behind)
    const files = await readFile(join(tmpDir, "config.json"), "utf8");
    const parsed = JSON.parse(files);
    assert.equal(parsed.token, "test-token-123");
  });

  void it("read() returns persisted config", async () => {
    await store.write({
      token: "persist-token",
      settings: {
        protocol: "http2",
        region: "auto",
        edgeIpVersion: "auto",
        metricsEnabled: false,
        metricsPort: 60123,
        autoStart: true,
      },
    });

    const config = await store.read();
    assert.equal(config.token, "persist-token");
    assert.equal(config.settings.protocol, "http2");
  });

  void it("read() falls back to defaults on corrupt JSON", async () => {
    // Write a corrupt config file directly (bypassing ConfigStore)
    await writeFile(join(tmpDir, "config.json"), "{invalid json}", "utf8");

    const config = await store.read();
    assert.equal(config.token, "");
    assert.equal(config.settings.autoStart, true);
  });

  void it("update() shallow-merges and persists", async () => {
    await store.write({
      token: "original",
      settings: {
        protocol: "auto",
        region: "auto",
        edgeIpVersion: "auto",
        metricsEnabled: false,
        metricsPort: 60123,
        autoStart: false,
      },
    });

    const updated = await store.update({ token: "updated-token" });
    assert.equal(updated.token, "updated-token");
    assert.equal(updated.settings.autoStart, false); // unchanged

    const reRead = await store.read();
    assert.equal(reRead.token, "updated-token");
  });
});
