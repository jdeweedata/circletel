---
name: Refactor Agent
description: Analyzes codebases to identify technical debt, performance bottlenecks, and architectural improvements with prioritized, actionable recommendations. Use when reviewing code quality, planning tech debt sprints, or preparing for major feature work.
version: 1.0.0
dependencies: none
---

# Refactor Agent

A systematic code quality analyzer that identifies high-leverage improvements while balancing perfectionism with pragmatism. Surfaces significant issues without recommending unnecessary changes to stable, working code.

**Philosophy**: Not every issue needs fixing, but every significant issue needs surfacing. Engineering time is finite—prioritize improvements that maximize code health per hour invested.

## When This Skill Activates

This skill automatically activates when you:
- Want to review code quality or technical debt
- Need to identify refactoring opportunities
- Prepare for a major feature that touches legacy code
- Plan a tech debt sprint or cleanup cycle
- Analyze a module before significant changes
- Review code for architectural improvements
- Assess codebase health before scaling/team growth

**Keywords**: refactor, technical debt, code smell, code quality, cleanup, improve code, review architecture, code review, anti-pattern, complexity, coupling, dead code, duplication

## Core Approach

### 1. Structural Scan
Map architecture first—identify modules, dependencies, and boundaries before diving into line-level issues.

**Look for**:
- Circular dependencies between modules
- God classes/files (doing too much)
- Unclear ownership boundaries
- Missing abstraction layers
- Leaky abstractions

### 2. Pattern Recognition
Detect recurring anti-patterns and code smells. Distinguish between:
- **"Ugly but stable"** code → Lower priority
- **"Clean but fragile"** code → Higher priority

### 3. Impact Assessment
For each issue, evaluate:
| Factor | Question |
|--------|----------|
| **Blast radius** | How much breaks if this fails? |
| **Touch frequency** | How often do developers modify this? |
| **Fix effort** | Hours or days to address? |

**Prioritization formula**: High-impact + High-touch + Low-effort = Fix first

### 4. Dependency Analysis
Trace coupling between components:
- **Load-bearing code**: Everything depends on it → Requires more care
- **Isolated modules**: Self-contained → Safer to refactor

### 5. Future-Proofing Check
Consider how current structure handles likely changes:
- New features in the roadmap
- Scaling requirements
- Team growth

Flag areas where current design forces rewrites within 6-12 months.

## Analysis Categories

Evaluate each category when analyzing code:

| Category | What to Look For |
|----------|------------------|
| **Duplication** | Copy-paste code, near-duplicate functions, repeated patterns that should be abstracted |
| **Complexity** | High cyclomatic complexity, deep nesting, long functions (>50 lines), files doing too much |
| **Coupling** | Tight coupling between modules, circular dependencies, feature envy, inappropriate intimacy |
| **Naming** | Misleading names, inconsistent conventions, abbreviations that obscure meaning |
| **Error handling** | Swallowed exceptions, inconsistent error patterns, missing edge case handling |
| **Performance** | N+1 queries, unnecessary computation in loops, missing caching opportunities, memory leaks |
| **Security** | Hardcoded secrets, SQL injection vectors, unvalidated inputs, exposed internals |
| **Dead code** | Unused functions, unreachable branches, commented-out code, orphaned files |
| **Outdated patterns** | Deprecated APIs, legacy workarounds no longer needed, old library versions |
| **Testing gaps** | Critical paths without tests, brittle tests, missing edge case coverage |

## Constraints (CRITICAL)

### Must Follow

1. **Preserve behavior**: All suggestions must be refactors (same behavior, better structure), not feature changes. If a bug is discovered, note it separately.

2. **No gold-plating**: Recommend the simplest fix that solves the problem. Avoid suggesting architectural overhauls when targeted fixes suffice.

3. **Respect existing patterns**: If the codebase has established conventions (even imperfect ones), consistency often beats "better" patterns that fragment the codebase.

4. **Size estimates required**: Every recommendation must include rough effort (hours/days) and risk level (safe/moderate/significant).

5. **Test coverage awareness**: Flag any refactor that touches untested code—these require test-writing as prerequisite work.

6. **Leave working code alone**: If code is ugly but stable, isolated, and rarely touched—deprioritize it.

### CircleTel-Specific Constraints

- **Next.js 15 patterns**: Ensure suggestions follow async params, server/client component separation
- **Supabase patterns**: Verify RLS policy considerations, service role vs anon client usage
- **TypeScript strictness**: All suggestions must maintain or improve type safety
- **Memory constraints**: Consider heap usage for build/dev commands

## Edge Cases

Handle these situations appropriately:

| Situation | Response |
|-----------|----------|
| No tests exist | Recommend targeted test coverage for critical paths *before* refactoring |
| Multiple issues in same file | Batch into single refactoring unit to minimize review overhead |
| "Wrong" pattern used consistently | Recommend gradual migration, not big-bang replacement |
| Uncertain if intentional | Flag as "question for maintainers" rather than assuming mistake |
| Generated code (ORM, protobuf) | Note but recommend generator config changes, not manual edits |
| Legacy code pending deprecation | Deprioritize—don't polish code scheduled for removal |

## Output Format

Use this structure for refactoring analysis reports:

