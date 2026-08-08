# RESUME — exact next steps

Phase: **baseline trials run for idea-validator only. Three skills have frozen
contracts + audited benchmarks but no trials yet.**

## Status per skill
| skill | contract | benchmark | trials | verdict |
|---|---|---|---|---|
| idea-validator | frozen v1 | v2 audited+repaired | B vs C on 3 iteration tasks, 6 blind judge runs | no-skill 2, original 1 — **not retirable**, needs a candidate |
| claude-md-guardian | frozen v1 | v2 audited+repaired | none | — |
| promotional-campaigns | frozen v1 | v2 audited+repaired | none | — |
| brand-design | frozen v1 | v2 audited+repaired | none | — |

## The idea-validator result, and what it means for the next step
Both judge orderings agreed on all three tasks, so there is no position bias.
- Bare Opus 5 won the two ordinary tasks: it grounded claims in named alternatives
  with prices and labelled them as recalled-not-verified.
- The original skill won the emotionally-loaded task, where the hard part is
  refusing to reassure someone who has already spent money.
So the skill is carrying real value on candour under pressure, and losing on
grounding discipline. A candidate should keep the first and fix the second.
Do NOT retire it on this evidence.

## Next steps, in order
1. Builder for idea-validator: give it the frozen contract, the ITERATION tasks only,
   and the blind judge feedback above. Never the held-out set or its packets.
   Target: keep candour-under-pressure, add the labelled-recall grounding discipline.
2. Run condition D on the same 3 iteration tasks; judge D vs C and D vs B, blind and
   counterbalanced. Then add condition A (sonnet-5 + original) for the prior-gen baseline.
3. Raise samples per cell from 1 to 3 before calling anything green — current margins
   are directional only.
4. Repeat 1-3 for the other three skills.
5. Final clean evaluation on the sealed held-out sets with fresh agents.

## Harness commands that work
Contestant prompt files: regenerate into scratchpad via the inline python in the
trials section of the session; payloads already at `trials/payloads/<skill>.original.txt`.
Judge packets: built from `benchmarks/<skill>/iteration.json` + `runs/<skill>/<task>.<cond>.r1/output.md`,
with the condition mapping recorded in `runs/<skill>/judge_key.json` (lead-only).

## Hard invariants
- Builders never see `heldout.sealed.json`, its packets, or held-out verdicts.
- Judges never see skill files, model identity, condition labels, or prior verdicts.
- `originals/` is never modified (chmod a-w, sha256 manifest).
- Record the exact model id for every run.
- Condition A is claude-sonnet-5, a DECLARED SUBSTITUTE for the unreachable Opus 4.8.
  Never label it Opus 4.8.

## Known infrastructure issue (INC-001/003/004)
Subagents hang intermittently on their FIRST tool call under concurrency. Launch in
batches of ~3. Detect by flat transcript mtime under
/root/.claude/projects/-home-user-circletel/<session>/subagents/ for >5 min, then
TaskStop and relaunch. Roughly 40% of runs needed one retry.
