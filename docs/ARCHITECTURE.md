# Architecture

Design baseline: 2026-10-13. Next.js hosts the invitation, admin interface, and server endpoints. Supabase provides Auth and Postgres. Vercel is the intended HTTPS production host. The concrete route names are recorded by the implementation.

The recipient opens a high-entropy invite link, which is validated and exchanged for an HttpOnly scoped session. The app redirects to a token-free invitation URL and supplies only published public copy/questions/scheduling settings. Draft choices stay in memory. Final submission validates the session, origin, request bounds, configuration version, date/slot, question membership, and rate limit before the transactional database operation. A committed receipt drives confirmation. Unconfigured persistence shows a clear setup state and never displays a fabricated saved response.

Supabase SSR session handling verifies admin identity on the server. Every admin request checks a provisioned membership for its invitation. Database RLS repeats that owner boundary. Admin operations include paginated/filterable reads, metrics, scoped deletion, versioned configuration publication, and filtered CSV/XLSX exports. Exports neutralize formula-like text as literal content.

Private routes and responses are not shared-cacheable. Responses, cookies, and exports must be protected from cross-user cache reuse. Origin checking and appropriate SameSite/CSRF handling protect mutation routes. React escaping displays all custom copy and notes as plain text. A Content Security Policy and restrictive referrer policy support the privacy boundary. Production cookies are HTTPS-only.

Secret keys are server-only. An elevated Supabase client is confined to invite validation, submission, and other narrow privileged operations; it is never a substitute for admin authorization. Logs contain error codes and non-sensitive identifiers, without links, full request bodies, messages, or secrets. Persistent atomic rate limiting works across Vercel instances and fails closed when unavailable.

Published JSON versions keep the data model small while preserving history. Stable question/option IDs and response snapshots support future configuration edits. Publishing checks version conflicts; an open form against an older version must review the new settings before saving.

Local UI work can proceed without owner credentials. Real database checks require Supabase configuration and a provisioned admin account; real production delivery requires Vercel/project access, approved redirects, migrated schema, and a tested private invite. The UI must make this setup boundary visible. Repository handover must use the actual owner's repository.
