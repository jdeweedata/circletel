# Design: Product-Linked Benefits & Terms in Quotes

**Date**: 2026-03-18
**Status**: Reviewed (v2)
**Scope**: Replace hardcoded quote benefits and T&Cs with product-linked data from database

---

## Problem

Quotes currently show:
1. **Hardcoded benefits** — `generateInclusiveBenefits()` in `preview/page.tsx` (lines 254-304) uses generic if/else on service type strings. Benefits don't reflect actual product features.
2. **Generic T&Cs** — 8 hardcoded sections (lines 734-785) are identical regardless of product. They don't leverage the master T&Cs document or product-specific terms.
3. **Unused infrastructure** — `business_quote_terms` table exists with correct schema but is empty. `service_packages.features[]` has rich product data that isn't surfaced in quotes.

## Solution: Database-Driven (Approach A)

Pull benefits from `service_packages.features[]` per line item and populate `business_quote_terms` with product-specific T&Cs from the master legal document.

---

## Data Model Changes

### 1. Add `benefits_snapshot` to `business_quote_items`

```sql
ALTER TABLE business_quote_items
ADD COLUMN benefits_snapshot JSONB DEFAULT NULL;
```

**Purpose**: Snapshot product features at quote creation time so historical quotes remain accurate even if product features change later.

**Shape**:
```json
{
  "features": ["50 Mbps download", "Truly uncapped", "Static IP"],
  "formatted_benefits": [
    { "text": "FREE Installation - worth up to R1,699", "category": "benefit" },
    { "text": "Truly uncapped data", "category": "technical" }
  ]
}
```

### 2. Seed `business_quote_terms` table

Populate with product-specific T&Cs extracted from `docs/legal/CIRCLETEL_TERMS_AND_CONDITIONS.md` sections 4 and 6.

**Schema** (already exists):
| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | PK |
| `service_type` | text | Brand names from `service_packages.service_type` (e.g. `SkyFibre`, `BizFibreConnect`, `5G`) or `_default` |
| `display_order` | integer | Controls rendering order (added in migration) |
| `contract_term` | integer | NULL = applies to all terms |
| `title` | text | Section heading |
| `terms_text` | text | Terms content |
| `version` | integer | For versioning |
| `active` | boolean | Soft delete |

**Seed data by service_type**:

| service_type | Sections to include |
|--------------|-------------------|
| `_default` | Quote validity, Payment terms, Cancellation, Equipment, Governing law |
| `SkyFibre` | Installation (7-14 days, site survey), SLA (99.5%), Fair usage, Speed (FWB-specific) |
| `BizFibreConnect` | Installation (DFA coordination), SLA (99.9%), Dedicated support, Symmetric speeds |
| `5G` | Coverage (signal dependent), Self-install + professional options, Data caps/throttling, Performance expectations |

**`_default` terms** apply to ALL quotes regardless of product. Product-specific terms are ADDED alongside defaults.

**Service type convention**: Use brand names from `service_packages.service_type` (`SkyFibre`, `BizFibreConnect`, `5G`), NOT generic categories (`fibre`, `wireless`). This matches what `business_quote_items.service_type` actually stores (copied from `service_packages` at quote creation time).

**Unmapped service types**: If a quote item has a `service_type` not covered by seed data (e.g. `HomeFibreConnect`, `LTE`, `Cloud_Services`), only `_default` terms will be shown. New service types should be seeded as products are added.

---

## Code Changes

### 1. Quote Generator (`lib/quotes/quote-generator.ts`)

When creating quote items, snapshot the product benefits:

```typescript
// After fetching package from service_packages
import { formatFeatures } from '@/lib/products/feature-formatter';

const features: string[] = pkg.features || [];
const formatted = formatFeatures(features); // Returns FormattedFeature[]

// Store in quote item — snapshot raw features + formatted version
await supabase.from('business_quote_items').insert({
  ...itemData,
  benefits_snapshot: { features, formatted_benefits: formatted }
});
```

**Note**: `extractBenefits(features)` accepts `string[]` and internally calls `formatFeatures()`. For the snapshot we call `formatFeatures()` directly to store ALL formatted features (not just top 4 benefits). Rendering code will filter by category as needed.

### 2. New utility: `lib/quotes/quote-benefits.ts`

