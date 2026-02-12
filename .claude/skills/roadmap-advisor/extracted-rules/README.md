# Extracted Rules

This directory contains rules extracted from user corrections via RSI (Recursive Self-Improvement).

## How Rules Are Created

1. User corrects a roadmap recommendation
2. Correction stored in `corrections/roadmap/`
3. If pattern is recurring (2+ corrections), rule is extracted here
4. Future analyses apply these rules automatically

## Expected Files

- `priority-overrides.md` - When standard scoring is incorrect
- `effort-calibrations.md` - Actual vs estimated efforts
- `dependency-patterns.md` - Common dependency chains
- `circletel-constraints.md` - Business/regulatory limits

## Adding Rules Manually

If you identify a pattern, create a rule file:

```markdown
# Rule: [Brief Name]

**Created**: YYYY-MM-DD
**Source**: [Correction reference or observation]

## When to Apply
[Conditions that trigger this rule]

## Rule
[What to do differently]

## Examples
[Concrete examples]
```

---

*This directory is auto-populated by the RSI system. Manual entries are also welcome.*
