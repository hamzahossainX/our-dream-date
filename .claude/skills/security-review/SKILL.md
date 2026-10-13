---
name: security-review
description: Adversarial security & privacy review — authorization correctness, authorization-as-another-user, secrets, PII, server-only-secret leaks. Use on any auth/data-access/finance/PII/upload/notification ticket, "security review", "is this safe", before shipping sensitive surface.
---

# /security-review — The Security Gate

1. **Delegate to the `security-reviewer` subagent** (Agent tool) with the ticket + diff scope. It has the full procedure (authorization presence, **authorization-as-another-user**, secret/server-only-key scan, per-app guard, upload/signed-URL, notification PII, dependency audit) and writes findings to `docs/SECURITY.md`. It reads the auth model from `docs/STACK.md §5` (RLS vs app-layer) and tests accordingly.
2. **Apply fixes** for every 🔴/🟠, then re-run the subagent to re-verify (especially the as-another-user test).
3. A 🔴 (cross-user read/write, auth bypass, missing authorization, secret/server-key leak) **blocks merge/ship** until fixed. A human may waive only with an explicit, logged decision.

When to invoke (per WORKFLOW.md §3): any ticket touching auth, sessions, authorization/access policy, finance, sensitive records, entity relationships (e.g. guardian↔student, owner↔resource), file upload/storage, or notifications carrying PII. When in doubt, run it.

Output: verdict (CLEARED/BLOCKED), findings by severity, the as-another-user test result, SECURITY.md update. Next: `/qa` or the rest of the review stage → `/ship`.