```typescript
export interface QuoteBenefits {
  perItem: Array<{
    serviceName: string;
    benefits: string[];
  }>;
  global: string[];
}

/**
 * Build benefits list from quote items' benefits_snapshot
 * Falls back to service_packages.features[] if no snapshot exists
 */
export function buildQuoteBenefits(items: QuoteItem[]): QuoteBenefits;
```

**Global benefits** (always shown for business quotes):
- South African-based customer support
- 24/7 Network Operations Centre (NOC) monitoring
- Professional installation and configuration
- Dedicated account manager
- Priority technical support
- Monthly usage reporting and analytics

### 3. New utility: `lib/quotes/quote-terms.ts`

```typescript
export interface QuoteTermsSection {
  title: string;
  text: string;
  serviceType: string;
}

/**
 * Fetch applicable terms for a quote based on its line items' service types
 * Returns: default terms + product-specific terms, deduplicated
 */
export async function fetchQuoteTerms(
  serviceTypes: string[],
  contractTerm: number
): Promise<QuoteTermsSection[]>;
```

### 4. Quote Preview Page (`app/quotes/business/[id]/preview/page.tsx`)

**Benefits section** — Replace `generateInclusiveBenefits()` with product-linked data:

```
INCLUSIVE BENEFITS

Per-product benefits (from benefits_snapshot):
  SkyFibre SMB 100 Mbps:
    ✓ FREE Installation - worth up to R1,699
    ✓ FREE TO USE Router - valued at up to R1,999
    ✓ Truly uncapped - no fair usage policy
    ✓ Static IP address included
    ✓ 99.5% uptime SLA

All CircleTel Business Services:
    ✓ South African-based customer support
    ✓ 24/7 NOC monitoring
    ✓ Professional installation
    ✓ Dedicated account manager
    ✓ Priority technical support
```

**T&Cs section** — Replace hardcoded 8 sections with database-driven terms:

```
TERMS AND CONDITIONS

General Terms (from _default rows):
  1. QUOTE VALIDITY — This quote is valid for 30 days...
  2. PAYMENT TERMS — Monthly charges payable in advance...
  3. CANCELLATION — 30 days written notice...
  4. EQUIPMENT — CPE remains CircleTel property...
  5. GOVERNING LAW — South African law applies...

SkyFibre Service Terms (from SkyFibre rows):
  6. INSTALLATION — Site survey within 5 business days...
  7. SERVICE LEVEL AGREEMENT — 99.5% uptime measured monthly...
  8. FAIR USAGE — Subject to Fair Usage Policy...
```

### 5. PDF Generator (`lib/quotes/pdf-generator.ts`)

The PDF generator currently has:
- **10 hardcoded T&C sections** (lines 380-397) — different content from preview page's 8 sections
- **No benefits section** — only shows services table, pricing, and T&Cs

Changes required:
1. **Add a benefits section** between pricing and T&Cs in the PDF layout, rendering per-item benefits + global benefits using jsPDF text methods
2. **Replace hardcoded T&Cs** with data from `fetchQuoteTerms()` — called server-side
3. **Update function signature**: `generateQuotePDF(quote, options)` → add `terms: QuoteTermsSection[]` to the options or fetch internally
4. Benefits and terms data must be passed in (not fetched inside the PDF generator) since the generator is a pure function that shouldn't make DB calls

### 6. Email Template (`app/api/quotes/business/[id]/email/route.ts`)

The email uses Playwright to render the preview page as PDF, so it will automatically pick up preview page changes. The inline HTML summary in the email body should also show key product benefits.

### 7. API Changes

**`/api/quotes/business/[id]` (GET)** — Include `benefits_snapshot` from items and fetch applicable `business_quote_terms` rows. Return as:

```json
{
  "quote": { ... },
  "items": [{ ..., "benefits_snapshot": { ... } }],
  "terms": [{ "title": "...", "text": "...", "serviceType": "..." }]
}
```

**`/api/quotes/business/create` (POST)** — Snapshot benefits during item creation.

---

## Migration Plan

### Migration 1: Add benefits_snapshot column + display_order
```sql
ALTER TABLE business_quote_items
ADD COLUMN benefits_snapshot JSONB DEFAULT NULL;

ALTER TABLE business_quote_terms
ADD COLUMN display_order INTEGER DEFAULT 0;
```

