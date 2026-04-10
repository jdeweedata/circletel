---
name: churn-prevention
version: 1.0.0
description: "Reduce churn, build cancellation flows, set up save offers, recover failed payments, and implement retention strategies for CircleTel. Triggers: 'churn', 'cancel flow', 'save offer', 'dunning', 'failed payment recovery', 'retention', 'exit survey', 'pause subscription', 'customers leaving', 'churn rate', 'keep users', 'involuntary churn', 'win-back'."
dependencies: [product-marketing-context, email-sequence]
attribution: "Adapted from coreyhaines31/marketingskills (MIT License) for CircleTel"
---

# CircleTel Churn Prevention

Reduce both voluntary churn (customers choosing to cancel) and involuntary churn (failed payments) for CircleTel's subscription services.

## When This Skill Activates

This skill automatically activates when you:
- Design or optimize a cancellation flow
- Create save offers or retention strategies
- Set up dunning/payment recovery flows
- Analyze churn patterns and risk signals
- Build proactive retention interventions

**Keywords**: churn, cancel flow, save offer, dunning, failed payment, retention, exit survey, pause subscription, customers leaving, churn rate, win-back, involuntary churn

---

## CircleTel Context

**Read first**: `.claude/product-marketing-context.md` for brand voice.

### ISP-Specific Churn Reality

