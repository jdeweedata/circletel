---
name: ab-test-setup
version: 1.0.0
description: "Plan, design, or implement A/B tests and growth experiments for CircleTel. Triggers: 'A/B test', 'split test', 'experiment', 'test this change', 'variant', 'multivariate test', 'hypothesis', 'should I test this', 'which version is better', 'statistical significance', 'how long should I run this test', 'growth experiments', 'ICE score'."
dependencies: [product-marketing-context]
attribution: "Adapted from coreyhaines31/marketingskills (MIT License) for CircleTel"
---

# CircleTel A/B Test Setup

Design and run experiments that produce statistically valid, actionable results for CircleTel's conversion funnel.

## When This Skill Activates

This skill automatically activates when you:
- Design A/B tests for CircleTel pages or flows
- Calculate sample sizes for experiments
- Plan a growth experimentation program
- Evaluate which version of a page/component performs better
- Prioritize experiment ideas with ICE scoring

**Keywords**: A/B test, split test, experiment, test this change, variant, hypothesis, should I test this, which version is better, statistical significance, how long to run, growth experiments, ICE score, conversion rate

---

## CircleTel Context

**Read first**: `.claude/product-marketing-context.md` for personas and messaging before designing test variants.

### Key Conversion Points to Test

| Funnel Stage | Page/Component | Current Metric |
|-------------|----------------|---------------|
| **Awareness** | Homepage hero | Bounce rate, scroll depth |
| **Interest** | Product pages | Time on page, CTA clicks |
| **Coverage** | Coverage check form | Form completion rate |
| **Selection** | Package selector | Package selection rate |
| **Checkout** | Checkout flow | Checkout completion rate |
| **B2B** | Business quote form | Quote submission rate |

### CircleTel-Specific Test Ideas

| Test | Hypothesis | Metric |
|------|-----------|--------|
| Hero headline: feature vs. outcome | Outcome-focused copy converts better (per brand voice) | CTA click rate |
| Coverage check placement | Above-fold placement increases checks | Form starts |
| Pricing: show/hide competitor comparison | Showing competitor comparison increases confidence | Package selection |
| Social proof: Hellopeter vs. Google reviews | Hellopeter more trusted by SA customers | Conversion rate |
| Free installation badge visibility | Prominent badge reduces price objection | Checkout rate |
| Load-shedding messaging | Mentioning backup/UPS increases business signups | B2B quote rate |

---

## Core Principles

### 1. Start with a Hypothesis

**Structure:**
```
Because [observation/data],
we believe [change]
will cause [expected outcome]
for [audience].
We'll know this is true when [metric changes by X%].
```

**Example (CircleTel):**
```
Because SA customers fear hidden fees (per product-marketing-context),
we believe adding "No hidden fees" badge next to pricing
will increase package selection rate by 10%+
for residential visitors.
We'll measure click-through from pricing to checkout.
```

### 2. Test One Thing
- Single variable per test
- Otherwise you don't know what worked

### 3. Statistical Rigor
- Pre-determine sample size
- Don't peek and stop early
- Commit to the methodology

### 4. Measure What Matters
- **Primary metric**: Tied to business value (MRR, signups)
- **Secondary metrics**: Context (time on page, scroll depth)
- **Guardrail metrics**: Things that shouldn't get worse (support tickets, bounce rate)

---

## Sample Size Quick Reference

| Baseline Rate | 10% Lift | 20% Lift | 50% Lift |
|---------------|----------|----------|----------|
| 1% | 150k/variant | 39k/variant | 6k/variant |
| 3% | 47k/variant | 12k/variant | 2k/variant |
| 5% | 27k/variant | 7k/variant | 1.2k/variant |
| 10% | 12k/variant | 3k/variant | 550/variant |

