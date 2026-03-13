#!/bin/bash
set -Eeuo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <ENV>"
    exit 1
fi
TARGET_ENV="$1"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$SCRIPT_DIR/.."
ENV_DIR="$BASE_DIR/config/env"
CONFIG_DIR="$HOME/.local/share/reptrack-$TARGET_ENV"

ENV_FILE="$ENV_DIR/.env"
SERVERS_FILE="servers.json"
PGPASS_FILE="pgpass"
SERVERS_TEMPLATE="$ENV_DIR/$SERVERS_FILE.template"
PGPASS_TEMPLATE="$ENV_DIR/$PGPASS_FILE.template"

mkdir -p "$CONFIG_DIR"

set -a
source "$ENV_FILE"
set +a

if [ "$ENV" != "$TARGET_ENV" ]; then
    echo "Error: ENV variable in $ENV_FILE is '$ENV', but expected '$TARGET_ENV'"
    exit 1
fi

envsubst < "$SERVERS_TEMPLATE" > "$CONFIG_DIR/$SERVERS_FILE"
envsubst < "$PGPASS_TEMPLATE" > "$CONFIG_DIR/$PGPASS_FILE"
chmod 600 "$CONFIG_DIR/$PGPASS_FILE"

# symlinks for convenience
ln -sf "$CONFIG_DIR/$SERVERS_FILE" "$ENV_DIR/$SERVERS_FILE"
ln -sf "$CONFIG_DIR/$PGPASS_FILE" "$ENV_DIR/$PGPASS_FILE"
