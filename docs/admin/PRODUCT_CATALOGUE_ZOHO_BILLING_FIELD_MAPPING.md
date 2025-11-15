# Product Catalogue – Zoho Billing Field Mapping Matrix

**Epic 3.1 - Zoho Billing Integration Mapping Design**

This document defines the **field mapping** between CircleTel's internal product catalogue and Zoho Billing system:

- CircleTel **runtime catalogue**: `service_packages`
- **Zoho Billing Items**: One-time charges (installation fees, hardware)
- **Zoho Billing Plans**: Recurring subscription charges (monthly service fees)

CircleTel is the **master** for all catalogue and pricing data. Zoho Billing is a downstream billing system.

> **Important**: All CircleTel-synced fields should be configured as **read-only** in Zoho Billing to prevent data drift.

---

## 1. Entity Mapping Strategy

### CircleTel Product → Zoho Billing Entities

Each CircleTel `service_package` maps to **TWO** Zoho Billing entities:

```
service_packages (CircleTel Product)
    ↓
    ├─→ Zoho Billing PLAN (Recurring Monthly Charge)
    │   - Monthly service fee
    │   - Recurring billing cycle
    │   - Contract term/commitment
    │
    └─→ Zoho Billing ITEM (One-Time Charges)
        - Installation fee
        - Hardware costs
        - Activation fees
```

### Rationale

1. **Plans** = Recurring revenue (monthly broadband service)
2. **Items** = One-time revenue (installation, hardware, setup)
3. This separation aligns with standard Zoho Billing subscription workflow

### Special Cases

| CircleTel Product Type | Zoho Billing Strategy |
|------------------------|----------------------|
| **Standard Service** (e.g., 100Mbps Fibre) | 1 Plan + 1 Item |
| **Bundle** (e.g., Fibre + Router) | 1 Plan + Multiple Items (per component) |
| **Promotion** (discounted monthly) | New Plan version (preserve historical pricing) |
| **Free Installation** | Item with ZAR 0.00 price (for audit trail) |

---

## 2. Zoho Billing Plans (Recurring Charges)

### 2.1 Identity & Classification

| CircleTel Field | Zoho Billing Plan Field | Type | Notes |
|-----------------|------------------------|------|-------|
| `service_packages.id` | `reference_id` | Text | CircleTel canonical ID |
| `service_packages.sku` | `plan_code` | Text (unique) | Primary business key for matching |
| `service_packages.name` | `name` | Text | Customer-facing plan name |
| `service_packages.description` | `description` | Text | Full service description |
| `service_packages.service_type` | Custom: `cf_service_type` | Picklist | fibre, lte, wireless, etc. |
| `service_packages.product_category` | Custom: `cf_product_category` | Picklist | connectivity, voice, etc. |
| `service_packages.market_segment` | Custom: `cf_market_segment` | Picklist | B2B, B2C, Partner |
| `service_packages.provider` | Custom: `cf_provider` | Text | MTN, DFA, Vumatel, etc. |

### 2.2 Pricing & Billing Cycle

| CircleTel Field | Zoho Billing Plan Field | Type | Notes |
|-----------------|------------------------|------|-------|
| `service_packages.price` | `recurring_price` | Decimal(10,2) | Monthly service fee (ZAR) |
| `service_packages.promotion_price` | Custom: `cf_promo_price` | Decimal(10,2) | Promotional monthly rate (if active) |
| N/A (always ZAR) | `currency_code` | Text | Fixed: "ZAR" |
| N/A (always monthly) | `interval` | Number | Fixed: 1 |
| N/A (always monthly) | `interval_unit` | Enum | Fixed: "months" |
| `metadata.contract_months` | `billing_cycles` | Number | Contract commitment (0 = month-to-month) |
| N/A | `trial_period` | Number | Fixed: 0 (no free trial) |

### 2.3 Technical Characteristics

