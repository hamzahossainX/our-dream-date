# .claude/scripts — A-Team v7 tooling

The skills call these. All are **stack-agnostic** (they read `.claude/stack.json`) and safe to run before the repo is scaffolded — they degrade gracefully.

| Script | What it does | Reads |
|---|---|---|
| `detect-stack.mjs` | **The adapt sensor.** Read-only probe of manifests → writes a best-guess `.claude/stack.json`. `/adapt` reviews the guess with the human. `node .claude/scripts/detect-stack.mjs` | manifests |
| `gen-inventory.mjs` | **Reuse brain (CONTEXT_PROTOCOL §3).** Scans the scan roots for exported symbols + `@purpose` comments → writes `docs/INVENTORY.md`. Run before every fan-out and at close. | `.claude/stack.json` `scanRoots` |
| `worktree.sh` | **Waves + merge protocol.** `new`/`clean` isolated worktrees per ticket; `integrate` builds an integration branch, merges shared-first, re-runs the gate chain after EACH merge, never auto-pushes. | `.claude/stack.json` `gates`, `gateFilterFlag` |
| `codex-review.sh` | **Codex seam (WORKFLOW §5).** Runs OpenAI Codex (via the ChatGPT plan) as a 2nd reviewer on a diff; structured verdict for dual-review with `code-reviewer`. On rate-limit, queues to `docs/CODEX_QUEUE.md` and falls back to Claude. Dormant until `codex` is installed + signed in. | git diff |

State files they read/write: `.claude/stack.json` (the machine contract), `docs/STACK.md` (the human map), `docs/INVENTORY.md` (generated), `docs/CODEX_QUEUE.md` (Codex catch-up queue).

The Codex *connection* is the only piece needing a user action (install + ChatGPT sign-in). Everything else activates automatically once `/adapt` has run and (for waves) `git init` exists.
