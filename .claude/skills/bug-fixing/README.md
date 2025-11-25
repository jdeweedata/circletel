# Bug Fixing Assistant Skill

A systematic approach to debugging and fixing software bugs in CircleTel, based on Claude's best practices for efficient bug resolution.

## What This Skill Does

This skill helps you:
- **Understand failures** faster by systematically identifying root causes
- **Debug efficiently** using structured workflows for different bug types
- **Fix confidently** with targeted solutions that match CircleTel patterns
- **Validate thoroughly** with comprehensive testing checklists
- **Learn from history** by documenting patterns for future reference

## Quick Start

### 1. Identify Your Bug Type

- **Runtime Error**: Application crashes with exception
- **Infinite Loading**: UI stuck or infinite re-renders
- **API Failure**: 403/500 errors or unexpected responses
- **Type Error**: TypeScript compilation fails
- **Performance Issue**: Slow loading or high memory usage
- **UI Bug**: Visual or interaction problems
- **Auth Issue**: Login or permission problems
- **Regression**: Something that used to work

### 2. Use the Appropriate Template

Open `templates/prompt_templates.md` and copy the template for your bug type. Fill in the details and ask Claude for help.

**Example**:
```
"Debug this infinite loading issue in CircleTel:

Component: app/dashboard/page.tsx
Symptom: UI stuck on 'Loading...' indefinitely
Code: [paste useEffect code]

Analyze for:
1. Missing finally block?
2. Error handling in async callback?
..."
```

### 3. Follow the 5-Phase Workflow

1. **Understand** (5-10 min) - Gather evidence, identify failure modes
2. **Investigate** (15-30 min) - Reproduce, add logs, isolate problem
3. **Analyze** (10-20 min) - Review code, check patterns, find root cause
4. **Fix** (5-15 min) - Apply targeted solution, review side effects
5. **Validate** (10-20 min) - Test fix, write tests, verify no regressions

### 4. Use CircleTel-Specific Patterns

Common bugs and quick fixes:

| Pattern | Quick Fix |
|---------|-----------|
| Infinite Loading | Add `finally { setLoading(false) }` |
| 403 API Error | Add service_role RLS policy |
| Type Error | Use `await context.params` (Next.js 15) |
| Heap Overflow | Use `npm run build:memory` |
| Undefined Error | Add `?.` optional chaining |

## File Structure

```
bug-fixing/
├── Skill.md                        # Main skill documentation
├── README.md                       # This file
├── templates/
│   └── prompt_templates.md         # 10 ready-to-use prompt templates
├── examples/
│   └── real_circletel_bugs.md     # 6 real bugs and their fixes
└── checklists/
    └── debugging_checklist.md      # Systematic debugging checklists
```

## When to Use This Skill

### Automatic Activation

The skill activates automatically when you mention:
- Bug, error, debug, fix, issue, broken, failing
- Specific errors: crash, exception, timeout, undefined, null
- HTTP errors: 500 error, 403 error, 404 error

### Manual Activation

Ask Claude directly:
- "Help me debug this error: [error message]"
- "Why is my dashboard showing infinite loading?"
- "Fix this API 403 error"
- "Analyze this performance issue"

## Key Features

### 1. Structured Debugging Workflow

Instead of random trial-and-error, follow a proven 5-phase process that systematically narrows down the problem.

### 2. Prompt Templates

10 ready-to-use templates for different bug types:
- Runtime errors
- Infinite loops/loading
- API/database issues
- TypeScript errors
- Performance problems
- Build failures
- Auth issues
- Regressions
- Intermittent bugs
- UI/UX issues

### 3. Real CircleTel Examples

Learn from 6 actual bugs fixed in production:
1. Dashboard infinite loading (missing finally block)
2. RLS policy blocking API (missing service_role policy)
3. Next.js 15 type error (async params)
4. NetCash amount format (cents conversion)
5. Broken dashboard links (non-existent routes)
6. Memory heap overflow (build with limited memory)

### 4. CircleTel-Specific Patterns

Quick reference for common CircleTel bugs:
- Infinite loading states (auth callbacks)
- RLS policy issues (missing service role)
- Next.js 15 compatibility (async params)
- Supabase client patterns (server vs client)
- Memory management (heap limits)

### 5. Comprehensive Checklists

Systematic checklists for:
- Universal debugging (any bug)
- Frontend bugs (React/Next.js)
- API route bugs (authentication, RLS)
- Database bugs (queries, policies, performance)
- Build/deploy bugs (TypeScript, compilation)
- Performance bugs (React, database, network)
- Authentication bugs (login, session, authorization)
- Regression bugs (used to work)

## Example Usage

### Scenario: Customer Dashboard Not Loading

**Step 1**: Identify bug type
- Symptom: Infinite loading
- Use Template #2 from `templates/prompt_templates.md`

