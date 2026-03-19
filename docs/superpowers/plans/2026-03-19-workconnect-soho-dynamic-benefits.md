# WorkConnect SOHO Packages & Dynamic Benefits Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed 3 WorkConnect SOHO packages with full cost data, make global quote benefits dynamic by product category, seed SOHO terms, and edit BQ-2026-001 to WorkConnect Plus.

**Architecture:** Two constraint-altering migrations, two seed migrations, one code change to `quote-benefits.ts` (replace hardcoded global benefits with dynamic function), and direct SQL to edit BQ-2026-001. All migrations applied via Supabase MCP.

**Tech Stack:** Next.js 15, TypeScript, Supabase (PostgreSQL)

**Spec:** `docs/superpowers/specs/2026-03-19-workconnect-soho-dynamic-benefits-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `supabase/migrations/20260319100000_alter_service_packages_constraints.sql` | Add `WorkConnect` to service_type CHECK, `soho` to customer_type CHECK |
| `supabase/migrations/20260319100001_seed_workconnect_soho.sql` | Seed 3 WorkConnect packages with full cost/metadata |
| `supabase/migrations/20260319100002_seed_workconnect_terms.sql` | Seed 4 WorkConnect T&C rows into business_quote_terms |
| `lib/quotes/quote-benefits.ts` | Replace hardcoded `GLOBAL_BENEFITS` with `getGlobalBenefits(items)`, add WorkConnect to legacy fallback |

---

## Task 1: Alter CHECK Constraints

**Files:**
- Create: `supabase/migrations/20260319100000_alter_service_packages_constraints.sql`

- [ ] **Step 1: Create constraint migration**

```sql
-- supabase/migrations/20260319100000_alter_service_packages_constraints.sql

-- Add 'WorkConnect' to service_type CHECK constraint
ALTER TABLE service_packages DROP CONSTRAINT IF EXISTS service_packages_service_type_check;
ALTER TABLE service_packages ADD CONSTRAINT service_packages_service_type_check
CHECK (service_type IN (
  'SkyFibre', 'HomeFibreConnect', 'BizFibreConnect', 'WorkConnect', 'All',
  '5g', 'lte', 'fixed_lte', 'fibre', 'uncapped_wireless', '5G', 'LTE',
  'VoIP', 'voip', 'Hosting', 'hosting', 'Cloud_Services', 'cloud_services', 'cloud',
  'IT_Support', 'it_support', 'managed_it', 'Managed_IT',
  'Security', 'security', 'cybersecurity', 'cpe', 'hardware', 'other'
));

-- Add 'soho' to customer_type CHECK constraint
ALTER TABLE service_packages DROP CONSTRAINT IF EXISTS service_packages_customer_type_check;
ALTER TABLE service_packages ADD CONSTRAINT service_packages_customer_type_check
CHECK (customer_type IN ('consumer', 'business', 'both', 'soho'));
```

- [ ] **Step 2: Apply via Supabase MCP**

Run the SQL directly via `mcp__supabase__execute_sql`.

- [ ] **Step 3: Verify constraints updated**

```sql
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'service_packages'::regclass AND contype = 'c'
AND conname IN ('service_packages_service_type_check', 'service_packages_customer_type_check');
```

Expected: Both constraints show the new values.

- [ ] **Step 4: Commit migration file**

```bash
git add supabase/migrations/20260319100000_alter_service_packages_constraints.sql
git commit -m "feat(db): add WorkConnect and soho to service_packages CHECK constraints"
```

---

## Task 2: Seed WorkConnect SOHO Packages

**Files:**
- Create: `supabase/migrations/20260319100001_seed_workconnect_soho.sql`

- [ ] **Step 1: Create seed migration**

```sql
-- supabase/migrations/20260319100001_seed_workconnect_soho.sql

-- Idempotent: delete existing WorkConnect packages before re-inserting
DELETE FROM service_packages WHERE service_type = 'WorkConnect' AND product_category = 'soho';

