#!/bin/bash
# Fix linting, type errors, and formatting for changed TS/TSX files in the current branch.
# Runs oxlint (with autofix + typecheck) then oxfmt sequentially to avoid conflicts.
set -uo pipefail

base=$(git merge-base origin/main HEAD 2>/dev/null || echo "HEAD~1")
files=$(
  (
    git diff --name-only --diff-filter=ACMR "$base" -- 'apps/' 'packages/'
    git diff --name-only --diff-filter=ACMR -- 'apps/' 'packages/'
    git ls-files --others --exclude-standard -- 'apps/' 'packages/'
  ) | sort -u | grep -E '\.(ts|tsx)$' || true
)

if [ -z "$files" ]; then
  echo "No changed TS/TSX files to fix."
  exit 0
fi

echo "$files" | xargs oxlint --fix --quiet
lint_exit=$?

echo "$files" | xargs oxfmt --write
fmt_exit=$?

if [ $lint_exit -ne 0 ] || [ $fmt_exit -ne 0 ]; then
  exit 1
fi
