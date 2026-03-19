#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$SCRIPT_DIR/.."
ENV_DIR="$BASE_DIR/config/env"

ENV_FILE="$ENV_DIR/.env"
SERVERS_FILE="servers.json"
PGPASS_FILE="pgpass"
SERVERS_TEMPLATE="$ENV_DIR/$SERVERS_FILE.template"
PGPASS_TEMPLATE="$ENV_DIR/$PGPASS_FILE.template"

set -a
source "$ENV_FILE"
set +a

if [[ -z "${ENV:-}" ]]; then
    echo "Error: ENV variable is not set. Please set it in $ENV_FILE."
    exit 1
fi

CONFIG_DIR="$HOME/.local/share/reptrack-$ENV"
mkdir -p "$CONFIG_DIR"

envsubst < "$SERVERS_TEMPLATE" > "$CONFIG_DIR/$SERVERS_FILE"
envsubst < "$PGPASS_TEMPLATE" > "$CONFIG_DIR/$PGPASS_FILE"
chmod 644 "$CONFIG_DIR/$PGPASS_FILE"

# symlinks for convenience
ln -sf "$CONFIG_DIR/$SERVERS_FILE" "$ENV_DIR/$SERVERS_FILE"
ln -sf "$CONFIG_DIR/$PGPASS_FILE" "$ENV_DIR/$PGPASS_FILE"
