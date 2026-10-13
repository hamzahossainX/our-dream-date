---
name: db
description: A schema change done right — declarative/migration flow per the project's DB tool, regenerated types, an authorization checklist, and advisors. Use for "add table", "migration", "schema", "RLS", "database change".
---

# /db — Schema Discipline (whatever DB STACK.md names)

Read `docs/STACK.md §5` for the DB kind, the schema-change command, the typegen command, and the auth model (RLS vs app-layer). Never hand-write migration SQL first when the tool generates it; never mutate schema out-of-band (dashboard/manual). Structural shape goes through `/architect-review` first. Check `docs/DATA_MODEL.md` + `docs/DOMAIN.md` — the model must match the domain and keep **policy numbers configurable, not columns of constants**.

## Flow (adapts to the stack's tool)
1. **Declare / author the change** in the project's canonical place (declarative schema file, ORM schema, or a migration authored via the tool — per STACK.md §5).
2. **Generate + review the migration:** run the stack's schema-change command, then **read the generated migration** — destructive statements? unintended drops? Never apply blind.
3. **Apply locally** (dev DB), never against production here.
4. **Regenerate types** (if the stack has typegen — STACK.md §5) → run the typecheck gate and fix fallout now.
5. **Authorization checklist — every new/changed table/collection:**
   - **If RLS (DB enforces):** row-level security enabled · one policy per operation (never a blanket `using(true)`) · ownership via the identity function (e.g. `(select auth.uid()) = user_id`) · `with check` on writes · **every column a policy references is indexed** · role-aware access matches DOMAIN.md.
   - **If app-layer (server enforces):** every read/write path re-checks the caller's identity server-side · no endpoint trusts a client-supplied ID for authorization · role/tenant scoping matches DOMAIN.md · covered by an authz test (see `/security-review`).
   - Storage/file access rules set if the feature touches uploads.
6. **Advisors:** if a DB advisor/linter is available (e.g. Supabase MCP security + performance advisors), run it and act on errors. Else note "advisors not run".
7. Update `docs/DATA_MODEL.md` with the new tables/relationships. Production push happens in `/ship` (after confirmation), never here.

Output: schema change summary, migration filename, types-regen status, auth checklist results, advisor findings. Next: `/build`, then `/security-review` (probe access as another user).
