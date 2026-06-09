# `docker/` — Container build & deployment

> Guidance for AI agents working in this directory. Read this **carefully**
> before editing the Dockerfile — several lines are load-bearing and were the
> source of real multi-arch build failures.

## What lives here

| File                 | Purpose                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| `Dockerfile`         | Multi-stage, multi-arch build for the single image (Web UI + `cloudflared`). |
| `entrypoint.sh`      | Maps env → the Next.js standalone server and runs it.                        |
| `docker-compose.yml` | Reference deployment (build from source, host networking, `/config` volume). |

The build context is the **repository root** (compose uses `context: ..`; CI
uses `context: .`). Paths in the Dockerfile are relative to the repo root.

## The image (one container, everything inside)

`Web UI (Next.js standalone) + cloudflared binary`, run-and-forget. Default Web
UI port **`23899`**, config persisted in the **`/config`** volume.

## Build stages (and why they are the way they are)

```
builder            (FROM --platform=$BUILDPLATFORM node:22-bookworm-slim)
  └─ pnpm install + `next build` → apps/web/.next/standalone  (portable JS)

cloudflared-downloader  (FROM debian:bookworm-slim — NOT platform-pinned)
  └─ curl the raw cloudflared binary for the TARGET arch → /cloudflared

runner             (FROM node:22-bookworm-slim — per target arch)
  └─ COPY standalone + /cloudflared + entrypoint → run `node apps/web/server.js`
```

### ⚠️ Load-bearing details — do not "simplify" these

1. **Predefined platform ARGs must have NO default.**

   ```dockerfile
   ARG TARGETOS        # ✅  buildkit injects the real per-target value
   ARG TARGETARCH      # ❌  ARG TARGETARCH=amd64  →  default shadows the real
   ARG TARGETVARIANT   #     value, TARGETARCH stays "amd64" for every target
   ```

   A default value **shadows** buildkit's automatic per-target value. With
   `ARG TARGETARCH=amd64`, the `arm/v7` build resolved to `linux/amd64/v7`,
   matched no `case` branch, and failed. This was the actual CI bug.

2. **The heavy build stage (`builder`) is pinned to `$BUILDPLATFORM`.**
   `next build` (Turbopack) runs **once, natively** — never under QEMU
   emulation (which is slow and OOM-prone for arm). The standalone output is
   pure JS, so it is portable to every target arch.

3. **The `cloudflared-downloader` is NOT pinned to `$BUILDPLATFORM`.**
   It runs per-target so `TARGET*` resolve correctly, then downloads the raw
   binary for that arch. (Raw binary, **not** a `.deb` + `dpkg` — `dpkg` would
   reject a cross-arch package.)

4. **`sharp` is bundled but never loaded.** Next traces its optional `sharp`
   dependency into the standalone for the **build** platform's arch. On an
   arm runner that binary is the wrong arch — which is fine **only because**
   `images: { unoptimized: true }` (in `apps/web/next.config.ts`) means the
   image optimizer, and therefore `sharp`, is never invoked. Do not remove
   `images.unoptimized` while the build stage is `$BUILDPLATFORM`-pinned.

5. **`entrypoint.sh` runs `node apps/web/server.js`.** That path only exists
   because `outputFileTracingRoot` (in `next.config.ts`) is set to the monorepo
   root, so the standalone mirrors the repo layout. If that changes, the
   `COPY --from=builder … standalone` targets and the entrypoint path break.

## Runtime configuration

| Env var           | Default       | Description                                           |
| ----------------- | ------------- | ----------------------------------------------------- |
| `WEBUI_PORT`      | `23899`       | Port the Web UI listens on (mapped to Next's `PORT`). |
| `WEBUI_HOST`      | `0.0.0.0`     | Bind address (mapped to Next's `HOSTNAME`).           |
| `CONFIG_DIR`      | `/config`     | Where the token + settings are persisted.             |
| `CLOUDFLARED_BIN` | `cloudflared` | Override the binary path (rarely needed).             |
| `NODE_ENV`        | `production`  | —                                                     |

| Build ARG                                   | Default      | Description                                                  |
| ------------------------------------------- | ------------ | ------------------------------------------------------------ |
| `CLOUDFLARED_VERSION`                       | `2026.6.0`   | cloudflared release to bake in. Pin for reproducible builds. |
| `TARGETOS` / `TARGETARCH` / `TARGETVARIANT` | _(injected)_ | Provided by buildx; **declare without defaults**.            |

Volume: **`/config`** (token + `config.json`). Networking: **host** is
recommended on Linux so `cloudflared` can reach host services; on Docker
Desktop use `-p 23899:23899` instead.

## Quick reference

```bash
# Build locally (from repo root)
docker build -f docker/Dockerfile -t cloudflared-web:local .

# Pin the cloudflared version
docker build -f docker/Dockerfile --build-arg CLOUDFLARED_VERSION=2026.6.0 -t cloudflared-web:local .

# Run
docker run -d --name cloudflared-web --network host -v cf-config:/config cloudflared-web:local
# then open http://<host>:23899
```

## CI

`.github/workflows/container.yml` builds `linux/amd64`, `linux/arm64`, and
`linux/arm/v7` with buildx + QEMU and pushes to GHCR on a SemVer tag
(`1.2.3`, no `v` prefix). If a build fails, fetch the exact step with
`gh run view <run-id> --log-failed` rather than guessing.
