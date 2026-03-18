# Quote Product-Linked Benefits & Terms Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded quote benefits and T&Cs with database-driven product-linked data from `service_packages.features[]` and `business_quote_terms`.

**Architecture:** Three Supabase migrations (schema change, seed data, backfill), two new utility modules (`quote-benefits.ts`, `quote-terms.ts`), and updates to quote generator, API route, preview page, and PDF generator. Benefits are snapshotted at quote creation time into `business_quote_items.benefits_snapshot`. Terms are fetched from `business_quote_terms` filtered by service type.

**Tech Stack:** Next.js 15, TypeScript, Supabase (PostgreSQL), jsPDF

**Spec:** `docs/superpowers/specs/2026-03-18-quote-product-benefits-terms-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `supabase/migrations/20260318100000_add_benefits_snapshot_and_display_order.sql` | Add `benefits_snapshot` JSONB to `business_quote_items`, `display_order` INT to `business_quote_terms` |
| `supabase/migrations/20260318100001_seed_business_quote_terms.sql` | Seed `_default`, `SkyFibre`, `BizFibreConnect`, `5G` terms from master T&Cs |
| `supabase/migrations/20260318100002_backfill_benefits_snapshot.sql` | Backfill existing quote items with features from linked `service_packages` |
| `lib/quotes/types.ts` | Add `benefits_snapshot` to `BusinessQuoteItem`, `display_order` to `BusinessQuoteTerms` |
| `lib/quotes/quote-benefits.ts` | **New** — Build per-item + global benefits from snapshot data |
| `lib/quotes/quote-terms.ts` | **New** — Fetch applicable terms by service type + contract term |
| `lib/quotes/quote-generator.ts` | Snapshot benefits during item creation |
| `app/api/quotes/business/[id]/route.ts` | Include terms in GET response |
| `app/quotes/business/[id]/preview/page.tsx` | Render product-linked benefits + database-driven T&Cs |
| `lib/quotes/pdf-generator.ts` | Add benefits section, replace hardcoded T&Cs with passed-in terms |
| `app/api/quotes/business/[id]/public/route.ts` | Include terms in public GET response |

**Note**: `app/api/quotes/business/[id]/email/route.ts` auto-inherits preview page changes via Playwright PDF. Inline email HTML body benefits update is deferred to a follow-up task.

---

## Task 1: Database Migrations

**Files:**
- Create: `supabase/migrations/20260318100000_add_benefits_snapshot_and_display_order.sql`
- Create: `supabase/migrations/20260318100001_seed_business_quote_terms.sql`
- Create: `supabase/migrations/20260318100002_backfill_benefits_snapshot.sql`

- [ ] **Step 1: Create schema migration**

```sql
-- supabase/migrations/20260318100000_add_benefits_snapshot_and_display_order.sql

-- Add benefits_snapshot to business_quote_items
-- Stores product features at quote creation time for historical accuracy
ALTER TABLE business_quote_items
ADD COLUMN IF NOT EXISTS benefits_snapshot JSONB DEFAULT NULL;

-- Add display_order to business_quote_terms for deterministic rendering order
ALTER TABLE business_quote_terms
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN business_quote_items.benefits_snapshot IS 'Snapshot of product features at quote creation time. Shape: { features: string[], formatted_benefits: Array<{ text, category }> }';
COMMENT ON COLUMN business_quote_terms.display_order IS 'Controls rendering order. Default terms: 1-5, product-specific: 10+';
```

- [ ] **Step 2: Create terms seed migration**

Reference `docs/legal/CIRCLETEL_TERMS_AND_CONDITIONS.md` sections 4 and 6 for accurate T&C content.

```sql
-- supabase/migrations/20260318100001_seed_business_quote_terms.sql

-- Idempotent: clear existing v1 seed data before re-inserting
-- Safe because these are system-managed terms, not user-edited
DELETE FROM business_quote_terms WHERE version = 1;

-- Default terms (apply to ALL quotes regardless of product)
INSERT INTO business_quote_terms (service_type, contract_term, title, terms_text, version, active, display_order) VALUES
('_default', NULL, 'Quote Validity',
 'This quote is valid for 30 days from the date of issue. Pricing is subject to change after this period. All prices are quoted in South African Rands (ZAR) and include 15% VAT unless otherwise stated.',
 1, true, 1),
('_default', NULL, 'Payment Terms',
 'Monthly charges are payable in advance on the 1st of each month. Installation fees are due upon contract signing or before installation commences. Late payments attract interest at the prescribed rate under the National Credit Act.',
 1, true, 2),