ISP churn differs from SaaS — customers don't churn casually because:
- Internet is a necessity, not a nice-to-have
- Switching ISPs involves installation/disruption
- Contract-free (CircleTel's advantage AND risk)

**CircleTel's unique churn risks:**
- No contracts = lower switching barrier
- SA competitors frequently run aggressive promotions
- Load-shedding frustration (even though it's not CircleTel's fault)
- Price sensitivity in SA market

### Billing Infrastructure

| Component | Implementation |
|-----------|---------------|
| **Payment provider** | NetCash Pay Now |
| **Billing tables** | `customer_invoices`, `customer_payment_methods` |
| **Promotion service** | `lib/marketing/promotion-service.ts` |
| **Email** | Resend (`billing@notify.circletel.co.za`) |

---

## Churn Types

| Type | Cause | % of Total | CircleTel Strategy |
|------|-------|-----------|-------------------|
| **Voluntary** | Customer chooses to cancel | 50-70% | Cancel flows, save offers, exit surveys |
| **Involuntary** | Payment fails | 30-50% | Dunning emails, retry logic, card updates |

Involuntary churn is often easier to fix — start there.

---

## Cancel Flow Design

### The Cancel Flow Structure

```
Trigger -> Exit Survey -> Dynamic Offer -> Confirmation -> Post-Cancel
```

### Exit Survey (CircleTel-Specific)

| Reason | What It Tells Us | Save Offer |
|--------|-----------------|------------|
| Too expensive | Price sensitivity | Downgrade to cheaper package |
| Moving house | Relocation | Check coverage at new address |
| Switching to competitor | Competitive pressure | Comparison + speed boost offer |
| Service quality issues | Technical problem | Escalate to support + credit |
| Not using enough / don't need | Overprovisioned | Downgrade + pause option |
| Load-shedding makes it useless | External frustration | UPS info + temporary discount |
| Installation took too long | Onboarding failure | Credit + escalation |
| Temporary / seasonal | Usage pattern | Pause subscription (1-3 months) |

**Survey best practices:**
- 1 question, single-select with optional free text
- 5-8 reason options max
- "Help us improve" framing, not guilt-tripping
- Most common reasons first (review quarterly)

### Dynamic Save Offers

**Match offer to reason — a discount won't save someone with quality issues.**

| Cancel Reason | Primary Offer | Fallback Offer |
|---------------|---------------|----------------|
| Too expensive | Downgrade package | 20% off for 2 months (check margin) |
| Moving house | Coverage check at new address | Pause until move completes |
| Switching to competitor | Speed comparison + 3-month speed boost | Retention discount (MD approval if >10%) |
| Service quality | Escalate to tech + R200 credit | Priority support for 3 months |
| Not using enough | Downgrade to entry package | Pause 1-3 months |
| Load-shedding | UPS guide + R100 credit | Pause during heavy shedding periods |

### Save Offer Margin Validation

**CRITICAL**: All save offers must comply with margin guardrails from `margin-guardrails.md`:

```
Effective Price after offer >= COS Floor + 25% margin
```

**Discount limits (without MD approval):**
- Price discount: max 10%
- Free months (on 12mo): max 2 months
- Installation waiver: full waiver allowed
- Speed boost (temporary): max 6 months

### Cancel Flow UI Pattern

```
+-----------------------------------------+
|  We're sorry to see you go              |
|                                         |
|  What's the main reason you're          |
|  cancelling your CircleTel service?     |
|                                         |
|  o Too expensive for my needs           |
|  o Moving to a new address              |
|  o Switching to another provider        |
|  o Service quality / speed issues       |
|  o Don't need internet right now        |
|  o Load-shedding makes it useless       |
|  o Other: [____________]               |
|                                         |
|  [Continue]                             |
|  [Never mind, keep my service]          |
+-----------------------------------------+
         | (selects reason)
         v
+-----------------------------------------+
|  Before you go...                       |
|                                         |
|  [Dynamic offer based on reason]        |
|                                         |
|  [Accept Offer]                         |
|  [No thanks, continue cancelling]       |
+-----------------------------------------+
```

**UI principles:**
- Keep "continue cancelling" visible — no dark patterns
- One primary offer + one fallback
- Show specific Rand savings
- Mobile-friendly (many cancel on phone)
- Include WhatsApp support link

---

## Churn Prediction & Proactive Retention

### Risk Signals (ISP-Specific)

| Signal | Risk Level | Timeframe |
|--------|-----------|-----------|
| Support tickets spike then stop | High | 1-2 weeks before cancel |
| Speed test complaints | High | 2-4 weeks before cancel |
| Billing page visits increase | High | Days before cancel |
| No data usage for 7+ days | Medium | 2-3 weeks before cancel |
| Email engagement drops | Medium | 2-6 weeks before cancel |
| Visited competitor pages (if trackable) | High | Days before cancel |
| Requested usage/billing data export | Critical | Days before cancel |

### Proactive Interventions

| Trigger | Intervention |
|---------|-------------|
| Usage drop >50% for 2 weeks | Email: "Is everything okay with your connection?" |
| Speed complaints in support | Proactive tech check + speed optimization |
| Approaching data limit (if applicable) | Upgrade nudge with savings comparison |
| No login to customer portal for 30 days | Re-engagement email with new features |
| Annual renewal in 30 days | Value recap + renewal confirmation |
| Load-shedding escalation in their area | Proactive UPS advice email |

---

## Involuntary Churn: Payment Recovery

### The Dunning Stack (NetCash)

```
Pre-dunning -> Payment fails -> Retry -> Dunning emails -> Grace period -> Suspend
```

### Pre-Dunning (Prevent Failures)

- **Card expiry alerts**: Email 30, 15, and 7 days before card expires
- **Payment reminder**: Email 3 days before monthly debit
- **Multiple payment methods**: Encourage backup payment method on file

### Dunning Email Sequence

| Email | Timing | Tone | Content |
|-------|--------|------|---------|
| 1 | Day 0 | Friendly alert | "Your payment didn't go through — update your details" |
| 2 | Day 3 | Helpful | "Quick reminder — update your payment to keep connected" |
| 3 | Day 7 | Urgent | "Your CircleTel service will be paused in 3 days" |
| 4 | Day 10 | Final | "Last chance to keep your connection active" |

**Email best practices:**
- Direct link to payment update page
- Show what they'll lose (connection, static IP, email)
- Don't blame ("payment didn't go through" not "you failed to pay")
- Include WhatsApp support link
- Plain text performs better than designed emails for dunning

### Grace Period

| Setting | Recommendation |
|---------|---------------|
| Duration | 7 days after final retry |
| Access | Degraded (reduced speed, not full cutoff) |
| Visibility | Customer portal banner: "Payment overdue" |
| Communication | Continue dunning emails |

After grace period: Suspend service (don't delete account).

### Recovery Benchmarks

| Metric | Target |
|--------|--------|
| Soft decline recovery | 70%+ |
| Hard decline recovery | 30%+ |
| Overall payment recovery | 50-60% |
| Pre-dunning prevention | 20-30% |

---

## Metrics & Measurement

### Key Churn Metrics

| Metric | Formula | CircleTel Target |
|--------|---------|-----------------|
| Monthly churn rate | Churned / Start-of-month customers | <3% residential, <2% business |
| Revenue churn (net) | (Lost MRR - Expansion MRR) / Start MRR | Negative (net expansion) |
| Cancel flow save rate | Saved / Total cancel sessions | 25-35% |
| Offer acceptance rate | Accepted / Shown | 15-25% |
| Pause reactivation rate | Reactivated / Total paused | 60-80% |
| Dunning recovery rate | Recovered / Total failed | 50-60% |

### Cohort Analysis

Segment churn by:
- **Product type**: Fibre vs. FWA vs. LTE (different churn profiles)
- **Customer type**: Residential vs. Business
- **Tenure**: 30-day, 90-day, 6-month, 12-month retention curves
- **Area**: Geographic patterns (competitor coverage overlap)
- **Cancel reason**: Which reasons are growing?
- **Acquisition channel**: Which channels bring stickier customers?

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| No cancel flow at all | Even a simple survey + one offer saves 10-15% |
| Making cancellation hard to find | Hidden cancel breeds resentment and Hellopeter complaints |
| Same offer for every reason | Match offer to reason |
| Discounts too deep (>15%) | Value-adds preferred over price cuts |
| Ignoring involuntary churn | Easiest to fix — start here |
| No dunning emails | Silent payment failures = lost customers |
| Guilt-trip copy | Damages brand trust — stay empathetic per brand voice |
| Not tracking saved customer LTV | Customer who churns 30 days later wasn't really saved |

---

## Related Skills

- **email-sequence**: For dunning and win-back email sequences
- **referral-program**: Retained customers are best referrers
- **promotional-campaigns**: For retention-focused promotions (margin-validated)
- **ab-test-setup**: For testing cancel flow variations

---

## Related Files

- `lib/marketing/promotion-service.ts` — Save offer implementation
- `lib/inngest/functions/marketing-triggers.ts` — Automated triggers
- `supabase/migrations/20251201000003_create_marketing_email_preferences.sql` — Email prefs
- `.claude/rules/margin-guardrails.md` — Discount limits
- `.claude/product-marketing-context.md` — Brand voice for all customer comms

---

**Version**: 1.0.0
**Last Updated**: 2026-04-10
**Attribution**: Adapted from [marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT) for CircleTel
