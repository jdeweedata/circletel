# GPT-5.6 Prompting (Sol / Terra / Luna)

**Trigger**: Writing or auditing any prompt, tool description, agent instruction, or task-dispatch text aimed at a GPT-5.6 model (Codex default is now `gpt-5.6-sol`); migrating an older prompt to 5.6.
**Source**: OpenAI official — https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6 (captured 2026-07-12)

---

## Core shift

GPT-5.6 works best when the prompt defines the **outcome, key constraints, available evidence, and completion bar**, then leaves the model to pick an efficient path. Longer procedural prompts can now *hurt*.

In OpenAI internal coding-agent eval runs, leaner system prompts improved scores **~10–15%** while cutting tokens **41–66%** and cost **33–67%**. OpenAI calls these **directional** — validate on your own tasks; do not quote as hard guarantees.

## The 8-block prompt structure (official)

```
Role:             function and context
Personality:      tone + collaboration style (keep short)
Goal:             user-visible outcome
Success criteria: what must be true before the final answer
Constraints:      policy, safety, business, evidence, side-effect limits
Tools:            which to use, when, and what NOT to use
Output:           sections, length, format, tone
Stop rules:       when to retry, fallback, abstain, ask, or stop
```
Keep each section short. Add a block only when it changes behavior. Simple tasks may need only Goal + Constraints + Output.

## Rules that matter most

1. **Simplify first.** Remove ONE group of instructions/examples/tools at a time and rerun evals. Trim repeated rules, behavior-neutral examples, process instructions for things the model already does, unrelated tools. Keep outcome, success criteria, stop conditions, safety/evidence/permission constraints, context-dependent tool routing, output shape + validation.
2. **Kill contradictions.** GPT-5 models follow contracts closely — conflicting rules destabilize more than missing detail.
3. **Reserve `ALWAYS/NEVER/must/only`** for true invariants. Use *decision rules* for judgment calls (when to search, ask, use a tool, keep iterating).
4. **Set authority once.** State auto-do vs. ask-first vs. out-of-scope a single time. Repeating "ask first / wait for approval / do not mutate" causes needless approval requests for safe actions.
5. **Separate personality (tone) from collaboration style (when it asks/assumes/checks).** Replace vague "friendly/empathetic" with concrete writing choices.
6. **Concise by default.** 5.6 is terser than 5.5 — old "be concise" instructions may now over-trim. Prefer `text.verbosity` (`low/medium/high`) for the default; prompt for task-specific length.
7. **Define evidence + stopping conditions.** What needs citations, what counts as enough, what to do when evidence is missing (absence ≠ a factual "no"). Add an explicit stop rule or a simple request becomes a research expedition.
8. **Require named validation, not "double-check."** Give validation tools and name the checks (targeted tests, type/lint, build, smoke test; render-and-inspect for visuals).
9. **Fix the prompt before raising reasoning effort.** `max` reasoning cannot infer a success criterion you never wrote. Baseline at current effort, test one level lower too.

## Reasoning effort (API)

`low / medium / high / xhigh / max`. `medium` = balanced start; `high/xhigh` only when evals show a gain; `max` reserved for hardest quality-first work (never a global default).
Note: Codex CLI exposes an extra **`ultra`** tier for Sol/Terra — a Codex/product setting, not in the API prompting doc.

## Model tiers (from the model guide, not the prompting page)

- **Sol** — frontier; high-stakes coding/research/design.
- **Terra** — balanced daily driver for repeatable workflows.
- **Luna** — fastest/cheapest; high-volume, format-predictable work.
Pick by task economics, not "always biggest."

## Migration workflow

1. Switch model, **preserve current reasoning effort**.
2. Run representative evals *before* touching the prompt.
3. Remove obsolete scaffolding, repeated instructions, irrelevant tools.
4. Add only the smallest instruction that fixes a *measured* regression.
5. Re-run evals after each single change (never rewrite the whole stack at once).

## Programmatic Tool Calling (PTC)

Only for bounded reduction (filter/join/rank/dedup/aggregate → compact schema). Prefer **direct calls** when one call suffices, outputs are small, each result changes the next decision, approval is needed, citations must survive, or semantic judgment is required between calls. "Multiple/parallel/dependent calls alone do not justify PTC."

## Caveat on secondhand summaries

Popular thread versions of this guide merge in launch-post material (1.05M context, Ultra=4 agents, GPT-Live, ChatGPT Work) and rename the 8 blocks to a "5+1 stack." Anchor on the official page above.