('_default', NULL, 'Cancellation',
 '30 days written notice is required for cancellation. Early termination fees may apply for fixed-term contracts, calculated as the remaining months multiplied by the monthly fee. Month-to-month contracts may be cancelled with 30 days notice without penalty.',
 1, true, 3),
('_default', NULL, 'Equipment',
 'Customer Premises Equipment (CPE) including routers, antennas, and ONTs remains the property of CircleTel and must be returned in good condition upon service termination. Failure to return equipment will result in equipment charges at replacement cost.',
 1, true, 4),
('_default', NULL, 'Governing Law',
 'This agreement is governed by the laws of the Republic of South Africa. Disputes will be resolved in accordance with the Consumer Protection Act and ICASA regulations. Full terms and conditions are available at www.circletel.co.za/terms-of-service.',
 1, true, 5);

-- SkyFibre (Fixed Wireless Broadband) terms
INSERT INTO business_quote_terms (service_type, contract_term, title, terms_text, version, active, display_order) VALUES
('SkyFibre', NULL, 'Installation & Activation',
 'Installation will be scheduled within 7-14 business days of order confirmation, subject to a successful site survey and line-of-sight assessment. A Tarana G1 fixed wireless unit will be installed at the premises. Professional installation includes mounting, cabling, and router configuration. The customer must provide suitable access and infrastructure.',
 1, true, 10),
('SkyFibre', NULL, 'Service Level Agreement',
 'CircleTel provides a 99.5% uptime SLA measured monthly, excluding scheduled maintenance windows. Fault acknowledgment within 4 hours. Resolution targets: Critical (total outage) 24 hours, Major (degraded) 48 hours, Minor (intermittent) 72 hours. Service credits apply for verified outages exceeding SLA thresholds, capped at one month''s service fee.',
 1, true, 11),
('SkyFibre', NULL, 'Fair Usage Policy',
 'Uncapped packages have no hard data caps and are not subject to throttling under normal usage. CircleTel reserves the right to manage traffic during peak periods (18:00-23:00) to ensure fair usage across all customers. Priority is given to VoIP, video conferencing, and web browsing. Commercial reselling of bandwidth is prohibited.',
 1, true, 12),
('SkyFibre', NULL, 'Speed & Performance',
 'Advertised speeds are measured at the CPE and represent maximum achievable speeds. Minimum guaranteed speed is 80% of the advertised speed. Actual performance may vary based on line-of-sight conditions, weather, network congestion, and the number of concurrent users. Speed tests should be conducted via wired connection for accurate results.',
 1, true, 13);

-- BizFibreConnect (DFA Dark Fibre) terms
INSERT INTO business_quote_terms (service_type, contract_term, title, terms_text, version, active, display_order) VALUES
('BizFibreConnect', NULL, 'Installation & Activation',
 'Fibre installation is coordinated with Dark Fibre Africa (DFA) and typically takes 14-21 business days from order confirmation. This includes fibre routing, ONT installation, and service activation. A 24-48 hour stabilisation period follows activation. Delays may occur due to wayleave approvals or infrastructure work.',
 1, true, 10),
('BizFibreConnect', NULL, 'Service Level Agreement',
 'Enterprise-grade 99.9% uptime SLA measured monthly with dedicated support. Fault acknowledgment within 2 hours. Resolution targets: Critical 12 hours, Major 24 hours. Service credits for outages exceeding SLA thresholds. Dedicated account manager and priority escalation path for enterprise customers.',
 1, true, 11),
('BizFibreConnect', NULL, 'Performance',
 'Symmetric upload and download speeds as per selected package. Active Ethernet delivery via DFA infrastructure. Enterprise-grade routing with QoS capabilities. Cloud-ready performance optimised for business applications including VoIP, video conferencing, and cloud services.',
 1, true, 12);

-- 5G terms
INSERT INTO business_quote_terms (service_type, contract_term, title, terms_text, version, active, display_order) VALUES
('5G', NULL, 'Coverage & Eligibility',
 'Service availability is dependent on 5G/LTE network coverage at the specified address. A coverage check is performed before order acceptance. Coverage is subject to cellular network availability and may vary by location. CircleTel does not guarantee coverage at all locations.',
 1, true, 10),
('5G', NULL, 'Installation',
 'Self-installation kit provided with pre-configured router and activated SIM card. Professional installation available at R750 (including external antenna installation if required, signal optimisation, and multi-device setup). Signal strength assessment tools are included in the self-install kit.',
 1, true, 11),
