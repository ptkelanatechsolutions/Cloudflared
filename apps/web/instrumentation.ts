/**
 * Runs once when the Next.js server process boots. Enables "run-and-forget":
 * if a token is persisted and autoStart is on, the tunnel comes up on its own —
 * e.g. after the host loses power and the container restarts.
 */
export async function register() {
  // Only the Node.js runtime can spawn cloudflared, so skip the edge runtime.
  // We guard on "edge" (rather than requiring "nodejs") because NEXT_RUNTIME is
  // not reliably set in the standalone production server — an over-strict
  // `!== "nodejs"` check would silently skip auto-start there.
  if (process.env.NEXT_RUNTIME === "edge") return;

  try {
    const { cloudflaredManager, configStore } = await import("@cloudflared/core");
    const config = await configStore.read();

    if (config.token && config.settings.autoStart) {
      console.log("[cloudflared] auto-start: launching tunnel on boot");
      cloudflaredManager.start(config.token, config.settings);
    } else {
      console.log(
        `[cloudflared] auto-start: skipped (token ${config.token ? "present" : "missing"}, ` +
          `autoStart=${config.settings.autoStart})`,
      );
    }
  } catch (err) {
    console.error("[cloudflared] auto-start failed:", err);
  }
}