-- WorkConnect Starter — 50/13 Mbps — R799/mo
INSERT INTO service_packages (
  name, service_type, product_category, customer_type, market_segment, provider,
  speed_down, speed_up, price, base_price_zar, cost_price_zar,
  description, features, active, status, is_featured, is_popular,
  slug, sku, pricing, metadata
) VALUES (
  'WorkConnect Starter', 'WorkConnect', 'soho', 'soho', 'soho', 'MTN',
  50, 13, 799.00, 799.00, 632.08,
  'Work-grade internet for freelancers and entry-level WFH. VoIP QoS, business email, and extended support hours.',
  ARRAY[
    'Uncapped data, no FUP',
    'VoIP QoS included',
    '2 business email accounts',
    'Reyee WiFi 5 router (free to use)',
    'Extended support Mon-Sat 07:00-19:00',
    '12 business hour response time',
    '99% uptime target',
    'Month-to-month or 12/24 month contract',
    'R900 installation fee'
  ],
  true, 'active', false, false,
  'workconnect-starter', 'WC-STARTER-50',
  '{"monthly": 799, "setup": 900, "download_speed": 50, "upload_speed": 13}',
  '{
    "cost_breakdown": {
      "wholesale_fwb": 499.00,
      "infrastructure": 33.50,
      "bss_platform": 10.96,
      "router_amortisation": 28.13,
      "installation_amortisation": 37.50,
      "support_operations": 15.00,
      "payment_processing": 7.99
    },
    "router": {"model": "Reyee RG-EW1300G", "dealer_cost": 675},
    "margin_percent": 20.9,
    "margin_post_24mo": 27.2,
    "installation_fee": 900,
    "contract_duration": "month-to-month or 12/24 months"
  }'::jsonb
);

-- WorkConnect Plus — 100/25 Mbps — R1,099/mo
INSERT INTO service_packages (
  name, service_type, product_category, customer_type, market_segment, provider,
  speed_down, speed_up, price, base_price_zar, cost_price_zar,
  description, features, active, status, is_featured, is_popular,
  slug, sku, pricing, metadata
) VALUES (
  'WorkConnect Plus', 'WorkConnect', 'soho', 'soho', 'soho', 'MTN',
  100, 25, 1099.00, 1099.00, 754.66,
  'Power your productivity with VPN support, VoIP QoS, and a business gateway router. Ideal for remote workers and micro-businesses.',
  ARRAY[
    'Uncapped data, no FUP',
    'VoIP QoS included',
    '5 business email accounts',
    'Reyee Business Gateway router (free to use)',
    '3 concurrent VPN tunnels',
    'Extended support Mon-Sat 07:00-19:00',
    '8 business hour response time',
    '99% uptime target',
    'Month-to-month or 12/24 month contract',
    'R900 installation fee'
  ],
  true, 'active', true, true,
  'workconnect-plus', 'WC-PLUS-100',
  '{"monthly": 1099, "setup": 900, "download_speed": 100, "upload_speed": 25}',
  '{
    "cost_breakdown": {
      "wholesale_fwb": 599.00,
      "infrastructure": 38.50,
      "bss_platform": 10.96,
      "router_amortisation": 42.71,
      "installation_amortisation": 37.50,
      "support_operations": 15.00,
      "payment_processing": 10.99
    },
    "router": {"model": "Reyee RG-EG105GW", "dealer_cost": 1025},
    "margin_percent": 31.3,
    "margin_post_24mo": 33.8,
    "installation_fee": 900,
    "contract_duration": "month-to-month or 12/24 months"
  }'::jsonb
);

