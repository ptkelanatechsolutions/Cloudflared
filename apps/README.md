# `apps/` — Deployable applications

> Guidance for AI agents working in this directory. Read this before editing.

## What lives here

`apps/*` holds **deployable units** — things that run as a process / get shipped
in the container image. Libraries do **not** go here (those live in
[`packages/`](../packages/README.md)).

| App    | Package name       | What it is                                                                                            |
| ------ | ------------------ | ----------------------------------------------------------------------------------------------------- |
| `web/` | `@cloudflared/web` | The Next.js single-page dashboard + server actions that drive `cloudflared`. The **only** deployable. |

## `apps/web` at a glance

- **Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict),
  Tailwind CSS v4, shadcn/ui, Motion (`motion/react`), `lucide-react`,
  `next-themes`, `sonner`.
- **Role:** It is both the UI **and** the backend. Server Actions / the Node
  server process talk to `cloudflared` through `@cloudflared/core`. There is no
  separate backend service — everything ships as one container.

### Key files

| Path                            | Purpose                                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `app/page.tsx`                  | The single page. `export const dynamic = "force-dynamic"`; server-renders initial state via `getState()`.                          |
| `app/layout.tsx`                | Root layout, Geist fonts, `ThemeProvider` (dark default, `enableSystem`), `Toaster` (sonner).                                      |
| `app/loading.tsx`               | Skeleton loading matching dashboard card layout for initial page load.                                                             |
| `app/actions.ts`                | `"use server"` — `getState`, `saveToken`, `saveSettings`, `startTunnel`, `stopTunnel`. The **only** bridge between UI and core.    |
| `app/globals.css`               | Tailwind + shadcn theme tokens (`--background`, `--primary`, `--status-active`, …). The single source of truth for colors.         |
| `instrumentation.ts`            | Runs once on server boot. Auto-starts the tunnel if a token is saved and `autoStart` is on ("run-and-forget").                     |
| `components/tunnel-control.tsx` | `"use client"` — the dashboard UI (2-column asymmetrical grid layout with Hero, Token, Settings, Observability cards).             |
| `components/use-tunnel.ts`      | `"use client"` — central hook for polling, draft state, keyboard shortcuts, and all tunnel action handlers.                        |
| `components/panel-shell.tsx`    | Animated card wrapper used by all section components. Entry stagger via `delay` prop, motion entry, reduced-motion-aware.          |
| `components/sections/`          | Section card components: `hero-card.tsx`, `token-card.tsx`, `settings-card.tsx`, `observability-card.tsx`, `log-dialog.tsx`.       |
| `components/ui/`                | shadcn primitives (`Button`, `Input`, `Card`, `Switch`, …).                                                                        |
| `lib/dashboard.ts`              | `DashboardState` type shared between actions and the client.                                                                       |
| `lib/tunnel.ts`                 | Tunnel constants: poll intervals, state metadata, tone/color maps, formatting helpers.                                             |
| `next.config.ts`                | `output: "standalone"`, `outputFileTracingRoot` (monorepo root), `transpilePackages: ["@cloudflared/core"]`, `images.unoptimized`. |

### How a request flows

```
client (tunnel-control.tsx)  ──calls──▶  app/actions.ts ("use server")
                                              │ imports
                                              ▼
                                   @cloudflared/core (manager + store)
                                              │ spawns / reads
                                              ▼
                                cloudflared process  +  /config/config.json
```

## Rules for agents

**Do**

- Use **only** the semantic color tokens from `app/globals.css`
  (`bg-card`, `text-muted-foreground`, `bg-primary`, `border-border`, …).
- Use **`lucide-react`** for icons and **`motion/react`** for animation.
- Keep all privileged work (spawning `cloudflared`, touching `/config`,
  Docker) inside `@cloudflared/core`, imported **server-side only**.
- Keep the path alias `@/*` → `apps/web/*` (configured in `tsconfig.json` and
  `components.json`).

**Don't**

- ❌ Import `@cloudflared/core` into a `"use client"` component — it uses
  `node:child_process`/`node:fs` and is server-only.
- ❌ Add hard-coded colors (`#hex`, `rgb(...)`, `bg-white/10`). They break the
  token system and were explicitly removed once already.
- ❌ Return the raw tunnel token to the client. Actions expose only a
  `tokenSet: boolean`.
- ❌ Add routing/multiple pages or a scrollable layout — this is a deliberate
  single screen (`min-h-[100dvh]`).
- ❌ Use `next/image`. Optimization is disabled on purpose (see
  [`docker/README.md`](../docker/README.md) for why — `sharp` portability).

## Commands

```bash
pnpm --filter @cloudflared/web dev        # dev server
pnpm --filter @cloudflared/web build      # production (standalone) build
pnpm --filter @cloudflared/web lint
pnpm --filter @cloudflared/web typecheck
```
