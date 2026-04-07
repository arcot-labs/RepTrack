#!/usr/bin/env bash
set -Eeuo pipefail

require_command() {
    if ! command -v "$1" > /dev/null 2>&1; then
        echo "Error: $1 is not installed" >&2
        exit 1
    fi
}

print_help() {
    cat << EOF
Usage: ./$(basename "$0") [-f|--force]

Regenerates the API spec & client
EOF
}

FORCE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
    -f | --force)
        FORCE=true
        shift
        ;;
    -h | --help)
        print_help
        exit 0
        ;;
    *)
        echo "Unknown option: $1" >&2
        print_help
        exit 1
        ;;
    esac
done

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BASE_DIR="${SCRIPT_DIR}/.."
SERVER_DIR="${BASE_DIR}/server"
CLIENT_DIR="${BASE_DIR}/client"
CONFIG_DIR="${BASE_DIR}/config"
CLIENT_SPEC="${CLIENT_DIR}/openapi_spec.json"
CONFIG_SPEC="${CONFIG_DIR}/openapi_spec.json"
VENV_ACTIVATE="${SERVER_DIR}/.venv/bin/activate"

if [ ! -f "$VENV_ACTIVATE" ]; then
    echo "Error: activate script is not found at $VENV_ACTIVATE" >&2
    exit 1
fi

SPEC_TMP="$(mktemp)"

cleanup() {
    rm -f "$SPEC_TMP"
}
trap cleanup EXIT

cd "$SERVER_DIR"
source "$VENV_ACTIVATE"

require_command python3
require_command pnpm

python3 << EOF
import json
import logging

logging.disable(logging.CRITICAL)
from app.main import fastapi_app
logging.disable(logging.NOTSET)

spec = fastapi_app.openapi()
with open("$SPEC_TMP", "w") as out:
    json.dump(spec, out, indent=4)
EOF

if [ "$FORCE" = "false" ] && [ -f "$CLIENT_SPEC" ]; then
    if cmp -s "$SPEC_TMP" "$CLIENT_SPEC"; then
        echo "API spec unchanged - skipping client generation"
        cp "$SPEC_TMP" "$CONFIG_SPEC"
        exit 0
    fi
fi

cp "$SPEC_TMP" "$CLIENT_SPEC"
cp "$SPEC_TMP" "$CONFIG_SPEC"

cd "$CLIENT_DIR"
echo "Generating API client"
pnpm run generate-api > /dev/null
