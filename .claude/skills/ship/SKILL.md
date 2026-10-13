---
name: ship
description: Pre-flight and release for one or more apps/units — all gates, review stage, secret scan, DB migration push, deploy, log entry. Use for "ship", "deploy", "release", "push this".
---

# /ship — Release Gate

Read `docs/STACK.md §3/§5` for the gate commands, DB push flow, and deploy target.

1. **Tree + gates:** working tree clean or only intended changes. Then per affected unit: the full gate chain (STACK.md §3) — lint → typecheck → test → build → e2e (if specs exist). Any red → stop, report, fix or hand back.
2. **Review stage (WORKFLOW.md §5):** confirm the applicable reviewers cleared — `code-reviewer` (correctness), `security-reviewer` (if sensitive), `design-reviewer` (if UI). Unresolved 🔴 → do not ship. (This is where the Codex reviewer runs once installed.)
3. **Secret scan:** `git diff --staged` + changed files for key material (from `.claude/stack.json` `secretPatterns` — e.g. `sk-`, `service_role`, JWTs, private keys); `.env*` not staged; **no server-only secret reachable from any client bundle** (grep the `clientReachableGlobs`).
4. **Commit + PR:** conventional commit; push branch; `gh pr create` when a remote exists (summary = tickets shipped + evidence links). Solo-on-main only if that's the user's stated mode.
5. **DB:** pending local migrations? Show them, then push to the linked/production DB (STACK.md §5 flow) **only after explicit user confirmation** (production schema). Regenerate prod types if CI uses them.
6. **Deploy (per unit):** only the **affected apps** deploy. Rely on the deploy target's preview flow (STACK.md); surface each affected app's preview URL; production promote per the user's flow, **only on request**. After deploy, hit key routes (200s, no console errors).
7. **Log:** append to `docs/LOG.md`: `YYYY-MM-DD — T-### shipped (<units>): <one line>. Learned: <one line or —>.` Check off ROADMAP items closed.

Output: gate results, reviewer verdicts, what went out (commits/PR/preview URLs), migrations pushed or pending, log entry. Next: `/plan` for the next slice, or `/team`.

## Hard stops (never autopilot past)
A schema push/reset on a linked/production DB · a production deploy/promote · `git push` to a shared default branch · dropping columns / deleting user data · an unresolved review 🔴. Present the decision, wait.
