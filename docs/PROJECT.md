# Fahim's invitation

Updated: 2026-10-13 (Asia/Dhaka).

Fahim wants to give his wife a website that opens like a personal love letter and invites her to spend time together. The local WhatsApp video supplies the visual mood and sequence. The owner authorized implementation after reviewing the plan on 2026-10-13.

The first release includes a romantic phone-first invitation, accessible Yes and No paths, date/time choices, configurable activity questions, an optional note, review, and a real saved receipt. Fahim's private dashboard provides secure login, response search/filter/detail/deletion, statistics, CSV/XLSX exports, and supported invitation customization.

Success means his wife can complete one invitation on her phone and Fahim can retrieve the same complete response securely. There is no traffic or revenue target. Duplicate requests and abandoned forms must not create extra responses.

The owner confirmed English. Defaults for local development are recipient display name `my love`, sender `Fahim`, and timezone `Asia/Dhaka`. Names, dates, slots, activities, and wording can be replaced through supported configuration. No personal photo or audio has been supplied.

Out of scope: payments, bookings, public registration, a multi-couple service, subscriptions, chat, automated messages, recipient accounts, incomplete-response tracking, visitor analytics pixels, arbitrary code customization, native apps, and a general page builder.

The requested stack is Next.js, TypeScript, Supabase Postgres/Auth, and Vercel. Package versions and checks are recorded in STACK.md. Environment variable names and setup belong in the implementation README and .env.example; secret values never belong in project documentation.

Live Supabase provisioning, a Vercel production deployment, the owner's admin identity, and repository handover require the actual owner setup. A working local interface and prepared schema do not establish that those external steps have happened.
