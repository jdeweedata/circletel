---
name: email-sequence
version: 1.0.0
description: "Create or optimize email sequences, drip campaigns, and lifecycle email flows for CircleTel. Triggers: 'email sequence', 'drip campaign', 'nurture sequence', 'onboarding emails', 'welcome sequence', 're-engagement emails', 'email automation', 'lifecycle emails', 'email funnel', 'email workflow', 'what emails should I send', 'welcome series', 'email cadence', 'dunning emails'."
dependencies: [product-marketing-context, promotional-campaigns]
attribution: "Adapted from coreyhaines31/marketingskills (MIT License) for CircleTel"
---

# CircleTel Email Sequence Design

Create email sequences that nurture relationships, drive activation, and move prospects toward becoming CircleTel customers.

## When This Skill Activates

This skill automatically activates when you:
- Design welcome/onboarding email sequences for new customers
- Create lead nurture sequences after coverage checks
- Build re-engagement sequences for inactive customers
- Plan dunning/payment recovery email flows
- Design promotional email campaigns

**Keywords**: email sequence, drip campaign, nurture, onboarding emails, welcome sequence, re-engagement, email automation, lifecycle emails, email funnel, dunning, payment recovery

---

## CircleTel Context

**Read first**: `.claude/product-marketing-context.md` for brand voice and persona messaging.

### Email Infrastructure

| Component | Implementation |
|-----------|---------------|
| **Transactional email** | Resend (`billing@notify.circletel.co.za`) |
| **Email preferences** | `supabase/migrations/20251201000003_create_marketing_email_preferences.sql` |
| **Inngest triggers** | `lib/inngest/functions/marketing-triggers.ts` |
| **Promotion service** | `lib/marketing/promotion-service.ts` |

### CircleTel Email Principles

1. **South African tone** — Warm, direct, no corporate fluff (per brand voice)
2. **Outcome-focused** — Lead with what internet enables, not speeds
3. **Fear-addressing** — Counter ISP trust issues (hidden fees, contracts, slow support)
4. **Rand pricing** — Always show prices in ZAR with VAT clarity
5. **Mobile-first** — High SA mobile email opens — short, scannable

---

## Core Principles

### 1. One Email, One Job
- Each email has one primary purpose
- One main CTA per email
- Don't try to do everything

### 2. Value Before Ask
- Lead with usefulness
- Build trust through helpful content
- Earn the right to sell

### 3. Relevance Over Volume
- Fewer, better emails win
- Segment by persona (B2B vs. B2C, area, product interest)
- Quality > frequency

---

## CircleTel Sequence Types

### 1. Post-Coverage-Check Sequence (Lead Nurture)

**Trigger**: Customer completes coverage check but doesn't order
**Length**: 5-7 emails over 14 days
**Goal**: Convert to package selection

| Email | Timing | Purpose | Subject Line |
|-------|--------|---------|-------------|
| 1 | Immediate | Confirm coverage result + top packages | "Great news — you're covered in [Area]" |
| 2 | Day 2 | Address #1 fear: hidden costs | "What you'll actually pay — no surprises" |
| 3 | Day 4 | Social proof from their area | "How [Name] in [Area] got connected in 7 days" |
| 4 | Day 7 | Address #2 fear: contracts | "No contracts. Cancel anytime. Seriously." |
| 5 | Day 10 | Feature comparison vs. competitor | "CircleTel vs. [local competitor] — honest comparison" |
| 6 | Day 12 | Urgency + offer (if margin allows) | "Free installation this month — check your options" |
| 7 | Day 14 | Last touch, soft close | "Still looking for internet in [Area]?" |

### 2. New Customer Welcome Sequence

**Trigger**: Customer signs up for a package
**Length**: 5 emails over 14 days
**Goal**: Activate, set expectations, build loyalty

| Email | Timing | Purpose | Subject Line |
|-------|--------|---------|-------------|
| 1 | Immediate | Welcome + installation timeline | "Welcome to CircleTel — here's what happens next" |
| 2 | Day 1 | Getting ready for installation | "Preparing for your installation on [date]" |
| 3 | Post-install | Speed test + support info | "You're connected! Test your speed now" |
| 4 | Day 7 | Check-in, support availability | "How's your connection? We're here if you need us" |
| 5 | Day 14 | Referral program introduction | "Know someone who needs better internet?" |

### 3. Business Customer Onboarding

**Trigger**: B2B customer signs contract
**Length**: 6 emails over 21 days
**Goal**: Activate, demonstrate SLA value, upsell managed services

| Email | Timing | Purpose |
|-------|--------|---------|
| 1 | Immediate | Welcome + dedicated account manager intro |
| 2 | Day 2 | SLA details + how to reach priority support |
| 3 | Day 5 | Network monitoring setup guide |
| 4 | Day 10 | Business features walkthrough (static IP, VoIP quality) |
| 5 | Day 14 | ROI check-in — productivity gains |
| 6 | Day 21 | Managed IT services introduction |

