import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { appConfigSchema, type AppConfig } from "../schema/config";

/** Directory mounted as a Docker volume to persist token + settings. */
const CONFIG_DIR = process.env.CONFIG_DIR ?? "/config";
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

/**
 * Reads and writes the app config as a JSON file inside the `/config` volume.
 * Missing/corrupt files fall back to schema defaults so the UI always boots.
 */
export class ConfigStore {
  async read(): Promise<AppConfig> {
    try {
      const raw = await readFile(CONFIG_FILE, "utf8");
      return appConfigSchema.parse(JSON.parse(raw));
    } catch (err) {
      if (isNotFound(err)) return appConfigSchema.parse({});
      throw err;
    }
  }

  async write(config: AppConfig): Promise<AppConfig> {
    const parsed = appConfigSchema.parse(config);
    await mkdir(CONFIG_DIR, { recursive: true });
    await writeFile(CONFIG_FILE, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    return parsed;
  }

  /** Shallow-merge a patch into the current config and persist it. */
  async update(patch: Partial<AppConfig>): Promise<AppConfig> {
    const current = await this.read();
    return this.write({ ...current, ...patch });
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
