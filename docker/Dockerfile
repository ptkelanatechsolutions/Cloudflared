# syntax=docker/dockerfile:1

# ---------- Builder ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN corepack enable

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/core/package.json ./packages/core/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @cloudflared/web build

# ---------- Cloudflared downloader ----------
FROM --platform=$BUILDPLATFORM debian:bookworm-slim AS cloudflared-downloader

ARG TARGETOS=linux
ARG TARGETARCH=amd64
ARG TARGETVARIANT
ARG CLOUDFLARED_VERSION=2026.6.0

RUN set -eux; \
  apt-get update; \
  apt-get install -y --no-install-recommends ca-certificates curl; \
  case "${TARGETOS}/${TARGETARCH}${TARGETVARIANT:+/${TARGETVARIANT}}" in \
    linux/amd64) \
      CLOUDFLARED_BIN="cloudflared-linux-amd64" ;; \
    linux/arm64) \
      CLOUDFLARED_BIN="cloudflared-linux-arm64" ;; \
    linux/arm/v7) \
      CLOUDFLARED_BIN="cloudflared-linux-armhf" ;; \
    *) \
      echo "Unsupported platform: ${TARGETOS}/${TARGETARCH}${TARGETVARIANT:+/${TARGETVARIANT}}"; \
      exit 1 ;; \
  esac; \
  CLOUDFLARED_URL="https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/${CLOUDFLARED_BIN}"; \
  echo "Target platform: ${TARGETOS}/${TARGETARCH}${TARGETVARIANT:+/${TARGETVARIANT}}"; \
  echo "Cloudflared version: ${CLOUDFLARED_VERSION}"; \
  echo "Downloading cloudflared from: ${CLOUDFLARED_URL}"; \
  curl -fL --retry 5 --retry-delay 5 -o /cloudflared "${CLOUDFLARED_URL}"; \
  chmod +x /cloudflared; \
  test -s /cloudflared; \
  rm -rf /var/lib/apt/lists/*

# ---------- Runner ----------
FROM node:22-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    WEBUI_PORT=23899 \
    WEBUI_HOST=0.0.0.0 \
    CONFIG_DIR=/config

COPY --from=cloudflared-downloader /cloudflared /usr/local/bin/cloudflared

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /usr/local/bin/cloudflared /entrypoint.sh

VOLUME ["/config"]
EXPOSE 23899

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.WEBUI_PORT||23899)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
