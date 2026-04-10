---
name: referral-program
version: 1.0.0
description: "Create, optimize, or analyze CircleTel's referral and ambassador programs. Triggers: 'referral', 'affiliate', 'ambassador', 'word of mouth', 'refer a friend', 'partner referral', 'referral incentive', 'how to get referrals', 'ambassador code', 'ambassador program', 'affiliate payout'."
dependencies: [product-marketing-context, promotional-campaigns]
attribution: "Adapted from coreyhaines31/marketingskills (MIT License) for CircleTel"
---

# CircleTel Referral & Ambassador Program

Design and optimize programs that turn CircleTel customers and partners into growth engines.

## When This Skill Activates

This skill automatically activates when you:
- Design or optimize the customer referral program
- Plan ambassador program incentives and mechanics
- Analyze referral program performance
- Create referral email sequences or landing pages
- Set up affiliate/partner commission structures

**Keywords**: referral, affiliate, ambassador, word of mouth, refer a friend, partner referral, referral incentive, ambassador code, ambassador program, affiliate payout, CTPL partner

---

## CircleTel Context

**Read first**: `.claude/product-marketing-context.md` for brand voice.

### Existing Infrastructure

| Component | Implementation | Status |
|-----------|---------------|--------|
| **Ambassador table** | `supabase/migrations/20260227211006_create_marketing_ambassadors.sql` | Active |
| **Partner system** | `partners` table (CTPL-YYYY-NNN format) | Active |
| **Promotion tracking** | `lib/marketing/promotion-service.ts` (PromotionUsage includes `ambassador_code`) | Active |
| **Partner compliance** | `partner_compliance_documents` table | Active |

### CircleTel Programs

| Program | Type | Target |
|---------|------|--------|
| **Customer Referral** | Refer-a-friend | Existing residential & business customers |
| **Ambassador Program** | Community ambassador | Local influencers, community leaders |
| **Partner Program** | Channel partner (CTPL) | IT companies, estate agents, property managers |

---

## Customer Referral Program Design

### The Referral Loop

```
Trigger Moment -> Share Action -> Referred Converts -> Reward -> (Loop)
```

### Step 1: Identify Trigger Moments

**High-intent moments for ISP referrals:**
- After installation (excitement about new connection)
- After first positive speed test result
- After excellent support interaction
- After friend complains about their ISP (word-of-mouth)
- After load-shedding (CircleTel stayed up if customer has UPS)
- After price increase from competitor

### Step 2: Incentive Structure

**Double-sided rewards (recommended for CircleTel):**

| Tier | Referrer Reward | New Customer Reward |
|------|----------------|-------------------|
| **Residential** | R500 account credit | Free installation (worth R2,500) |
| **Business** | R1,000 account credit | Free installation + 1st month free |
| **Premium (SkyFibre)** | R1,500 account credit | Free installation + router upgrade |

**Margin validation:**
```
Max Referral Reward = (Customer LTV x Gross Margin) - Target CAC

Example (Residential):
- Average LTV: R1,299/mo x 18 months = R23,382
- Gross margin: ~85%
- Target CAC: R3,000
- Max reward: (R23,382 x 0.85) - R3,000 = R16,875
- Actual reward: R500 (well within margin)
```

### Step 3: Share Mechanism

**Ranked by effectiveness for SA market:**

1. **WhatsApp sharing** (highest reach in SA — everyone uses WhatsApp)
2. **Personalized referral link** (trackable, shareable anywhere)
3. **Referral code** (works offline — important for township/community channels)
4. **Email invitation** (lower conversion but still valuable for B2B)
5. **SMS sharing** (still widely used in SA)

### Step 4: Referral Landing Page

When a referred visitor lands on CircleTel:
- Show the referring customer's name/area (social proof)
- Highlight the new customer reward prominently
- Pre-fill coverage check with referred customer's area if possible
- Streamlined flow: Coverage > Package > Checkout

---

## Ambassador Program

### Who Are Ambassadors?

| Type | Profile | Reach |
|------|---------|-------|
| **Community leaders** | Body corporate chairs, community group admins | 100-500 households |
| **Local influencers** | Area bloggers, Facebook group admins | 500-5,000 followers |
| **Tech enthusiasts** | Local IT guys, gamers who test and share | 50-200 word-of-mouth |
| **Estate agents** | Property agents recommending to buyers/renters | 20-100 new residents/year |
| **Small business owners** | Well-connected local business people | 50-200 contacts |

### Ambassador Tiers

| Tier | Requirement | Reward |
|------|------------|--------|
| **Bronze** | 1-5 referrals/quarter | R300/successful referral |
| **Silver** | 6-15 referrals/quarter | R500/referral + quarterly bonus |
| **Gold** | 16+ referrals/quarter | R750/referral + free service + quarterly bonus |

### Ambassador Tools

