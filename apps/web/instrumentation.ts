/**
 * Runs once when the Next.js server process boots. Enables "run-and-forget":
 * if a token is persisted and autoStart is on, the tunnel comes up on its own.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { cloudflaredManager, configStore } = await import("@cloudflared/core");

  try {
    const config = await configStore.read();
    if (config.token && config.settings.autoStart) {
      cloudflaredManager.start(config.token, config.settings);
    }
  } catch {
    // Ignore — the UI will surface the resulting state on first load.
  }
}
