# Data model

Design baseline: 2026-10-13. See the migration files for the executable schema. These notes describe requirements, not evidence of a deployed database.

| Entity | Purpose and rules |
| --- | --- |
| invitations | UUID, owner Auth ID, current published configuration JSON, and positive integer version. Editor drafts remain in the browser until publication. |
| invitation_versions | Immutable JSON configuration with stable question/option IDs, schedule, copy, appearance, and timezone. Composite primary key: invitation UUID and integer version. |
| admin_memberships | Provisioned Auth user to invitation mapping. No public inserts or self-promotion. |
| recipient_invites | Invitation mapping, hashed random token, expiry/revocation, and persistent completion marker. Raw tokens are never stored. |
| responses | UUID receipt, unique recipient invite, Yes/No answer, nullable local date/time, note, integer config version, UUID idempotency key, content hash, UTC submitted_at, and JSON snapshot containing timezone and human-readable selected labels. |
| rate-limit counters | Atomic bounded expiring technical counters. No draft answers or private messages. |

The version JSON replaces separate questions/options/slots tables for this small personal gift. The server validates its full structure before publishing, including `messageMaxLength` and each question's `appliesTo` (yes/no/both), required status, and selection limits. Responses retain stable IDs plus human-readable snapshots so exports and details remain readable after edits. Configuration is not arbitrary HTML/CSS/JavaScript.

Relationships: an invitation has versions, admins, and recipient invites; each recipient invite has at most one response. Each response references the version used. Foreign keys reject cross-invitation references. Unique constraints protect recipient completion and version numbering. Database check constraints protect answer and Yes/No scheduling shape.

The server checks option membership and counts, normalizes choices, and hashes the content against the expected version before calling a narrow transactional operation. That transaction locks the invitation and recipient in a consistent order, checks expiry/revocation/completion, verifies the same published version and permitted scheduling, inserts the complete snapshot, and marks the invite complete. Rollback leaves neither a response nor a completion marker. A retry with the same content returns its receipt; conflicting reuse of an idempotency key is rejected.

RLS is enabled for every application table. Anonymous users cannot access responses, memberships, tokens, or counter data and cannot insert responses directly. Verified admins receive only invitation-scoped operations. Recipient submission is a narrow server-authorized database operation; its elevated credentials can bypass RLS, so it must perform its own explicit authorization and validation. Execute privileges are restricted accordingly.

A stale form is rejected with a request to review refreshed settings. Publish and submit concurrency must make that version comparison atomic. Deleting a response preserves `recipient_invites.completed_at`; it cannot silently unlock another submission. Expiring counters have a documented cleanup path.
