Rule: anti-patterns
Loaded by: CLAUDE.md
Scope: Things Claude must NEVER do

---

## ⚠️ ANTI-SLOP RULES — NON-NEGOTIABLE

```
NEVER write placeholder code, stub functions, or TODO items
NEVER invent file paths, function names, or variable names — check first
NEVER make changes outside the scope of the current task
NEVER claim a task is complete without running /skill superpowers:verification-before-completion
ALWAYS invoke the relevant superpowers skill before writing code
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

## Common Violations

| Violation | Consequence | Prevention |
|-----------|-------------|------------|
| Invented column name | Silent data loss | Run `SELECT column_name FROM information_schema.columns` |
| Wrong API param | Silent failure | Check working implementation first |
| Root-level file dump | Cluttered repo | Always use subdirectories |
| Assumed function exists | Runtime error | Grep for function before calling |
| Skipped verification | Broken deployment | Run `/skill superpowers:verification-before-completion` |
