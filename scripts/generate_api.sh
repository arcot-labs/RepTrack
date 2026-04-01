#!/bin/bash
set -Eeuo pipefail

FORCE=false

while getopts "f" opt; do
    case "$opt" in
    f) FORCE=true ;;
    \?) exit 1 ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$SCRIPT_DIR/.."
SERVER_DIR="$BASE_DIR/server"
CLIENT_DIR="$BASE_DIR/client"
CONFIG_DIR="$BASE_DIR/config"
OLD_SPEC_FILE="$CLIENT_DIR/openapi_spec.json"
NEW_SPEC_FILE="$CONFIG_DIR/openapi_spec.json"

cd "$SERVER_DIR"
source .venv/bin/activate

tmpfile="$(mktemp)"

python3 << EOF
import json
import logging

logging.disable(logging.CRITICAL)
from app.main import fastapi_app
logging.disable(logging.NOTSET)

spec = fastapi_app.openapi()
with open("$tmpfile", "w") as f:
    json.dump(spec, f, indent=4)
EOF

mv "$tmpfile" "$NEW_SPEC_FILE"

if [ "$FORCE" = false ] && [ -f "$OLD_SPEC_FILE" ]; then
    if cmp -s "$NEW_SPEC_FILE" "$OLD_SPEC_FILE"; then
        echo "Skipping API generation"
        exit 0
    fi
fi

mv "$NEW_SPEC_FILE" "$OLD_SPEC_FILE"

cd "$CLIENT_DIR"
echo "Generating API client"
pnpm run generate-api > /dev/null
