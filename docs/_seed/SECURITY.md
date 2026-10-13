# SECURITY.md — Threat Model & Findings

<!-- draft: auto-created. Owned by /security-review + the security-reviewer subagent. Append-only findings. -->

## §1 — Threat model
- **Assets:** _<sensitive data this system holds>_
- **Boundary:** authorization (RLS or app-layer per STACK.md §5) — tested *as another user*, never assumed from policy text.
- **Assumptions:** any committed secret is compromised; clients are hostile; server-only secrets must never reach a client bundle.

## §2 — Open findings
| ID | Sev | Finding | Location | Status | Date |
|---|---|---|---|---|---|

## §3 — Resolved findings
| ID | Sev | Finding | Fixed in | Date |
|---|---|---|---|---|
