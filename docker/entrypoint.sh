#!/bin/sh
set -e

# Next.js standalone server reads PORT and HOSTNAME.
export PORT="${WEBUI_PORT:-23899}"
export HOSTNAME="${WEBUI_HOST:-0.0.0.0}"

# Ensure the persisted-config directory exists.
mkdir -p "${CONFIG_DIR:-/config}"

exec node apps/web/server.js
