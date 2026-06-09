<div align="center">

<img src="./apps/web/public/cloudflare.png" width="150" alt="Cloudflare Logo">

# **Cloudflared**

<img src="https://img.shields.io/github/actions/workflow/status/ptkelanatechsolutions/Cloudflared/code-quality.yml?branch=main&label=code%20quality&style=flat-square" alt="Code Quality" />
<img src="https://img.shields.io/github/v/release/ptkelanatechsolutions/Cloudflared?label=release&style=flat-square" alt="Latest Release" />
<img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
<img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white&style=flat-square" alt="Next.js" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript" />
<img src="https://img.shields.io/badge/Tailwind%20CSS%20v4-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square" alt="Tailwind CSS v4" />
<img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=flat-square" alt="Docker" />
<img src="https://img.shields.io/badge/Cloudflare%20Tunnel-F38020?logo=cloudflare&logoColor=white&style=flat-square" alt="Cloudflare Tunnel" />
<img src="https://img.shields.io/badge/pnpm-11.5.0-F69220?logo=pnpm&logoColor=white&style=flat-square" alt="pnpm" />

A self-hosted dashboard for managing Cloudflared tunnels on a home server via Docker.

</div>

---

## Overview

**Cloudflared** is a lightweight, self-hosted dashboard for running and managing a Cloudflare Tunnel through the `cloudflared` binary.

It is designed for home server environments where you want a simple local Web UI to save a tunnel token, start or stop the tunnel, persist configuration, and automatically restore the tunnel after the container starts.

The application runs as a Docker container and stores persistent configuration inside `/config`.

## Features

- Self-hosted Web UI for Cloudflare Tunnel management.
- Token-based `cloudflared tunnel run` workflow.
- Start and stop tunnel from the dashboard.
- Persistent configuration stored in `/config/config.json`.
- Auto-start support when a token is saved.
- Configurable tunnel protocol: `auto`, `http2`, or `quic`.
- Configurable region: `auto` or `us`.
- Optional metrics endpoint support.
- Production-ready Next.js standalone output.
- Docker-first deployment for home servers.
- GitHub Container Registry image publishing.
- Code quality workflow for Prettier, ESLint, and TypeScript checks.

## Requirements

For Docker deployment:

- Linux home server, VPS, NAS, or any Docker-capable machine.
- Docker Engine.
- Docker Compose.
- A Cloudflare Tunnel token.

For local development:

- Node.js 22 or newer.
- pnpm 11.5.0.
- Git.

## Quick Start

### Docker Compose

The Docker Compose file is located at:

```text
docker/docker-compose.yml
```

From the repository root:

```bash
cd docker
docker compose up -d --build
```

By default, the Web UI listens on:

```text
http://SERVER_IP:23899
```

Example:

```text
http://192.168.1.20:23899
```

### Docker Run

```bash
docker run -d \
  --name cloudflared-web \
  --network host \
  -v cloudflared-config:/config \
  --restart unless-stopped \
  ghcr.io/ptkelanatechsolutions/cloudflared:latest
```

Then open:

```text
http://SERVER_IP:23899
```

## Docker Desktop Notes

The default Compose file uses host networking, which is intended for Linux home server deployments.

If you are using Docker Desktop, remove:

```yaml
network_mode: host
```

Then use port mapping instead:

```yaml
ports:
  - "23899:23899"
```

Example:

```yaml
services:
  cloudflared-web:
    image: ghcr.io/ptkelanatechsolutions/cloudflared:latest
    container_name: cloudflared-web
    restart: unless-stopped
    ports:
      - "23899:23899"
    environment:
      WEBUI_PORT: 23899
      WEBUI_HOST: 0.0.0.0
      CONFIG_DIR: /config
    volumes:
      - cloudflared-config:/config

volumes:
  cloudflared-config:
```

## Environment Variables

| Variable          | Default       | Description                                          |
| ----------------- | ------------- | ---------------------------------------------------- |
| `WEBUI_PORT`      | `23899`       | Port used by the Web UI inside the container.        |
| `WEBUI_HOST`      | `0.0.0.0`     | Host address used by the Next.js standalone server.  |
| `CONFIG_DIR`      | `/config`     | Directory used to persist token and tunnel settings. |
| `CLOUDFLARED_BIN` | `cloudflared` | Optional override for the `cloudflared` binary path. |
| `NODE_ENV`        | `production`  | Runtime mode for the web server.                     |

## Build Arguments

| Argument              | Default  | Description                                                                                           |
| --------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `CLOUDFLARED_VERSION` | `latest` | Cloudflared release version installed into the image. Use a specific version for reproducible builds. |

Example:

```bash
docker build \
  -f docker/Dockerfile.web \
  --build-arg CLOUDFLARED_VERSION=latest \
  -t cloudflared-web:local .
```

## Configuration

Cloudflared stores application config inside:

```text
/config/config.json
```

This file may contain:

- Tunnel token.
- Tunnel protocol.
- Tunnel region.
- Edge IP version preference.
- Metrics settings.
- Auto-start setting.

Because the tunnel token is persisted in `/config`, protect the Docker volume and avoid exposing the Web UI publicly without additional access control.

## Tunnel Settings

| Setting          | Values                  | Description                                                              |
| ---------------- | ----------------------- | ------------------------------------------------------------------------ |
| `protocol`       | `auto`, `http2`, `quic` | Controls the tunnel transport protocol.                                  |
| `region`         | `auto`, `us`            | Controls Cloudflare edge region preference.                              |
| `edgeIpVersion`  | `auto`, `4`, `6`        | Controls preferred edge IP version.                                      |
| `metricsEnabled` | `true`, `false`         | Enables or disables cloudflared metrics.                                 |
| `metricsPort`    | `1-65535`               | Port used by the cloudflared metrics endpoint.                           |
| `autoStart`      | `true`, `false`         | Starts the tunnel automatically when the app boots and a token is saved. |

## Development

Install dependencies:

```bash
pnpm install
```

Start development server:

```bash
pnpm dev
```

Build production output:

```bash
pnpm build
```

Run lint:

```bash
pnpm lint
```

Run type check:

```bash
pnpm typecheck
```

Check formatting:

```bash
pnpm format:check
```

Format files:

```bash
pnpm format
```

## Project Structure

```text
Cloudflared/
├── apps/
│   └── web/
│       ├── app/
│       ├── components/
│       ├── lib/
│       ├── public/
│       ├── next.config.ts
│       └── package.json
├── packages/
│   └── core/
│       └── src/
│           ├── cloudflared/
│           ├── config/
│           ├── schema/
│           └── index.ts
├── docker/
│   ├── Dockerfile.web
│   ├── docker-compose.yml
│   └── entrypoint.sh
├── .github/
│   └── workflows/
│       ├── code-quality.yml
│       └── container.yml
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

## Security Notes

- Keep your Cloudflare Tunnel token private.
- The token is persisted in the `/config` Docker volume.
- Do not expose the Web UI directly to the public internet without authentication or network-level protection.
- Prefer running the dashboard on a trusted LAN, VPN, or protected reverse proxy.
- Keep the container image and `cloudflared` binary up to date.

## License

This project is licensed under the MIT License.

See the `LICENSE` file for details.
