---
name: promotional-campaigns
version: 1.0.0
description: "Create promotional campaigns and respond to competitor offers for CircleTel. Triggers: 'promo', 'promotional campaign', 'competitor offer', 'react to [X]', 'counter campaign', 'special offer', 'seasonal promotion', 'Black Friday', 'back to school', 'price match'."
dependencies: [brand-design, copywriting, competitor-alternatives]
---

# CircleTel Promotional Campaigns

Create promotional campaigns that drive customer acquisition while maintaining ≥25% gross margin discipline. React strategically to competitor offers with counter-positioning or value-add responses.

## When This Skill Activates

This skill automatically activates when you:
- Create promotional campaigns for CircleTel products
- React to competitor offers or pricing moves
- Plan seasonal promotions (Black Friday, tax season, back to school)
- Need counter-campaign strategies against specific competitors
- Design special offers or limited-time deals
- Calculate promotional pricing to ensure margin compliance

**Keywords**: promo, promotional campaign, special offer, competitor offer, react to, counter campaign, price match, seasonal promotion, Black Friday, back to school, WiruLink, Rain, Afrihost, MTN, Vodacom, discount, limited time, bundle deal

## Quick Reference

| Need | Action |
|------|--------|
| Create a campaign | [Campaign Creation Framework](#campaign-creation-framework) |
| React to competitor | [Competitor Response Framework](#competitor-response-framework) |
| Check margin impact | [Pricing Guardrails](#pricing-guardrails) |
| Get templates | See `references/campaign-templates.md` |
| Competitor playbook | See `references/competitor-playbook.md` |

---

## Campaign Creation Framework

### Step 1: Define Campaign Objective

| Objective Type | Goal | Metric |
|----------------|------|--------|
| **Acquisition** | New customer sign-ups | Net new MRR, CAC |
| **Upsell** | Existing customers upgrade | ARPU increase |
| **Win-back** | Reactivate churned customers | Reactivation rate |
| **Referral** | Customer referrals | Referral conversion % |
| **Seasonal** | Capitalize on buying moments | Campaign period revenue |
| **Competitive** | Counter competitor moves | Market share defense |

### Step 2: Select Target Segment

| Segment | Product Focus | Messaging Angle |
|---------|--------------|-----------------|
| **SME (2-50 staff)** | SkyFibre SMB | Productivity, reliability |
| **SOHO/Freelancer** | WorkConnect SOHO | Work-from-home, video calls |
| **Office Parks** | ParkConnect DUNE | Shared infrastructure, premium |
| **Healthcare** | ClinicConnect | Reliability-critical, compliance |
| **Budget-conscious** | AirLink FWA | Affordable entry point |
| **Mobile workers** | CircleConnect | Nationwide coverage |

### Step 3: Design the Offer

**CRITICAL: Never discount below COS + 25%** — See [Pricing Guardrails](#pricing-guardrails)

**Offer Types (Best to Worst for Margin):**

| Type | Example | Margin Impact | Use When |
|------|---------|---------------|----------|
| **Value-add** | Free installation worth R2,500 | Neutral (bundled cost) | Acquisition campaigns |
| **Extended trial** | First 2 months free (10mo commitment) | ~17% revenue dilution | High LTV products |
| **Speed boost** | Free upgrade for 6 months | Low (minimal COS increase) | Upsell/retention |
| **Bundle discount** | 10% off when adding Managed IT | Offset by additional MRR | Cross-sell |
| **Price discount** | 15% off monthly fee | Direct margin hit | LAST RESORT only |

### Step 4: Validate Margin

Before finalizing ANY promotional price:

```
Effective Price = (Standard Price × Discount%) OR (Standard Price - Free Months Amortized)
Gross Margin = (Effective Price - COS Floor) / Effective Price × 100

IF Gross Margin < 25% → REJECT the offer
IF Gross Margin 25-30% → Requires MD approval
IF Gross Margin > 30% → Proceed
```

**Example Calculation:**
```
SkyFibre SMB 50/25: R1,899/mo
Offer: 2 months free on 12-month contract
Effective revenue: 10 × R1,899 ÷ 12 = R1,582.50/mo
COS Floor: R175.43
Gross Margin: (R1,582.50 - R175.43) / R1,582.50 = 88.9% ✓

Even with 2 free months, margin is healthy — PROCEED
```

### Step 5: Create Campaign Assets

For each campaign, generate:

1. **Campaign concept** - Name, positioning, key message
2. **Marketing copy** - Use `copywriting` skill
3. **Visual assets** - Use `brand-design` skill for image prompts
4. **Landing page brief** - Hero, benefits, CTA
5. **Sales enablement** - Talking points, objection handling

---

## Competitor Response Framework

### Step 1: Analyze the Competitor Offer

| Question | Why It Matters |
|----------|----------------|
| What's the actual price/offer? | Verify claims (often marketing spin) |
| What segment are they targeting? | Does it overlap with ours? |
| What's their technology? | Can we differentiate on capability? |
| What's the catch? | Fair usage, contract lock-in, hidden fees? |
| Is it sustainable for them? | Aggressive pricing may be short-term |

### Step 2: Choose Response Strategy

| Strategy | When to Use | CircleTel Action |
|----------|-------------|------------------|
| **Differentiate** | Technology gap exists | Lead with Tarana latency, reliability |
| **Value-add** | Price-sensitive segment | Bundle extras vs. matching price |
| **Ignore** | Different segment/geography | Focus on our strengths |
| **Match** | Direct competition, strategic account | MD approval required |
| **Flank** | Can't win head-on | Target adjacent segment |

### Step 3: Execute Counter-Campaign

**For detailed competitor-specific playbooks**, see `references/competitor-playbook.md`

**Quick Response Template:**
```markdown
## Competitor: [Name]
## Their Offer: [Description]

### Our Counter-Position:
- **Lead with:** [Technology/service advantage]
- **Avoid:** [Don't compete on price alone]
- **Talking point:** "[Single memorable statement]"

### Recommended CircleTel Offer:
- Product: [X]
- Standard price: R[X]/mo
- Promotional offer: [Value-add, not discount]
- Campaign period: [X weeks]
- Target accounts: [X customers in segment]

### Margin Check:
- Effective price: R[X]/mo
- COS: R[X]
- Gross margin: [X]% ✓
```

---

## Pricing Guardrails

### Cost of Sale (COS) Floors

| Product | COS Floor | Min Price (25% margin) | Standard Price |
|---------|-----------|------------------------|----------------|
| **SkyFibre SMB** | R175.43 | R234 | R1,899-4,899 |
| **BizFibreConnect** | ~R150 | R200 | R1,699-4,373 |
| **AirLink FWA** | ~R100 | R133 | R599-1,699 |
| **ParkConnect DUNE** | ~R500/tenant | R667 | R1,299-4,999 |
| **CircleConnect LTE** | ~R300 | R400 | Package-dependent |
| **ClinicConnect** | ~R300 | R400 | R450 |

**Note:** COS excludes installation, CPE, and tower/site allocation. Full margin models in product specs.

### Non-Negotiable Rules

1. **≥25% gross margin on ALL products** — no exceptions without MD written approval
2. **Installation revenue ≥ installation cost** — never subsidize installation
3. **Hardware amortization** included in margin calculations
4. **Value-adds preferred** over price discounts
5. **Contract term extension** acceptable to offset promotions

### Discount Approval Matrix

| Discount Type | Max Without Approval | MD Approval Required |
|--------------|---------------------|----------------------|
| Free months (12mo contract) | 2 months | 3+ months |
| Price discount | 10% | >10% |
| Installation waiver | Full waiver allowed | N/A |
| Speed boost (temp) | 6 months | >6 months |
| Bundle discount | 15% | >15% |

---

## Seasonal Campaign Calendar

| Period | Trigger | Focus Products | Typical Offer |
|--------|---------|----------------|---------------|
| **Jan-Feb** | New year, budget planning | SkyFibre SMB, Managed IT | "New year, new speed" - installation waiver |
| **Mar-Apr** | Tax season | SkyFibre SMB | "Tax season speed" - 1 month free |
| **May-Jun** | Mid-year | AirLink FWA | Entry-level campaigns |
| **Aug-Sep** | Back to school | WorkConnect SOHO | WFH setups, student discounts |
| **Oct-Nov** | Black Friday | ALL | Major seasonal push |
| **Dec** | Quiet period | Retention focus | Loyalty rewards |

---

## Output Templates

When creating campaigns, structure output as:

### Campaign Brief

```markdown
## [Campaign Name]

**Objective:** [Acquisition/Upsell/Win-back/Seasonal/Competitive]
**Target Segment:** [Specific persona]
**Product(s):** [CircleTel product line]
**Campaign Period:** [Start] - [End]

### The Offer
[Clear description of promotional offer]

### Margin Validation
- Standard price: R[X]/mo
- Effective price: R[X]/mo (after promo)
- COS floor: R[X]
- Gross margin: [X]% [✓ or ✗]

### Key Messages
1. [Primary message]
2. [Supporting message]
3. [Urgency/CTA message]

### Required Assets
- [ ] Landing page copy (use copywriting skill)
- [ ] Social media posts
- [ ] Email sequence
- [ ] Sales one-pager
- [ ] AI image prompts (use brand-design skill)

### Success Metrics
- Target: [X] new customers / [X] MRR
- Tracking: [How we'll measure]
```

---

## Integration with Other Skills

| Skill | When to Invoke | Purpose |
|-------|----------------|---------|
| **brand-design** | After campaign concept | Generate visual assets with correct branding |
| **copywriting** | For all campaign copy | Headlines, body copy, CTAs |
| **competitor-alternatives** | Deep competitive analysis | Detailed competitor positioning |
| **email-sequence** | Nurture campaigns | Multi-touch email flows |

---

## Examples

### Example 1: Black Friday Campaign

**User:** "Create a Black Friday campaign for SkyFibre SMB"

**Response:**
```markdown
## SkyFibre SMB Black Friday 2026

**Objective:** Acquisition
**Target:** SMEs (2-50 staff) in Gauteng
**Product:** SkyFibre SMB 50/25
**Period:** 15 Nov - 30 Nov 2026

### The Offer
- FREE installation (worth R2,500)
- FREE router upgrade to premium Tarana unit
- First month at R999 (standard R1,899)
- 12-month commitment required

### Margin Validation
- Standard price: R1,899/mo
- Month 1: R999
- Months 2-12: R1,899
- Average: (R999 + R1,899×11) ÷ 12 = R1,824/mo
- COS: R175.43
- Gross margin: 90.4% ✓

### Key Messages
1. "50Mbps. Sub-5ms latency. Your Zoom calls will thank you."
2. "Enterprise-grade connectivity at SME prices"
3. "Black Friday only: R2,500 installation FREE"
```

### Example 2: Competitor Response

**User:** "Rain is offering R399 unlimited 5G. How should we respond?"

**Response:**
```markdown
## Competitor Analysis: Rain R399 Unlimited 5G

### Their Offer
- R399/mo unlimited 5G
- Network congestion issues widely reported
- No SLA, best-effort service
- Limited coverage (metro areas)

### Our Strategy: DIFFERENTIATE (don't price match)

Rain targets price-sensitive mobile users. Our SkyFibre SMB targets
businesses needing RELIABLE connectivity. Different segment — don't
compete on price.

### Counter-Position
- Lead with: "When your business depends on it, best-effort isn't good enough"
- Technology advantage: Tarana G1 = sub-5ms latency vs. 5G congestion
- Target: Businesses frustrated with 5G unreliability

### Recommended Campaign: "Reliability Over Promises"
- Product: SkyFibre SMB entry (50/25)
- Price: R1,899/mo (NO discount — we're premium)
- Value-add: Free installation + 30-day satisfaction guarantee
- Message: "Your video calls. Your cloud backups. Your business.
           Don't leave them to network congestion."

### Talking Points for Sales Team
1. "Rain's 'unlimited' has fair use caps at 50GB/day"
2. "5G tower sharing means congestion at peak times"
3. "We guarantee sub-5ms latency — can they?"
4. "Business SLA vs. consumer best-effort"
```

---

## Related Files

- `references/competitor-playbook.md` - Detailed competitor response strategies
- `references/campaign-templates.md` - Ready-to-use campaign templates
- `references/pricing-guardrails.md` - Full pricing rules and COS data
- `products/solution-design.md` - Master product/competitive reference

---

**Version:** 1.0.0
**Last Updated:** 2026-03-01
**Maintained By:** CircleTel Product & Strategy