| CircleTel Field | Zoho Billing Plan Field | Type | Notes |
|-----------------|------------------------|------|-------|
| `service_packages.speed_down` | Custom: `cf_download_speed_mbps` | Number | Download speed in Mbps |
| `service_packages.speed_up` | Custom: `cf_upload_speed_mbps` | Number | Upload speed in Mbps |
| `metadata.technology` | Custom: `cf_technology` | Text | fibre, fixed-lte, wireless, 5G |
| `metadata.data_limit` | Custom: `cf_data_limit` | Text | "Unlimited" or specific GB |
| `metadata.installation_days` | Custom: `cf_installation_sla_days` | Number | Expected installation timeframe |

### 2.4 Lifecycle & Visibility

| CircleTel Field | Zoho Billing Plan Field | Type | Notes |
|-----------------|------------------------|------|-------|
| `service_packages.status` | `status` | Enum | active, inactive, archived |
| `service_packages.active` | N/A | - | Derived from status |
| `service_packages.valid_from` | Custom: `cf_valid_from` | Date | Plan launch date |
| `service_packages.valid_to` | Custom: `cf_valid_to` | Date | Plan retirement date (null = ongoing) |
| `service_packages.is_featured` | Custom: `cf_is_featured` | Boolean | Marketing flag |

---

## 3. Zoho Billing Items (One-Time Charges)

### 3.1 Identity & Classification

| CircleTel Field | Zoho Billing Item Field | Type | Notes |
|-----------------|------------------------|------|-------|
| `service_packages.id` + "_INSTALL" | `item_id` | Text | Composite ID for uniqueness |
| `service_packages.sku` + "-INSTALL" | `sku` | Text | Business key for installation item |
| `service_packages.name` + " - Installation" | `name` | Text | e.g., "100Mbps Fibre - Installation" |
| "One-time installation and activation fee" | `description` | Text | Standard description |
| `service_packages.service_type` | Custom: `cf_service_type` | Text | Links back to parent service |

### 3.2 Pricing

| CircleTel Field | Zoho Billing Item Field | Type | Notes |
|-----------------|------------------------|------|-------|
| `pricing.setup` OR `cost_price_zar` | `rate` | Decimal(10,2) | One-time installation fee (ZAR) |
| N/A (always ZAR) | `currency_code` | Text | Fixed: "ZAR" |
| N/A | `tax_id` | Text | VAT tax group (15% in South Africa) |
| `pricing.vat_inclusive` | Custom: `cf_tax_inclusive` | Boolean | True if price includes VAT |

### 3.3 Item Type & Accounting

| CircleTel Field | Zoho Billing Item Field | Type | Notes |
|-----------------|------------------------|------|-------|
| N/A | `item_type` | Enum | Fixed: "service" (not goods) |
| N/A | `unit` | Text | Fixed: "unit" (single installation) |
| N/A | `account_id` | Text | GL account for installation revenue |

---

## 4. Hardware Items (Optional)

If `metadata.hardware.included = true`, create additional Zoho Billing Items:

| CircleTel Field | Zoho Billing Item Field | Type | Notes |
|-----------------|------------------------|------|-------|
| `service_packages.id` + "_HARDWARE" | `item_id` | Text | Hardware item ID |
| `metadata.hardware.sku` | `sku` | Text | Hardware SKU (e.g., "ROUTER-TPLINK-X50") |
| `metadata.hardware.model` | `name` | Text | e.g., "TP-Link Deco X50 Router" |
| `metadata.hardware.cost` | `rate` | Decimal(10,2) | Hardware cost (ZAR) |
| N/A | `item_type` | Enum | "goods" (physical product) |

---

## 5. Integration Metadata

### 5.1 CircleTel Mapping Table (`product_integrations`)

Add Zoho Billing columns to existing table:

