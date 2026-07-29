# Cross-Vendor Orchestration

## Overview

This document records the agreed cross-vendor orchestration doctrine for work that uses the two-phase pipeline: co-plan, then execute and verify. It is the repo-tracked interface for Fable (Claude), Sol (Codex), Terra, and Opus so that requirements are explicit across the boundary.

Use it to select a routing path, establish the Context Pack, and keep planning, execution, and verification ownership distinct.

| Model | Tier | Reasoning levels |
| --- | --- | --- |
| Sol | Frontier | low, medium, high, xhigh, max; Codex CLI also provides ultra |
| Terra | Balanced | low, medium, high, xhigh, max; Codex CLI also provides ultra |
| Luna | Fast/cheap | low, medium, high, xhigh, max (no ultra) |

## PLAN Phase (Opus owns)

Opus classifies the work as a fast-path or full-pipeline request and builds the Context Pack. Fable and Sol at Extra-High independently draft plans from that same pack. They may complete at most two critique rounds. Opus adjudicates the result and publishes one versioned Master Plan.

Before publishing, Opus applies a completeness gate: every task must trace to evidence.

## EXECUTE Phase (Sol-High or Terra-High owns)

Opus routes the work once. The selected executor, Sol-High or Terra-High, implements only the authorized scope. It may not silently alter architecture, security, schema, or acceptance criteria. If required context is missing, the executor returns the work to Opus.

## VERIFY Phase (Opus owns)

A non-executing Opus inspects the diff, checks CircleTel constraints with Claude tooling, and runs the verification matrix. Executor results are evidence, not certification. High-blast-radius work receives an independent adversarial pass. Opus owns the commit.

## Routing Decision Matrix

| Route | Use when | Planning or execution path |
| --- | --- | --- |
| Fast-path | At most three files; reversible; no auth, payment, schema, or security work | Fast-path |
| Terra-High | Bounded and precisely specified | Terra-High execution |
| Sol-High | Cross-cutting or reasoning-heavy | Sol-High execution |
| Full co-plan | Ambiguity, expensive failure, architecture, multiple subsystems, security, or more than half a day | Fable + Sol Extra-High plan |

## Codex Execution Constraint

Codex cannot commit in CircleTel worktrees. Opus verifies and commits; Codex execution does not replace either responsibility.

## Residual Risk & Completeness Gate

The residual risk is a Context Pack omission. Opus mitigates it through the mandatory completeness gate, requiring every task to trace to evidence before the Master Plan is published.

## Cross-References

- [GPT-5.6 prompting rule](../../.claude/rules/gpt-5-6-prompting.md)
- Claude auto-memory (outside repo): `~/.claude/projects/-home-circletel/memory/gpt-5-6-prompting-official.md`
