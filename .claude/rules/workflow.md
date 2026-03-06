Rule: workflow
Loaded by: CLAUDE.md
Scope: Superpowers-gated workflow pipeline, blast radius minimization, confirm-before-implement

---

## Superpowers Pipeline (MANDATORY)

Every task flows through 6 stages. Each stage has a mandatory skill gate — you MUST invoke the skill via the `Skill` tool before proceeding. Skipping a gate is a rule violation equivalent to writing placeholder code.

```
START → PLAN → IMPLEMENT → VERIFY → SHIP → LEARN
  |       |        |          |        |       |
  v       v        v          v        v       v
 brainstorming  writing-plans  TDD    verification  finishing-branch  compound
 debugging      executing-plans  parallel-agents  code-review
```

### Stage 1: START — Understand & Design

**Before ANY work begins:**

1. Read all relevant files
2. **INVOKE `superpowers:brainstorming`** for new features/pages/components
3. **INVOKE `superpowers:systematic-debugging`** for bugs/errors/failures
4. Explain approach and wait for confirmation

### Stage 2: PLAN — Break Down the Work

**Before writing code:**

1. **INVOKE `superpowers:writing-plans`** for multi-step tasks (2+ files or stages)
2. **INVOKE `superpowers:executing-plans`** when a written plan exists
3. Build todo list with affected files

### Stage 3: IMPLEMENT — Write the Code

**While implementing:**

1. **INVOKE `superpowers:test-driven-development`** before writing any feature code
2. **INVOKE `superpowers:dispatching-parallel-agents`** when 2+ independent tasks exist
3. **INVOKE `superpowers:subagent-driven-development`** when executing a plan with independent steps
4. Follow existing code patterns

### Stage 4: VERIFY — Confirm Quality

**Before claiming done:**

1. Run `npm run type-check:memory`
2. **INVOKE `superpowers:verification-before-completion`** — NO EXCEPTIONS
3. **INVOKE `superpowers:requesting-code-review`** after features or significant changes
4. Test affected flows manually
5. Check for console errors

### Stage 5: SHIP — Merge & Deploy

**When ready to merge:**

1. **INVOKE `superpowers:finishing-a-development-branch`**
2. Ensure all quality gates pass

### Stage 6: LEARN — Capture Knowledge

**After completing significant work:**

1. **INVOKE `compound:compound`** when any trigger is met:
   - Task took >30 minutes
   - Discovered reusable pattern
   - Debugged tricky issue
   - Got corrected by user
2. Update MEMORY.md with key insights
3. Extract rules from corrections (RSI)

See `.claude/rules/compound-learnings.md` for full details.

### Context-Triggered Skills

These fire when their specific context arises — not at a fixed stage:

| Skill | When |
|-------|------|
| `superpowers:receiving-code-review` | PR feedback or review comments received |
| `superpowers:using-git-worktrees` | Feature work needs branch isolation |
| `superpowers:writing-skills` | Creating or editing Claude Code skills |

---

## Blast Radius Minimization

- **Isolate changes** — Don't break existing features
- **Test impact** — Verify unrelated functionality still works
- **Stay in scope** — Don't refactor adjacent code
- **Keep changes contained** — Smallest possible diff

## Confirmation Required For

- Any change touching 3+ files
- Any database migration
- Any authentication changes
- Any payment-related code
- Any deployment configuration
- Any deletion of files or data

## Progressive Loading Pattern

```
CORRECT: "Load app/admin/layout.tsx" -> "Show lines 50-100" -> "Update line 75"
WRONG: "Load all admin files" -> "Show everything in app/"
```

## When Requirements Are Unclear

1. **Ask questions first** — Don't guess
2. **Propose alternatives** — Show trade-offs
3. **State assumptions** — Make them explicit
4. **Get confirmation** — Before major work

## Context Management

**BEFORE STARTING ANY WORK:**
```powershell
powershell -File .claude/skills/context-manager/run-context-analyzer.ps1
```

**Budget Zones**: Green (<70%) | Yellow (70-85%) | Red (>85%)

## System Knowledge

- **Always read** `docs/architecture/SYSTEM_OVERVIEW.md` before unfamiliar areas
- **Verify against** documented architecture
- **Don't assume** — check the codebase