('5G', NULL, 'Data & Fair Usage',
 'Capped packages: data limit as per selected package. Service is throttled to 1 Mbps after the data cap is reached. Top-up data is available for purchase. Uncapped packages are subject to the Fair Usage Policy. Commercial reselling and operating public hotspots is prohibited on all packages.',
 1, true, 12),
('5G', NULL, 'Performance Expectations',
 '5G speeds up to 500 Mbps (coverage dependent). LTE speeds up to 100 Mbps (typical 20-50 Mbps). Latency: 20-80ms (higher than fibre). Performance is affected by distance from tower, weather conditions, network congestion, tower capacity, and line of sight. Speeds are not guaranteed.',
 1, true, 13);
```

- [ ] **Step 3: Create backfill migration**

```sql
-- supabase/migrations/20260318100002_backfill_benefits_snapshot.sql

-- Backfill existing quote items with features from their linked service_packages
-- Only sets raw features — formatted_benefits will be null for legacy items
-- The application code handles this gracefully via fallback logic
UPDATE business_quote_items bqi
SET benefits_snapshot = jsonb_build_object(
  'features', COALESCE(sp.features, '[]'::jsonb)
)
FROM service_packages sp
WHERE bqi.package_id = sp.id
AND bqi.benefits_snapshot IS NULL;
```

- [ ] **Step 4: Apply migrations**

Run: `npx supabase db push` or apply via Supabase dashboard

- [ ] **Step 5: Verify migrations applied**

```sql
-- Check benefits_snapshot column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'business_quote_items' AND column_name = 'benefits_snapshot';

-- Check display_order column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'business_quote_terms' AND column_name = 'display_order';

-- Check terms seeded
SELECT service_type, COUNT(*) FROM business_quote_terms WHERE active = true GROUP BY service_type ORDER BY service_type;
-- Expected: _default=5, 5G=4, BizFibreConnect=3, SkyFibre=4

-- Check backfill worked
SELECT COUNT(*) FROM business_quote_items WHERE benefits_snapshot IS NOT NULL;
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260318100000_add_benefits_snapshot_and_display_order.sql \
  supabase/migrations/20260318100001_seed_business_quote_terms.sql \
  supabase/migrations/20260318100002_backfill_benefits_snapshot.sql
git commit -m "feat(db): add benefits_snapshot column and seed business_quote_terms"
```

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `lib/quotes/types.ts:104-137` (BusinessQuoteItem interface)
- Modify: `lib/quotes/types.ts:193-204` (BusinessQuoteTerms interface)

- [ ] **Step 1: Add `benefits_snapshot` to `BusinessQuoteItem`**

In `lib/quotes/types.ts`, add after line 131 (`display_order: number;`):

```typescript
  // Product benefits snapshot (captured at quote creation)
  benefits_snapshot?: {
    features: string[];
    formatted_benefits: Array<{
      text: string;
      category?: 'benefit' | 'technical' | 'contract' | 'support';
    }>;
  } | null;
```

- [ ] **Step 2: Add `display_order` to `BusinessQuoteTerms`**

In `lib/quotes/types.ts`, add after line 200 (`active: boolean;`):

```typescript
  display_order: number;
```

- [ ] **Step 3: Verify type check passes**

Run: `npm run type-check:memory`
Expected: No new errors from these additions (they're optional/additive).

- [ ] **Step 4: Commit**

```bash
git add lib/quotes/types.ts
git commit -m "feat(types): add benefits_snapshot and display_order to quote types"
```

---

## Task 3: Create `quote-benefits.ts` Utility

**Files:**
- Create: `lib/quotes/quote-benefits.ts`

- [ ] **Step 1: Create the utility module**

```typescript
// lib/quotes/quote-benefits.ts

import type { BusinessQuoteItem } from './types';

/**
 * Structured benefits for quote rendering
 */
export interface QuoteBenefits {
  perItem: Array<{
    serviceName: string;
    serviceType: string;
    benefits: string[];
  }>;
  global: string[];
}

/**
 * Global benefits shown on ALL CircleTel business quotes
 */
const GLOBAL_BENEFITS = [
  'South African-based customer support',
  '24/7 Network Operations Centre (NOC) monitoring',
  'Professional installation and configuration',
  'Dedicated account manager',
  'Priority technical support',
  'Monthly usage reporting and analytics',
];

