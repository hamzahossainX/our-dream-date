#!/usr/bin/env bash
# codex-debate.sh — Codex as the independent second mind in /debate (DECISION_RIGHTS.md).
# Feeds the neutral framing file (which includes Position A) to Codex read-only and returns
# a structured counter-position. CONTRACT (same as codex-review.sh): always exit 0; any
# failure → {"verdict":"SKIPPED"} so /debate falls back to a Claude adversary subagent.
# Usage: codex-debate.sh --topic "<one-line decision>" --context <framing-file>
set -uo pipefail

MODEL="${CODEX_DEBATE_MODEL:-${CODEX_REVIEW_MODEL:-gpt-5.5}}"
TOPIC=""; CONTEXT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --topic)   TOPIC="${2:-}"; shift 2;;
    --context) CONTEXT="${2:-}"; shift 2;;
    *) echo "unknown arg: $1" >&2; exit 64;;
  esac
done

skip() { echo "{\"verdict\":\"SKIPPED\",\"reason\":\"$1\"}"; exit 0; }

# Owner kill switch — `/codex off` (marker file) or CODEX_OFF=1 disables Codex entirely
# (e.g. out of credits). Clean skip → /debate falls back to the Claude adversary subagent.
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
if [ "${CODEX_OFF:-0}" = "1" ] || [ -f "$ROOT/.claude/codex-off" ]; then
  echo "CODEX_OFF — Codex disabled by owner (run /codex on to re-enable). Using Claude adversary." >&2
  skip "codex_disabled_by_owner"
fi

command -v codex >/dev/null 2>&1 || { echo "CODEX_NOT_CONNECTED — fall back to Claude adversary subagent." >&2; skip "codex_not_connected"; }
[ -n "$TOPIC" ]    || skip "no_topic"
[ -r "$CONTEXT" ]  || { echo "CODEX: cannot read --context $CONTEXT" >&2; skip "context_unreadable"; }

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
SCHEMA="$TMP/schema.json"
cat > "$SCHEMA" <<'JSON'
{ "type":"object","additionalProperties":false,
  "required":["verdict","position","case","strongest_objection"],
  "properties":{
    "verdict":{"type":"string","enum":["AGREE","PARTIAL","DISAGREE"]},
    "position":{"type":"string"},
    "case":{"type":"array","items":{"type":"string"}},
    "strongest_objection":{"type":"string"},
    "evidence_that_would_change_my_mind":{"type":"string"}}}
JSON

OUT="$TMP/out.json"
PROMPT="You are the independent second mind in an adversarial decision debate. Topic: ${TOPIC}. The framing document on stdin contains the decision context, the candidate options, and 'Position A' (the other reviewer's recommendation). Your job: steelman the best ALTERNATIVE to Position A, then attack Position A's weakest points. You win by being right, not by agreeing or disagreeing reflexively. verdict = AGREE only if Position A survives your strongest attack; PARTIAL if it needs material amendment; DISAGREE if the alternative is better. Return ONLY the structured output."

set +e
err="$(codex exec --ignore-user-config --skip-git-repo-check --sandbox read-only -m "$MODEL" --output-schema "$SCHEMA" -o "$OUT" "$PROMPT" < "$CONTEXT" 2>&1 1>/dev/null)"
rc=$?
set -e

if [ $rc -ne 0 ]; then
  if printf '%s' "$err" | grep -qiE 'rate.?limit|quota|usage limit|429|too many requests'; then
    echo "CODEX_RATELIMIT — fall back to Claude adversary subagent for this debate." >&2
    skip "rate_limit"
  fi
  echo "CODEX error (rc=$rc): $err" >&2; skip "codex_error"
fi

if [ -s "$OUT" ] && grep -q '"verdict"' "$OUT"; then
  if command -v jq >/dev/null 2>&1 && ! jq -e . "$OUT" >/dev/null 2>&1; then
    echo "CODEX: output is not valid JSON" >&2; skip "bad_codex_output"
  fi
  cat "$OUT"
else
  echo "CODEX: empty/invalid debate output" >&2; skip "bad_codex_output"
fi
exit 0
