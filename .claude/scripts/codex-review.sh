#!/usr/bin/env bash
# codex-review.sh — Codex dual-review harness for /system-architect (WORKFLOW.md §5 seam).
# Runs OpenAI Codex (via the user's ChatGPT plan, NOT an API key) as a 2nd reviewer on a
# ticket diff. DORMANT until `codex` is installed + signed in; until then it reports
# not-connected and exits 0 so the orchestrator falls back to Claude's code-reviewer.
# CONTRACT: always exit 0; only a well-formed verdict reaches the orchestrator. Any failure
# (no codex, git error, unreadable diff, bad output, rate-limit) → a SKIPPED verdict so the
# orchestrator falls back to Claude — NEVER a false SHIP. Stack-agnostic (reviews a unified diff).
# Usage: codex-review.sh --ticket T-014 [--base main] [--ac "<acceptance criteria>"] [--diff file]
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
QUEUE="$ROOT/docs/CODEX_QUEUE.md"
# Pin a Codex model the ChatGPT plan supports (the user's config default may be API-only).
MODEL="${CODEX_REVIEW_MODEL:-gpt-5.5}"
TICKET=""; BASE=""; AC=""; DIFF_FILE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --ticket) TICKET="${2:-}"; shift 2;;
    --base)   BASE="${2:-}"; shift 2;;
    --ac)     AC="${2:-}"; shift 2;;
    --diff)   DIFF_FILE="${2:-}"; shift 2;;
    *) echo "unknown arg: $1" >&2; exit 64;;
  esac
done
# Default base = main, else master.
if [ -z "$BASE" ]; then
  if git -C "$ROOT" rev-parse --verify --quiet main >/dev/null 2>&1; then BASE="main"
  elif git -C "$ROOT" rev-parse --verify --quiet master >/dev/null 2>&1; then BASE="master"
  else BASE="main"; fi
fi

skip() { echo "{\"verdict\":\"SKIPPED\",\"reason\":\"$1\"}"; exit 0; }

# 0) Owner kill switch — `/codex off` (marker file) or CODEX_OFF=1 disables Codex entirely
#    (e.g. out of credits). Clean skip: no attempt, no error noise, no queue entry.
if [ "${CODEX_OFF:-0}" = "1" ] || [ -f "$ROOT/.claude/codex-off" ]; then
  echo "CODEX_OFF — Codex disabled by owner (run /codex on to re-enable). Using Claude fallback." >&2
  skip "codex_disabled_by_owner"
fi


# 1) Is Codex connected? (the deferred step)
if ! command -v codex >/dev/null 2>&1; then
  cat >&2 <<'MSG'
CODEX_NOT_CONNECTED — `codex` CLI not installed/signed in. Fall back to Claude code-reviewer.
To activate the Codex seam (uses the ChatGPT plan, no API key):
  curl -fsSL https://chatgpt.com/codex/install.sh | sh
  codex            # then choose "Sign in with ChatGPT"
MSG
  skip "codex_not_connected"
fi

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
DIFF="$TMP/diff.patch"

# 2) Resolve the diff — fail CLOSED (SKIPPED, never SHIP) if anything goes wrong
if [ -n "$DIFF_FILE" ]; then
  if [ ! -r "$DIFF_FILE" ] || ! cp "$DIFF_FILE" "$DIFF"; then
    echo "CODEX: cannot read --diff $DIFF_FILE" >&2; skip "diff_file_unreadable"
  fi
elif git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if ! git -C "$ROOT" rev-parse --verify --quiet "$BASE" >/dev/null; then
    echo "CODEX: base ref '$BASE' not found" >&2; skip "bad_base_ref"
  fi
  if ! git -C "$ROOT" diff "$BASE...HEAD" > "$DIFF" 2>"$TMP/giterr"; then
    echo "CODEX: git diff $BASE...HEAD failed: $(cat "$TMP/giterr")" >&2; skip "git_diff_failed"
  fi
else
  echo "CODEX: no --diff and not a git repo; nothing to review" >&2; skip "no_diff"
fi
[ -s "$DIFF" ] || { echo '{"verdict":"SHIP","reason":"empty_diff"}'; exit 0; }

# 3) Structured-output schema for a clean, parseable verdict
SCHEMA="$TMP/schema.json"
cat > "$SCHEMA" <<'JSON'
{ "type":"object","additionalProperties":false,
  "required":["verdict","findings"],
  "properties":{
    "verdict":{"type":"string","enum":["SHIP","FIX_FIRST","BLOCK"]},
    "findings":{"type":"array","items":{"type":"object","additionalProperties":false,
      "required":["severity","file","detail","fix"],
      "properties":{
        "severity":{"type":"string","enum":["critical","high","medium","low"]},
        "file":{"type":"string"},"detail":{"type":"string"},"fix":{"type":"string"}}}}}}
JSON

OUT="$TMP/verdict.json"
PROMPT="You are an adversarial correctness reviewer. Review the unified diff piped on stdin against these acceptance criteria: ${AC:-<none provided>}. Check logic bugs, edge cases, AC coverage, error handling, and test adequacy. Return ONLY the structured verdict."

# 4) Run Codex read-only (it must not edit — it is a reviewer)
set +e
err="$(codex exec --ignore-user-config --skip-git-repo-check --sandbox read-only -m "$MODEL" --output-schema "$SCHEMA" -o "$OUT" "$PROMPT" < "$DIFF" 2>&1 1>/dev/null)"
rc=$?
set -e

# 5) Rate-limit? queue the ticket + fall back (the "knock" picks it up next run)
if [ $rc -ne 0 ]; then
  if printf '%s' "$err" | grep -qiE 'rate.?limit|quota|usage limit|429|too many requests'; then
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    mkdir -p "$ROOT/docs"
    [ -f "$QUEUE" ] || printf '# CODEX_QUEUE\n\n| queued (UTC) | ticket | base | reason |\n|---|---|---|---|\n' > "$QUEUE"
    printf '| %s | %s | %s | rate-limit |\n' "$ts" "${TICKET:-?}" "$BASE" >> "$QUEUE" \
      || echo "CODEX: warning — could not append to $QUEUE" >&2
    echo "CODEX_RATELIMIT — queued ${TICKET:-?}; fall back to Claude. Knock when the window resets." >&2
    skip "rate_limit_queued"
  fi
  echo "CODEX error (rc=$rc): $err" >&2; skip "codex_error"
fi

# 6) Validate before emitting — only a well-formed verdict reaches the orchestrator
if [ -s "$OUT" ] && grep -q '"verdict"' "$OUT"; then
  if command -v jq >/dev/null 2>&1 && ! jq -e . "$OUT" >/dev/null 2>&1; then
    echo "CODEX: output is not valid JSON" >&2; skip "bad_codex_output"
  fi
  cat "$OUT"
else
  echo "CODEX: empty/invalid verdict output" >&2; skip "bad_codex_output"
fi
exit 0
