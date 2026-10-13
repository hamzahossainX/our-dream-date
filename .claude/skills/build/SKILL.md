---
name: build
description: Implement ONE roadmap ticket end-to-end in the right app/unit — code, tests, gates. Use for "build", "implement", "do ticket T-###", any planned coding task.
---

# /build — Implement One Ticket

Read first (the map, not the repo): the ticket in `docs/ROADMAP.md` (lowest unblocked `[ ]` if none named) · `docs/STACK.md` (gate commands, reuse surface, auth model) · `docs/INVENTORY.md` (reuse before you build) · `docs/DOMAIN.md` (if domain logic) · `docs/DESIGN.md` **if `[design]`** (pick tokens/spacing before writing UI). No ticket for the ask? Write a one-line ticket, then proceed.

## Procedure
1. **Branch:** `git checkout -b t-###-slug` (skip only if user works solo-on-main and said so).
2. **Locate correctly:** which unit does this belong in (STACK.md §4)? Shared logic → the right shared package/module, never duplicated across apps, never app→app import. Domain rules → the domain package/module.
3. **Reuse gate:** search `docs/INVENTORY.md` first — exact match → reuse · close → extend with a variant/prop · genuinely new → create in the right unit with a `/** @purpose … */` comment. State the choice in the summary.
4. **Implement to every AC.** CLAUDE.md rules apply: validate every boundary input; never trust client IDs for authz (re-check server-side per STACK.md §5); semantic tokens only (UI); **no hard-coded policy numbers** (read from config); secrets stay server-only.
5. **Schema touched?** STOP — run `/db` for that part first (declarative/migration flow → regenerate types), then continue. Route structural shape through `/architect-review`.
6. **Tests with the code:** the project's test runner (STACK.md §3) for changed logic — happy + one edge + one failure minimum. UI logic: test the action/handler, not pixels (pixels = `/design-review`).
7. **Gates (hard, in order, for affected units — STACK.md §3):** lint → typecheck → test → build. Fix and re-run until green. Never "done" with a red gate.
8. Mark ticket `[x]` with commit ref. Commit `feat(<scope>): summary (T-###)`.

Output: files changed + why, tests added, gate results — plainly.
Next per tags: `[design]` → `/design-review` · `[sec]`/auth/data-access/finance → `/security-review` · risky logic → `/qa` · then the §5 review stage → `/ship`.
