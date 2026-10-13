---
name: debate
description: Two independent minds argue a one-way-door decision BEFORE it's locked — this session's case vs Codex (or a fresh adversarial subagent), one rebuttal round, synthesis, then a decision brief carrying both positions to the owner. Use for "debate", "second opinion", "are we sure about", and mandatorily for money/auth/schema one-way doors per docs/DECISION_RIGHTS.md.
---

# /debate — adversarial decision review

Debate is for **one-way doors** (see `docs/DECISION_RIGHTS.md`). If the decision at hand is
a two-way door or trivia, say so and offer a plain decision brief instead — debating
everything is how good tools become expensive theater.

## 1 · Frame (write it down first)
Write `docs/review-evidence/debate-<slug>.md` containing ONLY neutral framing — no position
yet: the decision in one sentence · why it's one-way · the required parameters for its class
from DECISION_RIGHTS.md, each answered with project facts (from STACK/DATA_MODEL/RISKS/
DOMAIN) · the 2–3 candidate options. This file is the second mind's entire context — keep
it honest and complete; a rigged frame rigs the debate.

## 2 · Position A (this session)
Append to the file: your recommended option, the strongest case for it, and — mandatory —
the three strongest points AGAINST it that you can see. Hiding weaknesses here defeats
the purpose and will be caught in synthesis.

## 3 · Position B (the independent mind)
1. Try Codex: `.claude/scripts/codex-debate.sh --topic "<decision>" --context docs/review-evidence/debate-<slug>.md`
   — returns structured JSON (position · case · strongest objection · AGREE/PARTIAL/DISAGREE
   with Position A). SKIPPED verdict → fall back to:
2. A fresh subagent on the **top model tier**, given ONLY the framing file, briefed as the
   adversary: "Steelman the best alternative to Position A, then attack Position A's weakest
   three points. You win by being right, not by agreeing."

## 4 · Rebuttal (one round, no ping-pong)
Position A responds to B's attacks — each point explicitly **CONCEDE** (B is right, adjust)
or **HOLD** (with the reason). One round only; unresolved points go to synthesis as live
disagreements, not another lap.

## 5 · Synthesis + the owner's brief
Separate three buckets: **agreed ground** (both minds concur — likely safe) · **conceded
points** (position changed — say what changed) · **live disagreement** (the real decision
surface — present BOTH sides at full strength, no false balance and no fake consensus).
Then the standard DECISION BRIEF (options · recommendation · door type · if-we're-wrong),
with the debate file linked as evidence. **The owner decides.** Record in `docs/DECISIONS.md`:
the choice, `debated: yes`, which minds, and what the live disagreement was — that last part
is what future-you audits when the decision is re-examined.

## Rules
- The second mind must be genuinely independent: it never sees chat history, only the frame.
- A Claude↔Codex DISAGREE on a money/auth/schema decision is a **hard stop** — it goes to
  the owner even in autonomous mode (DECISION_RIGHTS matrix, WORKFLOW §5 escalation).
- Never run more than one debate per decision; never debate to overturn an owner's recorded
  choice — that requires the owner reopening it.