```sql
ALTER TABLE product_integrations
ADD COLUMN zoho_billing_plan_id TEXT,           -- Zoho Plan ID for recurring charges
ADD COLUMN zoho_billing_item_id TEXT,           -- Zoho Item ID for installation fee
ADD COLUMN zoho_billing_hardware_item_id TEXT,  -- Zoho Item ID for hardware (if applicable)
ADD COLUMN zoho_billing_sync_status TEXT,       -- ok | failed | pending
ADD COLUMN zoho_billing_last_synced_at TIMESTAMPTZ,
ADD COLUMN zoho_billing_last_sync_error TEXT;
```

### 5.2 Bidirectional Linking

**CircleTel → Zoho Billing**
- Store Zoho IDs in `product_integrations` table
- Use `plan_code` (SKU) as primary matching key

**Zoho Billing → CircleTel**
- Store CircleTel `service_packages.id` in Zoho custom field `reference_id`
- Store CircleTel `service_packages.sku` in Zoho standard field `plan_code` / `sku`

---

## 6. Subscription Creation Workflow

When a customer orders a CircleTel product:

```
1. Customer selects service_packages (e.g., "100Mbps Fibre - 12 Month")
   ↓
2. Create Zoho Billing Subscription:
   - Plan: zoho_billing_plan_id (recurring monthly charge)
   - Addon Items: [
       zoho_billing_item_id (installation fee),
       zoho_billing_hardware_item_id (router, if applicable)
     ]
   ↓
3. Zoho Billing generates Invoice:
   - Line 1: Monthly service (Plan) - ZAR 799.00 (recurring)
   - Line 2: Installation (Item) - ZAR 0.00 (one-time)
   - Line 3: Router (Item) - ZAR 1,200.00 (one-time, if included)
   - VAT: 15% on all items
   - Total Due: ZAR XXX.XX
   ↓
4. Customer pays invoice via NetCash Pay Now
   ↓
5. Subscription activated, recurring billing begins
```

---

## 7. Sync Pipeline Integration Points

### 7.1 Publish Pipeline Extension

```typescript
// lib/catalog/publish.ts - Extend existing pipeline
async function publishServicePackage(adminProductId: string) {
  // 1. Validate admin_products ✅ (already done)
  // 2. Upsert service_packages ✅ (already done)
  // 3. Sync to Zoho CRM ✅ (already done)

  // 4. Sync to Zoho Billing (NEW)
  const zohoBillingSync = await syncServicePackageToZohoBilling(servicePackage);

  if (zohoBillingSync.success) {
    await updateProductIntegration({
      servicePackageId: servicePackage.id,
      zohoBillingPlanId: zohoBillingSync.planId,
      zohoBillingItemId: zohoBillingSync.itemId,
      zohoBillingHardwareItemId: zohoBillingSync.hardwareItemId,
      zohoBillingSyncStatus: 'ok',
      zohoBillingLastSyncedAt: new Date().toISOString()
    });
  } else {
    // Handle failure with retry logic (same as CRM)
    await scheduleRetry(servicePackage.id, 'billing', zohoBillingSync.error);
  }
}
```

### 7.2 Zoho Billing Sync Service

```typescript
// lib/integrations/zoho/billing-sync-service.ts (NEW)
export async function syncServicePackageToZohoBilling(servicePackage: ServicePackage) {
  // 1. Create or update Zoho Billing Plan (recurring monthly)
  const plan = await upsertZohoPlan({
    plan_code: servicePackage.sku,
    name: servicePackage.name,
    recurring_price: parseFloat(servicePackage.price),
    interval: 1,
    interval_unit: 'months',
    billing_cycles: servicePackage.metadata?.contract_months || 0
  });

  // 2. Create or update Zoho Billing Item (installation fee)
  const installationItem = await upsertZohoItem({
    sku: `${servicePackage.sku}-INSTALL`,
    name: `${servicePackage.name} - Installation`,
    rate: servicePackage.pricing?.setup || 0,
    item_type: 'service'
  });

  // 3. Create hardware item if applicable
  let hardwareItem = null;
  if (servicePackage.metadata?.hardware?.included) {
    hardwareItem = await upsertZohoItem({
      sku: servicePackage.metadata.hardware.sku,
      name: servicePackage.metadata.hardware.model,
      rate: servicePackage.metadata.hardware.cost,
      item_type: 'goods'
    });
  }

  return {
    success: true,
    planId: plan.plan_id,
    itemId: installationItem.item_id,
    hardwareItemId: hardwareItem?.item_id
  };
}
```