/**
 * Build benefits list from quote items.
 * Uses benefits_snapshot when available, falls back to raw features.
 *
 * @param items - Quote line items with optional benefits_snapshot
 * @returns Structured benefits: per-item product benefits + global benefits
 */
export function buildQuoteBenefits(items: BusinessQuoteItem[]): QuoteBenefits {
  const perItem: QuoteBenefits['perItem'] = [];

  for (const item of items) {
    const snapshot = item.benefits_snapshot;
    let benefits: string[] = [];

    if (snapshot?.formatted_benefits && Array.isArray(snapshot.formatted_benefits)) {
      // Use formatted benefits from snapshot
      // Show benefit category first, then technical (max 6 total)
      const benefitItems = snapshot.formatted_benefits
        .filter((b) => b.category === 'benefit' && b.text.trim() !== '');
      const technicalItems = snapshot.formatted_benefits
        .filter((b) => b.category === 'technical' && b.text.trim() !== '');
      benefits = [...benefitItems, ...technicalItems]
        .slice(0, 6)
        .map((b) => b.text);
    } else if (snapshot?.features && Array.isArray(snapshot.features)) {
      // Fallback: use raw features (backfilled items without formatted_benefits)
      benefits = snapshot.features.slice(0, 6);
    }

    if (benefits.length > 0) {
      perItem.push({
        serviceName: item.service_name,
        serviceType: item.service_type,
        benefits,
      });
    } else {
      // Legacy fallback: generate basic benefits from service_type/service_name
      // (covers items where benefits_snapshot is null and backfill failed)
      const legacyBenefits = getLegacyBenefits(item.service_type, item.service_name);
      if (legacyBenefits.length > 0) {
        perItem.push({
          serviceName: item.service_name,
          serviceType: item.service_type,
          benefits: legacyBenefits,
        });
      }
    }
  }

  return {
    perItem,
    global: GLOBAL_BENEFITS,
  };
}

/**
 * Legacy fallback: generate basic benefits from service type when no snapshot exists.
 * Mirrors the old generateInclusiveBenefits() logic from preview/page.tsx.
 */
function getLegacyBenefits(serviceType: string, serviceName: string): string[] {
  const type = serviceType?.toLowerCase() || '';
  const name = serviceName?.toLowerCase() || '';

  if (type.includes('fibre') || name.includes('fibre') || type === 'bizfibreconnect') {
    return ['99.9% Service Level Agreement (SLA)', 'Unlimited data usage', 'Static IP address allocation'];
  }
  if (type === 'skyfibre' || name.includes('skyfibre') || name.includes('wireless')) {
    return ['99.5% Service Level Agreement (SLA)', 'Weather-resistant equipment', 'Professional installation'];
  }
  if (type === '5g' || name.includes('5g') || name.includes('lte')) {
    return ['Coverage-optimised connectivity', 'Self-install or professional installation', 'Flexible data options'];
  }
  return [];
}
```

- [ ] **Step 2: Verify type check**

Run: `npm run type-check:memory`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/quotes/quote-benefits.ts
git commit -m "feat(quotes): add quote-benefits utility for product-linked benefits"
```

---

## Task 4: Create `quote-terms.ts` Utility

**Files:**
- Create: `lib/quotes/quote-terms.ts`

- [ ] **Step 1: Create the utility module**

```typescript
// lib/quotes/quote-terms.ts

import { createClient } from '@/lib/supabase/server';
import type { BusinessQuoteTerms } from './types';

/**
 * Terms section for quote rendering
 */
export interface QuoteTermsSection {
  title: string;
  text: string;
  serviceType: string;
  displayOrder: number;
}

/**
 * Fetch applicable terms for a quote based on its line items' service types.
 * Returns _default terms + product-specific terms, sorted by display_order.
 *
 * @param serviceTypes - Unique service types from quote items (e.g. ['SkyFibre', '5G'])
 * @param contractTerm - Contract term in months (12, 24, 36)
 * @returns Sorted array of terms sections
 */
export async function fetchQuoteTerms(
  serviceTypes: string[],
  contractTerm: number
): Promise<QuoteTermsSection[]> {
  const supabase = await createClient();

  // Fetch terms matching _default + any of the service types
  // contract_term NULL means "applies to all terms"
  const uniqueTypes = ['_default', ...new Set(serviceTypes)];

  const { data: terms, error } = await supabase
    .from('business_quote_terms')
    .select('*')
    .in('service_type', uniqueTypes)
    .eq('active', true)
    .or(`contract_term.is.null,contract_term.eq.${contractTerm}`)
    .order('display_order', { ascending: true });

  if (error || !terms) {
    console.error('[quote-terms] Failed to fetch terms:', error?.message);
    return [];
  }

  return (terms as BusinessQuoteTerms[]).map((t) => ({
    title: t.title,
    text: t.terms_text,
    serviceType: t.service_type,
    displayOrder: t.display_order,
  }));
}
```

