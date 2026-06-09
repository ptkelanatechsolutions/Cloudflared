<div align="center">

<img src="./apps/web/public/cloudflare.png" width="150" alt="Cloudflare Logo">

# **Cloudflared**

<img src="https://img.shields.io/github/actions/workflow/status/ptkelanatechsolutions/Cloudflared/code-quality.yml?branch=main&label=code%20quality&style=flat-square" alt="Code Quality" />
<img src="https://img.shields.io/github/actions/workflow/status/ptkelanatechsolutions/Cloudflared/container.yml?label=container&style=flat-square" alt="Container" />
<img src="https://img.shields.io/badge/dynamic/json?url=https://api.github.com/repos/ptkelanatechsolutions/Cloudflared/releases/latest&query=%24.tag_name&label=release&color=blue&style=flat-square" alt="Latest Release" />
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
- Multi-architecture Linux container support.
- Code quality workflow for Prettier, ESLint, and TypeScript checks.

## Requirements

For Docker deployment:

- Docker Engine.
- Docker Compose.
- A Cloudflare Tunnel token.
- A Linux home server, VPS, NAS, or any Docker-capable machine.

For local development:

- Node.js 22 or newer.
- pnpm 11.5.0.
- Git.

## Container Image

Official container image:

```text
ghcr.io/ptkelanatechsolutions/cloudflared
```

Recommended stable tag:

```text
ghcr.io/ptkelanatechsolutions/cloudflared:1.1.5
```

Latest tag:

```text
ghcr.io/ptkelanatechsolutions/cloudflared:latest
```

Pull the latest image:

```bash
docker pull ghcr.io/ptkelanatechsolutions/cloudflared:latest
```

## Supported Platforms

### Container Platforms

The official container image supports Linux containers.

| Platform       | Status    | Notes                                                                              |
| -------------- | --------- | ---------------------------------------------------------------------------------- |
| `linux/amd64`  | Supported | Intel/AMD 64-bit servers, VPS, mini PCs, and most home servers.                    |
| `linux/arm64`  | Supported | ARM64 servers, Raspberry Pi 4/5 64-bit, ARM VPS, and Apple Silicon Docker Desktop. |
| `linux/arm/v7` | Supported | 32-bit ARMv7 devices such as Raspberry Pi OS 32-bit.                               |

### Host Systems

| Host    | Status                                        | Notes                                        |
| ------- | --------------------------------------------- | -------------------------------------------- |
| Linux   | Recommended                                   | Best target for home server deployments.     |
| Windows | Supported via Docker Desktop Linux containers | Native Windows containers are not supported. |
| macOS   | Supported via Docker Desktop Linux containers | Native macOS containers are not supported.   |

### Not Supported

- Native Windows containers.
- Native macOS containers.
- `linux/386`.
- `linux/arm/v6`.

## Quick Start

### Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  cloudflared-web:
    image: ghcr.io/ptkelanatechsolutions/cloudflared:latest
    container_name: cloudflared-web
    restart: unless-stopped

    # Recommended for Linux home server deployments.
    # Do not use "ports" together with "network_mode: host".
    network_mode: host

    environment:
      NODE_ENV: production
      WEBUI_PORT: 23899
      WEBUI_HOST: 0.0.0.0
      CONFIG_DIR: /config

    volumes:
      - cloudflared-config:/config

volumes:
  cloudflared-config:
    name: cloudflared-config
```

Start the container:

```bash
docker compose up -d
```

Open the Web UI:

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

The default Compose example uses host networking, which is intended for Linux home server deployments.

If you are using Docker Desktop or an environment where host networking is not suitable, use port mapping instead.

```yaml
services:
  cloudflared-web:
    image: ghcr.io/ptkelanatechsolutions/cloudflared:latest
    container_name: cloudflared-web
    restart: unless-stopped

    ports:
      - "23899:23899"

    environment:
      NODE_ENV: production
      WEBUI_PORT: 23899
      WEBUI_HOST: 0.0.0.0
      CONFIG_DIR: /config

    volumes:
      - cloudflared-config:/config

volumes:
  cloudflared-config:
    name: cloudflared-config
```

Start the container:

```bash
docker compose up -d
```

Open:

```text
http://localhost:23899
```

## Build From Source

The Dockerfile is located at:

```text
docker/Dockerfile
```

Build locally:

```bash
docker build \
  -f docker/Dockerfile \
  -t cloudflared-web:local .
```

Run the local image:

```bash
docker run -d \
  --name cloudflared-web \
  --network host \
  -v cloudflared-config:/config \
  --restart unless-stopped \
  cloudflared-web:local
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
  -f docker/Dockerfile \
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
│   ├── Dockerfile
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

## CI/CD

This repository includes two GitHub Actions workflows.

### Code Quality

Runs formatting, linting, and type checking.

Checks:

- Prettier.
- ESLint.
- TypeScript.

### Container

Builds and publishes the Docker image to GitHub Container Registry.

The workflow runs when a SemVer tag without the `v` prefix is pushed:

```text
1.0.0
1.0.1
1.1.0
```

Published image tags include:

```text
ghcr.io/ptkelanatechsolutions/cloudflared:1.0.0
ghcr.io/ptkelanatechsolutions/cloudflared:latest
```

## Release

Create a version tag without the `v` prefix:

```bash
git tag 1.0.0
git push origin 1.0.0
```

The container workflow will build and publish the image automatically.

## Security Notes

- Keep your Cloudflare Tunnel token private.
- The token is persisted in the `/config` Docker volume.
- Do not expose the Web UI directly to the public internet without authentication or network-level protection.
- Prefer running the dashboard on a trusted LAN, VPN, or protected reverse proxy.
- Keep the container image and `cloudflared` binary up to date.

## License

This project is licensed under the MIT License.

See the [`LICENSE`](./LICENSE) file for details.
