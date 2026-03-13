#!/bin/bash
set -Eeuo pipefail

SKIP_INSTALL_DEPS=false
INCLUDE_CLIENT_SERVER=true

while getopts "so" opt; do
    case "$opt" in
    s) SKIP_INSTALL_DEPS=true ;;
    o) INCLUDE_CLIENT_SERVER=false ;;
    \?) exit 1 ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$SCRIPT_DIR/.."
SERVER_DIR="$BASE_DIR/server"
CLIENT_DIR="$BASE_DIR/client"
CONFIG_DIR="$BASE_DIR/config"
INFRA_DIR="$CONFIG_DIR/infra"
ENV_DIR="$CONFIG_DIR/env"

if [ "$SKIP_INSTALL_DEPS" = false ]; then
    echo "Installing dependencies"
    cd "$SERVER_DIR"
    uv sync

    cd "$CLIENT_DIR"
    npm i
else
    echo "Skipping dependency installation"
fi

watchexec -r -w "$SERVER_DIR/app" -e py "$SCRIPT_DIR/generate_api.sh" &
WATCHEXEC_PID=$!

cleanup() {
    echo "Stopping watchexec (PID: $WATCHEXEC_PID)"
    kill $WATCHEXEC_PID
}
trap cleanup EXIT

cd "$SCRIPT_DIR"
./generate_pg_admin_config.sh

cd "$INFRA_DIR"
if [ "$INCLUDE_CLIENT_SERVER" = true ]; then
    echo "Starting Docker Compose with client and server"
    docker compose --env-file "$ENV_DIR/.env" --profile include-client-server up --watch &
else
    echo "Starting Docker Compose without client and server"
    docker compose --env-file "$ENV_DIR/.env" up &
fi

wait
