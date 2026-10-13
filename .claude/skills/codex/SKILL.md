---
name: codex
description: Owner switch for the Codex second mind — turn it off when credits run out, back on when they're back, or check status. Use for "codex off", "codex on", "codex status", "disable codex", "out of codex credits".
---

# /codex — the Codex kill switch

Codex (the second reviewer/debater) is OPTIONAL. Both harness scripts check the switch
first and fall back to Claude cleanly — reviews and debates never stall on a missing or
disabled Codex.

## `/codex off`
1. `touch .claude/codex-off`
2. Confirm: "Codex disabled — code review runs on Claude's code-reviewer alone; /debate
   uses a fresh Claude adversary subagent as the second mind. Re-enable with /codex on."
This is the owner's call — never turn it off silently on the owner's behalf. If Codex is
merely rate-limited, you don't need this: the scripts already queue and fall back on their own.

## `/codex on`
1. `rm -f .claude/codex-off`
2. Verify readiness: `command -v codex` — if missing, show the install steps (see README
   "Optional: the Codex second reviewer") and note it stays dormant-but-safe until installed.
3. If `docs/CODEX_QUEUE.md` has queued tickets, offer to knock: re-run
   `.claude/scripts/codex-review.sh` for each queued ticket, then clear served rows.

## `/codex status`
Report in one block: switch state (`.claude/codex-off` present? `CODEX_OFF` env set?) ·
CLI installed? · queue depth in `docs/CODEX_QUEUE.md` · which mind currently fills the
second-reviewer and debate-adversary seats.

## Law
- The switch changes WHO fills the second seat, never WHETHER the review/debate happens.
- One-way-door debates still run with a Claude adversary when Codex is off — note
  `minds: claude+claude` in the DECISIONS entry so the record shows the second opinion
  was not fully independent that day.