### 4. Re-Engagement Sequence

**Trigger**: 30+ days inactive (no login, no support contact, no payment page visit)
**Length**: 3-4 emails over 14 days
**Goal**: Win back or identify churn risk early

| Email | Timing | Tone | Subject Line |
|-------|--------|------|-------------|
| 1 | Day 30 | Genuine check-in | "Is everything okay with your connection?" |
| 2 | Day 35 | Value reminder | "Did you know about these features?" |
| 3 | Day 40 | Offer (if appropriate) | "A little something for being a CircleTel customer" |
| 4 | Day 45 | Direct ask | "Should we check in about your service?" |

### 5. Payment Recovery (Dunning) Sequence

**Trigger**: Failed payment via NetCash
**Length**: 4 emails over 10 days
**Goal**: Recover payment, prevent involuntary churn

| Email | Timing | Tone | Subject Line |
|-------|--------|------|-------------|
| 1 | Day 0 | Friendly alert | "Heads up — your payment didn't go through" |
| 2 | Day 3 | Helpful reminder | "Quick reminder — update your payment details" |
| 3 | Day 7 | Urgency | "Your CircleTel service will be paused in 3 days" |
| 4 | Day 10 | Final warning | "Last chance to keep your service active" |

**Dunning email best practices:**
- Direct link to payment update (no login required if possible)
- Show what they'll lose (their connection, any static IP, etc.)
- Don't blame ("your payment didn't go through" not "you failed to pay")
- Include WhatsApp support link for help
- Plain text performs better than designed emails for dunning

---

## Email Copy Guidelines

### Structure
1. **Hook**: First line grabs attention (outcome, not feature)
2. **Context**: Why this matters to them
3. **Value**: The useful content
4. **CTA**: What to do next (one primary action)
5. **Sign-off**: Human, warm ("The CircleTel Team" or individual name)

### Formatting
- Short paragraphs (1-3 sentences)
- White space between sections
- Bullet points for scanability
- Bold for emphasis (sparingly)
- Mobile-first (most SA users read email on phone)

### Tone (per CircleTel brand voice)
- Confident but not arrogant
- Empathetic — we understand ISP frustration
- Direct — get to the point
- South African — use local context naturally

### Length
- Transactional: 50-125 words
- Educational: 150-300 words
- Story-driven: 300-500 words max

### Subject Lines
- Clear > Clever
- Specific > Vague
- 40-60 characters ideal
- Avoid ALL CAPS, excessive punctuation
- Test personalization ([Name], [Area])

### CTA Language (per product-marketing-context)
- "Check My Coverage" (not "Sign Up")
- "See Plans for My Area" (not "Get Started")
- "Update Payment Details" (not "Click Here")
- "Chat With Us on WhatsApp" (not "Contact Support")

---

## Output Format

### Sequence Overview
```
Sequence Name: [Name]
Trigger: [What starts the sequence]
Goal: [Primary conversion goal]
Length: [Number of emails]
Timing: [Delay between emails]
Exit Conditions: [When they leave — e.g., converts, unsubscribes, triggers different sequence]
Resend Integration: [How it connects to existing Resend setup]
```

### For Each Email
```
Email [#]: [Name/Purpose]
Send: [Timing from trigger]
Subject: [Subject line]
Preview: [Preview text, 90-140 chars]
Body: [Full copy following CircleTel brand voice]
CTA: [Button text] -> [Link destination]
Segment/Conditions: [B2B vs B2C, area, etc.]
```

---

## Metrics & Benchmarks

| Metric | SA ISP Benchmark | CircleTel Target |
|--------|-----------------|-----------------|
| Open rate | 20-25% | 30%+ (relevant, segmented) |
| Click rate | 2-4% | 5%+ |
| Unsubscribe rate | <0.5% | <0.3% |
| Coverage-to-order conversion | 5-10% | 15%+ with nurture |
| Dunning recovery rate | 30-40% | 50%+ |

---

## Related Skills

- **churn-prevention**: For cancel flows and retention strategy
- **referral-program**: For referral email sequences
- **promotional-campaigns**: For promotional email campaigns (margin validation)
- **ab-test-setup**: For testing email elements

---

## Related Files

- `lib/inngest/functions/marketing-triggers.ts` — Automated triggers
- `lib/marketing/promotion-service.ts` — Promotion validation
- `supabase/migrations/20251201000003_create_marketing_email_preferences.sql` — Preference schema
- `.claude/product-marketing-context.md` — Brand voice reference

---

**Version**: 1.0.0
**Last Updated**: 2026-04-10
**Attribution**: Adapted from [marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT) for CircleTel
