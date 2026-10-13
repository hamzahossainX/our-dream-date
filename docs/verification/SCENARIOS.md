# Verification scenarios

The owner authorized implementation and local verification on 2026-10-13. These checks use local fixtures, not personal responses. Production deployment is not established by local results.

Run routine behavior checks with `npm test`. The integration suite is opt-in and skipped by default. For actual database/Auth/API checks, start local Supabase, seed an invitation, create the ignored `.env.local`, and start the Next.js server at `http://127.0.0.1:3000`. Then run:

```sh
RUN_INTEGRATION=1 npx vitest run tests/integration.test.ts
```

The suite consumes `.env.local` in memory without printing secrets. It refuses non-loopback or HTTPS provider/app URLs, creates two unique local Auth users and temporary hashed recipient links, and removes only those users, links, and responses afterward. It does not reset the database. Allow this suite to run alone while checking configuration: the publication scenario changes one label, restores original copy through another versioned publication, and leaves the legitimate immutable version history behind. Do not run it against a personalized or constrained-date local invitation without reviewing the fixture assumptions (default activities and a date seven days ahead).

| Scenario | Meaningful evidence |
| --- | --- |
| Incomplete form and invalid Yes | HTTP 422, zero response rows, no recipient completion marker |
| Concurrent valid Yes and retries | Three successful HTTP requests, one UUID, exactly one row |
| Same link on another device | Private receipt reload and identical-payload retry return original response |
| Changed submitted payload | HTTP 409 and original receipt preserved |
| Complete No | Saved real response with null date/time and optional plain-text note |
| CSRF and forged recipient session | Cross-origin write HTTP 403, forged cookie HTTP 401 |
| Expired/revoked recipient | Open/submission denied, no new response |
| Persistent submit rate limit | Twenty identical retries succeed, next request is HTTP 429, still one committed row |
| Anonymous/outsider API protection | Read, export, config publication, deletion refused |
| Direct Supabase protection | No unauthorized response rows; direct insert, membership escalation, publishing and limiter RPC rejected |
| Admin filters and metrics | Authorized filtered response matches actual fixture ID; totals include actual saved fixtures |
| CSV and Excel safety | Formula-like note prefixed with apostrophe; actual XLSX message cell is a string |
| Config publication and concurrent edits | Version increments, stale form/edit HTTP 409, immutable historic labels retained |
| Admin deletion | Response disappears, repeat deletion 404, completed recipient remains closed with HTTP 410 |
| Admin logout | Server logout clears the session and subsequent private response API returns HTTP 401 |
| Unit admin behavior | Combined filters, UTC submission dates distinct from chosen dates, empty/single/mixed metrics, historical label counts |

## Execution record

2026-10-13: `RUN_INTEGRATION=1 npx vitest run tests/integration.test.ts tests/admin-behavior.test.ts` completed successfully against the running local Supabase provider and seeded Next.js application: **13 tests passed** (9 real HTTP/Auth/database scenarios and 4 admin behavior checks), in 98.09 seconds including cold development compilation. Fixture response/link/Auth-user cleanup completed; original configuration copy was restored with two immutable version increments. No production provider was used. Scoped ESLint passed. Browser visual/accessibility checks belong to the separate root-agent verification.

The final rerun after the loader type correction also passed all 13 tests in 30.38 seconds, and `npx tsc --noEmit` exited 0. Across the two successful runs original copy was restored twice, adding four configuration versions in total. The local open/login rate counters intentionally expire according to the normal policy rather than being globally erased; avoid repeatedly rerunning this suite within one rate-limit window alongside browser invitation opens.

An initial test runner incompatibility (`describe.sequential` unavailable in installed Vitest 5) was fixed by using the runner's default sequential execution. The ExcelJS loader test follows its installed ArrayBuffer API; this avoids a Node Buffer type mismatch while reading the actual export workbook. These were test harness corrections, not product failures.