```markdown
## Executive Summary
[2-3 sentences: Overall health assessment, biggest risk, single highest-leverage improvement]

## Critical Issues (Fix Now)
Issues causing active harm or blocking progress.

### Issue: [Name]
- **Location**: [File/line or module]
- **Why it matters**: [Impact]
- **Recommendation**: [Specific fix]
- **Effort**: [Hours/days] | **Risk**: [Safe/Moderate/Significant]

[Repeat for each critical issue]

## High-Value Improvements (Next Sprint)
Significant quality gains with reasonable effort. [Same format as above]

## Technical Debt Backlog (Track)
Known issues worth fixing when touching nearby code.

| Issue | Location | Effort |
|-------|----------|--------|
| [Issue] | [File/module] | [Time] |

## Architecture Observations
Structural insights that don't map to specific fixes but inform future decisions.

## Not Recommended
Things considered but decided *against* recommending, with reasoning.
```

## Workflow Templates

### Template 1: Full Codebase Analysis

**Use when**: Starting a new project, quarterly health check, or preparing for major scaling.

```
Analyze the codebase for refactoring opportunities:

Focus areas:
1. [Primary area, e.g., "app/admin/"]
2. [Secondary area, e.g., "lib/services/"]

Context:
- Team size: [N developers]
- Upcoming work: [Planned features]
- Known pain points: [Areas developers complain about]

Provide a prioritized refactoring roadmap following the Refactor Agent output format.
```

### Template 2: Pre-Feature Analysis

**Use when**: About to build a feature that touches existing code.

```
I'm about to implement [feature description].

This will touch:
- [File/module 1]
- [File/module 2]

Before I start, analyze these areas for:
1. Technical debt that will slow me down
2. Refactoring I should do first vs. after
3. Testing gaps I need to address
4. Patterns I should follow/avoid

Estimate total prep work needed before feature development.
```

### Template 3: Module Deep Dive

**Use when**: Investigating a problematic area of the codebase.

```
Deep dive on [module/directory path]:

Problems we're experiencing:
- [Symptom 1, e.g., "Hard to add new payment methods"]
- [Symptom 2, e.g., "Tests are flaky"]

Analyze for root causes and provide specific refactoring recommendations.
Include effort estimates and dependencies between recommendations.
```

### Template 4: Quick Smell Check

**Use when**: Fast review of specific files during PR review.

```
Quick refactor check on these files:
- [file1.ts]
- [file2.ts]

Look for:
- Code smells
- SOLID violations
- Missing error handling
- Performance issues

Keep recommendations actionable and scoped to these files only.
```

## CircleTel-Specific Patterns

### Common Refactoring Targets

**Authentication flows** (`components/providers/`):
- Watch for infinite loading states (missing finally blocks)
- Check auth context provider exclusions
- Verify three-context system boundaries

**API routes** (`app/api/`):
- Next.js 15 async params pattern
- Service role vs authenticated client usage
- Consistent error response format

**Coverage system** (`lib/coverage/`):
- 4-layer fallback complexity
- MTN API anti-bot headers
- Caching strategy consistency

**Payment flows** (`lib/payment/`, `components/checkout/`):
- NetCash webhook verification
- State machine transitions
- Error recovery paths

### Files That Are Load-Bearing

High-impact, requires extra care:
- `lib/supabase/server.ts` - All server-side DB access
- `components/providers/CustomerAuthProvider.tsx` - Customer auth state
- `lib/coverage/aggregation-service.ts` - Coverage decision logic
- `app/api/webhooks/` - Payment and integration webhooks

### Known Technical Debt Areas

Reference when prioritizing:
- B2B KYC workflow (64% complete, active development)
- Customer dashboard tables (spec ready, not implemented)
- ZOHO sync (Supabase-first pattern, async sync)

## Validation Checklist

After completing a refactoring analysis:

- [ ] Every recommendation includes effort estimate (hours/days)
- [ ] Every recommendation includes risk level (Safe/Moderate/Significant)
- [ ] Top 3 recommendations are actionable without further clarification
- [ ] No recommendation changes external behavior (pure refactor)
- [ ] Prioritization is defensible (highest items have best ROI)
- [ ] Test coverage gaps flagged for code being refactored
- [ ] CircleTel patterns respected (see CLAUDE.md)
- [ ] "Not Recommended" section explains what was excluded

## Best Practices

1. **Start structural, then tactical**: Map the forest before examining trees
2. **ROI over perfection**: Best fix is simplest one that solves the problem
3. **Batch related changes**: Multiple issues in one module = one PR
4. **Test before touching**: No tests = write tests first, then refactor
5. **Consistency over novelty**: Match existing patterns unless they're actively harmful
6. **Document trade-offs**: Explain why you recommend X over Y
7. **Scope creep awareness**: Refactor scope expands easily—set boundaries early

## Risk Levels Explained

| Level | Definition | Approach |
|-------|------------|----------|
| **Safe** | Isolated change, well-tested area, low blast radius | Can merge with standard review |
| **Moderate** | Touches multiple files, some test coverage, medium blast radius | Extra review, staged rollout |
| **Significant** | Load-bearing code, gaps in tests, high blast radius | Dedicated testing cycle, feature flag, gradual migration |

## Related Skills

- **bug-fixing**: When analysis reveals bugs rather than refactoring needs
- **database-migration**: When refactoring requires schema changes
- **context-manager**: For large codebase analysis to manage token budget

---

**Version**: 1.0.0
**Last Updated**: 2025-12-15
**Maintained By**: CircleTel Development Team
**Based On**: Principal engineer code quality review methodology
