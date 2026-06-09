# `packages/` — Shared libraries

> Guidance for AI agents working in this directory. Read this before editing.

## What lives here

`packages/*` holds **libraries** — code that is _imported_ by apps but is never
deployed on its own. Anything with a running process belongs in
[`apps/`](../apps/README.md) instead.

| Package | Name                | What it is                                                                                                        |
| ------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `core/` | `@cloudflared/core` | UI-agnostic, **Node-only** domain logic: the `cloudflared` process manager, the config store, and the zod schema. |

### When to add a new package

Extract a package **only** when one of these is true:

1. **≥ 2 apps import it**, or
2. you intend to **publish / version it independently**.

A single consumer means it should stay a folder inside that app, not a package.
(This is why there is no `packages/ui`, `packages/docker`, etc. — `web` is the
only consumer of those concerns.)

## `packages/core` at a glance

- **Runtime:** Node only. Uses `node:child_process`, `node:fs/promises`,
  `node:path`, `process`. No React, no DOM, no browser APIs.
- **Consumption:** `apps/web` imports it as `@cloudflared/core`. The package
  **exports TypeScript source directly** (`"exports": "./src/index.ts"`) and is
  compiled by Next.js via `transpilePackages`. There is **no build step** — do
  not add one.

### Structure

```
core/src/
├── schema/config.ts      # zod: TunnelSettings + AppConfig (+ inferred types)
├── config/store.ts       # ConfigStore — reads/writes /config/config.json
├── cloudflared/manager.ts# CloudflaredManager — spawns/stops the tunnel
└── index.ts              # barrel: re-exports the three modules
```

| Export                                     | Kind              | Notes                                                                                            |
| ------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------ |
| `appConfigSchema`, `tunnelSettingsSchema`  | zod schemas       | Source of truth for persisted config + validation.                                               |
| `AppConfig`, `TunnelSettings`              | types             | Inferred from the schemas.                                                                       |
| `ConfigStore`, `configStore`               | class + singleton | `read()` falls back to defaults on missing **or corrupt** config; only genuine I/O errors throw. |
| `CloudflaredManager`, `cloudflaredManager` | class + singleton | Owns the single long-lived `cloudflared` child process.                                          |
| `TunnelState`, `TunnelStatus`              | types             | UI status contract.                                                                              |

### Singletons

Both `configStore` and `cloudflaredManager` are **module-level singletons**
pinned to `globalThis` so they survive across Next.js requests (and dev HMR)
for the lifetime of the server process:

```ts
const g = globalThis as unknown as { __cloudflaredManager?: CloudflaredManager };
export const cloudflaredManager =
  g.__cloudflaredManager ?? (g.__cloudflaredManager = new CloudflaredManager());
```

### Runtime env vars it reads

| Var               | Default       | Used by                                           |
| ----------------- | ------------- | ------------------------------------------------- |
| `CONFIG_DIR`      | `/config`     | `ConfigStore` (directory for `config.json`).      |
| `CLOUDFLARED_BIN` | `cloudflared` | `CloudflaredManager` (binary path / PATH lookup). |

## Rules for agents

**Do**

- Keep this package **Node-only and framework-agnostic** — it must be usable
  without Next.js.
- Add new domain logic here (not in `apps/web`) when it touches `cloudflared`,
  the filesystem, or process management.
- Validate all persisted/external input through the zod schemas.
- Run `pnpm --filter @cloudflared/core typecheck` after changes.

**Don't**

- ❌ Import React, Next.js, or any DOM/browser API.
- ❌ Add a bundler/build step or change `exports` away from `./src/index.ts`
  (Next transpiles the source; a build would break consumption).
- ❌ Let `ConfigStore.read()` throw on a corrupt/invalid file — the UI must
  always boot. Fall back to schema defaults.
- ❌ Spawn a second `cloudflared` while one is alive — `CloudflaredManager`
  guards on the live child for exactly this reason.

## Commands

```bash
pnpm --filter @cloudflared/core typecheck
```
