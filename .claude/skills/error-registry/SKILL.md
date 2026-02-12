---
name: error-registry
description: Searchable database of recurring errors with linked solutions. Use when debugging bugs, encountering errors, or adding new error patterns. Enables faster resolution by checking known fixes before investigation.
version: 1.0.0
author: CircleTel Engineering
---

# Error Pattern Registry

> "The fastest bug fix is one you've already solved."

A searchable database of recurring errors with documented root causes, solutions, and prevention strategies. This skill implements RSI (Recursive Self-Improvement) by learning from every bug fix.

## When This Skill Activates

This skill activates when you:
- Encounter a runtime error or exception
- See familiar error messages or patterns
- Debug API failures (403, 401, 500)
- Fix TypeScript compilation errors
- Resolve database/RLS issues
- Complete a bug fix (to add to registry)

**Keywords**: error, bug, registry, recurring, known issue, previous fix, error lookup, ERR-

## Commands

| Command | Description |
|---------|-------------|
| `/errors` | List all error categories with counts |
| `/errors top` | Show top 10 most recurring errors |
| `/errors api` | List errors in specific category |
| `/error ERR-001` | Show specific error details and solution |
| `/errors add` | Add new error pattern to registry |
| `/errors search <term>` | Search errors by keyword |

## Integration with Bug-Fixing

Before starting investigation (Phase 1 of bug-fixing), check the registry:

```
┌─────────────────────────────────────────────────────────┐
│  BUG DETECTED                                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 0: Check Error Registry                          │
│  ─────────────────────────────────────────────────────  │
│  1. Match error signature against registry.json         │
│  2. If match found → apply known fix                    │
│  3. If no match → proceed to Phase 1 (Investigation)    │
└────────────────┬────────────────────────────────────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
     ▼                       ▼
┌──────────────┐     ┌──────────────────────────┐
│ KNOWN ERROR  │     │ NEW ERROR                │
│ Apply fix    │     │ Investigate & fix        │
│ Log +1       │     │ Add to registry when done│
└──────────────┘     └──────────────────────────┘
```

## Error Pattern Format

Each error pattern includes:

```markdown
# Error: [Short Name]

**ID**: ERR-XXX
**Category**: api | typescript | supabase | auth | frontend | build
**Severity**: critical | high | medium | low
**Occurrences**: N
**Last Seen**: YYYY-MM-DD

## Signature
[Error message or pattern to match]

## Root Cause
[Why this error occurs]

## Solution
[Code or steps to fix]

## Prevention
[How to prevent in future]

## Related
- [Links to patterns, learnings, files]
```

## Quick Reference: Top Errors

| ID | Error | Category | Quick Fix |
|----|-------|----------|-----------|
| ERR-001 | Infinite Loading State | auth | Add `finally { setLoading(false) }` |
| ERR-002 | RLS Policy 403 | api | Add service_role policy to table |
| ERR-003 | Next.js 15 Async Params | typescript | `await context.params` |
| ERR-004 | Payment Amount Format | api | Convert to cents: `Math.round(amount * 100)` |
| ERR-005 | Heap Overflow | build | Use `npm run build:memory` |
| ERR-006 | 401 Auth Header | auth | Check BOTH header AND cookies |

## Using the Registry

### When Encountering an Error

1. **Check signature match**:
   ```
   "Does this error match any known patterns?"

   Error: "new row violates row-level security policy"
   → Matches ERR-002 (RLS Policy 403)
   → Apply known fix: Add service_role policy
   ```

2. **Log occurrence**:
   - Update `occurrences` count in error pattern
   - Update `last_seen` date
   - Note any new context

3. **Apply fix**:
   - Follow documented solution
   - Validate with documented checks

### After Fixing a New Error

1. **Create error pattern**:
   ```
   /errors add

   Name: [Short descriptive name]
   Category: [api|typescript|supabase|auth|frontend|build]
   Signature: [Error message to match]
   Root Cause: [Why it happened]
   Solution: [How to fix]
   Prevention: [How to avoid]
   ```

2. **Link to related patterns**:
   - Add to `compound-learnings` if it creates a new pattern
   - Link to relevant files and documentation

## Directory Structure

```
error-registry/
├── SKILL.md              # This file
├── registry.json         # Master index (fast lookup)
├── errors/               # Error pattern files
│   ├── api/
│   │   ├── rls-policy-403.md
│   │   ├── payment-amount-format.md
│   │   └── mtn-api-antibot.md
│   ├── typescript/
│   │   └── nextjs15-async-params.md
│   ├── supabase/
│   │   ├── join-array-handling.md
│   │   └── quote-column-name.md
│   ├── auth/
│   │   ├── infinite-loading.md
│   │   └── dashboard-401.md
│   ├── frontend/
│   │   └── broken-links.md
│   └── build/
│       ├── heap-overflow.md
│       └── vercel-timeout.md
└── analytics/
    └── occurrences.json  # Tracking data
```

## Category Definitions

| Category | Description | Examples |
|----------|-------------|----------|
| `api` | API route errors, external API issues | 403, 500, payment API |
| `typescript` | Type errors, compilation failures | Next.js 15, type mismatch |
| `supabase` | Database, RLS, query issues | Join arrays, missing columns |
| `auth` | Authentication, authorization | Infinite loading, 401 |
| `frontend` | UI bugs, component issues | Broken links, re-renders |
| `build` | Build failures, deployment | Heap overflow, timeouts |

## Metrics

Track the effectiveness of the error registry:

| Metric | Description |
|--------|-------------|
| **Registry Hit Rate** | % of bugs resolved via registry lookup |
| **Avg Resolution Time** | Known errors vs new errors |
| **Most Recurring** | Errors that need architectural fix |
| **Categories Growing** | Areas needing more attention |

## Best Practices

1. **Check registry first** - Before deep investigation
2. **Be specific** - Include exact error messages in signatures
3. **Document prevention** - How to avoid, not just fix
4. **Link related** - Connect to learnings, patterns, files
5. **Update occurrences** - Track frequency for prioritization
6. **Add new patterns** - Every unique bug fix should be documented

## RSI Loop

This skill implements Recursive Self-Improvement:

```
ENCOUNTER BUG
     │
     ▼
CHECK REGISTRY ────► KNOWN? ────► Apply Fix ────► Log Occurrence
     │                  │
     │                  NO
     │                  │
     ▼                  ▼
INVESTIGATE ────► FIX ────► ADD TO REGISTRY
     │                           │
     └───────────────────────────┘
            LEARNING LOOP
```

Each bug fixed makes future debugging faster. The registry grows smarter over time.

---

**Version**: 1.0.0
**Last Updated**: 2026-02-12
**Errors Documented**: 10 (seeded from existing documentation)
**Maintained By**: CircleTel Development Team