- [ ] **Step 2: Verify type check**

Run: `npm run type-check:memory`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/quotes/quote-terms.ts
git commit -m "feat(quotes): add quote-terms utility for database-driven T&Cs"
```

---

## Task 5: Update Quote Generator to Snapshot Benefits

**Files:**
- Modify: `lib/quotes/quote-generator.ts:1-7` (imports)
- Modify: `lib/quotes/quote-generator.ts:97-124` (item creation)

- [ ] **Step 1: Add import for formatFeatures**

At `lib/quotes/quote-generator.ts` line 7, after the existing imports, add:

```typescript
import { formatFeatures } from '@/lib/products/feature-formatter';
```

- [ ] **Step 2: Add benefits_snapshot to item creation**

In `lib/quotes/quote-generator.ts`, replace the `quoteItems` mapping (lines 98-124) to include benefits_snapshot:

Replace:
```typescript
    const quoteItems = request.items.map((item, index) => {
      const pkg = packages.find(p => p.id === item.package_id);
      if (!pkg) {
        throw new QuoteGenerationError(
          `Package ${item.package_id} not found`,
          'PACKAGE_NOT_FOUND'
        );
      }

      return {
        quote_id: quote.id,
        package_id: item.package_id,
        item_type: item.item_type,
        quantity: item.quantity || 1,
        monthly_price: pkg.price,
        installation_price: pkg.installation_fee || 0,
        custom_pricing: false,
        service_name: pkg.name,
        service_type: pkg.service_type,
        product_category: pkg.product_category,
        speed_down: pkg.speed_down,
        speed_up: pkg.speed_up,
        data_cap_gb: pkg.data_cap_gb,
        notes: item.notes || null,
        display_order: index
      };
    });
```

With:
```typescript
    const quoteItems = request.items.map((item, index) => {
      const pkg = packages.find(p => p.id === item.package_id);
      if (!pkg) {
        throw new QuoteGenerationError(
          `Package ${item.package_id} not found`,
          'PACKAGE_NOT_FOUND'
        );
      }

      // Snapshot product features at quote creation time
      const features: string[] = Array.isArray(pkg.features) ? pkg.features : [];
      const formattedBenefits = formatFeatures(features);

      return {
        quote_id: quote.id,
        package_id: item.package_id,
        item_type: item.item_type,
        quantity: item.quantity || 1,
        monthly_price: pkg.price,
        installation_price: pkg.installation_fee || 0,
        custom_pricing: false,
        service_name: pkg.name,
        service_type: pkg.service_type,
        product_category: pkg.product_category,
        speed_down: pkg.speed_down,
        speed_up: pkg.speed_up,
        data_cap_gb: pkg.data_cap_gb,
        notes: item.notes || null,
        display_order: index,
        benefits_snapshot: {
          features,
          formatted_benefits: formattedBenefits,
        },
      };
    });
```

- [ ] **Step 3: Verify type check**

Run: `npm run type-check:memory`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/quotes/quote-generator.ts
git commit -m "feat(quotes): snapshot product benefits during quote item creation"
```

---

## Task 6: Update API Route to Include Terms

**Files:**
- Modify: `app/api/quotes/business/[id]/route.ts:10-80`

- [ ] **Step 1: Add import and fetch terms in GET handler**

At `app/api/quotes/business/[id]/route.ts`, add import after line 15:

```typescript
import { fetchQuoteTerms } from '@/lib/quotes/quote-terms';
```

- [ ] **Step 2: Add terms to the GET response**

Replace the response block (lines 74-80):

```typescript
    return NextResponse.json({
      success: true,
      quote: {
        ...quote,
        items: items || []
      }
    });
```

With:

```typescript
    // Fetch applicable terms based on service types in this quote
    const serviceTypes = [...new Set((items || []).map((item: any) => item.service_type))];
    const terms = await fetchQuoteTerms(serviceTypes, quote.contract_term);

    return NextResponse.json({
      success: true,
      quote: {
        ...quote,
        items: items || []
      },
      terms
    });
```

- [ ] **Step 3: Verify type check**

