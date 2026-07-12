# Context Pack + Master Plan — Cross-Vendor Orchestration Doc

> This file is the **single cross-vendor interface**. Fable (Claude) and Sol (Codex) both plan from it; the Terra executor implements from it. Nothing implicit crosses the boundary — every requirement is stated here.

## Context Pack (Opus-assembled — Claude-only knowledge serialized)

**Objective:** Create a repo-tracked doc `docs/architecture/CROSS_VENDOR_ORCHESTRATION.md` that records the agreed Opus/Fable/Sol/Terra orchestration doctrine so it survives outside chat and the global `~/.claude/CLAUDE.md`.

**Why it exists:** This session agreed a two-phase cross-vendor pipeline (co-plan → execute → verify). It's saved as auto-memory (`gpt-5-6-prompting-official.md`) and a rule (`.claude/rules/gpt-5-6-prompting.md`), but there is no repo-tracked architecture doc a teammate could read.

**Repo facts the Codex executor CANNOT discover on its own:**
- File-organization rule (`.claude/rules/file-organization.md`): architecture docs MUST live in `docs/architecture/`; naming = `SCREAMING_SNAKE.md`. Never create docs in repo root.
- Doctrine content is authoritative as agreed this session (see "Doctrine to capture" below) — do NOT invent new rules.
- Codex cannot commit in CircleTel worktrees (known limitation) — so VERIFY + commit are Opus-owned. The doc must state this.
- Reasoning efforts (API): low/medium/high/xhigh/max. Codex CLI adds `ultra` for Sol/Terra. Model tiers: Sol (frontier), Terra (balanced), Luna (fast/cheap).
- Cross-references: `.claude/rules/gpt-5-6-prompting.md`, memory `gpt-5-6-prompting-official.md`.

**Doctrine to capture (verbatim intent — do not alter):**
- PLAN (Opus owns): classify fast-path vs full-pipeline; build Context Pack; Fable + Sol Extra-High draft independent plans from the same pack; ≤2 critique rounds; Opus adjudicates and publishes one versioned Master Plan; completeness gate (every task traces to evidence).
- EXECUTE (Sol-High or Terra-High owns): Opus routes once; executor implements authorized scope only; may not silently alter architecture/security/schema/acceptance; missing context → return to Opus.
- VERIFY (non-executing Opus owns): inspect diff, check CircleTel constraints with Claude tooling, run verification matrix; executor results are evidence not certification; independent adversarial pass on high-blast-radius work; Opus commits.
- Routing: fast-path (≤3 files, reversible, no auth/payment/schema/security); Terra-High (bounded, precisely specified); Sol-High (cross-cutting/reasoning-heavy); Full Fable+Sol-Extra-High plan (ambiguity, expensive failure, architecture, multi-subsystem, security, >½ day).
- Residual risk: context-pack omission → mandatory Opus completeness gate.

**Constraints:** New file only. No code changes. No build impact. Match existing `docs/architecture/` doc style (markdown, tables ok).

## Success criteria (acceptance matrix)
- [ ] File exists at `docs/architecture/CROSS_VENDOR_ORCHESTRATION.md` (correct dir per file-org rule).
- [ ] Contains all three phases (PLAN/EXECUTE/VERIFY) with the owner named for each.
- [ ] Contains the 4-row routing table.
- [ ] States the "Codex can't commit → Opus verifies+commits" constraint.
- [ ] States the context-pack-omission residual risk + completeness-gate mitigation.
- [ ] Cross-links `.claude/rules/gpt-5-6-prompting.md`.
- [ ] No new rules invented beyond the doctrine above; markdown renders (headings/tables well-formed).

## Master Plan (Opus-adjudicated)

**Co-plan inputs:** Fable returned a 9-section outline mapping all 7 acceptance checkboxes (gaps: none). Sol timed out at 400s (Codex cold-start) — proceeded on Fable's plan + Opus review per the degradation rule.

**Adjudication delta:** merge Fable's separate "Model Tiers & Reasoning Levels" into Overview (keep doc lean). Final section list is authoritative:

**Final H2 section list for `docs/architecture/CROSS_VENDOR_ORCHESTRATION.md`:**
1. `## Overview` — what/why + when to use it + a small Model Tiers & Reasoning Levels table (Sol/Terra/Luna; low→max, +ultra in Codex CLI). [covers crit 7]
2. `## PLAN Phase (Opus owns)` — classify, Context Pack, Fable+Sol co-plan, ≤2 rounds, adjudicate, completeness gate. [crit 2]
3. `## EXECUTE Phase (Sol-High or Terra-High owns)` — route once, authorized scope only, return-to-Opus on missing context. [crit 2]
4. `## VERIFY Phase (Opus owns)` — diff inspection, verification matrix, adversarial pass, evidence≠certification. [crit 2]
5. `## Routing Decision Matrix` — 4-row table: fast-path / Terra-High / Sol-High / Full co-plan. [crit 3]
6. `## Codex Execution Constraint` — Codex can't commit in worktrees → Opus verifies + commits. [crit 4]
7. `## Residual Risk & Completeness Gate` — context-pack omission + mitigation. [crit 5]
8. `## Cross-References` — link `.claude/rules/gpt-5-6-prompting.md` + memory. [crit 6]

**Execution routing decision:** bounded, fully-specified doc → **Terra-High** (`-m gpt-5.6-terra`), write-capable.
**Verification owner:** Opus (file exists at correct path, all 8 sections present, acceptance matrix satisfied, markdown well-formed). Opus commits; Terra does not.
