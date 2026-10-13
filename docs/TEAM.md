# Project team

The owner authorized installing the agents needed for this project on 2026-10-13. Existing code, architecture, security, and design reviewer definitions remain installed from A-Team V7. Three project-specific roles are now installed locally; their complete instructions were authored and reviewed for this project's scope. No additional external agent package is needed.

| Role | Responsibility and justification | Tier | Write paths |
| --- | --- | --- | --- |
| invitation-designer | Recipient gift experience and accessible Yes/No/form/receipt behavior | Inherited builder model | components/invitation, app/invite, app/confirmation |
| supabase-engineer | Private records, Auth, RLS, complete atomic saving, admin APIs and safe export | Inherited builder model | lib/server, backend validation/export, app/api, app/auth, proxy, supabase, owned backend tests/setup |
| scenario-tester | Duplicate/privacy/auth failures and behavior that visual review cannot establish | Judgment model in Claude; inherited parent model in current Codex session | tests and verification reports only |

Current Codex task delegation uses explicit disjoint ownership; Claude agent frontmatter is installed for future Claude sessions and is not automatic Codex registration. The Claude path guard only applies when the Claude harness runs it. No claim is made that these instructions alone mechanically isolate shell writes in Codex.

A temporary system-design agent produces the template document and domain/architecture/risk docs. The root builds the dashboard, shared contracts and app configuration, integrates work, and owns approvals, memory, source control, and final verification.
