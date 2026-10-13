# SESSION_PROTOCOL.md — Context & Session Economy

> How to start, run, and hand off a working session so the context window stays useful and tokens aren't wasted. **Resume law:** every session must be resumable *cold* from files — nothing important lives only in chat. Owned/executed by `/system-architect`; `/team` is the read-only resume view. See `docs/CONTEXT_PROTOCOL.md` for the per-role load budgets.

## §1 — The one rule
State lives in files (`docs/*`, `ROADMAP`, `LOG`, `DECISIONS`, `.claude` memory) — **never only in the conversation.** If it isn't written down, it didn't happen. A fresh session + `/team` must reconstruct exactly where we are. This is what makes a cheap restart possible.

## §2 — When to start a fresh session
Start a new session when ANY of these is true:
- Context feels heavy, responses slow, or you've completed ~3 tickets / a large multi-agent workflow.
- You're switching to an unrelated task (different app, different subsystem).
- A long document, schema, or transcript was just read in full — it's now ballast.
- A big workflow just finished and its result is already saved to files.

Resuming mid-task is expected and safe — the close ritual (§4) makes the next session cheap.

## §3 — Open ritual (cheap resume — the 3 maps)
1. The memory index loads automatically — read only the memory files relevant to today's task.
2. Read the **3 maps** (`docs/STACK.md`, `docs/INVENTORY.md`, the checkpoint memory), then `/team` for board state — **not** all of `docs/`, and never source "just in case".
3. Pull the one ticket / one goal into focus.

## §4 — Close / handoff ritual (before ending a session)
`/system-architect` writes, centrally (so parallel workers never conflict on docs):
- `LOG.md` — what shipped or changed.
- `ROADMAP.md` — tick boxes + commit refs; park blocked items as `[BLOCKED: Q##]`.
- `DECISIONS.md` — any non-obvious choice + why.
- `.claude` memory — the ONE checkpoint memory, updated in place (current state · next action · how-to-resume).
- Regenerate `docs/INVENTORY.md`.
- A one-line **next action** so the following session starts already in motion.

## §5 — Token economy during a session
- **Read the map, not the repo** — `docs/STACK.md` has the stack/commands; don't re-derive them by grepping (CONTEXT_PROTOCOL §2).
- **Delegate heavy reading** to subagents; consume their *structured* return, not raw dumps.
- **Never re-read a file you just wrote.**
- **Read the slice, not the whole** — offset/limit or the one section you need.
- **Large outputs persist to disk** — read once, extract, move on.
- **Batch decisions** — one `AskUserQuestion` round beats back-and-forth.
- **Keep the orchestrator thin** — it routes and integrates; workers hold heavy context. Never fan out a swarm (default cap 5 agents; more requires approval).

## §6 — Who owns what
- `/system-architect` — runs the session, owns all doc/memory writes, performs §4 at close.
- `/team` — read-only resume dashboard.
- **Split of record:** memory = *why / who / preferences / direction*; `docs/` = *what / law / history*; `STACK.md` = *the stack map*; `INVENTORY.md` = *what already exists to reuse*; code comments = *local intent*.
