#!/usr/bin/env bash
# worktree.sh — worktree + merge-protocol helpers for /system-architect (SKILL §3, §7).
# Conservative parallelism: the shared-package wave runs first/alone, then file-disjoint work in
# isolated worktrees; merge via an integration branch with the §4 gates re-run after EACH merge
# (two independently-green branches can be red together). Never auto-pushes the default branch.
# Stack-agnostic: gate commands come from .claude/stack.json. Portable to macOS bash 3.2.
set -uo pipefail
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
STACK="$ROOT/.claude/stack.json"

require_git() {
  if ! git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Not a git repo yet:  cd \"$ROOT\" && git init && git add -A && git commit -m 'chore: scaffold'" >&2
    exit 2
  fi
}

# Read a gate command from stack.json via node (preferred) or python3. Empty if unset/absent.
gate_cmd() { # gate_cmd <name>
  local name="$1"
  if command -v node >/dev/null 2>&1; then
    node -e "try{const s=require('$STACK');process.stdout.write((s.gates&&s.gates['$name'])||'')}catch(e){}" 2>/dev/null
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c "import json,sys;
try:
 s=json.load(open('$STACK')); sys.stdout.write((s.get('gates') or {}).get('$name') or '')
except Exception: pass" 2>/dev/null
  fi
}

gates() { # gates [unit] — the WORKFLOW.md §4 chain from stack.json
  local unit="${1:-}"
  local filterflag=""
  if [ -n "$unit" ] && command -v node >/dev/null 2>&1; then
    filterflag="$(node -e "try{const s=require('$STACK');process.stdout.write(s.gateFilterFlag||'')}catch(e){}" 2>/dev/null)"
  fi
  echo "▶ gates ${unit:-all}: lint → typecheck → test → build"
  local ran=0
  for g in lint typecheck test build; do
    local cmd; cmd="$(gate_cmd "$g")"
    [ -z "$cmd" ] && { echo "  · $g: (none in stack.json — skipped)"; continue; }
    if [ -n "$unit" ] && [ -n "$filterflag" ]; then cmd="$cmd $filterflag $unit"; fi
    echo "  ▶ $g: $cmd"
    ( cd "$ROOT" && eval "$cmd" ) || { echo "✗ $g red"; return 1; }
    ran=$((ran+1))
  done
  [ "$ran" -eq 0 ] && { echo "✗ no gate commands configured — run /adapt to populate .claude/stack.json"; return 1; }
  echo "✓ gates green"
}

cmd="${1:-help}"; shift || true
case "$cmd" in
  new)   # new <slug> — isolated worktree + branch for one ticket
    require_git; slug="${1:?usage: worktree.sh new <slug>}"
    case "$slug" in *[!a-z0-9-]*) echo "✗ slug must be [a-z0-9-] only" >&2; exit 64;; esac
    if git -C "$ROOT" show-ref --verify --quiet "refs/heads/t-$slug" || [ -e "$ROOT/../wt-$slug" ]; then
      echo "✗ t-$slug / ../wt-$slug already exists — run: worktree.sh clean $slug" >&2; exit 1
    fi
    git -C "$ROOT" worktree add "../wt-$slug" -b "t-$slug" && echo "worktree ../wt-$slug on branch t-$slug"
    ;;
  clean) # clean <slug> — remove that worktree + branch (best-effort)
    require_git; slug="${1:?usage: worktree.sh clean <slug>}"
    git -C "$ROOT" worktree remove "../wt-$slug" --force 2>/dev/null || true
    git -C "$ROOT" worktree prune
    git -C "$ROOT" branch -D "t-$slug" 2>/dev/null || true
    echo "cleaned wt-$slug / t-$slug (best-effort)"
    ;;
  gates) gates "${1:-}";;
  integrate) # integrate <branch...> — pass SHARED-package branches FIRST
    require_git
    [ $# -ge 1 ] || { echo "usage: worktree.sh integrate <branch> [branch...]  (shared-package branches first)" >&2; exit 64; }
    git -C "$ROOT" diff --quiet && git -C "$ROOT" diff --cached --quiet \
      || { echo "✗ working tree dirty — commit/stash before integrate (HARD STOP)" >&2; exit 1; }
    # Resolve the default branch (main, else master, else current).
    def="main"
    git -C "$ROOT" rev-parse --verify --quiet main >/dev/null || { git -C "$ROOT" rev-parse --verify --quiet master >/dev/null && def="master"; }
    git -C "$ROOT" rev-parse --verify --quiet "$def" >/dev/null \
      || { echo "✗ no 'main'/'master' branch — set your default branch first" >&2; exit 1; }
    git -C "$ROOT" switch "$def" >/dev/null 2>&1 || { echo "✗ cannot switch to $def" >&2; exit 1; }
    int="int/$(date -u +%Y%m%d-%H%M%S)"
    git -C "$ROOT" switch -c "$int" || exit 1
    for b in "$@"; do
      echo "▶ merging $b → $int"
      git -C "$ROOT" merge --no-ff "$b" -m "merge($b): integrate" \
        || { echo "✗ conflict on $b — orchestrator resolves with full context (HARD STOP)" >&2; exit 1; }
      gates || { echo "✗ gates red after $b — fix before continuing (HARD STOP)" >&2; exit 1; }
    done
    echo "✓ integration green on $int"
    echo "NEXT (orchestrator/human — NOT automatic, a Hard Stop): git -C \"$ROOT\" switch $def && git -C \"$ROOT\" merge --ff-only $int"
    ;;
  *) cat <<'H'
worktree.sh — /system-architect merge protocol (gate commands from .claude/stack.json)
  new <slug>        isolated worktree ../wt-<slug> on branch t-<slug>
  clean <slug>      remove that worktree + branch
  gates [unit]      run WORKFLOW §4 gate chain (lint/typecheck/test/build) from stack.json
  integrate <b...>  integration branch; merge branches (SHARED-FIRST); re-run gates after EACH; never auto-pushes
H
    ;;
esac
