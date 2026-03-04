# Feature-to-Outcome Copywriting Transformation

**Date**: 2026-03-03
**Trigger**: Marketing copy review, homepage improvements
**Source**: Homepage marketing copy overhaul session

---

## The Pattern

Transform feature-focused marketing copy into outcome-focused messaging that resonates with customer pain points.

### Formula

```
[Technical Feature] → [What Customer Achieves/Avoids]
```

### Transformation Examples

| Feature (Don't) | Outcome (Do) |
|-----------------|--------------|
| 99.9% SLA | Zero downtime guarantee |
| 99.9% uptime | Always available |
| 100Mbps uncapped | Everyone streams. Nobody buffers. |
| Static IP included | Remote access to your office systems |
| 24/7 support | Problems fixed before you notice them |
| Proactive monitoring | Problems fixed before you notice them |
| High-speed wireless | Stream, work, and game without interruption |
| Secure backup solutions | Your files, safe and accessible from anywhere |
| No FUP throttling | Truly uncapped (key differentiator) |

---

## Startup Metrics Honesty Pattern

### Rule
Only display metrics you can verify if challenged. Invented social proof destroys trust instantly.

### Fake Metrics to Avoid
- "10,000+ homes connected" (when you have 50)
- "4.8★ Google rating" (when you have no reviews)
- "500+ businesses" (when you have 10)

### Safe Deliverable Promises
- R0 setup fees (if true)
- 7 days to get online (if achievable)
- No contracts (if policy)
- 4hr response time (if SLA)

### Implementation
```typescript
// Before (fake)
const TRUST_METRICS = {
  home: [
    { value: '10,000+', label: 'homes connected' },
    { value: '4.8★', label: 'Google rating' },
  ],
};

// After (deliverable)
const TRUST_METRICS = {
  home: [
    { value: 'R0', label: 'setup fees' },
    { value: '7 days', label: 'to get online' },
    { value: 'No', label: 'contracts' },
  ],
};
```

---

## Fear-Addressing Feature Prominence

### Pattern
Put fear-countering features FIRST in feature lists. South African ISP customers have been burned by:
- Hidden costs / surprise fees
- 24-month contracts with no exit
- "Up to" speeds never achieved
- Installation delays
- Support that never answers

### Implementation
```typescript
// Position 1 should address the biggest fear
features: ['No contracts', 'Static IP included', 'Truly uncapped']
//          ^^^^^^^^^^^^ Fear-addressing first
```

---

## Market Context Management

### Pattern
Store time-sensitive market facts in MEMORY.md with verification dates.

### Example: Load Shedding (March 2026)
```markdown
## South Africa Market Context (2026-03-03)

### Load Shedding Has Ended
**Do NOT use load shedding in marketing copy**

**Facts** (verified March 2026):
- No load shedding since 29 March 2025 (288+ days)
- Eskom declared end in February 2026

**Alternative pain points to use**:
- Slow speeds / buffering
- Unreliable connections
- Poor support
- Contracts / lock-in
- Hidden fees
```

### Why This Matters
- Market conditions change (load shedding was relevant in 2024, not 2026)
- Memory entries prevent future sessions from using outdated references
- Include verification dates for periodic review

---

## Product Spec as Source of Truth

### Pattern
Always cross-reference `/products/**/*.md` before updating pricing or features in code.

### Example Issue Found
```typescript
// Code had:
price: 1599  // Wrong!

// Product spec v2.0 said:
// SkyFibre Business 100: R1,499
```

### Prevention
Add source comments in code:
```typescript
// Business/SME Plans - SkyFibre Business (MTN Tarana G1 FWA)
// Source: products/connectivity/fixed-wireless/SkyFibre_SMB_Commercial_Product_Spec_v2_0.md
const BUSINESS_PLANS: HeroPlan[] = [
```

---

## Copywriting Guidelines Reference

The transformation decisions are instant when you have documented guidelines.

**Location**: `.claude/product-marketing-context.md`

**Key sections**:
- Brand voice (confident but not arrogant)
- 7 customer personas with pain points
- Feature → Outcome transformation table
- CTA language (avoid "Sign Up", use "Check My Coverage")
- Writing checklist

---

## Files Modified in This Session

| File | Changes |
|------|---------|
| `components/home/NewHero.tsx` | Hero headline, business tagline |
| `components/home/ServicesSnapshot.tsx` | All 3 service descriptions |
| `components/home/SegmentTabs.tsx` | Business value prop |
| `components/home/PlanCards.tsx` | All 12 plan descriptions, pricing fix |
| `components/home/FAQ.tsx` | Added 3 persona-specific questions |
| `components/home/Testimonials.tsx` | Metrics → deliverable promises, removed load shedding |
| `app/(marketing)/soho/page.tsx` | Removed load shedding reference |

---

## Time Savings

| Task | Before | After |
|------|--------|-------|
| Deciding copy direction | 10-15 min guessing | Instant (guidelines exist) |
| Pricing verification | Often skipped | 2 min (check product spec) |
| Market context check | Research each time | Instant (in MEMORY.md) |

---

## Related Learnings

- `2026-03-01_segment-aware-homepage.md` - Segment-specific content
- `2026-03-01_cell-c-cro-patterns.md` - CRO patterns
- `.claude/product-marketing-context.md` - Copywriting guidelines
