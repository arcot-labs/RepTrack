#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BASE_DIR="${SCRIPT_DIR}/.."

cd "$BASE_DIR"

MISSING_MEGAIGNORE_UPDATES=""
CHANGED_GITIGNORES=""

for GITIGNORE_FILE in .gitignore client/.gitignore server/.gitignore; do
    if git diff --cached --quiet -- "$GITIGNORE_FILE"; then
        continue
    fi
    CHANGED_GITIGNORES="${CHANGED_GITIGNORES}${CHANGED_GITIGNORES:+\n}${GITIGNORE_FILE}"

    MEGAIGNORE_FILE="$(dirname "$GITIGNORE_FILE")/.megaignore"
    if [ "$MEGAIGNORE_FILE" = "./.megaignore" ]; then
        MEGAIGNORE_FILE=".megaignore"
    fi

    if git diff --cached --quiet -- "$MEGAIGNORE_FILE"; then
        MISSING_MEGAIGNORE_UPDATES="${MISSING_MEGAIGNORE_UPDATES}${MISSING_MEGAIGNORE_UPDATES:+\n}${MEGAIGNORE_FILE}"
    fi
done

if [ -z "$CHANGED_GITIGNORES" ]; then
    echo "No staged .gitignore changes detected"
    exit 0
fi

if [ -n "$MISSING_MEGAIGNORE_UPDATES" ]; then
    echo "Detected staged changes to .gitignore file without matching .megaignore updates:"
    printf '%b\n' "$MISSING_MEGAIGNORE_UPDATES"
    echo "Update .megaignore file(s) with: 'git2megaignore -mc'"
    exit 1
fi

echo ".megaignore files are up to date"
