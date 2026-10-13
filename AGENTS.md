# Fahim project instructions

This project uses the downloaded Genesis and A-Team V7 workflow. Read `GENESIS.md`, `CLAUDE.md`, and `.claude/memory/fahim-build-state.md` before project work. Follow Genesis phases and owner gates in order. During Genesis, defer stack selection and `/adapt` until Phase 2. The installed `.claude/skills/` contain the workflow instructions; Claude-specific slash commands and hooks require Claude Code and are not automatically registered in Codex.

## Owner's current scope

Read `plan.txt` for the invitation website for Fahim's wife. On 2026-10-13 the owner explicitly authorized plan review, installation of the needed agents, and building if the plan is sound. The review accepted the scope and development is now authorized. English is confirmed. Use the local video as the visual reference, not Facebook. Build and verify the Next.js/Supabase app locally; production deployment still needs concrete provider access and any applicable release approval. These owner instructions supersede the earlier planning-only restriction and framework defaults.

During active Genesis, resume from the checkpoint before applying ordinary `/team` or `/adapt` defaults. Do not recommend adaptation solely because adapted:false; perform it when there is a concrete approved stack and manifests. Claude-only commands/hooks are not automatically enforced in Codex. Agents use explicitly assigned disjoint write paths in this session.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
