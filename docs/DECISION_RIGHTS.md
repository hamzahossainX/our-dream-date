# DECISION_RIGHTS.md — who decides what, with which mind, on which parameters

> The single map of decision authority. If a decision isn't covered here, it defaults UP
> (toward the owner), never down. Companion law: CLAUDE.md, WORKFLOW.md §5, GENESIS gates.

## The matrix

| Decision class | Who DECIDES | Who is CONSULTED (mind tier) | Required parameters (must be weighed & named) | Recorded in | Door |
|---|---|---|---|---|---|
| Product scope / vision (any change after IDEA LOCK) | **Owner** | Orchestrator frames it; `/debate` if contested | 90-day number, the NOT-list, RISKS.md impact | DECISIONS | one-way |
| Stack choice / new dependency | **Owner** (via decision brief) | `architect-reviewer` (top mind); `/debate` if one-way | fit with existing stack, maintenance cost, INVENTORY reuse, 90-day number | DECISIONS | one-way |
| Schema shape | **Owner** approves; `architect-reviewer` gates pre-build | `architect-reviewer` (top mind); `/debate` for money/PII tables | DATA_MODEL.md, RISKS.md, migration cost, authorization impact, typegen | DECISIONS + DATA_MODEL | one-way |
| Auth model / access policy / money logic | **Owner** | `security-reviewer` (top mind) + premortem if present; `/debate` mandatory for money | SECURITY.md threat model, enforcement layer (RLS/server), as-another-user test plan | DECISIONS + SECURITY | one-way |
| UI taste not already in DESIGN.md | **Owner** (options + recommendation) | `design-reviewer` | DESIGN tokens, banned defaults, a11y floor | DESIGN.md addendum | two-way |
| Implementation detail (naming, file layout, reuse-vs-new, local refactor) | **Agent** — decides and LOGS, never pings owner | INVENTORY rubric | reuse search result, unit placement (STACK.md §4) | ticket summary | two-way |
| Sequencing, wave plan, which reviewers run | **Orchestrator** | WORKFLOW §3 tags | file-overlap graph, dependency order, fan-out cap (5) | sprint report | two-way |
| Merge to integration (no push) | **Orchestrator**, only after gates + reviews | — | all §4 gates green, zero unresolved 🔴 | LOG | two-way |
| Prod deploy · `git push` · schema push · data deletion · spending money | **Owner ONLY** — hard stop, no exceptions, no mode overrides | everything above it | full checklist WORKFLOW §6 | LOG + DECISIONS | one-way |
| Waiving a reviewer 🔴 | **Owner ONLY** | the blocking reviewer's finding | the finding itself + accepted risk, in writing | DECISIONS ("waived because…") | varies |
| Installing agents/skills (incl. from the internet) | **Owner**, per GENESIS Phase 3–4 protocol | read-before-activate report | source, full-file read, rejection rules | DECISIONS | two-way |

**Reading the door column:** two-way = agent may proceed on documented defaults when the owner
has said "just decide"; one-way = always a decision brief, and `/debate` when contested,
money-touching, or the owner asks "are we sure?".

## Mind-tier policy (the right mind for the decision)

- **Judgment seats run the top model** — the four reviewer subagents, any premortem/scenario
  agents, and both sides of a `/debate`. A cheaper mind must never gate a one-way door.
- **Mechanical seats run the default model** — scoped builders, inventory generation, formatting.
- A generated agent's tier is declared in its frontmatter (`model:`) and approved by the owner
  in the GENESIS Phase 3 team sheet. Changing a tier is a DECISIONS entry.

## The debate protocol (two independent minds before one-way doors)

`/debate` runs it (see the skill). In short: this session argues its position honestly →
an INDEPENDENT second mind (Codex via `codex-debate.sh`, else a fresh top-model subagent
that gets only the framing file) attacks it and steelmans the best alternative → one
rebuttal round with explicit concede/hold per point → synthesis separating *agreed ground*
(likely safe) from *live disagreement* (the real decision surface) → decision brief to the
owner carrying BOTH positions. Two minds agreeing is evidence; two minds disagreeing is a
flag that the decision genuinely needs the owner. Either way the owner decides — the debate
equips, it never replaces. DECISIONS entry records `debated: yes` + who disagreed on what.

## Enforcement layers (what makes this real, not prose)

1. **Harness permissions** (`.claude/settings.json`): deploys/pushes ASK; force-push and
   `.env` reads DENIED. An agent cannot talk its way past a deny.
2. **Tool frontmatter**: review-only agents carry no Edit/Write.
3. **Path guard** (`.claude/hooks/path-guard.mjs` + `.claude/guard.json`): when enabled,
   edits outside the declared allow-paths are mechanically blocked. The orchestrator arms it
   before scoped-builder waves (e.g. scenario-tester → `tests/` only) and disarms after.
4. **The hook** formats/lints/secret-scans every edit deterministically.
5. Everything else in this file is law-by-instruction — followed by well-behaved agents and
   audited via DECISIONS/LOG. When in doubt whether a rule is enforced or trusted: layers
   1–4 are enforced; the matrix is trusted-and-audited.
