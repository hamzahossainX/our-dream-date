---
name: migrate
description: Import existing data (Excel/CSV/other) into the project's database safely — profile the source, map to schema, validate, dry-run, load idempotently, reconcile counts. Use for "data migration", "import the spreadsheet", "load existing records".
---

# /migrate — External Data → The Database

For importing existing records into the project's DB (STACK.md §5). Treat real data as untrusted and irreplaceable. Route the mapping through `/architect-review` first.

## Preconditions
- Source files in hand? If not, this is `[BLOCKED]` — request the exports first.
- Target schema exists with authorization in place (run `/db` first if not).

## Procedure
1. **Profile the source:** open each file read-only; record columns, types, row counts, encodings (non-Latin/Unicode!), date formats, ID formats, duplicates, blanks, obvious errors. Write findings to `docs/migration/<source>-profile.md`.
2. **Map:** build an explicit column→table.field mapping (a mapping file/script). Note transforms (name splitting, phone normalization, date parsing, code lookups against DOMAIN.md). Flag fields with no home and policy values that belong in config.
3. **Validate before load:** a dry-run that parses every row and reports rejects (row numbers + reason) WITHOUT writing. Zero silent drops — every skipped row is logged.
4. **Idempotent load:** load via a server-side script using a stable natural key with upsert, inside a transaction per batch, so re-running is safe. Never load through a dashboard. Any server-only/service key is used **only** in this script, never shipped to a client.
5. **Reconcile:** counts in == counts loaded + counts rejected. Spot-check N random records against the source. Report the reconciliation table.
6. **Privacy:** do not paste real PII into chat/logs; sample with redaction. Keep raw source files out of git (gitignore the `migration/data/` dir).

Output: profile summary, mapping, dry-run reject report, load + reconciliation counts, spot-check results, leftovers. Next: `/qa` (verify a migrated user's access view) → review → `/ship`.
