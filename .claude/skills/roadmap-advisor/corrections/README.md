# Corrections

This directory stores corrections to roadmap recommendations for RSI learning.

## How Corrections Are Stored

When a user corrects a recommendation:

```markdown
# Correction: [Brief Description]

**Date**: YYYY-MM-DD
**Original**: [What was recommended]
**Correction**: [What user said]
**Type**: [priority/effort/dependency/invalid/context]
**Learning**: [Rule to apply in future]
```

## Correction Types

| Type | Description |
|------|-------------|
| `priority` | Scoring was wrong (e.g., "SLA should be P2, not P1") |
| `effort` | Estimate was off (e.g., "This took 3 weeks, not 1") |
| `dependency` | Missing prerequisite (e.g., "Needed X before Y") |
| `invalid` | Feature already exists (e.g., "We already have X") |
| `context` | Business constraint (e.g., "Can't do X due to regulation") |

## Structure

```
corrections/
├── README.md           # This file
└── roadmap/            # Roadmap-specific corrections
    ├── YYYY-MM-DD_priority-override.md
    ├── YYYY-MM-DD_effort-correction.md
    └── ...
```

---

*This directory is auto-populated when users correct recommendations.*