Provide ambassadors with:
- Unique tracking code (linked to `ambassador_code` in promotion usage)
- Branded referral link
- WhatsApp-ready share templates
- Monthly performance dashboard
- Marketing collateral (digital flyers, social media templates)

---

## Partner Program (CTPL)

Partners are tracked in the `partners` table with CTPL-YYYY-NNN format.

### Partner Commission Structure

| Product | One-Time Commission | Recurring (12 months) |
|---------|--------------------|-----------------------|
| **Residential packages** | R500 per activation | — |
| **Business packages** | R1,000 per activation | 5% of monthly fee |
| **Enterprise/SkyFibre** | R2,500 per activation | 7.5% of monthly fee |

**Commission validation**: All commissions must maintain ≥25% gross margin after payout.

### Partner Compliance

Partners tracked in `partner_compliance_documents`:
- BBBEE certificate
- Tax clearance
- Service level agreement
- Insurance documentation

---

## Measuring Success

### Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Active referrers | Customers who referred in last 30 days | 10%+ of customer base |
| Referral conversion rate | Referred signups / Total referral clicks | 15-25% |
| Referral share of new customers | Referral signups / Total new customers | 20-30% |
| CAC via referral | Total reward cost / Referral signups | < R1,000 (vs. R3,000+ paid) |
| LTV of referred customers | Average MRR x Average tenure (referred) | 20%+ higher than non-referred |
| Ambassador tier distribution | % in Bronze/Silver/Gold | Target 20% Silver+ |

### SA-Specific Insights

- Referred customers have 16-25% higher LTV (global benchmark)
- Referred customers have 18-37% lower churn
- WhatsApp referrals convert 2-3x better than email in SA
- Community ambassador model works exceptionally well in estates and complexes

### ROI Calculation

```
Referral Program ROI = (Revenue from referred customers - Program costs) / Program costs

Program costs = Rewards paid + Tool costs + Management time

Example:
- 50 referrals/month x R1,299 avg MRR x 18 months avg tenure = R1,169,100 LTV
- Rewards: 50 x R500 = R25,000
- ROI = (R1,169,100 - R25,000) / R25,000 = 45.8x
```

---

## Referral Email Sequences

### Launch Announcement

```
Subject: Refer a friend to CircleTel — you both get rewarded

Hi [Name],

You can now earn R500 in account credit every time you refer someone to CircleTel.

Here's how it works:
1. Share your unique link: [referral_link]
2. Your friend signs up and gets free installation
3. You get R500 off your next bill

It's that simple. No limits on how many friends you can refer.

[Share on WhatsApp]  [Copy My Link]

— The CircleTel Team
```

### Referral Nurture (post-installation)

- Day 7 after install: "Loving your new connection? Share it"
- Day 30: "Know someone still stuck with [competitor]?"
- Day 60: Success story from referred customer in their area
- After milestone: "You've been connected X months — know others who'd benefit?"

---

## Launch Checklist

### Before Launch
- [ ] Define incentive structure and validate margins
- [ ] Set up ambassador tracking in Supabase (`ambassador_code` field)
- [ ] Build referral landing page with coverage check
- [ ] Create unique link/code generation system
- [ ] Set up WhatsApp share templates
- [ ] Define fraud prevention rules (same household, self-referral)
- [ ] Create terms and conditions
- [ ] Test complete referral flow end-to-end

### Launch
- [ ] Email announcement to all existing customers
- [ ] Add referral prompt in customer portal
- [ ] WhatsApp broadcast to opted-in customers
- [ ] Brief support team on program details

### Post-Launch (First 30 Days)
- [ ] Review conversion funnel
- [ ] Identify top referrers — consider ambassador tier
- [ ] Gather feedback on referral experience
- [ ] Fix friction points (share mechanism, reward delivery)

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Reward too small to motivate | R500 credit is meaningful for SA market |
| No WhatsApp sharing | WhatsApp is SA's #1 communication channel — essential |
| Complex referral flow | One click to share, clear tracking |
| No referred customer reward | Double-sided converts better |
| Ambassador without tools | Provide share templates, tracking, dashboard |
| Not tracking referred LTV separately | Referred customers are usually stickier — prove it |
| Ignoring community model | Estate/complex ambassadors are gold in SA |

---

## Related Skills

- **email-sequence**: For referral nurture email sequences
- **promotional-campaigns**: For referral program promotions (margin-validated)
- **churn-prevention**: Retained customers make the best referrers
- **ab-test-setup**: For testing referral incentive structures

---

## Related Files

- `supabase/migrations/20260227211006_create_marketing_ambassadors.sql` — Ambassador schema
- `lib/marketing/promotion-service.ts` — Promotion/ambassador tracking
- `.claude/skills/promotional-campaigns/references/pricing-guardrails.md` — Margin rules
- `.claude/product-marketing-context.md` — Brand voice for referral copy

---

**Version**: 1.0.0
**Last Updated**: 2026-04-10
**Attribution**: Adapted from [marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT) for CircleTel