**Step 2**: Ask Claude
```
Debug this infinite loading issue in CircleTel:

Component: app/dashboard/page.tsx
Symptom: Dashboard shows "Loading..." indefinitely after login
Code: [paste auth callback useEffect]

Analyze for:
1. Missing finally block in async operation?
2. Error handling that prevents loading state update?
3. Auth provider exclusions?
```

**Step 3**: Follow Analysis
Claude identifies: Missing finally block in auth callback

**Step 4**: Apply Fix
```typescript
finally {
  setLoading(false) // ← Add this
}
```

**Step 5**: Validate
- [x] Dashboard loads
- [x] No console errors
- [x] Type check passes
- [x] Build succeeds

**Time Saved**: 80% reduction from random debugging to systematic resolution

## Best Practices

### DO ✅

- **Reproduce first, fix second** - Always reproduce locally before attempting fixes
- **Use templates** - They ensure you provide all necessary context
- **Follow the 5-phase workflow** - Systematic > Random
- **Document patterns** - Add new bugs to examples for team learning
- **Test thoroughly** - Use validation checklist before committing
- **Learn from history** - Review real examples before debugging similar issues

### DON'T ❌

- **Don't skip reproduction** - Can't fix what you can't reproduce
- **Don't guess randomly** - Form hypotheses, test systematically
- **Don't fix without understanding** - Know the root cause first
- **Don't skip validation** - Untested fixes create new bugs
- **Don't ignore patterns** - Check examples for similar bugs
- **Don't forget error handling** - Always use try/catch/finally

## Common Workflows

### Frontend Bug
1. Open DevTools Console
2. Reproduce and note errors
3. Check React DevTools for state/props
4. Add strategic console.log
5. Isolate component
6. Apply fix
7. Test in browser

### API Bug
1. Test with curl/Postman
2. Check response status/body
3. Review server logs
4. Verify authentication
5. Check RLS policies
6. Fix and redeploy
7. Test endpoint

### Database Bug
1. Check RLS policies
2. Test query in Supabase SQL editor
3. Verify foreign keys/constraints
4. Check indexes
5. Apply migration fix
6. Test locally with `npx supabase migration up`
7. Deploy to staging

### Build Bug
1. Run `npm run type-check:memory`
2. Read error messages carefully
3. Check for Next.js 15 patterns
4. Fix type errors incrementally
5. Run build: `npm run build:memory`
6. Verify no new errors

## Resources

### Internal Resources
- `Skill.md` - Complete debugging workflows and patterns
- `templates/prompt_templates.md` - 10 bug type templates
- `examples/real_circletel_bugs.md` - 6 real CircleTel bugs
- `checklists/debugging_checklist.md` - Systematic checklists

### CircleTel Resources
- `CLAUDE.md` - Common debugging patterns section
- `docs/fixes/` - Documented fixes directory
- Database Migration Skill - For RLS/schema issues
- Context Manager Skill - For token optimization

### External Resources
- Claude Blog: "Fix Software Bugs Faster with Claude"
- Next.js 15 Docs - Async params pattern
- Supabase RLS Docs - Row level security
- React DevTools - Component debugging

## Measuring Success

### Before This Skill
- Random trial-and-error debugging
- Multiple hour debugging sessions
- Unclear root causes
- Repeated similar bugs
- Incomplete testing

### After This Skill
- Systematic debugging approach
- 80% faster bug resolution (like Ramp)
- Clear root cause identification
- Pattern recognition and reuse
- Comprehensive validation

### Track Your Progress
- Time to fix bugs (before vs after)
- Number of bugs per sprint
- Regression rate
- Team knowledge sharing

## Tips for Better Debugging

1. **Start with the error message** - It usually tells you exactly what's wrong
2. **Check recent changes first** - 80% of bugs come from recent code
3. **Use the right tools** - DevTools, React DevTools, Supabase dashboard
4. **Add strategic logging** - Use `[DEBUG]` prefix for easy filtering
5. **Test incrementally** - Verify each change doesn't break other features
6. **Document patterns** - Help future you and your team
7. **Ask for help early** - Don't spend hours stuck on one bug
8. **Learn from examples** - Review real CircleTel bugs before debugging

## Contributing

Found a new bug pattern? Add it to the skill:
1. Document in `examples/real_circletel_bugs.md`
2. Create template in `templates/prompt_templates.md` if needed
3. Add to CircleTel-Specific Patterns in `Skill.md`
4. Update checklists if applicable

## Support

- Ask Claude: "Help me debug [description]"
- Check examples: `examples/real_circletel_bugs.md`
- Use templates: `templates/prompt_templates.md`
- Follow checklists: `checklists/debugging_checklist.md`

---

**Version**: 1.0.0
**Last Updated**: 2025-11-08
**Based On**: Claude Blog - "Fix Software Bugs Faster with Claude"
**Maintained By**: CircleTel Development Team

**Success Metric**: 80% reduction in bug triage time (Ramp's results with Claude)