**Calculators**: [Evan Miller's](https://www.evanmiller.org/ab-testing/sample-size.html)

### CircleTel Traffic Consideration

CircleTel is a startup — traffic may be limited. For low-traffic scenarios:
- Test bolder changes (larger expected effect size)
- Use sequential testing methods if needed
- Consider 80% confidence threshold for early-stage decisions
- Focus tests on highest-traffic pages first

---

## Test Types

| Type | Description | Traffic Needed | When to Use |
|------|-------------|----------------|-------------|
| A/B | Two versions, single change | Moderate | Default choice |
| A/B/n | Multiple variants | Higher | Testing 3+ headline options |
| Split URL | Different URLs for variants | Moderate | Major layout changes |

**Avoid MVT (multivariate)** until CircleTel has significant traffic volume.

---

## Metrics Selection

### Example: Product Page Test

- **Primary**: Package selection rate (clicks "Choose Plan")
- **Secondary**: Time on page, scroll to pricing section
- **Guardrail**: Support chat initiations (shouldn't spike), bounce rate

### Example: Coverage Check Test

- **Primary**: Coverage form completion rate
- **Secondary**: Address field interactions, error rate
- **Guardrail**: Fake/invalid submissions

---

## Implementation

### Next.js A/B Testing Options

**Server-side (recommended — no flicker):**
- Middleware-based variant assignment (`middleware.ts`)
- Cookie-based persistence across sessions
- Works with Vercel Edge functions

**Client-side:**
- React state-based variant rendering
- Can cause layout flicker
- Simpler to implement for quick tests

### Tools Compatible with CircleTel Stack

| Tool | Type | Integration |
|------|------|-------------|
| **Vercel Experimentation** | Server-side | Native with Next.js |
| **PostHog** | Full-stack | Self-hosted or cloud |
| **Google Optimize** | Client-side | Via GTM (sunset — use alternatives) |

---

## Running the Test

### Pre-Launch Checklist

- [ ] Hypothesis documented with expected effect size
- [ ] Primary metric defined and measurable
- [ ] Sample size calculated based on CircleTel traffic
- [ ] Variants implemented correctly (both paths work)
- [ ] Tracking verified in analytics
- [ ] QA completed on mobile + desktop
- [ ] Margin impact checked (if pricing-related — see `margin-guardrails.md`)

### During the Test

**DO**: Monitor for technical issues, check segment quality, document external factors (campaigns running, seasonal effects)

**AVOID**: Peeking at results early, making changes mid-test, launching promotions that skew traffic

### The Peeking Problem

Looking at results before reaching sample size leads to false positives. Pre-commit to sample size and duration.

---

## Analyzing Results

### Statistical Significance
- 95% confidence = p-value < 0.05
- Means <5% chance result is random

### Analysis Checklist

1. **Reached sample size?** If not, result is preliminary
2. **Statistically significant?** Check confidence intervals
3. **Effect size meaningful?** Worth implementing?
4. **Secondary metrics consistent?** Support the primary?
5. **Guardrail concerns?** Anything get worse?
6. **Segment differences?** Mobile vs. desktop? B2B vs. B2C? Gauteng vs. other?

---

## Growth Experimentation Program

### ICE Prioritization

Score each hypothesis 1-10:

| Dimension | Question |
|-----------|----------|
| **Impact** | If this works, how much does it move conversion/MRR? |
| **Confidence** | How sure are we? (Data > gut feeling) |
| **Ease** | How fast can we ship and measure this? |

**ICE Score** = (Impact + Confidence + Ease) / 3

### Experiment Velocity Targets

| Metric | CircleTel Target (Startup) |
|--------|---------------------------|
| Experiments per month | 2-4 (limited traffic) |
| Win rate | 20-30% is healthy |
| Average test duration | 2-4 weeks |
| Backlog depth | 10+ hypotheses queued |

### The Experiment Playbook

Document every test:
```
## [Experiment Name]
**Date**: [date]
**Hypothesis**: [the hypothesis]
**Sample size**: [n per variant]
**Result**: [winner/loser/inconclusive] — [metric] changed by [X%] (p=[value])
**Why it worked/failed**: [analysis]
**Pattern**: [reusable insight]
**Apply to**: [other pages where this pattern might work]
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Testing too small a change | Bold changes = detectable results |
| No clear hypothesis | Write it down before building |
| Stopping early | Pre-commit to sample size |
| Cherry-picking segments | Pre-define segments of interest |
| Ignoring mobile/desktop split | SA has high mobile usage — always segment |

---

## Related Skills

- **promotional-campaigns**: For campaign-specific landing page tests
- **seo-audit**: For measuring SEO impact of content changes
- **email-sequence**: For testing email elements (subject lines, CTAs)
- **churn-prevention**: For testing cancel flow variations

---

**Version**: 1.0.0
**Last Updated**: 2026-04-10
**Attribution**: Adapted from [marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT) for CircleTel
