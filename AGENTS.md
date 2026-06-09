# AGENTS.md

Orientation for AI agents working in this repository. Start here, then read the
per-directory guide for whatever you're touching.

## What this project is

**Cloudflared** is a self-hosted, **single Docker image** that bundles a Next.js
Web UI and the `cloudflared` binary so a Cloudflare Tunnel can be managed from
the browser: paste a token, start/stop with one click, run and forget. Default
Web UI port **`23899`**; config persists in the **`/config`** volume.

## Architecture (decisions that constrain everything)

- **pnpm monorepo, but a monolith deploy.** Everything ships as **one
  container**. There is no separate backend service — Next.js _is_ the backend
  (Server Actions / the Node server spawn and control `cloudflared`).
- **Token-based, remotely-managed tunnel** (`cloudflared tunnel run --token …`),
  not a locally-managed `config.yml`. Ingress is configured in the Cloudflare
  Zero Trust dashboard.
- **Right-sized structure.** Extract a `packages/*` only when ≥2 apps consume it
  or it will be published. Don't add ceremony (no `packages/ui`, etc.) for a
  single consumer.

## Repository map

```
Cloudflared/
├── apps/
│   └── web/              @cloudflared/web — Next.js dashboard (the deployable)   → apps/README.md
├── packages/
│   └── core/             @cloudflared/core — node-only domain logic (library)    → packages/README.md
├── docker/               Dockerfile, entrypoint.sh, docker-compose.yml           → docker/README.md
├── .github/workflows/    code-quality.yml (prettier/eslint/tsc), container.yml (build+push)
├── tsconfig.base.json    shared TS config (apps & packages extend it)
├── pnpm-workspace.yaml   workspaces: apps/*, packages/*
└── package.json          root orchestrator (scripts delegate via pnpm --filter / -r)
```

**Always read the directory's `README.md` before editing in it** — they document
load-bearing details and "Do / Don't" rules:

- [`apps/README.md`](apps/README.md) — the web app, UI conventions, server actions.
- [`packages/README.md`](packages/README.md) — `@cloudflared/core` (node-only library).
- [`docker/README.md`](docker/README.md) — the multi-arch image (hard-won build gotchas).

## Tech stack

- **Tooling:** Node 22, pnpm 11.5, TypeScript (strict), Prettier, ESLint.
- **`apps/web`:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4,
  shadcn/ui, Motion (`motion/react`), `lucide-react`, `next-themes`.
- **`packages/core`:** zod + Node built-ins only (no framework, no DOM).

## Commands (run from the repo root)

```bash
pnpm install
pnpm dev          # → apps/web dev server
pnpm build        # → apps/web production (standalone) build
pnpm lint         # → apps/web ESLint
pnpm typecheck    # → pnpm -r typecheck (core + web)
pnpm format       # Prettier write (whole repo)
pnpm format:check # Prettier check (what CI runs)
```

Run `typecheck`, `lint`, and `format:check` before pushing — the `code-quality`
workflow enforces all three.

## Cross-cutting conventions

- **Server boundary:** all privileged work (spawning `cloudflared`, touching
  `/config`, process/file I/O) lives in `@cloudflared/core` and is imported
  **server-side only** — never from a `"use client"` component.
- **Secrets:** the tunnel token is persisted in `/config` and **never** returned
  to the client or logged. Actions expose only `tokenSet: boolean`.
- **Styling:** use only the semantic color tokens in `apps/web/app/globals.css`
  (no hard-coded `#hex`/`rgb()`/`bg-white/10`), `lucide-react` icons, and
  `motion/react` for animation.
- **Commits:** Conventional Commits (`fix(core): …`, `feat(container): …`,
  `docs: …`, `chore: …`).
- **Releases:** SemVer tags **without** a `v` prefix (e.g. `1.1.5`). Pushing such
  a tag triggers `container.yml` to build and publish the image to GHCR.

## Hard-won lessons (don't reintroduce these)

- **Multi-arch ARGs:** predefined platform ARGs (`TARGETOS`/`TARGETARCH`/
  `TARGETVARIANT`) must be declared **without defaults** — a default shadows
  buildkit's per-target value and breaks arm builds. (`docker/README.md`)
- **Build under emulation:** pin the heavy Next build stage to `$BUILDPLATFORM`;
  never run Turbopack under QEMU.
- **`sharp`:** it's traced into the standalone for the build arch and is the
  wrong arch on arm runners — harmless **only because** `images.unoptimized` is
  set and `next/image` is unused. Don't add `next/image`.
- **Resilience:** `ConfigStore.read()` must never throw on a corrupt/invalid
  config — fall back to schema defaults so the UI always boots.
- **Single process:** there is exactly one `cloudflared` child; `CloudflaredManager`
  guards on the live child to avoid spawning a second.
- **CI debugging:** when a workflow fails, fetch the exact step with
  `gh run view <run-id> --log-failed` instead of guessing.

## Don't

- ❌ Turn this into a multi-page app or add a scrollable layout (deliberate single screen).
- ❌ Add a build step to `packages/core` or change its `exports` (Next transpiles the source).
- ❌ Change `outputFileTracingRoot` / the standalone layout without updating the Dockerfile `COPY` paths and `entrypoint.sh`.
- ❌ Commit with failing `typecheck`, `lint`, or `format:check`.