-- WorkConnect Pro — 200/50 Mbps — R1,499/mo
INSERT INTO service_packages (
  name, service_type, product_category, customer_type, market_segment, provider,
  speed_down, speed_up, price, base_price_zar, cost_price_zar,
  description, features, active, status, is_featured, is_popular,
  slug, sku, pricing, metadata
) VALUES (
  'WorkConnect Pro', 'WorkConnect', 'soho', 'soho', 'soho', 'MTN',
  200, 50, 1499.00, 1499.00, 842.66,
  'Built for ambition. Static IP, full traffic shaping, VPN, and WhatsApp priority support for power users and multi-user SOHO offices.',
  ARRAY[
    'Uncapped data, no FUP',
    'VoIP QoS with full traffic shaping',
    '10 business email accounts',
    '1 static IP included',
    'Reyee Business Gateway router (free to use)',
    '5 concurrent VPN tunnels',
    'Remote Desktop optimised (RDP/Citrix)',
    'WhatsApp priority support',
    '4 business hour response time',
    '99.5% uptime target with service credits',
    'Month-to-month or 12/24 month contract',
    'FREE installation (valued at R1,500)'
  ],
  true, 'active', false, false,
  'workconnect-pro', 'WC-PRO-200',
  '{"monthly": 1499, "setup": 0, "download_speed": 200, "upload_speed": 50}',
  '{
    "cost_breakdown": {
      "wholesale_fwb": 699.00,
      "infrastructure": 55.00,
      "bss_platform": 10.96,
      "router_amortisation": 42.71,
      "installation_amortisation": 0,
      "support_operations": 20.00,
      "payment_processing": 14.99
    },
    "router": {"model": "Reyee RG-EG105GW", "dealer_cost": 1025},
    "margin_percent": 43.8,
    "margin_post_24mo": 43.7,
    "installation_fee": 0,
    "contract_duration": "month-to-month or 12/24 months"
  }'::jsonb
);
```

- [ ] **Step 2: Apply via Supabase MCP**

Run the SQL directly.

- [ ] **Step 3: Verify packages seeded**

```sql
SELECT name, price, cost_price_zar, speed_down, speed_up,
       metadata->'cost_breakdown' as cost_breakdown,
       metadata->>'margin_percent' as margin
FROM service_packages
WHERE service_type = 'WorkConnect'
ORDER BY price;
```

Expected: 3 rows — Starter (R799, cost R632.08), Plus (R1099, cost R754.66), Pro (R1499, cost R842.66).

- [ ] **Step 4: Commit migration file**

```bash
git add supabase/migrations/20260319100001_seed_workconnect_soho.sql
git commit -m "feat(db): seed WorkConnect SOHO packages with full cost data"
```

---

## Task 3: Seed WorkConnect Terms

**Files:**
- Create: `supabase/migrations/20260319100002_seed_workconnect_terms.sql`

- [ ] **Step 1: Create terms seed migration**

```sql
-- supabase/migrations/20260319100002_seed_workconnect_terms.sql

-- Idempotent: clear existing WorkConnect terms before re-inserting
DELETE FROM business_quote_terms WHERE service_type = 'WorkConnect' AND version = 1;

INSERT INTO business_quote_terms (service_type, contract_term, title, terms_text, version, active, display_order) VALUES
('WorkConnect', NULL, 'Installation & Setup',
 'Professional installation will be scheduled within 7-10 business days of order confirmation. A Reyee router pre-configured with Ruijie Cloud management will be installed and optimised. The customer must provide suitable power and mounting access. Installation fee applies as per selected tier (waived on Pro tier).',
 1, true, 10),
('WorkConnect', NULL, 'Service Level Target',
 '99% uptime target (best-effort, not SLA-backed) for WorkConnect Starter and Plus tiers. 99.5% uptime target with service credits for WorkConnect Pro tier. Targets exclude scheduled maintenance windows and upstream provider outages. This is not a contractual SLA — for guaranteed uptime with service credits on all tiers, consider SkyFibre SME packages.',
 1, true, 11),
('WorkConnect', NULL, 'Support Hours',
 'Extended support available Mon-Sat 07:00-19:00 via phone, email, and WhatsApp. WorkConnect Pro tier receives WhatsApp priority queue access. Response times: Starter 12 business hours, Plus 8 business hours, Pro 4 business hours. On-site visits available at R500 per visit (Plus: 1 free per year, Pro: 2 free per year).',
 1, true, 12),
