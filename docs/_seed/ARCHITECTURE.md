# ARCHITECTURE.md — Topology & Boundaries

<!-- draft: auto-created. Fill during /adapt or /onboard. -->

## §1 — Topology
_<single app | monorepo with these apps/units; how they relate; deploy shape>_

## §2 — The reuse surface (units)
_<mirror docs/STACK.md §4: each shared unit + its responsibility. Rule: shared logic in a shared unit, never app→app import.>_

## §3 — Identity & roles
_<how users authenticate; the role model; per-app guards>_

## §4 — Authorization model
_<RLS or app-layer (per STACK.md §5); where it's enforced; how it's tested (as another user)>_

## §5 — Storage & external services
_<DB, file storage/CDN, notifications, payments — which unit wraps each>_

## §6 — Deploy
_<target, preview flow, production promote flow>_
