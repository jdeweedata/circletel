# Netcash PayNow + Zoho Billing Reconciliation Design

**Date:** 2026-03-12
**Status:** Approved
**Author:** Claude + User

---

## Problem Statement

PayNow processed transactions from Netcash are not being matched to CircleTel invoices because:

1. **Reference format mismatch**: Webhook checks `reference.startsWith('INV-')` but PayNow sends `CT-INV2026-00002-...`
2. **No fallback matching**: No attempt to match by `paynow_transaction_ref` stored in invoices
3. **Invoice number overwrite**: Zoho sync overwrites Supabase invoice numbers (line 183 in invoice-sync-service.ts)
4. **No safety net**: No daily reconciliation to catch missed webhooks

---

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOW                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Customer Pays ──► Netcash PayNow ──► Webhook (realtime)                │
│       │                                    │                             │
│       │                                    ▼                             │
│       │                         ┌──────────────────┐                    │
│       │                         │ Parse Reference  │                    │
│       │                         │ CT-INV... → INV- │                    │
│       │                         └────────┬─────────┘                    │
│       │                                  │                               │
│       │                                  ▼                               │
│       │                         ┌──────────────────┐                    │
│       │                         │ Match Invoice    │                    │
│       │                         │ 1. By INV number │                    │
│       │                         │ 2. By paynow_ref │                    │
│       │                         └────────┬─────────┘                    │
│       │                                  │                               │
│       │                                  ▼                               │
│       │                    ┌─────────────────────────┐                  │
│       │                    │ Update invoice → paid   │                  │
│       │                    │ Create payment_txn      │                  │
│       │                    │ Sync to Zoho Billing    │                  │
│       │                    └─────────────────────────┘                  │
│       │                                                                  │
│       │  Daily @ 09:00 SAST                                             │
│       │         │                                                        │
│       │         ▼                                                        │
│       │  ┌─────────────────┐     ┌──────────────────┐                  │
│       └─►│ Reconciliation  │────►│ Catch missed     │                  │
│          │ Cron Job        │     │ webhooks         │                  │
│          └─────────────────┘     └──────────────────┘                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Source of Truth

**Supabase is the source of truth for invoices.**

| System | Role |
|--------|------|
| Supabase `customer_invoices` | Source of truth - generates INV-2026-XXXXX |
| Zoho Billing | Receives invoice with same number (via `ignore_auto_number_generation=true`) |
| Zoho Books | Auto-synced from Zoho Billing |

---

## Component Design

### 1. Invoice Reference Parser

**File:** `lib/billing/invoice-reference-parser.ts`

```typescript
interface ParsedReference {
  type: 'invoice' | 'order' | 'contract' | 'unknown';
  invoiceNumber?: string;    // e.g., "INV-2026-00002"
  rawReference: string;      // Original reference
}

function parsePayNowReference(reference: string): ParsedReference {
  // Strategy 1: CT-INV format (e.g., "CT-INV2026-00002-1771356357084")
  const ctInvMatch = reference.match(/CT-(INV\d{4}-\d{5})/i);
  if (ctInvMatch) {
    return { type: 'invoice', invoiceNumber: ctInvMatch[1], rawReference: reference };
  }

  // Strategy 2: Direct INV format (e.g., "INV-2026-00002")
  const invMatch = reference.match(/(INV-\d{4}-\d{5})/i);
  if (invMatch) {
    return { type: 'invoice', invoiceNumber: invMatch[1], rawReference: reference };
  }

  // Strategy 3: Date-based format (e.g., "CT-20260227-52bd7f62") — likely order/contract
  if (reference.match(/^CT-\d{8}-/)) {
    return { type: 'order', rawReference: reference };
  }

  return { type: 'unknown', rawReference: reference };
}
```

### 2. Invoice Matching Chain

**Location:** Replace lines 462-514 in `app/api/payments/netcash/webhook/route.ts`

```typescript
async function matchInvoice(reference: string, supabase: SupabaseClient) {
  const parsed = parsePayNowReference(reference);

  // 1. Try by invoice number (extracted from reference)
  if (parsed.invoiceNumber) {
    const { data } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('invoice_number', parsed.invoiceNumber)
      .single();
    if (data) return { invoice: data, matchMethod: 'invoice_number' };
  }

  // 2. Fallback: Try by paynow_transaction_ref
  const { data: byRef } = await supabase
    .from('customer_invoices')
    .select('*')
    .eq('paynow_transaction_ref', reference)
    .single();
  if (byRef) return { invoice: byRef, matchMethod: 'paynow_transaction_ref' };

  return null;
}
```

### 3. Zoho Invoice Sync Fix

**File:** `lib/integrations/zoho/invoice-sync-service.ts`

Changes:
1. Add `ignore_auto_number_generation=true` query param to createInvoice call
2. Remove line 183 that overwrites invoice_number from Zoho response

**File:** `lib/integrations/zoho/billing-client.ts`

```typescript
// Modify buildUrl to support additional query params
private buildUrl(endpoint: string, params?: Record<string, string>): string {
  const baseUrl = this.getBillingBaseUrl();
  const allParams = { organization_id: this.organizationId, ...params };
  const queryString = new URLSearchParams(allParams).toString();
  return `${baseUrl}${endpoint}?${queryString}`;
}

// Update createInvoice to use ignore_auto_number_generation
async createInvoice(payload: {...}): Promise<any> {
  // Use ignore_auto_number_generation=true to enforce our invoice number
  const response = await this.request<any>(
    '/invoices',
    'POST',
    payload,
    { ignore_auto_number_generation: 'true' }  // New param
  );
  // ...
}
```

