# /compound - Capture Session Learnings

Analyze the current session and capture compoundable learnings that will make future work easier.

## What to Do

1. **Review the session** - Look at what was accomplished, what challenges arose, and what patterns emerged.

2. **Identify compoundable insights**:
   - Patterns that can be reused
   - Friction points and their solutions
   - Time-saving shortcuts discovered
   - Mistakes to avoid in future

3. **Create or update documentation**:
   - New learnings go in `.claude/skills/compound-learnings/learnings/YYYY-MM-DD_topic.md`
   - Reusable patterns go in `.claude/skills/compound-learnings/learnings/patterns/`
   - Key insights should be summarized in MEMORY.md

4. **Suggest follow-up actions**:
   - [ ] Patterns to extract
   - [ ] Documentation to update
   - [ ] CLAUDE.md updates if needed

## Output Format

```markdown
## Session Compound Summary

### What Was Accomplished
[Brief summary of completed work]

### Patterns Identified
1. **[Pattern Name]**: [Description]
   - Location: [Where to find/use it]
   - Saves: [Estimated time/effort saved]

### Friction Points Resolved
1. **[Issue]**: [How it was resolved]
   - Prevention: [How to avoid in future]

### Key Learnings
- [Learning 1]
- [Learning 2]

### Recommended Actions
- [ ] [Action item]
- [ ] [Action item]

Shall I save these learnings to:
- `.claude/skills/compound-learnings/learnings/YYYY-MM-DD_[topic].md`?
```

## Example Usage

```
User: /compound

Claude: Analyzing session for compoundable learnings...

## Session Compound Summary

### What Was Accomplished
Completed DEBT-001 API routes migration - 107 files, ~1,500 console statements replaced with structured loggers.

### Patterns Identified
1. **Domain-Based Logger Selection**: Match logger to code domain
   - Location: `learnings/patterns/structured-logging.md`
   - Saves: ~5 min per new route (no decision needed)

2. **Batch Migration by Domain**: Group related files for reviewable commits
   - Location: `learnings/2026-02-09_console-migration.md`
   - Saves: Easier rollback, clearer PRs

### Friction Points Resolved
1. **Duplicate catch blocks**: Automated migration introduced syntax errors
   - Prevention: Always `npm run type-check` before bulk commits

### Key Learnings
- Parallel subagents reduce bulk migration time by ~70%
- Type checking catches syntax issues early

### Recommended Actions
- [x] Create structured-logging pattern
- [x] Document migration learnings
- [ ] Add pre-commit hook for console statements
- [ ] Update MEMORY.md with key insights

Saved to: `.claude/skills/compound-learnings/learnings/2026-02-09_console-migration.md`
```

## Arguments

- `/compound` - Full session analysis
- `/compound "topic"` - Focus on specific topic
- `/compound --pattern "name"` - Quick pattern extraction
- `/compound --friction` - Focus on friction points only

## Philosophy

> "Each unit of engineering work should make subsequent units easier—not harder."

The goal is to invest a few minutes at the end of significant work to document what you learned. This small investment compounds over time, making you faster and reducing repeated mistakes.
