---
name: plan
description: Break a feature into right-sized, dependency-ordered tickets with acceptance criteria + tags in docs/ROADMAP.md. Use for "plan", "break down", "what's next", before building anything non-trivial.
---

# /plan — Ticketing

Read `docs/PROJECT.md` (scope check — is this in MVP? say so if not), `docs/ROADMAP.md`, `docs/STACK.md` (the reuse surface + gates), `docs/DOMAIN.md` (domain correctness), `docs/DESIGN.md` (does it have UI?), and `CLIENT_QUESTIONS.md` (blocked on a `[CONFIRM]`? flag it). Don't read source — search `docs/INVENTORY.md` to know what already exists.

For features needing real architectural thought, suggest re-running in **plan mode** (Shift+Tab) first, and route schema shape through `/architect-review`.

## Ticket rules
- Each ticket ≤ ~half a day; bigger → split. Sequence by dependency; **no two tickets touching the same files in parallel**. A `[db]` schema ticket comes FIRST in its feature's sequence.
- Tag every ticket: `[app:<unit>]` (which app/module), `[design]` (user-visible UI), `[db]` (schema), `[sec]` (auth/data-access/finance/PII/upload), `[migrate]` (data import), `[notify]` (SMS/email/push). Tags drive the `WORKFLOW.md §3` sequence.
- Flag `[BLOCKED: Q##]` if it needs a stakeholder answer; park it in `## Later` until answered.

## Format (append to `docs/ROADMAP.md`)
```
- [ ] T-014 — <title> [app:<unit>][design]
  AC: <observable, testable outcomes>; empty + loading + error states per DESIGN.md (if UI)
  Touches: <paths / units> (check INVENTORY first — reuse/extend/new stated)
  Risk: <threshold is [CONFIRM Q13] — read from config, default documented>
```

Output: the new ticket block + one-line rationale for the sequence. Next: `/build T-###` (or `/db T-###` if schema first, or `/architect-review` if structural).
