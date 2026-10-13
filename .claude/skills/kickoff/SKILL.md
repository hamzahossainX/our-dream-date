---
name: kickoff
description: Scaffold a NEW project's skeleton from the locked docs — repo shape, apps/units, data layer, tests, design tokens — then verify gates. Use for "scaffold", "set up the repo", "start building", "kickoff".
---

# /kickoff — Scaffold the Skeleton

For a **new** project whose decisions are already captured in `docs/`. Kickoff does NOT re-interrogate the idea; it **builds the skeleton from `docs/ARCHITECTURE.md` + `docs/STACK.md`**. Read ARCHITECTURE.md, STACK.md, DOMAIN.md, DESIGN.md, PROJECT.md first. (Existing codebase? Use `/onboard` instead.)

## Preconditions
- **Stack must be decided.** If `docs/STACK.md` is still a draft, settle the stack first (`/adapt` can record an intended stack even before code exists, or fill STACK.md by hand from PROJECT.md).
- Confirm with the user before scaffolding (this writes a lot). If `git` isn't initialized, `git init` first (waves/worktrees need it).
- Open `CLIENT_QUESTIONS.md` — some scope may still be pending; scaffold the confirmed parts, leave notes for the rest. Don't block the whole scaffold on pending policy numbers (those are config, added later).

## Procedure (drive every step from STACK.md — no hardcoded framework)
1. **Repo shape:** init the package manager + repo tool named in STACK.md (single-package, or the monorepo tool). Create the units listed in STACK.md §4 (apps + shared packages/modules).
2. **Each app/unit:** scaffold with the declared framework + strict typing; wire imports from the shared UI/config units; wire auth/role guards from the shared auth unit per ARCHITECTURE.md.
3. **Data layer:** initialize the DB tooling named in STACK.md §5 (local dev DB, declarative schema / ORM schema location, generated client + types in the shared DB unit). Configure the auth/session approach per ARCHITECTURE.md.
4. **Storage/integrations:** stub the notify/payments/storage units behind interfaces (provider chosen later; secrets server-only).
5. **Design (if UI):** generate the token set from DESIGN.md brand into the UI unit's theme; map status tokens to the `Tone` type; set the font pairing; init the component library.
6. **Domain:** seed the domain unit with DOMAIN.md vocabulary (entities, enums, shared validation schemas) — types/vocabulary, not mock data.
7. **Tests:** wire the test runner + e2e tool from STACK.md at the root; per-unit test config. Ensure the gate scripts (lint/typecheck/test/build) exist and match STACK.md §3.
8. **Verify + commit:** run the full gate chain for all units. All green → `chore: scaffold <project> (a-team v7)` on a branch. Pin exact versions back into `docs/PROJECT.md` and confirm `.claude/stack.json` matches reality (re-run `/adapt` if gates differ). Regenerate `docs/INVENTORY.md`.

Next: `/plan <first feature>` (or `/db` to lay the first schema once [BLOCKING] answers land).