### 4. Daily Reconciliation Cron

**File:** `app/api/cron/paynow-reconciliation/route.ts`

**Schedule:** Daily at 09:00 SAST (07:00 UTC) via Vercel Cron

```typescript
interface ReconciliationResult {
  date: string;
  source: 'netcash_statement';
  totalTransactions: number;
  matched: number;
  alreadyPaid: number;
  newlyMatched: number;
  unmatched: number;
  unmatchedDetails: Array<{
    netcashRef: string;
    yourRef: string;
    amount: number;
    reason: string;
  }>;
  errors: string[];
}
```

**Flow:**
1. Fetch Netcash PayNow statement for yesterday
2. Filter to successful transactions (Status=Complete, Method=Ozow/Card/EFT)
3. For each transaction:
   - Parse reference
   - Check idempotency (existing payment_transactions.provider_reference)
   - Match invoice using same logic as webhook
   - Update invoice if not already paid
   - Create payment_transactions record
   - Sync to Zoho
4. Log to cron_execution_log

### 5. Admin UI Component

**File:** `components/admin/billing/ReconciliationStatusCard.tsx`

Displays:
- Last reconciliation run date/time
- Status (success/partial/failed)
- Counts: total, matched, already paid, unmatched
- List of unmatched transactions for manual review

**API:** `GET /api/admin/billing/reconciliation/status`

---

## Data Flow

```
INVOICE CREATION (Supabase = Source of Truth)
─────────────────────────────────────────────
1. Monthly billing cron creates invoice (INV-2026-XXXXX)
2. Sync to Zoho Billing with ignore_auto_number_generation=true
3. Zoho Billing → Zoho Books (automatic)
4. Generate PayNow URL, store paynow_transaction_ref
5. Send payment notification to customer

PAYMENT PROCESSING (Webhook = Realtime)
───────────────────────────────────────
6. Customer pays via Netcash PayNow
7. Webhook received at /api/payments/netcash/webhook
8. Parse reference: CT-INV2026-00002-xxx → INV-2026-00002
9. Match invoice by:
   a) Extracted invoice_number, OR
   b) paynow_transaction_ref fallback
10. Update customer_invoices.status = 'paid'
11. Create payment_transactions record
12. Sync payment to Zoho Billing → auto-syncs to Zoho Books

RECONCILIATION (Daily Safety Net)
─────────────────────────────────
13. Daily cron at 09:00 SAST fetches Netcash statement
14. Match any missed payments (webhook failures)
15. Log results to cron_execution_log
16. Admin views status at /admin/integrations/zoho-billing
```

---

## Files Changed

### New Files

| File | Purpose |
|------|---------|
| `lib/billing/invoice-reference-parser.ts` | Parse CT-INV... → INV-... references |
| `app/api/cron/paynow-reconciliation/route.ts` | Daily reconciliation cron job |
| `app/api/admin/billing/reconciliation/status/route.ts` | API for admin UI status |
| `components/admin/billing/ReconciliationStatusCard.tsx` | Admin UI component |

### Modified Files

| File | Change |
|------|--------|
| `app/api/payments/netcash/webhook/route.ts` | Fix invoice matching (lines 462-514) |
| `lib/integrations/zoho/invoice-sync-service.ts` | Add ignore_auto_number_generation, remove line 183 |
| `lib/integrations/zoho/billing-client.ts` | Add query param support |
| `app/admin/integrations/zoho-billing/page.tsx` | Add ReconciliationStatusCard |
| `vercel.json` | Add cron schedule |

### Database Changes

**None** — existing columns sufficient:
- `customer_invoices.paynow_transaction_ref`
- `payment_transactions.provider_reference`
- `cron_execution_log`

---

## Testing Strategy

1. **Unit Tests:**
   - `invoice-reference-parser.ts` — test all reference formats
   - Invoice matching chain — test both match strategies

2. **Integration Tests:**
   - Webhook with CT-INV... format → invoice matched
   - Webhook with unknown format → graceful handling
   - Reconciliation cron → catches missed payments

3. **Manual Tests:**
   - Create invoice, generate PayNow, pay, verify status updates
   - Verify Zoho Billing receives correct invoice number
   - Verify Zoho Books auto-synced

---

## Success Criteria

1. PayNow webhooks correctly match invoices via CT-INV... reference
2. Supabase invoice numbers preserved (not overwritten by Zoho)
3. Daily reconciliation catches any missed webhook payments
4. Admin can view reconciliation status in Zoho Billing page
5. Zoho Books shows same invoice numbers as Supabase

---

## References

- [Zoho Billing API - Invoices](https://www.zoho.com/billing/api/v1/invoices/)
- [Zoho Billing + Zoho Books Integration](https://www.zoho.com/us/billing/integrations/zoho-billing-books-integration/)
- Existing webhook: `app/api/payments/netcash/webhook/route.ts`
- Existing Zoho sync: `lib/integrations/zoho/invoice-sync-service.ts`
