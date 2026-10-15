# Deploy Our Dream Date through GitHub

Choose between a standalone demonstration and real private replies. Both use **GitHub → Vercel** for this Next.js source. Add hosted Supabase only when Fahim needs to receive replies across devices and use a secure real dashboard. Frontend production release completed on2026-10-14: https://our-dream-date.vercel.app . Public repository: https://github.com/hamzahossainX/our-dream-date . Vercel is connected to main for future deployments. Hosted Supabase is intentionally not configured for this demo.

Recommended repository name: `our-dream-date`. Keep it private while configuring the gift and reviewing personal wording. Repository visibility does not replace database authorization or private recipient links.

## Simplest path: a standalone gift/demo

Create the GitHub repository, push the reviewed source, and import it into Vercel with the Next.js preset and repository root. Use `npm ci` and `npm run build`. No database environment variables are required. Share the deployed `/demo` invitation or `/admin/demo` dashboard sample.

The recipient demo saves the final reply in that browser's local storage. It survives a reload on the same browser, but does not deliver a reply to Fahim or synchronize with the admin demo. Clearing browser storage removes it. Admin demo sample replies have been removed; the dashboard starts empty on every visit. Settings save in browser local storage and survive reload. Personalized links include a snapshot of the saved design for another device; replies stay with the recipient. This mode is appropriate for showing the gift or using it together on one device.

You still need GitHub and Vercel account authorization to publish. No Supabase account, database password, API key, or real admin credentials are needed for demo-only use. The app remains a Next.js deployment with server routes in its source; this handover does not include a separate static-export build.

Use the optional setup below when the partner will open a link remotely and Fahim needs to see the actual answer in his dashboard.

## Why retain a small database?

The standalone demo works without a database. Real shared replies, secure admin login, duplicate protection across devices, customization, and exports need durable writes and authorization even when there is only one recipient.

| Storage choice | Suitable here? |
| --- | --- |
| Committed text/JSON file | Good for default wording and synthetic demo records; changing it requires a source deployment. |
| Browser memory | Good for drafts and the public admin demo; resets when the page reloads. |
| Browser local storage | Used by the standalone recipient demo; available only in that browser and removable by the user. |
| Response text file or SQLite inside a Vercel function | No persistent shared filesystem guarantee; unsuitable for stored replies. |
| Optional hosted Supabase | Recommended for actual shared replies: retains implemented Auth, RLS, transactions, and dashboard. |

