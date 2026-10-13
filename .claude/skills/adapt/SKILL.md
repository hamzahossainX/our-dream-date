---
name: adapt
description: Adapt the A-Team framework to THIS project's tech stack — detect the stack, fill docs/STACK.md + .claude/stack.json, and confirm the gate commands / DB flow / auth model so every other skill works. Run this FIRST after installing the A-Team into a project, and any time STACK.md still says adapted:false. Use for "adapt", "set up the team", "configure for this stack", "install the a-team here".
---

# /adapt — Bind the Framework to This Stack

The A-Team is stack-agnostic; this skill is what makes it work *here*. It writes the **architecture memory map** (`docs/STACK.md`) and the machine contract (`.claude/stack.json`) that every other skill reads instead of scanning the repo. **Run this first.** Nothing downstream is reliable until `stack.json` says `adapted: true`.

**Truth only:** every version/command quoted from a real manifest or a script that actually exists. Never read `node_modules`, build output, or `.env*` values (names only).

## Procedure
0. **Bootstrap project-local files if missing (plugin mode).** In installer mode everything is already in the project. If installed as a *plugin*, the project may not yet have the framework's project-local files — ensure they exist by copying from the plugin root (`${CLAUDE_PLUGIN_ROOT}`): `.claude/scripts/*`, `.claude/hooks/post-edit.sh`, `.claude/settings.json`, `.claude/stack.json`, the `docs/_seed/*` templates, `docs/STACK.md`, `docs/CONTEXT_PROTOCOL.md`, `docs/WORKFLOW.md`, `docs/SESSION_PROTOCOL.md`, and `CLAUDE.md`. Never overwrite a file that already exists — only fill gaps. (Every skill assumes these live at project-local paths like `.claude/scripts/…`, so both install modes converge here.)
1. **Detect (cheap, read-only):** run `node .claude/scripts/detect-stack.mjs`. It writes a best-guess `.claude/stack.json` and prints what it found + any `⚠ low-confidence` fields. This is the sensor, not the verdict.
2. **Verify the guess against reality** — read only what confirms it:
   - `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml` for real scripts + pinned versions.
   - Confirm each **gate command actually runs** something (a `lint`/`typecheck`/`test`/`build` script or a real tool). If a gate is missing, decide with the user: is there no such gate (fine — mark it `null`), or does it need wiring?
   - Confirm the **DB kind + schema-change flow + auth model** (RLS vs app-layer). This drives `/db` and `/security-review` — get it right.
   - Confirm the **scan roots** (the reuse surface) and the **client-reachable globs + secret patterns** the post-edit hook will guard.
3. **Batch open questions ONCE** (`AskUserQuestion`) — only genuinely ambiguous, high-impact items: an unclear gate, the auth model when detection was unsure, the deploy target, whether there's a UI (design lane on/off). Take documented defaults for the rest and note them.
4. **Write the maps:**
   - Fill **`docs/STACK.md`** §1–§8 with confirmed values (this is what agents read — make it accurate and terse).
   - Set `.claude/stack.json` `adapted: true`, `adaptedAt: <UTC date>`, corrected `gates`, `db`, `scanRoots`, `secretPatterns`, `clientReachableGlobs`, `formatter`. Clear `_confidence` for fields you verified.
   - Fill the **stack line** in `CLAUDE.md` context only if a placeholder remains; otherwise leave CLAUDE.md law as-is.
5. **Seed missing state docs:** for any `docs/` file absent, copy the seed from `docs/_seed/` (or write a minimal `<!-- draft: auto-created -->` version). Do NOT invent domain policy — leave `[CONFIRM]` markers and route them to `CLIENT_QUESTIONS.md`.
6. **Prime the reuse brain:** run `node .claude/scripts/gen-inventory.mjs` so `docs/INVENTORY.md` reflects existing code.
7. **Smoke-test the binding:** run the detected gate chain once (or `.claude/scripts/worktree.sh gates`) to confirm the commands are real and the baseline is green (or record the red baseline as ticket #0). If not a git repo yet, say so — worktree/waves need `git init`.
8. **Name the checkpoint memory:** tell the user the one-line convention — a single `.claude` memory `<project>-build-state` updated at every change (CLAUDE.md §Memory). Create it now with the current state.

## Output
A short adaptation report: detected stack table, the exact gate commands bound, DB + auth model, scan roots, what was low-confidence + how it was resolved, seeded docs, inventory count, gate smoke-test result. End with: `✅ Adapted. Next: /onboard (map an existing codebase) or /kickoff (scaffold a new one) or /plan <first feature>.`

## When to re-run
- Right after installing the A-Team into any project.
- Whenever `stack.json` says `adapted: false`.
- After a stack change, prefer **`/stack-change`** (it diffs + logs a DECISIONS entry) over a blind re-adapt.