('WorkConnect', NULL, 'Contract & Flexibility',
 'Month-to-month contracts available on all WorkConnect tiers with 30 days written cancellation notice. 12 and 24-month terms available. Router and CPE remain CircleTel property and must be returned in good condition upon service termination. Early termination fees apply to fixed-term contracts only.',
 1, true, 13);
```

- [ ] **Step 2: Apply via Supabase MCP**

Run the SQL directly.

- [ ] **Step 3: Verify terms seeded**

```sql
SELECT service_type, title, display_order FROM business_quote_terms
WHERE service_type = 'WorkConnect' AND active = true
ORDER BY display_order;
```

Expected: 4 rows (Installation & Setup, Service Level Target, Support Hours, Contract & Flexibility).

- [ ] **Step 4: Commit migration file**

```bash
git add supabase/migrations/20260319100002_seed_workconnect_terms.sql
git commit -m "feat(db): seed WorkConnect SOHO terms into business_quote_terms"
```

---

## Task 4: Make Global Benefits Dynamic

**Files:**
- Modify: `lib/quotes/quote-benefits.ts`

- [ ] **Step 1: Replace GLOBAL_BENEFITS constant and update buildQuoteBenefits**

Replace the entire file content of `lib/quotes/quote-benefits.ts` with:

```typescript
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
 * SOHO benefits — for WorkConnect and consumer-grade products
 */
const SOHO_BENEFITS = [
  'South African-based customer support',
  'Professional installation and configuration',
  'Extended support hours (Mon-Sat 07:00-19:00)',
  'Month-to-month flexibility available',
  'VoIP quality of service included',
  'Free-to-use business router',
];

/**
 * Business/Enterprise benefits — for SkyFibre SME, BizFibreConnect, etc.
 */
const BUSINESS_BENEFITS = [
  'South African-based customer support',
  '24/7 Network Operations Centre (NOC) monitoring',
  'Professional installation and configuration',
  'Dedicated account manager',
  'Priority technical support',
  'Monthly usage reporting and analytics',
];

/**
 * Determine the appropriate global benefits based on quote items.
 * SOHO products get SOHO benefits. Business products get business benefits.
 * Mixed quotes default to business benefits (higher tier wins).
 */
function getGlobalBenefits(items: BusinessQuoteItem[]): string[] {
  const hasBusinessItems = items.some((item) => {
    const type = item.service_type?.toLowerCase() || '';
    const category = item.product_category?.toLowerCase() || '';
    return (
      type.includes('skyfibre') && (item.service_name?.toLowerCase().includes('sme') || item.service_name?.toLowerCase().includes('enterprise')) ||
      type === 'bizfibreconnect' ||
      category === 'fibre_business'
    );
  });

  // If any item is business-grade, use business benefits (higher tier wins)
  if (hasBusinessItems) {
    return BUSINESS_BENEFITS;
  }

  const hasSohoItems = items.some((item) => {
    const type = item.service_type?.toLowerCase() || '';
    const category = item.product_category?.toLowerCase() || '';
    return type === 'workconnect' || category === 'soho';
  });

  if (hasSohoItems) {
    return SOHO_BENEFITS;
  }

  // Default to business benefits for unknown product types
  return BUSINESS_BENEFITS;
}

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
    global: getGlobalBenefits(items),
  };
}

