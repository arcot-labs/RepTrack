#!/usr/bin/env bash
set -Eeuo pipefail

require_command() {
    if ! command -v "$1" > /dev/null 2>&1; then
        echo "Error: $1 is not installed" >&2
        exit 1
    fi
}

require_command pnpm

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BASE_DIR="${SCRIPT_DIR}/.."
CLIENT_DIR="${BASE_DIR}/client"

cd "${CLIENT_DIR}"

for file in src/components/ui/*.tsx
do
    filename=$(basename "$file" .tsx)
    echo "Updating $filename..."
    pnpm dlx shadcn@latest add -o "$filename"
    echo
done

cd "${BASE_DIR}"

pnpm dlx prettier --write client/src/components/ui client/pnpm-lock.yaml
