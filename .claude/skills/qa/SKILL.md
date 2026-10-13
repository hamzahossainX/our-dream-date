---
name: qa
description: Adversarial QA on a ticket/feature — edge cases, authorization probing (as another user), error/loading states, e2e smoke. Use for "test this", "QA", "try to break it".
---

# /qa — Break It On Purpose

Scope: the named ticket/feature (else the diff since last ship). Read its AC + `docs/DOMAIN.md` (domain edge cases) + `docs/STACK.md` (test runner, auth model). Run real commands/tests, not code-reading.

## Attack list (run what applies)
1. **Inputs:** empty, huge (10k chars), unicode/emoji/RTL/non-Latin scripts, HTML/script injection rendered back, 0/negative/float where int expected, double-submit, oversized file upload.
2. **AuthZ (never skip):** as **user B**, attempt to read/update user A's data — through the app AND directly at the data layer with B's credentials/token (write a small integration test against the local stack). Match the model in STACK.md §5: if RLS, verify the DB denies it; if app-layer, verify the server endpoint denies it (not just the UI hiding it). Test the domain cases (tenant/role/relationship scoping per DOMAIN.md). Every leak = critical (route to `/security-review`).
3. **Domain logic:** boundary values (79.9 vs 80 style cutoffs), threshold edges, state transitions, date/timezone handling, money rounding — whatever DOMAIN.md defines.
4. **States:** loading, empty, error (kill/slow the backend), unauthenticated hitting protected routes, wrong-role/wrong-app login, session expiry mid-action.
5. **E2E smoke:** one spec for this feature's critical path (the e2e tool in STACK.md) — commit it.
6. **Concurrency where it matters:** two tabs mutating the same row; optimistic-UI rollback.

## Findings
- Critical (data leak, data loss, auth bypass, wrong result): **fix now**, then re-test.
- Major/minor: file as `[qa]` tickets in ROADMAP with repro.

Output: what was attacked, pass/fail per attack, fixes applied, tickets filed, e2e spec path. Next: review stage → `/ship` (don't defer criticals).
