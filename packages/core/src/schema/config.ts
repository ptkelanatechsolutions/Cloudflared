import { z } from "zod";

/**
 * Tunable flags passed to `cloudflared tunnel run`. Each "auto" value means
 * "let cloudflared decide" and is therefore omitted from the CLI args.
 */
export const tunnelSettingsSchema = z.object({
  protocol: z.enum(["auto", "http2", "quic"]).default("auto"),
  region: z.enum(["auto", "us"]).default("auto"),
  edgeIpVersion: z.enum(["auto", "4", "6"]).default("auto"),
  metricsEnabled: z.boolean().default(false),
  metricsPort: z.number().int().min(1).max(65535).default(60123),
  /** Start the tunnel automatically on boot when a token is present. */
  autoStart: z.boolean().default(true),
  /** Graceful shutdown duration in seconds before SIGKILL (--grace-period). 0 = disabled. */
  gracePeriod: z.number().int().min(0).max(600).default(0),
  /** Log verbosity (--loglevel). "info" = omit (cloudflared default). */
  logLevel: z.enum(["debug", "info", "warn", "error", "fatal"]).default("info"),
  /** Automatically restart the tunnel every N hours. 0 = disabled. */
  scheduledRestartHours: z.number().min(0).max(168).default(0),
});

export type TunnelSettings = z.infer<typeof tunnelSettingsSchema>;

/** Everything persisted to `/config/config.json`. */
export const appConfigSchema = z.object({
  token: z.string().default(""),
  settings: tunnelSettingsSchema.default({}),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
