#!/usr/bin/env bash
set -Eeuo pipefail

require_command() {
    if ! command -v "$1" > /dev/null 2>&1; then
        echo "Error: $1 is not installed" >&2
        exit 1
    fi
}

require_command getopt
require_command watchexec
require_command docker

set +e
getopt --test > /dev/null 2>&1
status=$?
set -e

if [[ $status -eq 4 ]]; then
    GNU_GETOPT="$(command -v getopt)"
else
    require_command brew
    GNU_GETOPT="$(brew --prefix gnu-getopt)/bin/getopt"
    if [[ ! -x "$GNU_GETOPT" ]]; then
        echo "Error: GNU getopt not found" >&2
        exit 1
    fi
fi

print_help() {
    cat << EOF
Usage: ./$(basename "$0") [OPTIONS]

Sets up and runs local development environment
Always runs infrastructure services
Optionally runs client & server depending on mode

Options:
  -s, --skip-install-deps    Skip installing client & server dependencies
  -m, --mode MODE            Client & server mode: docker (default) | local | none
  -n                         Alias for --mode none
  -h, --help                 Show this help message

Examples:
  ./$(basename "$0")
  ./$(basename "$0") --skip-install-deps
  ./$(basename "$0") --mode docker
  ./$(basename "$0") -sn
EOF
}

SKIP_INSTALL_DEPS=false
MODE="docker"

if ! OPTIONS=$(
    "$GNU_GETOPT" \
        -o sm:nh \
        --long skip-install-deps,mode:,help \
        -- "$@"
); then
    echo
    print_help
    exit 1
fi

eval set -- "$OPTIONS"

while true; do
    case "$1" in
    -s | --skip-install-deps)
        SKIP_INSTALL_DEPS=true
        shift
        ;;
    -m | --mode)
        MODE="$2"
        shift 2
        ;;
    -n)
        MODE="none"
        shift
        ;;
    -h | --help)
        print_help
        exit 0
        ;;
    --)
        shift
        break
        ;;
    *)
        echo "Unknown option: $1"
        exit 1
        ;;
    esac
done

case "$MODE" in
docker | local | none) ;;
*)
    echo "Invalid mode: $MODE"
    echo "Valid options: docker | local | none"
    exit 1
    ;;
esac

echo "Running in client/server mode: $MODE"
echo "Skip install deps: $SKIP_INSTALL_DEPS"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BASE_DIR="${SCRIPT_DIR}/.."
SERVER_DIR="${BASE_DIR}/server"
CLIENT_DIR="${BASE_DIR}/client"
CONFIG_DIR="${BASE_DIR}/config"
INFRA_DIR="${CONFIG_DIR}/infra"
ENV_DIR="${CONFIG_DIR}/env"
ENV_FILE="${ENV_DIR}/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file is not found at $ENV_FILE" >&2
    exit 1
fi

if [ "$MODE" = "local" ] || [ "$SKIP_INSTALL_DEPS" = "false" ]; then
    require_command uv
    require_command pnpm
fi

if [ "$SKIP_INSTALL_DEPS" = "false" ]; then
    echo "Installing client & server dependencies..."
    (cd "$SERVER_DIR" && uv sync)
    (cd "$CLIENT_DIR" && pnpm i)
else
    echo "Skipping installation of client & server dependencies"
fi

cleanup() {
    if [ -n "${WATCHEXEC_PID:-}" ]; then
        echo "Stopping watchexec (PID $WATCHEXEC_PID)"
        kill "$WATCHEXEC_PID" 2> /dev/null || true
    fi

    if [ -n "${COMPOSE_PID:-}" ]; then
        echo "Stopping Docker Compose..."
        docker compose --env-file "$ENV_FILE" down || true
    fi

    if [ -n "${SERVER_PID:-}" ]; then
        echo "Stopping local server (PID $SERVER_PID)"
        kill "$SERVER_PID" 2> /dev/null || true
    fi

    if [ -n "${CLIENT_PID:-}" ]; then
        echo "Stopping local client (PID $CLIENT_PID)"
        kill "$CLIENT_PID" 2> /dev/null || true
    fi
}
trap cleanup EXIT INT TERM

echo "Watching $SERVER_DIR/app for Python changes..."

watchexec -r \
    -w "$SERVER_DIR/app" \
    -e py \
    -d 200ms \
    "$SCRIPT_DIR/generate_api.sh" &

WATCHEXEC_PID=$!

cd "$INFRA_DIR"

COMPOSE_CMD=(docker compose --env-file "$ENV_FILE")
if [ "$MODE" = "docker" ]; then
    echo "Starting Docker Compose with client & server"
    "${COMPOSE_CMD[@]}" --profile include-client-server pull
    "${COMPOSE_CMD[@]}" --profile include-client-server up --watch &
else
    echo "Starting Docker Compose (infra only)"
    "${COMPOSE_CMD[@]}" pull
    "${COMPOSE_CMD[@]}" up &
fi

COMPOSE_PID=$!
PIDS=("$COMPOSE_PID")

if [ "$MODE" = "local" ]; then
    echo "Starting local client & server"

    (cd "$SERVER_DIR" && make dev) &
    SERVER_PID=$!

    (cd "$CLIENT_DIR" && pnpm run dev) &
    CLIENT_PID=$!

    PIDS+=("$SERVER_PID" "$CLIENT_PID")
fi

wait "${PIDS[@]}"
