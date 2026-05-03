#!/usr/bin/env bash
# Fix changed files, then run the full verification gate.
# Single command an AI agent must run after edits — autofix what's safe,
# fail loudly on what isn't.
set -uo pipefail

tmp_file=$(mktemp)
trap 'rm -f "$tmp_file"' EXIT

if base=$(git merge-base origin/main HEAD 2>/dev/null); then
  git diff --name-only --diff-filter=ACMR "$base" >> "$tmp_file"
elif base=$(git rev-parse --verify HEAD~1 2>/dev/null); then
  git diff --name-only --diff-filter=ACMR "$base" >> "$tmp_file"
fi

git diff --name-only --diff-filter=ACMR >> "$tmp_file"
git ls-files --others --exclude-standard >> "$tmp_file"

source_files=()
while IFS= read -r file; do
  source_files+=("$file")
done < <(
  sort -u "$tmp_file" \
    | grep -E '\.(js|jsx|ts|tsx|mjs|cjs|mts|cts)$' \
    | grep -vE '(^|/)(\.next|\.agents|\.claude)/' \
    || true
)

format_files=()
while IFS= read -r file; do
  format_files+=("$file")
done < <(
  sort -u "$tmp_file" \
    | grep -E '\.(js|jsx|ts|tsx|mjs|cjs|mts|cts|json|jsonc|md|css|html)$' \
    | grep -vE '(^|/)(\.next|\.agents|\.claude)/' \
    || true
)

lint_exit=0
fmt_exit=0

if [ ${#source_files[@]} -gt 0 ]; then
  pnpm exec oxlint --fix "${source_files[@]}"
  lint_exit=$?
else
  echo "No changed source files to lint."
fi

if [ ${#format_files[@]} -gt 0 ]; then
  pnpm exec oxfmt --write "${format_files[@]}"
  fmt_exit=$?
else
  echo "No changed files to format."
fi

if [ $lint_exit -ne 0 ] || [ $fmt_exit -ne 0 ]; then
  exit 1
fi

checks=(quality typecheck)
check_exit=0

for check in "${checks[@]}"; do
  echo "Running pnpm run $check..."
  if ! pnpm run "$check"; then
    check_exit=1
  fi
done

exit $check_exit
