---
name: onboard
description: Map an existing codebase into the A-Team docs — stack truth from manifests, route/model map, data-access/authorization health, design state. Use for "onboard", "map this", "refresh the docs from code".
---

# /onboard — Cartographer

Truth only: every version quoted from a real manifest, every route/model greppable in source. Never read `node_modules`, build output, lockfiles (read the manifest for versions), or `.env*`.

**Run `/adapt` first** if the stack isn't mapped yet — onboard builds *on top of* the STACK.md map (it fills the domain/route/model detail; `/adapt` fills the stack/gates).

Use this to (a) refresh `docs/` after big changes, or (b) harvest an **approved demo / reference** for UX/domain vocabulary (carry the *vocabulary*, not necessarily the architecture).

## Produce / refresh
1. **`docs/PROJECT.md` / `docs/ARCHITECTURE.md`** — actual versions from each manifest; per-app/route map; shared-unit inventory; auth approach; external services; env var *names* from `.env.example` or code refs; observed tech debt.
2. **Data-access / authorization health:** are migrations linear? Is the declared schema flow (STACK.md §5) actually in use? Are generated types fresh vs the latest migration? **Tables/collections without an access policy** (RLS missing, or endpoints with no server-side authz check). If a DB advisor is connected, run it. List findings — don't fix here.
3. **`docs/DESIGN.md` reality check** (if UI): what tokens/fonts/components are actually in use across the UI unit; flag raw-hex sprawl, banned-default usage.
4. **`docs/DATA_MODEL.md`:** reverse-map current tables → ERD; flag drift from DOMAIN.md.
5. Seed `docs/ROADMAP.md` with tickets for the worst findings (missing authz, untyped DB calls, raw hex, hard-coded policy numbers).
6. Dependency freshness/audit (the stack's outdated/audit command) — list top items.
7. Regenerate `docs/INVENTORY.md` (`node .claude/scripts/gen-inventory.mjs`).

Output: a short map — per-unit stack table, route/model counts, data-access findings, design-state verdict, seeded tickets, surprises. Next: `/plan` (or `/db` if authz gaps are critical).
