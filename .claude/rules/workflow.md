Rule: workflow
Loaded by: CLAUDE.md
Scope: Planning protocol, blast radius minimization, confirm-before-implement

---

## Before ANY Code Change

1. **Read first** — Load all relevant files before modifying
2. **Build todo list** — Step-by-step plan with affected files
3. **Explain approach** — Describe what you'll change and why
4. **Wait for confirmation** — Don't proceed without explicit approval

## The Three-Step Rule

```
Think first → Explain second → Code third
```

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

## Quality Gates

Before claiming work is done:
1. Run `npm run type-check:memory`
2. Run `/skill superpowers:verification-before-completion`
3. Test affected flows manually
4. Check for console errors

## Progressive Loading Pattern

```
✅ CORRECT: "Load app/admin/layout.tsx" → "Show lines 50-100" → "Update line 75"
❌ WRONG: "Load all admin files" → "Show everything in app/"
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

**Budget Zones**: 🟢 Green (<70%) | 🟡 Yellow (70-85%) | 🔴 Red (>85%)

## System Knowledge

- **Always read** `docs/architecture/SYSTEM_OVERVIEW.md` before unfamiliar areas
- **Verify against** documented architecture
- **Don't assume** — check the codebase