**TypeScript type update** (`lib/quotes/types.ts`):
```typescript
// Add to BusinessQuoteItem interface
benefits_snapshot?: {
  features: string[];
  formatted_benefits: Array<{
    text: string;
    category: 'benefit' | 'technical' | 'contract' | 'support';
  }>;
} | null;
```

### Migration 2: Seed business_quote_terms

Seed with terms extracted from `docs/legal/CIRCLETEL_TERMS_AND_CONDITIONS.md`:

**Default terms** (service_type = '_default', contract_term = NULL):
1. Quote Validity
2. Payment Terms
3. Cancellation Policy
4. Equipment & CPE
5. Governing Law & Disputes

**SkyFibre terms** (service_type = 'SkyFibre'):
1. Installation & Activation — Site survey, 7-14 business day timeline, Tarana FWB equipment
2. Service Level Agreement — 99.5% uptime, 4hr acknowledgment, service credits
3. Fair Usage — No hard caps on uncapped, traffic management during peak
4. Speed & Performance — FWB-specific factors, minimum 80% guaranteed

**BizFibreConnect terms** (service_type = 'BizFibreConnect'):
1. Installation & Activation — DFA fibre provisioning, 14-21 business days
2. Service Level Agreement — 99.9% uptime, dedicated support, priority resolution
3. Performance — Symmetric speeds, enterprise-grade SLA

**5G terms** (service_type = '5G'):
1. Coverage & Eligibility — Signal-dependent, coverage check required
2. Installation — Self-install or professional (R750), antenna options
3. Data & Fair Usage — Capped packages throttled to 1Mbps, top-up available
4. Performance Expectations — Speed varies by distance/congestion/weather

### Migration 3: Backfill existing quote items

For existing quotes, populate `benefits_snapshot` from their linked `service_packages.features[]`:

```sql
UPDATE business_quote_items bqi
SET benefits_snapshot = jsonb_build_object(
  'features', sp.features
)
FROM service_packages sp
WHERE bqi.package_id = sp.id
AND bqi.benefits_snapshot IS NULL;
```

---

## Files Affected

| File | Change |
|------|--------|
| `supabase/migrations/YYYYMMDD_add_benefits_snapshot.sql` | New column |
| `supabase/migrations/YYYYMMDD_seed_quote_terms.sql` | Seed T&Cs |
| `supabase/migrations/YYYYMMDD_backfill_benefits.sql` | Backfill existing |
| `lib/quotes/quote-benefits.ts` | **New** — Build benefits from snapshot |
| `lib/quotes/quote-terms.ts` | **New** — Fetch applicable terms |
| `lib/quotes/quote-generator.ts` | Snapshot benefits on item creation |
| `app/quotes/business/[id]/preview/page.tsx` | Render product-linked benefits + terms |
| `lib/quotes/pdf-generator.ts` | Render benefits + terms in PDF |
| `app/api/quotes/business/[id]/route.ts` | Return terms + benefits in response |
| `app/api/quotes/business/create/route.ts` | Snapshot benefits on create |
| `lib/quotes/types.ts` | Add `benefits_snapshot` to `BusinessQuoteItem` interface |

---

## Rendering Rules

1. **Benefits per item**: Show features from `benefits_snapshot.formatted_benefits` where `category === 'benefit'`, then `category === 'technical'` (max 6 per item)
2. **Global benefits**: Always show the 6 standard CircleTel business benefits
3. **Terms ordering**: Default terms first (numbered 1-5), then product-specific terms (numbered 6+)
4. **Multi-product quotes**: If a quote has items with different `service_type` values, show terms for ALL types
5. **Fallback**: If `benefits_snapshot` is null (legacy quotes), fall back to current `generateInclusiveBenefits()` logic. **Known bug in fallback**: The existing function checks `item.item_type` (which is `primary|secondary|additional`) instead of `item.service_type` for category matching. It only works via the `serviceName` string-matching fallback. This bug will not be fixed in the fallback — new quotes will use the snapshot path instead.
6. **Terms ordering**: Controlled by `display_order` column — default terms get orders 1-5, product-specific terms get orders 10+

---

## Out of Scope

- Admin UI for editing `business_quote_terms` (future enhancement)
- Sanity CMS integration for terms (terms are legal documents, not marketing content)
- Changes to the MSA contract PDF (separate document with its own terms structure)
- MITS/CPQ quote system (separate module)
