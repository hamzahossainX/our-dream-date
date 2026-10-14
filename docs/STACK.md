# Fahim stack and run commands

## 1 Identity
Fahim's romantic invitation website for his wife. English. Local application implemented and verified; frontend demo publicly deployed on Vercel2026-10-14 at https://our-dream-date.vercel.app, GitHub hamzahossainX/our-dream-date. Optional hosted Supabase is not configured. Reference is the video in the project folder. Latest interaction: No dodges mouse attempts while Yes stays stationary; keyboard/touch work normally.

## 2 Verified stack
Next.js 16.4.0 App Router, React 19.3.0, TypeScript, npm/package-lock.json, one application package. Supabase JS 2.117.3 and SSR 0.12.7; PostgreSQL, Auth, and owner-scoped RLS. Native CSS semantic variables, SVG envelope art, Lucide icons. ExcelJS 4.4.0 for actual .xlsx exports; compatible nested uuid override11.1.1 resolves the reported audit issue. Production target Vercel. These versions come from package.json and installed packages.

## 3 Gates
1. npm run lint
2. npm run typecheck (next typegen then tsc)
3. npm test (ordinary unit/behavior tests; opt-in real integration skipped)
4. npm run build
5. npm run e2e (real local Supabase integration; loads ignored .env.local and requires running app)

Browser QA uses the supported computer-use browser at375/768/1440 widths. No claim of a hosted deployment. Start with npm run dev at http://127.0.0.1:3000. The app shows an honest design preview if Supabase is not configured.

## 4 Reuse surface
app/ contains pages and route handlers; components/invitation/ is the recipient experience; components/admin/ is the dashboard. lib/contracts.ts is the shared contract, defaults.ts the bootstrap copy, validation.ts the validation schema; lib/server/ holds protected service access/session/Auth operations. lib/export.ts creates safe spreadsheet cells. lib/runaway.ts calculates collision-safe mouse evasion.

## 5 Data and authorization
Migrations live in supabase/migrations. Supabase local CLI configuration is supabase/config.toml. Schema changes use npx supabase migration new NAME; review SQL before applying. Local-only rollback assertions in supabase/tests/security.sql test grants/RLS/RPC behavior. Owner-scoped RLS protects admin data. Server-only elevated operations explicitly verify recipient or admin membership; service-role credentials bypass RLS and never go to client bundles. Shared TS domain contracts currently used rather than generated Supabase database types.

## 6 Configurable policy
Versioned JSON holds copy, themes, question applicability/selection limits, options, date bounds, time slots, timezone, and optional-message length. Historic complete responses contain label snapshots. Drafts remain browser memory. Per-recipient uniqueness and atomic saving enforce one complete response across devices. Deletion retains a completed marker.

## 7 Design
Read DESIGN.md. Screenshot and native-browser review verifies the romantic UI and admin states. Use semantic tokens, visible focus, reduced motion, keyboard access and44px controls. Native SVG assets do not require generated raster images. No fictional wife name/photo: configurable default address my love.

## 8 Services and secrets
Current development stack is local Supabase on127.0.0.1:54321, with local Studio/mail viewer. setup:local prepares a disposable admin and a private link, storing access in ignored .local-access.txt and server configuration in ignored .env.local. Hosted Supabase remains optional; Vercel and GitHub main are connected. Public release has no database environment variables. Environment variable names are in .env.example; never log or commit their values. Private gift links use fragments removed before exchange; legacy token paths have a documented request-log limitation. Nonce script CSP is applied in proxy; root layout dynamically renders; eval only in development.
