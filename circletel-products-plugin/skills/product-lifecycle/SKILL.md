---
name: Product Lifecycle
description: Track and manage products through lifecycle stages - IDEA → DRAFT → ACTIVE → INACTIVE → ARCHIVED
version: 1.0.0
dependencies: none
---

# Product Lifecycle Management

Skill for tracking CircleTel products through their lifecycle stages, generating transition checklists, and managing sunset plans.

## When This Skill Activates

This skill automatically activates when you:
- Want to see product lifecycle status
- Need to move a product between stages
- Plan a product sunset or retirement
- Say `/product-lifecycle` or ask about product status

**Keywords**: product lifecycle, lifecycle status, product stage, sunset product, retire product, activate product, archive product

## Lifecycle Stages

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│  IDEA   │ ──▶ │  DRAFT  │ ──▶ │  ACTIVE │ ──▶ │ INACTIVE │ ──▶ │ ARCHIVED │
└─────────┘     └─────────┘     └─────────┘     └──────────┘     └──────────┘
     │               │               │               │                │
     ▼               ▼               ▼               ▼                ▼
 Concept         In Admin       Live in         Paused/           End of
 stage only      Products       catalogue       Hidden            life
```

### Stage Definitions

| Stage | Status Code | Description | Visibility |
|-------|-------------|-------------|------------|
| **IDEA** | — | Concept only, not in system | Internal only |
| **DRAFT** | `draft` | In admin products, not live | Admin only |
| **ACTIVE** | `active` | Live in product catalogue | Public |
| **INACTIVE** | `inactive` | Temporarily paused | Admin only |
| **ARCHIVED** | `archived` | End of life, retained for history | Admin only |

## Integration with Admin Products

### Viewing Lifecycle Status

**Portfolio Dashboard**: `/admin/products` → Portfolio tab → Lifecycle

The existing portfolio dashboard shows:
- Products by status (draft, active, inactive, archived)
- Low margin products requiring attention
- Duplicate products to clean up

### Lifecycle Stepper Component

`components/admin/products/ProductLifecycleStepper.tsx` displays visual lifecycle progress on product detail pages.

### Status Management

**Change status via Admin:**
1. Go to `/admin/products/[id]/edit`
2. Update status field
3. Save changes

**Change status via API:**
```bash
PATCH /api/admin/products/[id]
Content-Type: application/json

{ "status": "active" }
```

## Transition Checklists

### IDEA → DRAFT

**Prerequisites:**
- [ ] Market-fit analysis completed (`/product-analyze`)
- [ ] GO or CONDITIONAL decision documented
- [ ] Pricing approved by CFO
- [ ] Technology capability confirmed

**Actions:**
- [ ] Create product in `/admin/products/new`
- [ ] Set status to `draft`
- [ ] Fill required fields (name, SKU, category, pricing)
- [ ] Attach to product line

---

### DRAFT → ACTIVE

**Prerequisites:**
- [ ] CPS documentation complete
- [ ] BRD documentation complete (for complex products)
- [ ] Pricing verified against costs
- [ ] Support team briefed
- [ ] Sales materials prepared

**Actions:**
- [ ] Change status to `active` in admin
- [ ] Verify appears in public catalogue
- [ ] Test ordering flow
- [ ] Announce to sales team
- [ ] Update `/products/README.md` index

---

### ACTIVE → INACTIVE

**Reasons for Inactivation:**
- Temporary stock outage
- Pricing review required
- Competitive repositioning
- Seasonal pause

**Prerequisites:**
- [ ] Reason documented
- [ ] Estimated reactivation date (if temporary)
- [ ] Customer communication plan (if impactful)

**Actions:**
- [ ] Change status to `inactive` in admin
- [ ] Product hidden from public catalogue
- [ ] Existing customers unaffected
- [ ] Set calendar reminder for review

---

### INACTIVE → ACTIVE

**Prerequisites:**
- [ ] Original issue resolved
- [ ] Pricing re-verified
- [ ] Stock/capacity confirmed
- [ ] Support team notified

**Actions:**
- [ ] Change status to `active`
- [ ] Verify appears in catalogue
- [ ] Consider promotional announcement

---

### ACTIVE/INACTIVE → ARCHIVED

**This is a sunset decision. Use sunset planning workflow.**

## Sunset Planning

### When to Sunset

Consider archiving when:
- Product has zero active customers
- Technology is end-of-life
- Margin is unsustainable (<15%)
- Better alternative exists
- Regulatory/compliance issue

### Sunset Checklist

```markdown
## Product Sunset Plan: [Product Name]

**Date**: [YYYY-MM-DD]
**Reason**: [Why sunsetting]
**Target Archive Date**: [YYYY-MM-DD]

### Customer Impact
- Current active customers: [X]
- MRR at risk: R[Y]
- Recommended migration path: [Product Z]

### Migration Plan
- [ ] Identify all affected customers
- [ ] Draft migration communication
- [ ] Set migration incentive (if applicable)
- [ ] Establish migration deadline

### Execution Timeline
| Date | Action | Owner |
|------|--------|-------|
| [D-60] | Notify customers of sunset | Support |
| [D-30] | Follow-up migration offer | Sales |
| [D-7] | Final reminder | Support |
| [D-0] | Archive product | Product |

### Post-Sunset
- [ ] Change status to `archived`
- [ ] Update documentation (mark superseded)
- [ ] Remove from marketing materials
- [ ] Brief support team on legacy inquiries
```

## Dashboard View

### Lifecycle Status Summary

```markdown
## Product Lifecycle Dashboard

**As of**: [YYYY-MM-DD]

| Stage | Count | Products |
|-------|-------|----------|
| Draft | [X] | [List or "None"] |
| Active | [X] | [Summary] |
| Inactive | [X] | [List with reasons] |
| Archived | [X] | [Summary] |

### Attention Required

**Low Margin (<25%)**: [X] products
**Duplicates**: [X] products
**Inactive >30 days**: [X] products
**Draft >90 days**: [X] products

### Recent Transitions
| Date | Product | From | To | By |
|------|---------|------|----|----|
| ... | ... | ... | ... | ... |
```

## Reporting Queries

### Products by Status

```sql
SELECT status, COUNT(*) as count
FROM products
GROUP BY status
ORDER BY
  CASE status
    WHEN 'active' THEN 1
    WHEN 'draft' THEN 2
    WHEN 'inactive' THEN 3
    WHEN 'archived' THEN 4
  END;
```

### Stale Drafts (>90 days)

```sql
SELECT id, name, created_at
FROM products
WHERE status = 'draft'
  AND created_at < NOW() - INTERVAL '90 days';
```

### Inactive Products Needing Review

```sql
SELECT id, name, updated_at
FROM products
WHERE status = 'inactive'
  AND updated_at < NOW() - INTERVAL '30 days';
```

## Related Skills

- `/product-browse` — Find new product candidates
- `/product-analyze` — Market-fit before adding to draft
- `/product-docs` — Documentation for draft → active transition

## Admin Pages Reference

| Page | URL | Purpose |
|------|-----|---------|
| Products List | `/admin/products` | View all products with status filters |
| Portfolio Dashboard | `/admin/products` → Portfolio tab | Lifecycle overview, margin health |
| Product Detail | `/admin/products/[id]` | View single product with lifecycle stepper |
| Edit Product | `/admin/products/[id]/edit` | Change status, update details |
| New Product | `/admin/products/new` | Create draft product |
| Approvals | `/admin/products/approvals` | Pending approval queue |

---

**Version**: 1.0.0
**Last Updated**: 2026-03-08
**Maintained By**: CircleTel Product Strategy