---

## 8. Tax Configuration (South Africa)

### VAT Settings

| Field | Value | Notes |
|-------|-------|-------|
| **Tax Name** | VAT | Value-Added Tax |
| **Tax Rate** | 15% | Standard South African VAT rate |
| **Tax Type** | Output Tax | Applied to all sales |
| **Default Behavior** | Tax Exclusive | Prices shown exclude VAT by default |

### CircleTel Tax Logic

```typescript
// Pricing display logic
if (servicePackage.pricing?.vat_inclusive) {
  // Price already includes VAT (all-inclusive pricing)
  displayPrice = servicePackage.price;
  vatAmount = (servicePackage.price / 1.15) * 0.15;
  exclVatPrice = servicePackage.price / 1.15;
} else {
  // Price excludes VAT (default)
  displayPrice = servicePackage.price;
  vatAmount = servicePackage.price * 0.15;
  inclVatPrice = servicePackage.price * 1.15;
}
```

---

## 9. Price Change Handling Strategy

### Option A: Update Existing Plan (Recommended for Minor Changes)

**When to use**: Price adjustments <10%, promotional pricing, corrections

```typescript
// Update existing Zoho Plan
await zoho.updatePlan(zohoBillingPlanId, {
  recurring_price: newPrice
});

// Existing subscriptions:
- Continue at old price (grandfathered)
- OR update to new price with customer notification
```

**Pros**: Simple, preserves subscription history
**Cons**: Requires customer communication for active subscriptions

### Option B: Create New Plan Version (Recommended for Major Changes)

**When to use**: Price changes >10%, new contract terms, product rebranding

```typescript
// Create new Zoho Plan
const newPlan = await zoho.createPlan({
  plan_code: `${servicePackage.sku}-V2`,  // Version suffix
  name: servicePackage.name,
  recurring_price: newPrice
});

// Old plan:
await zoho.updatePlan(oldPlanId, {
  status: 'inactive'  // No longer available for new subscriptions
});

// Existing subscriptions:
- Continue on old plan (fully grandfathered)
- Optional: migration campaign to new plan
```

**Pros**: Clean separation, no disruption to existing customers
**Cons**: More complex plan management

### CircleTel Strategy (Hybrid Approach)

```typescript
const priceChangePercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;

if (priceChangePercent < 10) {
  // Minor change: Update existing plan
  await updateZohoPlan(zohoBillingPlanId, { recurring_price: newPrice });
} else {
  // Major change: Create new plan version
  const newPlan = await createZohoPlanVersion(servicePackage, newPrice);
  await markOldPlanInactive(zohoBillingPlanId);

  // Update product_integrations to point to new plan
  await updateProductIntegration({
    servicePackageId: servicePackage.id,
    zohoBillingPlanId: newPlan.plan_id
  });
}
```

---

## 10. Error Handling & Retry Logic

### Sync Failure Scenarios

| Scenario | Error Code | Retry Strategy |
|----------|-----------|----------------|
| **Rate Limit Exceeded** | `RATE_LIMIT_EXCEEDED` | Exponential backoff (same as CRM) |
| **Invalid Plan Code** | `INVALID_PLAN_CODE` | No retry, log error for manual fix |
| **Duplicate Plan** | `DUPLICATE_PLAN_CODE` | Fetch existing, update instead of create |
| **Invalid Tax ID** | `INVALID_TAX_ID` | No retry, requires tax config fix |
| **Authentication Failed** | `INVALID_TOKEN` | Refresh OAuth token, retry once |