/**
 * Legacy fallback: generate basic benefits from service type when no snapshot exists.
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
  if (type === 'workconnect' || name.includes('workconnect')) {
    return ['VoIP QoS included', 'Extended support Mon-Sat 07:00-19:00', 'Free-to-use business router'];
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
git commit -m "feat(quotes): make global benefits dynamic by product category (SOHO vs Business)"
```

---

## Task 5: Edit Quote BQ-2026-001

This task is direct SQL against the database — no migration files needed since it's a data edit, not a schema change.

- [ ] **Step 1: Get the WorkConnect Plus package_id**

```sql
SELECT id, name, price, features FROM service_packages
WHERE name = 'WorkConnect Plus' AND service_type = 'WorkConnect';
```

Save the `id` value for use in subsequent steps.

- [ ] **Step 2: Get the current quote and item IDs**

```sql
SELECT bq.id as quote_id, bqi.id as item_id, bq.quote_number
FROM business_quotes bq
JOIN business_quote_items bqi ON bqi.quote_id = bq.id
WHERE bq.quote_number = 'BQ-2026-001';
```

- [ ] **Step 3: Update the quote item to WorkConnect Plus**

Using the `package_id` from Step 1 and `item_id` from Step 2:

```sql
UPDATE business_quote_items
SET
  package_id = '<workconnect_plus_id>',
  service_name = 'WorkConnect Plus',
  service_type = 'WorkConnect',
  product_category = 'soho',
  monthly_price = 1099.00,
  installation_price = 900.00,
  speed_down = 100,
  speed_up = 25,
  data_cap_gb = NULL,
  benefits_snapshot = jsonb_build_object(
    'features', ARRAY[
      'Uncapped data, no FUP',
      'VoIP QoS included',
      '5 business email accounts',
      'Reyee Business Gateway router (free to use)',
      '3 concurrent VPN tunnels',
      'Extended support Mon-Sat 07:00-19:00',
      '8 business hour response time',
      '99% uptime target',
      'Month-to-month or 12/24 month contract',
      'R900 installation fee'
    ]::text[]
  )
WHERE id = '<item_id>';
```

- [ ] **Step 4: Update the quote pricing totals**

```sql
UPDATE business_quotes
SET
  subtotal_monthly = 1099.00,
  vat_amount_monthly = 164.85,
  total_monthly = 1263.85,
  subtotal_installation = 900.00,
  vat_amount_installation = 135.00,
  total_installation = 1035.00,
  customer_notes = 'WorkConnect Plus installation - SOHO connectivity for law firm. Coverage verified: MTN Tarana wireless available at location. Nearest base station: Wits Sports Grounds (1.02km). VPN support for legal practice management software. 5 business email accounts for staff.',
  updated_at = NOW()
WHERE quote_number = 'BQ-2026-001';
```

- [ ] **Step 5: Verify the updated quote**

```sql
SELECT bq.quote_number, bq.total_monthly, bq.total_installation, bq.customer_notes,
       bqi.service_name, bqi.service_type, bqi.monthly_price, bqi.speed_down, bqi.speed_up,
       bqi.benefits_snapshot->'features' as features
FROM business_quotes bq
JOIN business_quote_items bqi ON bqi.quote_id = bq.id
WHERE bq.quote_number = 'BQ-2026-001';
```

Expected: WorkConnect Plus at R1,099/mo, 100/25 Mbps, with SOHO features and updated customer notes.

---

## Task 6: Final Verification

- [ ] **Step 1: Run type check**

Run: `npm run type-check:memory`
Expected: PASS

- [ ] **Step 2: Verify full product catalogue**

```sql
SELECT name, service_type, price, cost_price_zar,
       metadata->>'margin_percent' as margin,
       metadata->'cost_breakdown' as costs
FROM service_packages
WHERE service_type = 'WorkConnect'
ORDER BY price;
```

Expected: 3 WorkConnect packages with correct pricing and cost breakdowns.

- [ ] **Step 3: Verify WorkConnect terms**

```sql
SELECT service_type, title, display_order FROM business_quote_terms
WHERE service_type = 'WorkConnect' AND active = true
ORDER BY display_order;
```

Expected: 4 terms rows.

- [ ] **Step 4: Verify BQ-2026-001 is updated**

```sql
SELECT bq.quote_number, bqi.service_name, bqi.service_type, bqi.monthly_price
FROM business_quotes bq
JOIN business_quote_items bqi ON bqi.quote_id = bq.id
WHERE bq.quote_number = 'BQ-2026-001';
```

Expected: WorkConnect Plus, R1,099.

- [ ] **Step 5: Final commit and push**

```bash
git add -A
git commit -m "chore(quotes): finalize WorkConnect SOHO and dynamic benefits"
git push origin main
```
