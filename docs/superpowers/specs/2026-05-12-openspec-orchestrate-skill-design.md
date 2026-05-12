# OpenSpec Orchestrate Skill Design

**Date:** 2026-05-12
**Status:** Approved
**Location:** `~/.claude/skills/openspec-orchestrate/SKILL.md` (global)

## Purpose

A standalone orchestrated execution engine for OpenSpec changes. Replaces `/opsx:apply` with a multi-model workflow: Opus reads specs and plans execution, then routes each task to DeepSeek (cheap/fast) or handles it directly (architecture, security, integration) based on complexity auto-classification.

## Invocation

```
/openspec-orchestrate                     # auto-select active change
/openspec-orchestrate fix-netcash-notify   # specify change by name
```

**Prerequisites:** OpenSpec change must exist with at least a `tasks.md` artifact. Create specs first with `/opsx:propose`.

## Architecture

```
OpenSpec Artifacts (proposal.md, design.md, tasks.md)
        │
        ▼
┌─────────────────────────┐
│  Phase 1: Load Context  │  ← openspec CLI reads artifacts
│  (Opus)                 │
└────────┬────────────────┘
         ▼
┌─────────────────────────┐
│  Phase 2: Route Tasks   │  ← Opus classifies each task → routing table
│  (Opus)                 │
└────────┬────────────────┘
         ▼
┌─────────────────────────────────────────┐
│  Phase 3: Execute                       │
│  ┌───────────┐  ┌────────────────────┐  │
│  │ Opus      │  │ DeepSeek           │  │
│  │ (critical)│  │ flash/pro/max      │  │
│  │           │  │ (parallel where    │  │
│  │           │  │  independent)      │  │
│  └───────────┘  └────────────────────┘  │
└────────┬────────────────────────────────┘
         ▼
┌─────────────────────────┐
│  Phase 4: Review &      │  ← Opus validates all DeepSeek output
│  Integrate (Opus)       │
└────────┬────────────────┘
         ▼
┌─────────────────────────┐
│  Phase 5: Report        │  ← Execution log, cost summary, progress
└─────────────────────────┘
```

## Phase Details

### Phase 1: Load Context

1. Select change (auto, inferred, or user-specified)
2. Run `openspec status --change "<name>" --json` and `openspec instructions apply --change "<name>" --json`
3. Read all context files (proposal, design, tasks, specs)
4. Abort if blocked (missing artifacts)

### Phase 2: Route Tasks (Opus)

Opus reads every task from tasks.md and classifies into 4 execution lanes:

| Lane | Model | Flag | When |
|------|-------|------|------|
| Boilerplate | DeepSeek | `--flash` | CRUD, schemas, templates, simple components |
| Standard | DeepSeek | `--pro` | Algorithms, refactoring, standard features |
| Complex | DeepSeek | `--max` | State machines, optimization, tricky logic |
| Critical | Opus | direct | Auth, payments, security, integration glue, architectural decisions |

Displays routing table for transparency (no approval gate). Groups independent tasks for parallel execution.

### Phase 3: Execute (Mixed)

- **DeepSeek tasks**: Dispatched via `bun deepseek_executor.ts` with crafted prompts including spec context. Independent tasks run in parallel via `deepseek_parallel.ts`.
- **Opus tasks**: Handled directly inline.
- Progress shown: `[3/7] DeepSeek PRO: Create validation service... done`

### Phase 4: Review & Integrate (Opus)

- Reviews every DeepSeek output for correctness, security, style
- Fixes issues inline, noting what was changed
- Writes final code to codebase
- Marks each task complete in tasks.md

### Phase 5: Report

- Execution log table (task, model, status, fixes applied)
- Cost summary (estimated token usage per model tier)
- Progress: `7/7 tasks complete`
- Suggests `/opsx:archive` if all done

## Prompt Engineering for DeepSeek

Each DeepSeek prompt includes:

1. **Task description** from tasks.md
2. **Relevant design context** (specific section from design.md, not the whole file)
3. **Existing code patterns** (~50 lines surrounding code from target files)
4. **Constraints** (framework, naming, imports)
5. **Output format** (complete code only, no placeholders)

Parallel batching rule: Tasks targeting different files with no data dependencies batch together. Same-file tasks run sequentially.

## Error Handling

- DeepSeek failure → Opus retries once with more specific prompt → if retry fails, Opus implements directly
- Ambiguous task → pause, ask user
- Design issue discovered → pause, suggest artifact update
- Scope violation → Opus strips out-of-scope changes from DeepSeek output

## Interruptibility

- User can interrupt between tasks
- Progress persisted in tasks.md checkboxes
- Re-invoking picks up where it left off

## Relationship to Existing Skills

- **Does NOT call** `/opsx:apply` — standalone replacement for the execution phase
- **Reads** OpenSpec artifacts via `openspec` CLI (same as `/opsx:apply`)
- **Compatible with** `/opsx:propose` (create specs first, then orchestrate execution)
- **Compatible with** `/opsx:archive` (archive after completion)

## Design Decisions

1. **Approach A chosen**: Spec-first development accelerator (not a unified end-to-end command)
2. **Standalone**: Does not wrap existing skills; reads artifacts directly
3. **Auto-routing**: Complexity-based classification with transparent table, no approval gate
4. **Global skill**: Lives at `~/.claude/skills/openspec-orchestrate/` for cross-project use
