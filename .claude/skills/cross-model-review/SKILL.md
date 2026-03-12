---
name: cross-model-review
description: Use another LLM (Codex, Gemini) to QA plans and implementations before committing
trigger: When starting multi-phase feature work or before merging significant PRs
---

# Cross-Model Review Workflow

Use a second LLM (Codex CLI or Gemini) to review plans and implementations. This catches blind spots that a single model might miss.

## When to Use

- Multi-phase features (3+ phases)
- High-risk changes (auth, payments, database migrations)
- Before merging large PRs (10+ files)
- When you want a "second opinion" on architecture

## 4-Step Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: PLAN                              Claude Code      │
│  ─────────────                             Plan Mode        │
│  Open Claude Code in plan mode (Terminal 1).                │
│  Claude interviews you via AskUserQuestion.                 │
│  Produces a phased plan with test gates.                    │
│                                                             │
│  Output: .claude/plans/{feature-name}.md                    │
│                                                             │
│                          ▼                                  │
│                                                             │
│  STEP 2: QA REVIEW                         Codex/Gemini     │
│  ──────────────────                        Terminal 2       │
│  Open Codex CLI or Gemini in another terminal.              │
│  Prompt: "Review this plan against the actual codebase.     │
│           Insert 'Phase 2.5' if steps are missing.          │
│           Add findings but never rewrite original phases."  │
│                                                             │
│  Output: .claude/plans/{feature-name}.md (with findings)    │
│                                                             │
│                          ▼                                  │
│                                                             │
│  STEP 3: IMPLEMENT                         Claude Code      │
│  ──────────────────                        New Session      │
│  Start fresh Claude Code session (Terminal 1).              │
│  Implement phase-by-phase with test gates at each phase.    │
│                                                             │
│                          ▼                                  │
│                                                             │
│  STEP 4: VERIFY                            Codex/Gemini     │
│  ────────────────                          Terminal 2       │
│  Prompt: "Verify implementation against the plan.           │
│           Flag any deviations or missing requirements."     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Prompts for Codex/Gemini

### Plan Review Prompt
```
Review this implementation plan against the actual codebase:

[paste plan content]

Instructions:
1. Check if referenced files/functions exist
2. Check if the proposed approach matches existing patterns
3. Insert intermediate phases ("Phase 2.5") where steps are missing
4. Add "Codex Finding:" or "Gemini Finding:" headings for issues
5. DO NOT rewrite the original phases - only add to them
```

### Implementation Review Prompt
```
Verify this implementation against the original plan:

PLAN: [paste plan]
IMPLEMENTATION: [paste git diff or file changes]

Check for:
1. Missing requirements from the plan
2. Deviations from the agreed approach
3. Edge cases not handled
4. Tests that should exist but don't
```

## Tips

- **Keep terminals side-by-side**: Claude Code in Terminal 1, Codex/Gemini in Terminal 2
- **Don't over-use**: Simple features don't need cross-model review
- **Trust the findings**: If the second model flags something, investigate it
- **Document findings**: Keep the annotated plan for future reference

## Source

Pattern extracted from [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice)
