# Project risks

| ID | What could fail | How to notice | Severity | Mitigation / required check |
| --- | --- | --- | --- | --- |
| R1 | An outsider reads private notes or admin data. | Anonymous or other-user access returns private rows, details, or exports. | Critical | Verified Auth, provisioned membership, scoped RLS on every table, server checks, no shared private caches; test anonymous/non-admin/other-admin identities. |
| R2 | A retry or simultaneous request creates two answers. | Duplicate recipient rows or mismatched receipt after retries. | High | Recipient row lock, uniqueness, content hash and idempotency, atomic response/completion save; race and lost-response tests. Preserve completion after deletion. |
| R3 | Settings change the meaning of a response or let an invalid slot through. | Old labels disappear or stale selections are silently accepted. | High | Immutable config versions, stable IDs, stored response snapshots, timezone-aware date checks, atomic stale-version rejection. |
| R4 | The gift looks polished but saving, decline, or access is misleading. | Unconfigured UI claims success, No is unreachable, or phone/reduced-motion use fails. | High | Honest setup/error states, accessible Yes/No, real commit before success, phone/desktop screenshots, keyboard and reduced-motion tests. |
| R5 | The shared link, note, or export leaks or executes unintended content. | Tokens appear in logs/referrers; formula-like cells execute; abusive calls escape limits. | High | Hash/revoke links, scoped HttpOnly sessions, noindex/referrer policy, bounded plain-text input, formula-safe CSV/XLSX, persistent rate limits, sanitized logs. |

Cloud setup is an explicit delivery dependency. Missing credentials cannot be treated as a successful RLS or live-deployment check. Keep schema, setup instructions, and unresolved external checks visible at handover.
