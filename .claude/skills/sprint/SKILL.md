---
name: sprint
description: The orchestrator — run N roadmap tickets hands-off through build → db → reviews → qa → ship, managing skills and reviewer subagents, batching decisions once, stopping only at production pushes and real judgment calls. Use for "sprint", "autopilot", "run the roadmap", "do the next N tickets".
---

# /sprint — Orchestrator (runs in THIS main session)

You manage the workflow end-to-end **in this main session** — load-bearing: subagents can't spawn subagents, so the orchestrator must be you, here. You drive a **state machine**: read state, decide who runs next, delegate reviews to subagents, batch every foreseeable decision into ONE question, and stop only at hard stops. (For wave-based parallelism across file-disjoint tickets, use `/system-architect`; `/sprint` runs tickets sequentially.)

**Preflight:** if `.claude/stack.json` says `adapted: false`, run `/adapt` first.

**Non-negotiable:** Never bypass a skill's gates or a reviewer's 🔴. Never auto-push production schema or auto-promote to prod. Never run two agents editing files at once (parallel subagents only for read-only review). Batch all foreseeable decisions once per sprint — no ping-pong.

## 0 · Select + preflight
Scope from `$ARGUMENTS`: ticket IDs, a count, or blank = unblocked `## Now` tickets (cap 3 default). Read the 3 maps (STACK/INVENTORY/checkpoint), not the tree. Preflight: `git status` clean (dirty → stop, show, ask) · `docs/` present (missing → drafts per CLAUDE.md) · baseline green on the typecheck gate (STACK.md §3) for affected units (red baseline becomes ticket #0). Drop any ticket tagged `[BLOCKED: Q##]` whose answer is still missing — report it.

## 1 · Batch decisions ONCE (AskUserQuestion)
Scan selected tickets for every open question: ambiguous AC, naming, copy, schema shape, any taste/policy call DESIGN.md/DOMAIN.md don't already answer (and any `[CONFIRM]` that blocks the work). Ask ALL of it in one batched message before touching code. Write answers as a note under each ticket. Mid-run: never re-ask covered items; take the documented default for genuinely-new small calls, note it, keep moving. Only hard stops interrupt.

## 2 · Per-ticket loop (sequential), following WORKFLOW.md §3 by tags
Announce one line (`T-014 → building`), then run the ticket's sequence:
1. **Architecture** — `[db]`/new-dep/contract change → delegate to `architect-reviewer`; apply REVISE before proceeding (BLOCK = hard stop).
2. **DB** — `[db]` → execute `/db` (declarative/migration flow per STACK.md → types → auth checklist).
3. **Build** — execute `/build` (correct app/unit; branch per ticket unless solo-on-main agreed in §1).
4. **Design** — `[design]` → launch `design-reviewer` subagent; apply FIX FIRST; re-verify. `NEEDS DIRECTION` = hard stop.
5. **Security** — `[sec]` or touches auth/data-access/finance/PII/upload/entity-links → launch `security-reviewer`; fix 🔴/🟠; re-verify the as-another-user test. BLOCKED = hard stop until fixed.
6. **QA** — `[qa]`-tagged or risky domain logic → execute `/qa`'s attack list. Criticals fixed now, not filed.
7. **Code review** — launch `code-reviewer` (the Codex seam — Codex runs here once installed). Fix BLOCK/FIX FIRST.
8. Mark `[x]` with commit ref; one-line summary; next ticket.

**Failure policy:** two honest fix attempts per red gate / review blocker / QA critical. Still red → mark ticket `⛔ blocked: <why> · tried: <n>` in ROADMAP, continue ONLY if the next ticket doesn't depend on it — else end the sprint early with a clear report. Mid-build discovery that a ticket is > half a day → stop, split via `/plan`, ask which slice.

## 3 · Close
1. Execute `/ship` once for the sprint (its confirmation gates still apply).
2. Report: shipped / blocked / parked design-debt, reviewer verdicts, evidence paths, the LOG.md entry.
3. **Context economy:** after ~3 tickets (or if context feels heavy), close and say so — ROADMAP/LOG/DECISIONS/SECURITY carry ALL state, nothing lives only in chat. Resume = fresh session → `/team` → `/sprint`.

## Hard stops — never autopilot past these
A schema push/reset on a linked/production DB · a production deploy/promote · `git push` to a shared default branch · dropping columns / deleting user data · any reviewer 🔴 unresolved after 2 attempts · `design-reviewer` returns `NEEDS DIRECTION` · scope discovery (ticket > ½ day) · a `[CONFIRM]`/[BLOCKING] answer needed mid-ticket. Present the decision plainly, wait. Everything else: keep moving.
