---
name: design-review
description: Review rendered UI against docs/DESIGN.md with screenshots — score, fix, re-shoot. Use after UI work, "design review", "polish", "make it look right", "does this look good".
---

# /design-review — Pixels or It Didn't Happen

**Hard rule: no screenshots → no verdict.** If rendering is impossible now, output exactly `BLOCKED: cannot render — <reason>` and stop. Never approve from code. (If the project has no UI, say so and skip.)

1. **Delegate to the `design-reviewer` subagent** (Agent tool) with the ticket + the changed pages/states and which app/unit they live in (STACK.md §4). It has the full procedure + rubric. If subagents are unavailable, follow its steps inline.
2. The subagent starts the app's dev server (command per STACK.md), screenshots each page/state at the breakpoints in DESIGN.md (default **390 / 768 / 1440**) → `docs/review-evidence/T-###/`, scores against DESIGN.md (Direction · Tokens · Hierarchy · Spacing · Banned-list · Motion · A11y), and returns a fix list + verdict.
3. **Apply its FIX FIRST list** (worst first), re-run the subagent to re-shoot/re-score. Max two fix rounds per run — park leftovers as `[design]` tickets.
4. Verdict: `SHIP` / `SHIP after parked tickets` / `NEEDS DIRECTION` (the design itself is generic → present its 2–3 proposed moves toward the DESIGN.md signature and wait).

Output: score table (before→after), fixes made, evidence paths. Next: other reviewers (`/security-review`, `code-reviewer`) → `/ship`.
