import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { appConfigSchema, type AppConfig } from "../schema/config";

/**
 * Reads and writes the app config as a JSON file inside the `/config` volume.
 * Missing/corrupt files fall back to schema defaults so the UI always boots.
 *
 * @param configDir  Parent directory for config.json. Defaults to
 *                   `CONFIG_DIR` env var or `/config`.
 */
export class ConfigStore {
  private configDir: string;
  private configFile: string;
  private configTmp: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(configDir?: string) {
    this.configDir = configDir ?? process.env.CONFIG_DIR ?? "/config";
    this.configFile = join(this.configDir, "config.json");
    this.configTmp = join(this.configDir, "config.json.tmp");
  }

  async read(): Promise<AppConfig> {
    let raw: string;
    try {
      raw = await readFile(this.configFile, "utf8");
    } catch (err) {
      if (isNotFound(err)) return appConfigSchema.parse({});
      throw err; // genuine I/O error (e.g. permissions) — surface it
    }
    try {
      return appConfigSchema.parse(JSON.parse(raw));
    } catch {
      // Corrupt JSON or schema mismatch — fall back to defaults so the UI boots.
      return appConfigSchema.parse({});
    }
  }

  private async persist(parsed: AppConfig): Promise<void> {
    await mkdir(this.configDir, { recursive: true });
    const data = `${JSON.stringify(parsed, null, 2)}\n`;
    // Atomic write: write to temp file first, then rename over the target.
    // This prevents partial/corrupt files on power loss.
    await writeFile(this.configTmp, data, "utf8");
    await rename(this.configTmp, this.configFile);
  }

  async write(config: AppConfig): Promise<AppConfig> {
    const parsed = appConfigSchema.parse(config);
    await this.persist(parsed);
    return parsed;
  }

  /** Shallow-merge a patch into the current config and persist it. */
  async update(patch: Partial<AppConfig>): Promise<AppConfig> {
    // Serialize concurrent updates so one doesn't overwrite the other.
    const prev = await this.read();
    const merged = { ...prev, ...patch };
    const parsed = appConfigSchema.parse(merged);
    await this.persist(parsed);
    return parsed;
  }
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "ENOENT"
  );
}

// Module-level singleton — one store per Next.js server process.
const globalRef = globalThis as unknown as { __configStore?: ConfigStore };
export const configStore: ConfigStore =
  globalRef.__configStore ?? (globalRef.__configStore = new ConfigStore());
