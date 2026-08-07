# Gauntlet Protocol — frozen experiment design

Applies identically to every selected skill. Deviations must be recorded in
`state/run_state.json` under `protocol_deviations` with a reason.

## Roles (all mutually blind; every role is a fresh agent run)

| Role | Sees | Never sees |
|---|---|---|
| **Extractor** (x3, independent) | Original SKILL.md + all its resources + evidence of real use | Nothing about the upgrade goal |
| **Contract auditor** (x1) | Original skill + proposed contract | Any candidate, any benchmark |
| **Benchmark designer** (x1) | Frozen contract + neutral capability/boundary description | Original skill's implementation instructions |
| **Benchmark auditor** (x1) | Contract + full benchmark (both splits) | Any candidate skill |
| **Builder** (x1 per iteration) | Contract + iteration-set failures + blind judge feedback | Held-out tasks, held-out packets, held-out verdicts |
| **Contestant** (1 per sample) | Only its task + its assigned skill (or none) | Other contestants, conditions, contract, judges |
| **Judge** (1 per comparison) | Task + evaluation packet + anonymised outputs in randomised order | Skill files, model identity, condition labels, builder reasoning, prior verdicts, lead-agent preference |

No agent shares a conversation, memory, or artifact directory with another.

## Conditions

| # | Label | Model | Skill |
|---|---|---|---|
| A | prior-gen stack | *see BLK-001* | original |
| B | bare frontier | claude-opus-5 | none |
| C | current stack | claude-opus-5 | original |
| D | candidate | claude-opus-5 | candidate v_N |

Condition A as specified requires Opus 4.8, which is **not reachable in this
environment** (see `state/run_state.json.blockers.BLK-001`). It must not be
faked. Resolution is a user decision.

## Sampling

- Every sample = one fresh agent run, one task, one condition.
- 3 independent samples per (task, condition) cell to separate signal from
  lucky draws. Report per-cell win rate, not a single head-to-head.
- Contestant temperature/effort held constant across conditions within a task.

## Judging

- Pairwise, anonymised, randomised presentation order.
- Order is counterbalanced: each pair judged twice with positions swapped, by
  two different judge runs. A pair only counts as decided if both agree;
  disagreement is recorded as a tie and escalated to a third judge.
- Judge model: strongest independent model available that is **not** the
  contestant model for that comparison where possible; otherwise a fresh
  independent run is used and the shared-model caveat is recorded per trial.
- Judge must output: winner, confidence, concrete contract-grounded reason,
  requirements violated, requirements handled especially well.

## Acceptance standard (green)

All of the following, or it is not green:

1. Beats condition A (prior stack) — or the recorded A-substitute — decisively.
2. Beats condition C (Opus 5 + original skill) on the same tasks.
3. Beats condition B (Opus 5, no skill) by a margin that justifies the skill existing.
4. Satisfies every `never_do` and `constraint` in the frozen contract — zero violations.
5. Wins on **fresh, unseen** held-out tasks, not just the iteration set.
6. No important regression on any contract dimension.
7. Margin is repeatable across the 3 samples per cell, not a single win.

**Green — retire** is a valid terminal outcome: if B consistently beats C and D,
the honest result is to retire or disable the skill, with the evidence preserved.

## Anti-gaming rules

- Held-out tasks are never shown to a builder, and never rendered in the dashboard
  before final evaluation.
- Once iteration-set tasks have driven 2 builder revisions, they are replaced with
  freshly generated equivalents to prevent overfitting.
- No tuning to a specific judge's phrasing; judge prompts are fixed per skill.
- No benchmark answers, task text, or judge rubric wording may appear in a candidate skill.
- Verbosity is explicitly listed in every evaluation packet as a non-quality.