Vercel documents that function storage is ephemeral and cannot guarantee a persistent local SQLite file. That applies to response files as well. A server with a managed persistent disk could use file storage, but it would introduce a different hosting and backup setup. [Vercel's SQLite guidance](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel).

GitHub Pages serves static files; this app requires Next.js server routes and authenticated operations. Import the GitHub repository into Vercel rather than enabling Pages for this source. [GitHub Pages scope](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Vercel GitHub integration](https://vercel.com/docs/git/vercel-for-github).

## Optional real service: accounts and credentials

Configure these through the owner's provider accounts when enabling real shared responses. The GitHub/Vercel accounts also apply to demo-only publication. Do not paste credential values into source, README, GitHub issues, or chat.

| Item | Where it belongs | Purpose |
| --- | --- | --- |
| GitHub account and Vercel GitHub authorization | Provider sign-in/integration | Import the source and deploy commits; no GitHub token is needed by the running app. |
| Vercel account/project | Vercel dashboard | Host the application and store production environment settings. |
| Supabase account/project | Supabase dashboard | Persistent database and real Auth service. |
| `NEXT_PUBLIC_SUPABASE_URL` | App environment | Hosted project endpoint. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | App environment | Public client key; data access still relies on grants/RLS and user sessions. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only app environment | Elevated server key for explicitly authorized operations. |
| `INVITATION_SESSION_SECRET` | Server-only app environment | Random signing secret, at least 32 characters; use the same value across instances. |
| `INVITATION_ID` | App environment | One stable UUID matching the configured invitation. |
| `APP_URL` | App environment | Exact public HTTPS origin, without a page path. |
| `ADMIN_USER_ID` | Bootstrap environment only | UUID of an existing Supabase Auth admin; not the email or password. |
| Real admin email/password | Supabase Auth and owner's password manager | Private real dashboard login. Never use public demo values. |
| Supabase CLI sign-in/database password | Trusted setup machine when prompted | Link the project and apply migrations; not browser code. |
| Private recipient link | Shared privately with the intended recipient | One completed reply; anyone holding it can use it. |

Supabase recommends publishable and secret keys for new projects. The current server environment name `SUPABASE_SERVICE_ROLE_KEY` can contain the project's server secret key; it must remain server-only. Legacy local `anon`/`service_role` keys are also supported by this app. Elevated keys bypass RLS, so server authorization remains necessary. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

The public demo credentials are display samples. They route to `/admin/demo` and do not identify a real Supabase account. The demo starts with no responses. Setting edits persist in browser local storage after saving. View saved invitation opens a preview without changing a completed reply. Personalized links carry the saved configuration in the URL fragment; treat their wording as visible to anyone receiving the link. Further edits need a newly generated link. Exports and creating server-backed private links require real admin access.

## 1. Prepare the source

Run the README verification commands and review the final invitation wording. Confirm `.env.local`, `.local-access.txt`, `.vercel`, the reference video, and private exports are excluded from staged files. Commit the source, lockfile, migrations, and documentation.

Create an empty GitHub repository named `our-dream-date` under the owner's account, then connect and push the local branch using the exact remote URL GitHub provides. Do not commit local access details. A GitHub import is sufficient for deployment; a custom GitHub Actions pipeline is optional.

## 2. Prepare hosted Supabase

1. Create the production project and securely retain its account/database access. Review provider plan limits and backup options in the account dashboard before launch.
2. Review `supabase/migrations/202610130001_invitation.sql`. Sign in and link the exact hosted project:

   ```sh
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push --dry-run
   npx supabase db push
   ```

   Confirm the target and migration before the final command. Never use `db reset` on hosted data.
3. Disable public signup for this private application. Create Fahim's Auth user, configure a strong password, and confirm the account as appropriate. Copy its UUID for bootstrap.
4. On a trusted setup machine, populate a protected environment file with the hosted settings from `.env.example`, including the existing Auth user UUID. Do not reuse the disposable local owner or local `.local-access.txt` credentials.
5. Run `npm run bootstrap`. It creates the invitation, initial configuration snapshot, admin membership, and a private link. Existing invitation settings are preserved. The link prints to the local terminal: store it privately. Each rerun creates another link.

If testing a hosted configuration locally, set `APP_URL` to the exact local origin while testing. Before generating the final gift link, restore the final production origin. Database bootstrap and application environment must use the same invitation UUID.

## 3. Import GitHub into Vercel

1. Sign in to Vercel and choose **Add New Project**, then import `our-dream-date` through the GitHub integration.
2. Use the **Next.js** framework preset and repository root directory. Keep the lockfile; installation uses `npm ci` and the build uses `npm run build`. Select a supported Node.js 22-or-newer runtime compatible with the local setup.
3. Add the runtime variables from the table to the Production environment. `ADMIN_USER_ID` is needed only by the local bootstrap script. Environment changes require a new deployment to take effect. [Vercel environment variables](https://vercel.com/docs/environment-variables).
4. Set `APP_URL` to the exact assigned HTTPS domain. If the domain is determined after the first deployment, update the variable and redeploy before testing real sessions or creating the final link.
5. In Supabase Auth, set the Site URL to that origin and allow its exact `/auth/callback` recovery redirect. Use the same browser for the password-recovery request and PKCE callback. Configure production email delivery if password-recovery emails are required.
6. Choose the intended production branch explicitly. Later commits and pull requests can trigger deployments through Vercel's Git integration. Use an isolated test Supabase project for preview deployments with real saves; `/demo` works without database settings. Each configured preview needs its own exact `APP_URL` and permitted recovery redirect. [Vercel deployments](https://vercel.com/docs/deployments/overview).

## 4. Verify and release

Open the real HTTPS website on phone and desktop. Use a separate test invitation, not the gift link, to verify a completed reply, refresh/retry behavior, real admin login, response filters, exports, customization, and logout. Check an anonymous and an unrelated Auth user cannot access real responses. Confirm the public demo never exposes real data or calls real admin endpoints.

Review final recipient wording and date/time configuration, then create the final private link from the authenticated dashboard and share it privately. An empty successful dashboard is expected before a real reply. Only the saved confirmation proves a submission reached the database.

Keep a private export/backup strategy appropriate to the provider plan. For future schema changes, create and review a migration, verify it on an isolated database, and coordinate deployment with the code that uses it. Reverting a Vercel deployment does not revert the database or restore deleted responses. Apply reviewed forward fixes rather than resetting production.

Public release remains pending until provider access, the selected mode's configuration, verification, and the owner's applicable release approval are complete.
