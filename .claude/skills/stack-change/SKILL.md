---
name: stack-change
description: Re-adapt the A-Team when the project's tech stack changes — a new framework, package manager, DB, migration tool, test runner, or deploy target. Re-detects, diffs against the current maps, updates docs/STACK.md + .claude/stack.json, and logs a DECISIONS entry. Use for "we switched to X", "changed the stack", "migrated from Y to Z", "new build tool", "stack change".
---

# /stack-change — Re-bind After a Stack Shift

The maps (`docs/STACK.md` + `.claude/stack.json`) are only useful while they're true. When the stack moves, the whole framework must move with it — otherwise gates run the wrong commands and reviewers check the wrong boundary. This skill re-adapts **surgically** (a diff, not a blind overwrite) and records *why*.

## Procedure
1. **Capture the current map:** read `.claude/stack.json` (the current facts). Note what the user says changed.
2. **Re-detect:** run `node .claude/scripts/detect-stack.mjs` — but it writes over `stack.json`, so first copy the old one aside (`cp .claude/stack.json .claude/stack.prev.json`). Then run it.
3. **Diff old → new** and show the user the deltas that matter: gate commands, package manager, monorepo shape, DB kind / schema flow / auth model, scan roots, deploy target, design system, secret patterns. Detection is a guess — **confirm each changed field** with the user (batch into one `AskUserQuestion` if more than one is uncertain).
4. **Apply, don't clobber:** merge confirmed changes into `stack.json` (keep hand-tuned fields the user set previously unless they actually changed). Update `docs/STACK.md` §2/§3/§4/§5 to match. Bump `adaptedAt`.
5. **Ripple check** — a stack change usually invalidates things:
   - **Gates changed?** run the new chain to confirm it's green; a broken gate command is a hard stop.
   - **DB / migration tool changed?** update `/db`'s flow expectations in STACK.md §5; flag existing migrations that may need porting.
   - **Auth model changed** (e.g. RLS → app-layer)? this is a **security-relevant** change — schedule `/security-review` and note it loudly.
   - **Framework / client boundary changed?** update `clientReachableGlobs` + `secretPatterns` so the post-edit hook still guards the right paths.
   - **Design system changed?** note it for `/design-review`.
6. **Regenerate the reuse brain:** `node .claude/scripts/gen-inventory.mjs` (paths may have moved).
7. **Log it:** append a `docs/DECISIONS.md` entry — *what changed, from→to, why, and what it invalidated* (dated, absolute). This is a non-obvious choice by definition.
8. **Clean up:** remove `.claude/stack.prev.json`. Update the checkpoint memory with the new stack + the exact next action.

## Output
A change report: the old→new diff table, fields confirmed vs auto-applied, ripple actions taken/queued (gates re-run, migrations flagged, security review scheduled), the DECISIONS entry, inventory regenerated. End with the natural next command (often `/security-review` if auth changed, else `/team`).

## Hard stops
Auth-model change without a follow-up `/security-review` · a new gate command that doesn't run green · dropping a DB with real data as part of the switch. Present the decision, wait.