### Structured Error Logging

Same pattern as Zoho CRM sync:

```typescript
const error = {
  message: 'Failed to create Zoho Billing Plan',
  code: 'ZOHO_BILLING_CREATE_PLAN_FAILED',
  httpStatus: 400,
  timestamp: new Date().toISOString(),
  payload: {
    plan_code: servicePackage.sku,
    recurring_price: servicePackage.price
  },
  zoho_response: zohoError,
  stack: errorStack
};

await updateProductIntegration({
  servicePackageId: servicePackage.id,
  zohoBillingSyncStatus: 'failed',
  zohoBillingLastSyncError: error.message,
  syncErrorDetails: error  // JSONB column
});
```

---

## 11. API Endpoints Required

### Zoho Billing API Endpoints to Implement

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/plans` | GET | Search for existing plan by `plan_code` |
| `/plans` | POST | Create new plan |
| `/plans/{plan_id}` | PUT | Update existing plan |
| `/plans/{plan_id}` | DELETE | Mark plan as inactive |
| `/items` | GET | Search for existing item by `sku` |
| `/items` | POST | Create new item (installation, hardware) |
| `/items/{item_id}` | PUT | Update existing item |
| `/subscriptions` | POST | Create customer subscription (used during order flow) |
| `/subscriptions/{subscription_id}` | GET | Retrieve subscription details |
| `/invoices` | GET | List invoices for subscription |

### Authentication

Reuse existing Zoho OAuth client (`lib/zoho-api-client.ts`):

```typescript
class ZohoBillingClient extends ZohoApiClient {
  constructor() {
    super({
      clientId: process.env.ZOHO_CLIENT_ID,
      clientSecret: process.env.ZOHO_CLIENT_SECRET,
      refreshToken: process.env.ZOHO_REFRESH_TOKEN,
      region: process.env.ZOHO_REGION || 'US'
    });
  }

  protected getBaseUrl(): string {
    // Zoho Billing uses different subdomain
    return `https://billing.zoho.com/api/v1`;
  }
}
```

---

## 12. Testing & Validation Checklist

### Pre-Production Tests

- [ ] Create Plan for standard product (100Mbps Fibre)
- [ ] Create Plan for promotional product (discounted rate)
- [ ] Create Items for installation + hardware bundle
- [ ] Create test subscription with Plan + Items
- [ ] Verify invoice line items and VAT calculation
- [ ] Test plan update (minor price change)
- [ ] Test plan versioning (major price change)
- [ ] Test sync failure handling and retry logic
- [ ] Verify bidirectional linking (CircleTel ↔ Zoho IDs)
- [ ] Test reconciliation: compare CircleTel vs Zoho Billing

### Production Readiness

- [ ] Backfill script for existing `service_packages` → Zoho Billing
- [ ] Admin UI shows Zoho Billing sync status
- [ ] Manual re-sync action works for Billing (same as CRM)
- [ ] Structured logging captures all sync events
- [ ] Rate limit handling prevents API quota exhaustion
- [ ] Documentation updated with Billing integration details

---

## 13. Related Documentation

- **CRM Field Mapping**: `docs/admin/PRODUCT_CATALOGUE_ZOHO_FIELD_MAPPING.md`
- **CRM Field Security**: `docs/admin/ZOHO_CRM_FIELD_SECURITY_GUIDE.md`
- **Publish Pipeline**: `lib/catalog/publish.ts`
- **Integration Plan**: `docs/admin/PRODUCT_CATALOGUE_ZOHO_INTEGRATION_PLAN.md`
- **Database Schema**: `supabase/migrations/20251115000001_create_product_integrations.sql`

---

**Last Updated**: 2025-01-15
**Owner**: Platform Engineering Team
**Status**: 📋 Design Complete - Ready for Implementation (Epic 3.1)
**Next Steps**: Story 3.2 - Build Zoho Billing API Client
