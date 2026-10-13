---
name: team
description: Read-only status dashboard — board state, working tree, last ship, open questions, health flags, and the ONE recommended next command. Use for "status", "where are we", "what's next", or when resuming in a fresh session.
---

# /team — Status & Next Move

Read ONLY (headers/last-3-entries — never scan source, never write a file): `docs/STACK.md` §1 (identity + adapted?) · `docs/PROJECT.md` · `docs/ROADMAP.md` · last 3 of `docs/LOG.md` · last 3 of `docs/DECISIONS.md` · open 🔴 in `docs/SECURITY.md` · the Direction line of `docs/DESIGN.md` (if UI) · open **[BLOCKING]** items in `CLIENT_QUESTIONS.md` · then `git status -sb` + `git log --oneline -3`. 30-second snapshot, not an audit.

Render compactly:
```
<Project> · <design direction or —> · branch <name> (clean|dirty)
STACK   <language/framework> · <db> · gates: <ok|not-adapted>
BOARD   ✅ <n> done · ▢ <n> open · ⛔ <n> blocked
  ▢ T-014 [app:x][design] <title>
  ⛔ T-011 [db] blocked: needs Q11 (<what>)
OPEN    <n> [BLOCKING] questions still open: <short list>
LAST    shipped <date>: <one line> · decided: <one line>
SEC     <n> open 🔴 | none
FLAGS   <draft-marked docs · types older than latest migration · blocked >7d · none>
👉 NEXT <one command> — <one-line why>
```

Recommendation logic (pick ONE):
- `stack.json` `adapted:false` → `/adapt` (nothing works until the stack is mapped).
- Dirty tree → name the exact finish/commit step first.
- No `docs/` or no scaffold yet → `/kickoff` (new) or `/onboard` (existing code).
- [BLOCKING] answers missing for the next schema work → say so; recommend a non-blocked ticket.
- Open 🔴 security → fix it first.
- Docs but no open tickets → `/plan <next feature>`.
- Only blocked tickets → surface the blockers as the decision needed.
- Unblocked tickets + clean tree → `/sprint <n>` (hands-off) or `/build T-###` (single, attended).
