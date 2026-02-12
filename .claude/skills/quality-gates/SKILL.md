---
name: quality-gates
description: Multi-pass quality system for critical outputs. Implements RSI through generate-evaluate-refine loops for billing emails, contracts, customer notifications, and technical documentation.
version: 1.0.0
author: CircleTel Engineering
---

# Quality Gates

> "Ship quality, not quantity. Every output should meet a measurable standard."

This skill implements RSI (Recursive Self-Improvement) through multi-pass quality loops. Critical outputs are generated, evaluated against rubrics, and refined until they meet quality thresholds.

## When This Skill Activates

This skill activates when generating:
- Billing emails (invoices, payment reminders, receipts)
- Customer notifications (service updates, account alerts)
- Contracts and quotes (B2B documents)
- Technical documentation (API docs, architecture docs)

**Keywords**: quality, review, evaluate, refine, billing email, customer notification, contract, multi-pass, rubric

## The Multi-Pass Quality Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-PASS QUALITY SYSTEM                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    GENERATE ──► EVALUATE ──► REFINE ──► CHECK CONVERGENCE       │
│        │            │            │              │                │
│        │            │            │              │                │
│        │            ▼            │              │                │
│        │      SCORE < 8?         │              │                │
│        │         YES ────────────┘              │                │
│        │          │                             │                │
│        │          │         ┌───────────────────┘                │
│        │          │         │                                    │
│        │          │         ▼                                    │
│        │          │    PASSES < 3?                               │
│        │          │       YES ──► LOOP BACK                      │
│        │          │        │                                     │
│        │          │        NO                                    │
│        │          │        │                                     │
│        └──────────┴────────┴──────────► OUTPUT FINAL             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Reference: Output Types

| Output Type | Min Score | Max Passes | Rubric |
|-------------|-----------|------------|--------|
| Billing Email | 8/10 | 3 | `rubrics/billing-email.md` |
| Customer Notification | 8/10 | 3 | `rubrics/customer-notification.md` |
| Contract | 9/10 | 3 | `rubrics/contract.md` |
| Technical Docs | 8/10 | 2 | `rubrics/technical-docs.md` |

## How to Use

### Automatic Activation

When generating a qualifying output, the skill activates:

```
User: "Generate a payment reminder email for customer ABC"

Claude: [Generates draft]
        [Applies billing-email rubric]
        [Scores: Clarity 9, Accuracy 10, Tone 7, Action 8, Compliance 9 = 8.5]
        [Score >= 8, output final version]
```

### Manual Quality Check

Use `/quality-check` to evaluate existing content:

```bash
/quality-check billing-email

# Paste or reference content
# Receive scored evaluation with improvement suggestions
```

### Multi-Pass Example

```
PASS 1:
──────────────────────────────────────────────
Generated: "Your invoice is attached. Pay soon."
Evaluation:
  - Clarity: 6/10 (vague timing)
  - Accuracy: 5/10 (no amount mentioned)
  - Tone: 4/10 (too casual)
  - Action: 5/10 (unclear CTA)
  - Compliance: 8/10 (missing terms)
Total: 5.6/10 ❌

PASS 2:
──────────────────────────────────────────────
Refined: "Invoice #INV-2024-0042 for R799.00 is due by
February 28, 2026. Click below to pay securely via NetCash.
Questions? Reply to this email or WhatsApp 082 487 3900."
Evaluation:
  - Clarity: 9/10 (specific date, amount)
  - Accuracy: 10/10 (correct details)
  - Tone: 8/10 (professional, friendly)
  - Action: 9/10 (clear CTA)
  - Compliance: 9/10 (proper format)
Total: 9.0/10 ✓

Final output delivered.
```

## Rubric Structure

Each rubric defines:

```markdown
# Rubric: [Output Type]

**Target**: What this rubric evaluates
**Critical Score**: Minimum to pass (default 8/10)
**Max Passes**: Maximum refinement iterations (default 3)

## Criteria

| Criterion | Weight | Scoring Guide |
|-----------|--------|---------------|
| [Name] | [%] | 10=[best], 5=[average], 1=[worst] |

## Evaluation Prompt

[Template for self-evaluation]

## Convergence Rules

- Stop if score >= [threshold]
- Stop if passes >= [max]
- Stop if delta < 0.5 between passes
```

## Convergence Rules

The loop stops when ANY of these conditions are met:

1. **Quality Threshold**: Score >= minimum required (usually 8/10)
2. **Max Passes**: 3 iterations completed (prevents infinite loops)
3. **Diminishing Returns**: Improvement < 0.5 points between passes

## Integration with Billing Service

For billing emails, integrate with `lib/billing/paynow-billing-service.ts`:

```typescript
// Before sending payment reminder
const email = await generatePaymentReminder(customer, invoice)
const qualityScore = await evaluateWithRubric(email, 'billing-email')

if (qualityScore < 8) {
  const refined = await refineOutput(email, qualityScore.feedback)
  // Re-evaluate...
}
```

## Directory Structure

```
quality-gates/
├── SKILL.md              # This file
├── rubrics/              # Quality criteria per output type
│   ├── billing-email.md
│   ├── customer-notification.md
│   ├── contract.md
│   └── technical-docs.md
├── evaluators/           # Evaluation prompts
│   └── default-evaluator.md
└── history/              # Pass history (optional)
    └── YYYY-MM-DD_output-type.md
```

## Best Practices

1. **Trust the rubric** - Don't skip evaluation for "simple" outputs
2. **Don't over-refine** - If score is 8+, ship it
3. **Log passes** - Track which outputs need multiple passes
4. **Update rubrics** - Add new criteria as patterns emerge
5. **Check compliance** - Especially for billing and contracts

## RSI Feedback Loop

Quality gates connect to the broader RSI system:

```
QUALITY ISSUE DETECTED
        │
        ▼
MULTIPLE PASSES NEEDED ──► PATTERN?
        │                     │
        │                     ▼
        │               ADD TO error-registry
        │               (if recurring)
        │                     │
        │                     ▼
        │               UPDATE rubric
        │               (add new criterion)
        │                     │
        └─────────────────────┘
              IMPROVEMENT
```

---

**Version**: 1.0.0
**Last Updated**: 2026-02-12
**For**: CircleTel critical outputs
**RSI Integration**: error-registry, compound-learnings
