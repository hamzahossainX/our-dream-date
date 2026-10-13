# WORKFLOW.md — The Process Law

> How work moves from idea to shipped, and which gates are mandatory. `/sprint` and `/system-architect` execute this; humans follow it for attended work. Stack basis: `docs/STACK.md`. Sections §7–§8 are append-only.

## §1 — Source of truth + branch model
- **The default branch is shipped truth** — it must always pass the build gate for every affected unit.
- **No direct commits to the default branch.** Every change lands via a branch + merge, even solo.
- Branch naming: `t-###-slug` (feature/fix per ticket) · `chore/slug` · `backup-<reason>`.
- One ticket = one branch = one focused merge. No two tickets touching the same files in parallel; no two agents editing files at once.

## §2 — Commit format
- **Conventional Commits:** `type(scope): subject (T-###)` — `feat fix refactor chore docs test`. Imperative, ≤72 chars. Scope = the app/unit.
- No "wip", no committed secrets, no debug prints/commented-out code, no unrelated lockfile churn.
- Append the agent trailer the environment requires.

## §3 — Per-ticket sequence (by ticket type)
Every sequence is branch → work → **gates** → **review** → merge. Tickets are tagged in ROADMAP (`[design] [db] [sec] [migrate] [notify] [app:<unit>]`).

| Ticket type | Sequence |
|---|---|
| **Logic / no UI** | `/build → /qa (if risky) → review → ship` |
| **UI feature** `[design]` | `/build → /design-review → /qa (if risky) → review → ship` |
| **Schema-touching** `[db]` | `/architect-review (schema) → /db → /build → /qa (authz) → /security-review → review → ship` |
| **Security-sensitive** (auth, access policy, finance, sensitive records, upload, PII) | `/build → /security-review → /qa (authz as another user) → review → ship` |
| **Data migration** `[migrate]` | `/architect-review (mapping) → /migrate → /qa (row counts + spot check) → review → ship` |
| **Notifications** `[notify]` | `/build → /qa (provider sandbox) → /security-review (PII in messages) → review → ship` |
| **New dependency / version bump** | `/architect-review (approve) → /build → review → ship` |

**Insertion rules:** `/security-review` inserts into ANY sequence touching auth, access policy, secrets, finance, sensitive records, entity relationships, file upload, or notifications carrying PII. `/architect-review` inserts whenever schema changes, a package not in PROJECT.md is proposed, or a cross-unit contract changes.

## §4 — Gates (hard; must be green before review/merge)
In order, per affected unit: **lint → typecheck → test → build → e2e** (if specs exist). The exact commands are in `docs/STACK.md §3` / `.claude/stack.json`. A red gate stops the ticket — fix and re-run, never merge red. The PostToolUse hook also formats+lints every edited file deterministically.

## §5 — Review stage (the quality gate, incl. the Codex seam)
Before merge, the applicable reviewers run. Each returns a verdict; a 🔴 blocks merge until fixed or explicitly waived by the human.

| Reviewer | Scope | Verdict |
|---|---|---|
| **`code-reviewer`** subagent (correctness) | logic bugs, edge cases, contract drift | `SHIP / FIX FIRST / BLOCK` |
| **`security-reviewer`** subagent | authorization, authz-as-another-user, secrets, PII, server-key leak | `CLEARED / BLOCKED` |
| **`design-reviewer`** subagent | UI vs DESIGN.md, screenshots at the DESIGN.md breakpoints | `SHIP / FIX FIRST / NEEDS DIRECTION` |

> **CODEX SEAM:** the Codex reviewer plugs in HERE as the code reviewer. When installed (`.claude/scripts/codex-review.sh`), it runs alongside `code-reviewer` on the same inputs (the diff + ticket AC) for dual-review — agree = proceed, disagree = escalate. No other stage changes. Until then `code-reviewer` holds the slot.

## §6 — Merge & ship gates (checklist)
- [ ] All §4 gates green for every affected unit.
- [ ] Applicable §5 reviewers returned no unresolved 🔴.
- [ ] No `.env`/secrets/keys staged; no server-only secret reachable from a client bundle.
- [ ] Every new/changed table/collection has authorization (RLS or server-side) — verified, not assumed.
- [ ] Ticket AC met; ROADMAP checked `[x]` with commit ref; `docs/LOG.md` appended.
- [ ] Schema change → types regenerated (if the stack has typegen) and committed.

## §7 — Known issues (append-only)
| # | Issue | Severity | Date |
|---|---|---|---|

## §8 — Changelog (append-only)
| Date | Change |
|---|---|
| (install date) | A-Team v7 (portable edition) installed. Run `/adapt` to bind it to this stack. |
