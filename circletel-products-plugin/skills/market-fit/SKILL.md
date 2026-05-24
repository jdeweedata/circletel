---
name: Market-Fit Analysis
description: Analyze product-market fit with competitor comparison, unit economics, and go/no-go recommendation
version: 1.0.0
dependencies: none
---

# Market-Fit Analysis

Skill for analyzing whether a product candidate fits the CircleTel portfolio. Produces competitor comparison, margin calculations, and a structured go/no-go recommendation.

## When This Skill Activates

This skill automatically activates when you:
- Need to evaluate a product for the portfolio
- Want competitor pricing comparison
- Ask about product margins or unit economics
- Say `/product-analyze` with a product name or SKU

**Keywords**: market fit, analyze product, margin analysis, competitor comparison, go no go, product viability, unit economics

## Inputs Required

| Input | Source | Required |
|-------|--------|----------|
| Product details | Supplier catalogue or manual | Yes |
| Supplier cost | Supplier pricing | Yes |
| Target category | Product portfolio | Yes |
| Competitor prices | `references/competitor-benchmarks.md` | Yes |
| Existing products | `/admin/products` | Optional |

## Analysis Workflow

### Step 1: Gather Product Data

Collect from supplier:
- SKU, name, manufacturer
- Wholesale/cost price
- Specifications
- Category/subcategory

### Step 2: Load Competitor Benchmarks

From `references/competitor-benchmarks.md`:
- Comparable competitor products
- Price ranges by segment
- Feature comparisons

### Step 3: Calculate Unit Economics

```markdown
## Unit Economics Calculator

| Component | Value | Notes |
|-----------|-------|-------|
| **Supplier Cost** | R[X] | From supplier catalogue |
| **CircleTel Markup** | [Y]% | Target: 30-50% |
| **Retail Price** | R[Z] | Cost × (1 + markup) |
| **Competitor Price** | R[A] | Market benchmark |
| **Price Position** | [Above/Below/At] | vs competition |
| **Contribution Margin** | R[M] (Y%) | Retail - Cost |
```

### Step 4: Competitive Position Analysis

**Price Positioning Matrix:**
```
                    Features
                 Low        High
         ┌──────────┬──────────┐
    Low  │ Budget   │ Value    │
Price    │          │          │
         ├──────────┼──────────┤
    High │ Niche    │ Premium  │
         │          │          │
         └──────────┴──────────┘
```

**Questions to Answer:**
1. Where does this product sit in the matrix?
2. Which competitors occupy adjacent positions?
3. Is there a gap in the market?

### Step 5: Generate Go/No-Go Recommendation

**Decision Framework:**

| Criterion | Weight | Score (1-5) | Weighted |
|-----------|--------|-------------|----------|
| Margin ≥ 30% | 25% | [X] | [Y] |
| Competitive pricing | 20% | [X] | [Y] |
| Serves existing product line | 20% | [X] | [Y] |
| Supplier reliability | 15% | [X] | [Y] |
| Team capability to support | 10% | [X] | [Y] |
| Strategic alignment | 10% | [X] | [Y] |
| **TOTAL** | 100% | — | **[Z]** |

**Thresholds:**
- **GO**: Score ≥ 4.0
- **CONDITIONAL**: Score 3.0 - 3.9 (requires mitigation plan)
- **NO-GO**: Score < 3.0

## Output Template

```markdown
# Market-Fit Analysis: [Product Name]

**Date**: [YYYY-MM-DD]
**Analyst**: Claude Code
**Status**: [GO / CONDITIONAL / NO-GO]

---

## Product Overview

| Field | Value |
|-------|-------|
| **Product** | [Name] |
| **SKU** | [SKU] |
| **Supplier** | [Supplier] |
| **Category** | [Category] |
| **Target Product Line** | [e.g., SkyFibre SMB, CloudWiFi] |

---

## Competitor Landscape

| Competitor | Product | Price | Key Differentiator |
|------------|---------|-------|-------------------|
| [Comp 1] | [Product] | R[X] | [Differentiator] |
| [Comp 2] | [Product] | R[X] | [Differentiator] |
| [Comp 3] | [Product] | R[X] | [Differentiator] |

---

## CircleTel Positioning

| Metric | Value | Assessment |
|--------|-------|------------|
| **Supplier Cost** | R[X] | — |
| **Target Retail** | R[Y] | [Rationale] |
| **Contribution Margin** | R[Z] ([P]%) | [Above/Below target] |
| **vs Cheapest Competitor** | [+/-X%] | [Competitive/Premium/Budget] |
| **vs Market Average** | [+/-X%] | [Competitive/Premium/Budget] |

---

## Strategic Fit

### Serves Product Line(s)
- [x] [Product line 1] — [How it fits]
- [ ] [Product line 2] — [Why not]

### Cross-Sell Potential
- [Opportunity 1]
- [Opportunity 2]

### Risks
1. [Risk 1] — Mitigation: [Plan]
2. [Risk 2] — Mitigation: [Plan]

---

## Recommendation

### Verdict: [GO / CONDITIONAL / NO-GO]

**Rationale**: [2-3 sentence summary]

**Decision Criteria Score**: [X.X] / 5.0

| Criterion | Score | Notes |
|-----------|-------|-------|
| Margin | [X] | [Notes] |
| Pricing | [X] | [Notes] |
| Product fit | [X] | [Notes] |
| Supplier | [X] | [Notes] |
| Support | [X] | [Notes] |
| Strategy | [X] | [Notes] |

### Next Steps

**If GO:**
1. Run `/product-docs` to generate documentation
2. Add to `/admin/products/new` in draft status
3. Schedule pricing review with CFO
4. Plan launch timeline

**If CONDITIONAL:**
1. [Required mitigation action]
2. [Re-evaluate criteria]
3. [Escalate to leadership if needed]

**If NO-GO:**
1. Document in rejection log
2. Set reminder to re-evaluate in [X] months
3. Consider alternative products

---

## Appendix: Detailed Calculations

[Include detailed margin calculations, competitor data sources, etc.]
```

## Margin Targets by Segment

| Segment | Target Margin | Minimum | Notes |
|---------|---------------|---------|-------|
| Consumer Hardware | 25-35% | 20% | Competitive pressure |
| Business Hardware | 30-40% | 25% | Value-add expected |
| Enterprise Equipment | 35-50% | 30% | Service wrapper |
| Managed Services | 40-55% | 35% | Recurring revenue |
| WaaS / WiFi | 45-60% | 40% | Full managed stack |

## Integration with Admin Products

When recommending GO:
- Check existing products at `/admin/products` for duplicates
- Use `/admin/products/new` to create product in draft status
- Lifecycle: Draft → Active (after documentation complete)

**API Check for Duplicates:**
```bash
GET /api/admin/products?search=[product_name]&category=[category]
```

## Related Skills

- `/product-browse` — Find product candidates from suppliers
- `/product-docs` — Generate documentation after GO decision
- `/product-lifecycle` — Track product status

---

**Version**: 1.0.0
**Last Updated**: 2026-03-08
**Maintained By**: CircleTel Product Strategy
