---
name: Compound Learnings
description: Capture insights from each task to make future work easier. Implements the "compound engineering" philosophy - each unit of work should reduce friction for subsequent units.
version: 1.0.0
author: CircleTel Engineering
---

# Compound Learnings

> "Each unit of engineering work should make subsequent units easier—not harder."

This skill implements the compound engineering philosophy: systematically capturing what you learn during development to accelerate future work.

## When This Skill Activates

This skill should be invoked:
- After completing a significant task or feature
- When you discover a pattern that will be reused
- After debugging a tricky issue
- When you find a better way to do something
- At the end of a productive session

**Keywords**: compound, learnings, document what I learned, capture pattern, session summary, retrospective

## The Compound Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPOUND ENGINEERING CYCLE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    PLAN ──────► WORK ──────► REVIEW ──────► COMPOUND            │
│      │                                          │                │
│      │                                          │                │
│      └──────────── Future work is easier ◄──────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Command: /compound

Use `/compound` to trigger the learning capture workflow.

### Usage

```bash
# After completing work
/compound

# With specific focus
/compound "console migration patterns"

# Quick pattern capture
/compound --pattern "API error handling"
```

## What to Capture

### 1. Friction Points (What Slowed You Down)

```markdown
## Friction: [Brief Title]

**Task**: What were you trying to do?
**Obstacle**: What slowed you down?
**Root Cause**: Why did this happen?
**Solution**: How did you resolve it?
**Prevention**: How can future tasks avoid this?
```

### 2. Patterns (Reusable Solutions)

```markdown
## Pattern: [Pattern Name]

**Context**: When to use this pattern
**Problem**: What problem does it solve?
**Solution**: The pattern itself (with code)
**Trade-offs**: Pros and cons
**Examples**: Where it's used in CircleTel
```

### 3. Discoveries (Things You Learned)

```markdown
## Discovery: [Brief Title]

**Context**: What were you working on?
**Insight**: What did you learn?
**Impact**: How does this change future work?
**References**: Related files, docs, or code
```

### 4. Shortcuts (Time Savers)

```markdown
## Shortcut: [Brief Title]

**Before**: How it was done previously
**After**: The faster/better way
**Savings**: Estimated time saved
**Command/Code**: The actual shortcut
```

## File Organization

```
.claude/skills/compound-learnings/
├── SKILL.md                          # This file
├── templates/
│   ├── learning-template.md          # Template for learnings
│   └── pattern-template.md           # Template for patterns
└── learnings/
    ├── YYYY-MM-DD_topic.md           # Date-prefixed learnings
    └── patterns/
        ├── api-routes.md             # API route patterns
        ├── error-handling.md         # Error handling patterns
        ├── testing.md                # Testing patterns
        └── migrations.md             # Migration patterns
```

## Integration with MEMORY.md

After capturing learnings, the most important insights should be summarized in MEMORY.md for cross-session persistence:

```markdown
# In MEMORY.md

## Key Patterns
- API routes: Use apiLogger, not console.log (see compound-learnings/patterns/api-routes.md)
- Error handling: Use lib/errors/app-error.ts classes (see patterns/error-handling.md)

## Recent Learnings
- 2026-02-09: Console migration - batch by domain, use parallel agents
```

## Best Practices

### DO Capture

- Solutions to problems that took >30 minutes to solve
- Patterns you'll use more than twice
- Gotchas specific to CircleTel's stack
- Commands or workflows that saved significant time
- Architectural decisions and their rationale

### DON'T Capture

- Obvious things documented elsewhere
- One-off fixes unlikely to recur
- External library documentation (just link to it)
- Temporary workarounds (capture the proper fix instead)

## Example Compound Session

```
You: /compound

Claude: Let me analyze this session for compoundable learnings...

## Session Summary: Console Migration (2026-02-09)

### Patterns Extracted
1. **Batch Migration Pattern**: Group files by domain (cron, payments, admin)
   for focused, reviewable commits.

2. **Logger Selection Pattern**: Match logger to domain:
   - `apiLogger` - API routes
   - `cronLogger` - Scheduled tasks
   - `webhookLogger` - External webhooks
   - `paymentLogger` - Payment flows

### Friction Points
1. **Duplicate catch blocks**: Automated migration introduced syntax errors.
   Prevention: Always run type-check before committing bulk changes.

### Time Savings
- Parallel subagents reduced migration time by ~70%
- Domain-based batching made PRs reviewable

Shall I save these to learnings/2026-02-09_console-migration.md?
```

## Metrics

Track the compound effect over time:

| Metric | Description |
|--------|-------------|
| Patterns Created | Number of reusable patterns documented |
| Friction Resolved | Issues prevented by prior learnings |
| Time Saved | Estimated hours saved by patterns |
| MEMORY.md Updates | Cross-session insights captured |

## Related Skills

- `session-manager` - Name and resume sessions
- `refactor` - Identify improvement opportunities
- `tech-debt-analyzer` - Track technical debt
- `filesystem-context` - Persist context across sessions

---

**Philosophy**: Don't just ship code—ship knowledge. Every task completed is an investment in your future velocity.
