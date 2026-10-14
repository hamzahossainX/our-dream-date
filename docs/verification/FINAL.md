# Final local verification — 2026-10-13

The public release is a frontend demonstration for a partner's gift. Real private response management remains an optional Supabase integration. Browser demo replies are local to the device; downloading a reply does not automatically send it to Fahim.

## Automated evidence

- Full local run with `RUN_INTEGRATION=1 npm test`: 49/49 passed across six files. Real local Auth/API/database scenarios covered complete-only writes, concurrency, cross-device retries, expiry/revocation, CSRF, persistent limits, anonymous/unrelated-user access, admin filters/configuration/deletion/logout and safe CSV/XLSX exports.
- After final button portal changes, ordinary unit run: 40 passed, nine opt-in integration scenarios skipped. Backend logic was unchanged by the portal fix.
- Final `npm run lint` and `npm run build` passed; production build includes TypeScript verification and the /demo, /admin/demo and /about routes.
- Rollback-only local SQL security assertions passed earlier against the same migration.
- Runtime dependency audit: zero vulnerabilities at verification time.
- Direct HTTP login with public sample credentials returns401 at the real admin endpoint. The UI uses those samples only to navigate to the isolated demo.
- Git and Vercel ignore environment files, local access details, and the supplied reference video. Staged source is checked against local credential values before publication.

## Native browser evidence

Reviewed invitation widths320,375,768 and1440 and admin phone layout at375. Measured document width never exceeded the tested viewport. Mobile/tablet use shorter or stacked layouts; tables have an intentional internal scroll region. This is breakpoint/browser verification, not a claim to have tested every physical device.

Completed the frontend Yes journey on a phone: calendar date, sunset slot, dinner choice, note, review, final save, same receipt after reload, downloaded text reply, explicit reset. Saved browser-only receipt labels correctly explain storage scope. Keyboard No still opens the decline branch. Mouse attempt moves No from its original slot to another visible viewport position while Yes retains its rectangle. Fixed an actual containing-block bug from the animated welcome wrapper by rendering the floating button directly under the invitation root. Final No measured80×48 atx1340,y20 in a1440×900 viewport; Yes retainedx144.5,y827.17. Reduced-motion CSS disables animation/travel transitions.

Verified login Try demo fills samples, Open demo dashboard opens /admin/demo, navigation/filtering/details work, deletion changes only sandbox samples, reload restores four samples, and settings apply only within the sandbox. Real exports and link creation are disabled there. Admin sign-in and a real test response were verified separately before fixture cleanup. Removed only the disposable browser test user/recipient/response; original local owner and unused gift link remain.

Button contrast calculations: ivory text on rose6.39:1, lavender6.18:1, peach5.62:1; dark No text on blush6.83:1. All exceed4.5:1 for normal-sized labels. Yes hover changes color without moving its position.

Screenshots: [desktop invitation](screenshots/invitation-desktop.jpg), [phone invitation](screenshots/invitation-mobile.jpg), [phone dashboard demo](screenshots/admin-demo-mobile.jpg). The older [real local dashboard](screenshots/admin-dashboard.jpg) contains a clearly labeled disposable QA reply, subsequently deleted.

## Documentation and deferred work

README, setup/deployment guide, About page, schema/RLS migration and template system design DOCX are included. The seven-page DOCX was rendered and visually reviewed; local QA artifacts are ignored. Additional letter/paper/decoration motion requested for later is tracked in T-011. Personal names/availability/photos are still configurable defaults.

## Public release — 2026-10-14

[Live website](https://our-dream-date.vercel.app/) and [public GitHub source](https://github.com/hamzahossainX/our-dream-date) published. Vercel deployment dpl_6eJXhjMUqD3PAtbBuDiNPkEhwAaJ reached READY after a successful hosted Next.js/TypeScript build. The production alias returns HTTP200 without authentication; provider-generated preview URLs may require Vercel authentication. The project is connected to GitHub main. No production environment variables or hosted Supabase were added.

Native browser review of the live production alias verified hydration, keyboard decline, final browser save, same receipt on reload, reset, and Try demo → autofill → Open demo dashboard → four fictional samples. Saved [live invitation](screenshots/live-invitation.jpg) and [live admin demo](screenshots/live-admin-demo.jpg) screenshots. Production headers include HTTPS/HSTS, nonce CSP without unsafe-eval, no-store, no-referrer and frame denial. Ordinary fresh-checkout type checking now generates Next.js route types first; the updated command passed.

 A public demo does not claim hosted Supabase or automatic delivery of real replies.

Git-connected deployment for final manifest/docs commit `ccc7cc2` also reached READY (Vercel deployment `4qwYEfkZUEG27ssKbTGsUXJQH9Xv`); GitHub reports Vercel success. No source code changed during the final release-record update.