Run: `npm run type-check:memory`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/api/quotes/business/\[id\]/route.ts
git commit -m "feat(api): include product-specific terms in quote GET response"
```

---

## Task 7: Update Quote Preview Page

**Files:**
- Modify: `app/quotes/business/[id]/preview/page.tsx`

This is the largest change. We replace two sections:
1. The `generateInclusiveBenefits()` function and its rendering (lines 253-304, 706-730)
2. The hardcoded T&Cs section (lines 733-785)

- [ ] **Step 1: Add imports**

At the top of `app/quotes/business/[id]/preview/page.tsx`, add:

```typescript
import { buildQuoteBenefits } from '@/lib/quotes/quote-benefits';
import type { QuoteTermsSection } from '@/lib/quotes/quote-terms';
```

- [ ] **Step 2: Add terms to the page's data fetching**

The preview page fetches quote data. Add terms to the fetch response handling. Look for where `quote` state is set from the API response and add `terms` state:

```typescript
const [terms, setTerms] = useState<QuoteTermsSection[]>([]);
```

When the API response arrives (in the fetch effect), extract terms:

```typescript
setTerms(data.terms || []);
```

- [ ] **Step 3: Replace the benefits rendering section**

Replace the `generateInclusiveBenefits` function (lines 253-305) and the benefits rendering block (lines 706-730) with:

```tsx
// Build benefits from snapshot data
const quoteBenefits = quote ? buildQuoteBenefits(quote.items) : { perItem: [], global: [] };
```

And in the JSX, replace the benefits rendering:

```tsx
<div>
  <h3 className="text-base font-bold text-gray-900 mb-4 uppercase">
    INCLUSIVE BENEFITS
  </h3>
  <div className="space-y-4 text-sm">
    {/* Per-product benefits */}
    {quoteBenefits.perItem.map((itemBenefits, idx) => (
      <div key={idx}>
        <h4 className="font-medium text-gray-900 mb-2 text-xs uppercase">
          {itemBenefits.serviceName}
        </h4>
        <div className="space-y-1.5">
          {itemBenefits.benefits.map((benefit, bIdx) => (
            <div key={bIdx} className="flex items-start gap-2">
              <PiCheckBold className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    ))}

    {/* Global CircleTel benefits */}
    <div>
      <h4 className="font-medium text-gray-900 mb-2 text-xs uppercase">
        All CircleTel Business Services
      </h4>
      <div className="space-y-1.5">
        {quoteBenefits.global.map((benefit, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <PiCheckBold className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{benefit}</span>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Additional Notes */}
  {quote.notes && (
    <div className="mt-6">
      <h4 className="font-medium text-gray-900 mb-3 text-sm uppercase">
        Additional Notes
      </h4>
      <div className="bg-blue-50 border border-blue-200 p-3 text-sm">
        <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 4: Replace the T&Cs section**

Replace the hardcoded T&Cs block (lines 733-785) with database-driven terms:

```tsx
{/* Terms and Conditions */}
<div className="mb-8 terms-section">
  <h3 className="text-lg font-bold text-circleTel-navy mb-4 border-b border-gray-300 pb-2">
    TERMS AND CONDITIONS
  </h3>
  {terms.length > 0 ? (
    <div className="grid grid-cols-2 gap-8 text-xs leading-relaxed">
      <div className="space-y-3">
        {terms.filter((_, i) => i < Math.ceil(terms.length / 2)).map((term, index) => (
          <div key={index}>
            <h4 className="font-medium mb-1">{index + 1}. {term.title.toUpperCase()}</h4>
            <p>{term.text}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {terms.filter((_, i) => i >= Math.ceil(terms.length / 2)).map((term, index) => {
          const globalIndex = Math.ceil(terms.length / 2) + index;
          return (
            <div key={index}>
              <h4 className="font-medium mb-1">{globalIndex + 1}. {term.title.toUpperCase()}</h4>
              <p>{term.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    /* Fallback: original hardcoded terms if database returns empty */
    <div className="grid grid-cols-2 gap-8 text-xs leading-relaxed">
      <div className="space-y-3">
        <div>
          <h4 className="font-medium mb-1">1. CONTRACT TERMS</h4>
          <p>This quote is valid for 30 days from the date issued. Pricing is subject to change after this period. Contract term as specified above.</p>
        </div>
        <div>
          <h4 className="font-medium mb-1">2. INSTALLATION</h4>
          <p>Installation will be scheduled within 7-14 business days of order confirmation, subject to site readiness and third-party provider availability.</p>
        </div>
        <div>
          <h4 className="font-medium mb-1">3. PAYMENT TERMS</h4>
          <p>Monthly charges are payable in advance. Installation fees are due on completion of installation. All amounts are inclusive of VAT where applicable.</p>
        </div>
        <div>
          <h4 className="font-medium mb-1">4. SERVICE LEVEL AGREEMENT</h4>
          <p>CircleTel provides a 99.5% uptime SLA measured monthly. Service credits apply for verified outages exceeding SLA thresholds.</p>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <h4 className="font-medium mb-1">5. CANCELLATION</h4>
          <p>30 days written notice required for cancellation. Early termination fees may apply for contract term commitments.</p>
        </div>
        <div>
          <h4 className="font-medium mb-1">6. EQUIPMENT</h4>
          <p>Customer Premises Equipment (CPE) remains CircleTel property and must be returned in good condition upon service termination.</p>
        </div>
        <div>
          <h4 className="font-medium mb-1">7. FAIR USAGE</h4>
          <p>While data is unlimited, CircleTel reserves the right to manage traffic during peak periods to ensure fair usage across all customers.</p>
        </div>
        <div>
          <h4 className="font-medium mb-1">8. GOVERNING LAW</h4>
          <p>
            This agreement is governed by South African law. Full terms and conditions available at{' '}
            <a href="https://www.circletel.co.za/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-circleTel-orange hover:underline font-medium">
              www.circletel.co.za/terms
            </a>
          </p>
        </div>
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 5: Remove the old `generateInclusiveBenefits` function**

Delete the entire `generateInclusiveBenefits` function definition (lines 253-305) since its logic is now handled by `buildQuoteBenefits()` in `lib/quotes/quote-benefits.ts` (including the legacy fallback via `getLegacyBenefits()`).

- [ ] **Step 6: Verify type check**

Run: `npm run type-check:memory`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/quotes/business/\[id\]/preview/page.tsx
git commit -m "feat(quotes): render product-linked benefits and database-driven T&Cs in preview"
```

---

## Task 8: Update PDF Generator

**Files:**
- Modify: `lib/quotes/pdf-generator.ts:12-15` (PDFOptions interface)
- Modify: `lib/quotes/pdf-generator.ts:350-400` (terms section)

- [ ] **Step 1: Update PDFOptions interface to accept terms and benefits**

In `lib/quotes/pdf-generator.ts`, replace the `PDFOptions` interface (lines 12-15):

```typescript
interface PDFOptions {
  includeTerms?: boolean;
  includeSignature?: boolean;
  terms?: Array<{ title: string; text: string; serviceType: string; displayOrder: number }>;
  benefits?: {
    perItem: Array<{ serviceName: string; serviceType: string; benefits: string[] }>;
    global: string[];
  };
}
```

- [ ] **Step 2: Add benefits section before T&Cs**

Insert a benefits rendering block before the T&Cs section (before line 356). Add after the customer notes block:

```typescript
  // ===================================
  // INCLUSIVE BENEFITS
  // ===================================
  if (options.benefits) {
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(230, 233, 239);
    doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INCLUSIVE BENEFITS', 22, yPos);
    yPos += 10;

    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);

    // Per-item benefits
    for (const itemBenefits of options.benefits.perItem) {
      doc.setFont('helvetica', 'bold');
      doc.text(itemBenefits.serviceName, 22, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');

      for (const benefit of itemBenefits.benefits) {
        if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
        doc.text(`  •  ${benefit}`, 24, yPos);
        yPos += 4;
      }
      yPos += 3;
    }

    // Global benefits
    doc.setFont('helvetica', 'bold');
    doc.text('All CircleTel Business Services', 22, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');

    for (const benefit of options.benefits.global) {
      if (yPos > pageHeight - 20) { doc.addPage(); yPos = 20; }
      doc.text(`  •  ${benefit}`, 24, yPos);
      yPos += 4;
    }
    yPos += 10;
  }
```

- [ ] **Step 3: Replace hardcoded T&Cs with passed-in terms**

Replace the T&Cs section (lines 380-397) where `const terms = [...]` is defined:

```typescript
    const terms = options.terms && options.terms.length > 0
      ? options.terms.map((t, i) => `${i + 1}. ${t.title}: ${t.text}`)
      : [
          '1. This quote is valid for 30 days from the date of issue.',
          '2. Prices are quoted in South African Rands (ZAR) and include 15% VAT.',
          '3. Installation is subject to a successful site survey and feasibility assessment.',
          '4. Services are provided subject to network availability at the specified address.',
          '5. Contract terms are binding for the specified duration. Early termination fees may apply.',
          '6. Monthly fees are billed in advance and are due on the 1st of each month.',
          '7. Installation fees are payable upon contract signing or before installation commences.',
          '8. Customer is responsible for providing suitable infrastructure and access for installation.',
          '9. Service Level Agreements (SLAs) are detailed in the full service agreement.',
          '10. CircleTel reserves the right to amend pricing subject to 30 days written notice.'
        ];
```

- [ ] **Step 4: Verify type check**

Run: `npm run type-check:memory`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/quotes/pdf-generator.ts
git commit -m "feat(quotes): add benefits section and database-driven T&Cs to PDF generator"
```

---

## Task 9: Update PDF Download API to Pass Terms & Benefits

**Files:**
- Modify: `app/api/quotes/business/[id]/pdf/route.ts`

The PDF download endpoint calls `generateQuotePDF()`. It needs to fetch terms and build benefits, then pass them as options.

- [ ] **Step 1: Read the current PDF route**

Read `app/api/quotes/business/[id]/pdf/route.ts` to understand current implementation.

- [ ] **Step 2: Add imports and pass terms/benefits to PDF generator**

Add imports:

```typescript
import { fetchQuoteTerms } from '@/lib/quotes/quote-terms';
import { buildQuoteBenefits } from '@/lib/quotes/quote-benefits';
```

Before the `generateQuotePDF()` call, add:

```typescript
const serviceTypes = [...new Set(quote.items.map(item => item.service_type))];
const terms = await fetchQuoteTerms(serviceTypes, quote.contract_term);
const benefits = buildQuoteBenefits(quote.items);
```

Update the `generateQuotePDF` call to pass options:

```typescript
const pdf = generateQuotePDF(quote, { terms, benefits });
```

- [ ] **Step 3: Verify type check**

Run: `npm run type-check:memory`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/api/quotes/business/\[id\]/pdf/route.ts
git commit -m "feat(api): pass product terms and benefits to PDF generator"
```

---

## Task 10: Update Public Quote Endpoint

**Files:**
- Modify: `app/api/quotes/business/[id]/public/route.ts`

The public/shared quote endpoint is used when customers view quotes via share links. It needs to return terms data too, otherwise shared quote views will show fallback hardcoded T&Cs.

- [ ] **Step 1: Read current public route**

Read `app/api/quotes/business/[id]/public/route.ts` to understand the response shape.

- [ ] **Step 2: Add terms to public response**

Add import:
```typescript
import { fetchQuoteTerms } from '@/lib/quotes/quote-terms';
```

After fetching quote items, add:
```typescript
const serviceTypes = [...new Set((items || []).map((item: any) => item.service_type))];
const terms = await fetchQuoteTerms(serviceTypes, quote.contract_term);
```

Include `terms` in the response JSON alongside the quote and items.

- [ ] **Step 3: Verify type check**

Run: `npm run type-check:memory`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/api/quotes/business/\[id\]/public/route.ts
git commit -m "feat(api): include terms in public quote endpoint response"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run full type check**

Run: `npm run type-check:memory`
Expected: PASS with zero errors

- [ ] **Step 2: Verify terms data in database**

```sql
SELECT service_type, title, display_order FROM business_quote_terms
WHERE active = true ORDER BY display_order;
```

Expected: 16 rows (_default: 5, SkyFibre: 4, BizFibreConnect: 3, 5G: 4)

- [ ] **Step 3: Verify benefits_snapshot on existing items**

```sql
SELECT id, service_name, benefits_snapshot IS NOT NULL as has_snapshot
FROM business_quote_items LIMIT 10;
```

- [ ] **Step 4: Test quote preview page**

Navigate to an existing quote preview at `/quotes/business/[id]/preview` and verify:
- Benefits section shows per-product features grouped by service name
- Global benefits section shows 6 CircleTel benefits
- T&Cs section shows default terms + product-specific terms
- Layout renders correctly in two-column grid

- [ ] **Step 5: Test PDF generation**

Download PDF from an existing quote and verify:
- Benefits section appears between pricing and T&Cs
- Per-item benefits render with bullet points
- T&Cs show database-driven terms (not hardcoded fallback)

- [ ] **Step 6: Final commit (if any cleanup needed)**

```bash
git add -A
git commit -m "chore(quotes): cleanup and finalize product-linked benefits and terms"
```
