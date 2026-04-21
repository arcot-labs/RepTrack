#!/usr/bin/env bash
set -Eeuo pipefail

require_command() {
    if ! command -v "$1" > /dev/null 2>&1; then
        echo "Error: $1 is not installed" >&2
        exit 1
    fi
}

require_command git2megaignore

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BASE_DIR="${SCRIPT_DIR}/.."

cd "$BASE_DIR"

GITIGNORE_FILES=(.gitignore client/.gitignore server/.gitignore)
OUTDATED_MEGAIGNORES=()
FOUND_STAGED_GITIGNORE=false

for GITIGNORE_FILE in "${GITIGNORE_FILES[@]}"; do
    if git diff --cached --quiet -- "$GITIGNORE_FILE"; then
        continue
    fi
    FOUND_STAGED_GITIGNORE=true

    GITIGNORE_DIR="$(dirname -- "$GITIGNORE_FILE")"
    MEGAIGNORE_FILE="${GITIGNORE_DIR}/.megaignore"
    if [ "$MEGAIGNORE_FILE" = "./.megaignore" ]; then
        MEGAIGNORE_FILE=".megaignore"
    fi

    echo "Updating $MEGAIGNORE_FILE from $GITIGNORE_FILE..."
    (
        cd "$GITIGNORE_DIR"
        git show :"$GITIGNORE_FILE" | git2megaignore -mc
    )

    if git diff --quiet -- "$MEGAIGNORE_FILE"; then
        continue
    fi

    OUTDATED_MEGAIGNORES+=("$MEGAIGNORE_FILE")
done

if [ "$FOUND_STAGED_GITIGNORE" = false ]; then
    echo "No staged .gitignore changes detected"
    exit 0
fi

if [ "${#OUTDATED_MEGAIGNORES[@]}" -gt 0 ]; then
    echo -e "\nDetected staged .gitignore changes without matching staged .megaignore updates:"
    printf '%s\n' "${OUTDATED_MEGAIGNORES[@]}"
    echo -e "\nStage updated files"
    exit 1
fi

echo ".megaignore files are up to date"
