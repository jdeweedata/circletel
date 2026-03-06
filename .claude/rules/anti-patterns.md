Rule: anti-patterns
Loaded by: CLAUDE.md
Scope: Things Claude must NEVER do

---

## ⚠️ ANTI-SLOP RULES — NON-NEGOTIABLE

```
NEVER write placeholder code, stub functions, or TODO items
NEVER invent file paths, function names, or variable names — check first
NEVER make changes outside the scope of the current task
NEVER skip a Superpowers Pipeline gate — every applicable skill MUST be invoked
NEVER claim a task is complete without invoking superpowers:verification-before-completion
NEVER start implementation without invoking superpowers:brainstorming (new work) or superpowers:systematic-debugging (bugs)
NEVER write feature code without invoking superpowers:test-driven-development
NEVER end a session without capturing learnings when triggers are met (>30min task, pattern found, correction received)
ALWAYS follow the full Superpowers Pipeline: START -> PLAN -> IMPLEMENT -> VERIFY -> SHIP -> LEARN
ALWAYS ask before modifying more than 3 files at once
```

## Code Quality

- **No placeholder code**: Every function must be complete and production-ready
- **No TODO comments**: Fix it now or don't commit it
- **No band-aid fixes**: Address root causes, not symptoms
- **No technical debt**: If you identify a problem, fix it properly

## Hallucination Prevention

- **Never assume code exists** — verify with Read/Grep first
- **Never guess column names** — check schema with `verify-schema-first.md`
- **Never invent API parameters** — see `api-param-documentation.md`
- **Never reference undeclared variables** — TypeScript will catch this, but don't rely on it

## Scope Discipline

- **Only touch required files** — don't "improve" adjacent code
- **No drive-by refactoring** — if it's not in scope, leave it alone
- **No feature creep** — implement what was asked, nothing more
- **No over-engineering** — the simplest solution that works is best

## File Placement

- **Never create files in project root** — use appropriate subdirectories
- **Never create random .md files** — documentation goes in `docs/`
- **Never dump scratch files** — use `.claude/scratch/` (gitignored)

## Communication

- **Never proceed without confirmation** on major changes
- **Never rush** when context window is filling up
- **Never skip the verification skill** before claiming done

## Superpowers Pipeline Violations

| Violation | Consequence | Prevention |
|-----------|-------------|------------|
| Skipped brainstorming | Unvetted design, rework | Invoke `superpowers:brainstorming` at START |
| Skipped debugging skill | Shotgun fixes, root cause missed | Invoke `superpowers:systematic-debugging` on any error |
| Skipped writing-plans | Disorganized multi-file changes | Invoke `superpowers:writing-plans` for 2+ file tasks |
| Skipped TDD | Untested code shipped | Invoke `superpowers:test-driven-development` before features |
| Skipped verification | Broken deployment | Invoke `superpowers:verification-before-completion` before done |
| Skipped code review | Quality issues missed | Invoke `superpowers:requesting-code-review` after features |
| Skipped finishing-branch | Incomplete merge prep | Invoke `superpowers:finishing-a-development-branch` before merge |
| Skipped compound learnings | Lost knowledge, repeat mistakes | Invoke `compound:compound` when triggers met |

## Common Violations

| Violation | Consequence | Prevention |
|-----------|-------------|------------|
| Invented column name | Silent data loss | Run `SELECT column_name FROM information_schema.columns` |
| Wrong API param | Silent failure | Check working implementation first |
| Root-level file dump | Cluttered repo | Always use subdirectories |
| Assumed function exists | Runtime error | Grep for function before calling |
