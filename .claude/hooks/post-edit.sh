#!/usr/bin/env bash
# A-Team v7: format + lint every file Claude edits, and block obvious secret leaks into
# client-reachable paths. Exit 2 feeds the problem back to Claude to fix. Deterministic gate.
# Stack-agnostic: secret patterns + client globs come from .claude/stack.json.
set -uo pipefail
payload=$(cat)
ROOT="${CLAUDE_PROJECT_DIR:-.}"
STACK="$ROOT/.claude/stack.json"

# Extract the edited file path from the tool payload (python3 preferred, node fallback).
file=""
if command -v python3 >/dev/null 2>&1; then
  file=$(printf '%s' "$payload" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null || true)
elif command -v node >/dev/null 2>&1; then
  file=$(printf '%s' "$payload" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log((JSON.parse(d).tool_input||{}).file_path||'')}catch(e){}})" 2>/dev/null || true)
fi
[ -z "$file" ] || [ ! -f "$file" ] && exit 0
cd "$ROOT" || exit 0

# Helper: read a JSON array field from stack.json as newline-separated values.
json_array() { # json_array <field>
  local field="$1"
  if command -v node >/dev/null 2>&1; then
    node -e "try{const s=require('$STACK');(s['$field']||[]).forEach(x=>console.log(x))}catch(e){}" 2>/dev/null
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c "import json;
try:
 s=json.load(open('$STACK'));
 [print(x) for x in (s.get('$field') or [])]
except Exception: pass" 2>/dev/null
  fi
}

# --- Release-blocking guard: server-only secrets must never reach a client surface ---
globs="$(json_array clientReachableGlobs)"; [ -z "$globs" ] && globs="/app/
/pages/
/components/
/src/client/"
patterns="$(json_array secretPatterns)"; [ -z "$patterns" ] && patterns="SERVICE_ROLE
service_role
SECRET_KEY
PRIVATE_KEY"
in_client=0
while IFS= read -r g; do [ -n "$g" ] || continue; case "$file" in *"$g"*) in_client=1;; esac; done <<< "$globs"
if [ "$in_client" -eq 1 ]; then
  while IFS= read -r pat; do
    [ -n "$pat" ] || continue
    if grep -qE "$pat" "$file" 2>/dev/null; then
      echo "BLOCKED: $file (a client-reachable path) contains a secret-like pattern '$pat'. Move it to a server-only module." >&2
      exit 2
    fi
  done <<< "$patterns"
fi

# --- Format + lint (by file type; degrade gracefully if no toolchain) ---
case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.css|*.json)
    runner="npx --no-install"; command -v pnpm >/dev/null 2>&1 && runner="pnpm exec"
    if [ -f biome.json ] || [ -f biome.jsonc ]; then
      out=$($runner biome check --write "$file" 2>&1) || { echo "Lint issues in $file:" >&2; echo "$out" | tail -20 >&2; exit 2; }
    elif ls eslint.config.* .eslintrc* >/dev/null 2>&1; then
      $runner prettier --write "$file" >/dev/null 2>&1 || true
      out=$($runner eslint --fix "$file" 2>&1) || { echo "Lint issues in $file:" >&2; echo "$out" | tail -20 >&2; exit 2; }
    elif command -v prettier >/dev/null 2>&1 || [ -f .prettierrc ] || ls .prettierrc* prettier.config.* >/dev/null 2>&1; then
      $runner prettier --write "$file" >/dev/null 2>&1 || true
    fi
    ;;
  *.py)
    if command -v ruff >/dev/null 2>&1; then
      ruff format "$file" >/dev/null 2>&1 || true
      out=$(ruff check --fix "$file" 2>&1) || { echo "Ruff issues in $file:" >&2; echo "$out" | tail -20 >&2; exit 2; }
    elif command -v black >/dev/null 2>&1; then black "$file" >/dev/null 2>&1 || true; fi
    ;;
  *.go)  command -v gofmt >/dev/null 2>&1 && gofmt -w "$file" >/dev/null 2>&1 || true ;;
  *.rs)  command -v rustfmt >/dev/null 2>&1 && rustfmt "$file" >/dev/null 2>&1 || true ;;
esac
exit 0
