# Netcash PayNow + Zoho Billing Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix PayNow payment matching to invoices and add daily reconciliation safety net.

**Architecture:** Parse CT-INV... references to extract invoice numbers, match by invoice_number or paynow_transaction_ref fallback, preserve Supabase as source of truth for invoice numbers (don't let Zoho overwrite), add daily cron to catch missed webhooks.

**Tech Stack:** TypeScript, Next.js 15, Supabase, Zoho Billing API, Vercel Cron

**Spec:** `docs/superpowers/specs/2026-03-12-netcash-paynow-zoho-reconciliation-design.md`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `lib/billing/invoice-reference-parser.ts` | Parse PayNow references to extract invoice numbers |
| `__tests__/lib/billing/invoice-reference-parser.test.ts` | Unit tests for parser |
| `lib/billing/invoice-matcher.ts` | Match references to invoices using multiple strategies |
| `__tests__/lib/billing/invoice-matcher.test.ts` | Unit tests for matcher |
| `app/api/payments/netcash/webhook/route.ts` | (Modify) Use new matcher instead of inline logic |
| `lib/integrations/zoho/billing-client.ts` | (Modify) Add query param support for createInvoice |
| `lib/integrations/zoho/invoice-sync-service.ts` | (Modify) Use ignore_auto_number_generation, remove overwrite |
| `app/api/cron/paynow-reconciliation/route.ts` | Daily reconciliation cron job |
| `app/api/admin/billing/reconciliation/status/route.ts` | API endpoint for reconciliation status |
| `components/admin/billing/ReconciliationStatusCard.tsx` | Admin UI component |
| `app/admin/integrations/zoho-billing/page.tsx` | (Modify) Add ReconciliationStatusCard |
| `vercel.json` | (Modify) Add cron schedule |

---

## Chunk 1: Invoice Reference Parser

### Task 1.1: Create Invoice Reference Parser Tests

**Files:**
- Create: `__tests__/lib/billing/invoice-reference-parser.test.ts`

- [ ] **Step 1: Create test file with all reference format cases**

```typescript
// __tests__/lib/billing/invoice-reference-parser.test.ts
import { parsePayNowReference, type ParsedReference } from '@/lib/billing/invoice-reference-parser';

describe('parsePayNowReference', () => {
  describe('CT-INV format', () => {
    it('parses CT-INV2026-00002-timestamp format', () => {
      const result = parsePayNowReference('CT-INV2026-00002-1771356357084');

      expect(result).toEqual<ParsedReference>({
        type: 'invoice',
        invoiceNumber: 'INV-2026-00002',
        rawReference: 'CT-INV2026-00002-1771356357084',
      });
    });

    it('parses CT-INV with different years', () => {
      const result = parsePayNowReference('CT-INV2025-00145-9876543210');

      expect(result).toEqual<ParsedReference>({
        type: 'invoice',
        invoiceNumber: 'INV-2025-00145',
        rawReference: 'CT-INV2025-00145-9876543210',
      });
    });

    it('is case insensitive', () => {
      const result = parsePayNowReference('ct-inv2026-00002-123456');

      expect(result.type).toBe('invoice');
      expect(result.invoiceNumber).toBe('INV-2026-00002');
    });
  });

  describe('Direct INV format', () => {
    it('parses INV-2026-00002 format', () => {
      const result = parsePayNowReference('INV-2026-00002');

      expect(result).toEqual<ParsedReference>({
        type: 'invoice',
        invoiceNumber: 'INV-2026-00002',
        rawReference: 'INV-2026-00002',
      });
    });

    it('parses invoice number embedded in longer string', () => {
      const result = parsePayNowReference('Payment for INV-2026-00003');

      expect(result.type).toBe('invoice');
      expect(result.invoiceNumber).toBe('INV-2026-00003');
    });
  });

  describe('Order/Contract format', () => {
    it('identifies CT-YYYYMMDD-hash as order type', () => {
      const result = parsePayNowReference('CT-20260227-52bd7f62');

      expect(result).toEqual<ParsedReference>({
        type: 'order',
        invoiceNumber: undefined,
        rawReference: 'CT-20260227-52bd7f62',
      });
    });

    it('identifies CT-YYYYMMDD with longer hash', () => {
      const result = parsePayNowReference('CT-20260312-abc123def456');

      expect(result.type).toBe('order');
      expect(result.invoiceNumber).toBeUndefined();
    });
  });

  describe('Unknown format', () => {
    it('returns unknown for unrecognized formats', () => {
      const result = parsePayNowReference('RANDOM-REF-12345');

      expect(result).toEqual<ParsedReference>({
        type: 'unknown',
        invoiceNumber: undefined,
        rawReference: 'RANDOM-REF-12345',
      });
    });

    it('returns unknown for empty string', () => {
      const result = parsePayNowReference('');

      expect(result.type).toBe('unknown');
    });

    it('returns unknown for order numbers', () => {
      const result = parsePayNowReference('ORD-2026-00123');

      expect(result.type).toBe('unknown');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/lib/billing/invoice-reference-parser.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/billing/invoice-reference-parser'"

- [ ] **Step 3: Commit test file**

```bash
git add __tests__/lib/billing/invoice-reference-parser.test.ts
git commit -m "test: add invoice reference parser tests"
```

---

### Task 1.2: Implement Invoice Reference Parser

**Files:**
- Create: `lib/billing/invoice-reference-parser.ts`

- [ ] **Step 1: Create the parser implementation**

```typescript
// lib/billing/invoice-reference-parser.ts

/**
 * Invoice Reference Parser
 *
 * Parses PayNow transaction references to extract invoice numbers.
 * Handles multiple formats:
 * - CT-INV2026-00002-timestamp → INV-2026-00002
 * - INV-2026-00002 → INV-2026-00002
 * - CT-20260227-hash → order type (no invoice number)
 */

export interface ParsedReference {
  /** Type of reference: invoice, order, contract, or unknown */
  type: 'invoice' | 'order' | 'contract' | 'unknown';
  /** Extracted invoice number (e.g., "INV-2026-00002") */
  invoiceNumber?: string;
  /** Original reference string */
  rawReference: string;
}

/**
 * Parse a PayNow reference to extract invoice information
 *
 * @param reference - The PayNow reference string (e.g., "CT-INV2026-00002-1771356357084")
 * @returns Parsed reference with type and extracted invoice number
 */
export function parsePayNowReference(reference: string): ParsedReference {
  if (!reference) {
    return { type: 'unknown', rawReference: reference };
  }

  // Strategy 1: CT-INV format (e.g., "CT-INV2026-00002-1771356357084")
  // Captures: INV + 4-digit year + 5-digit sequence
  const ctInvMatch = reference.match(/CT-INV(\d{4})-?(\d{5})/i);
  if (ctInvMatch) {
    const year = ctInvMatch[1];
    const sequence = ctInvMatch[2];
    return {
      type: 'invoice',
      invoiceNumber: `INV-${year}-${sequence}`,
      rawReference: reference,
    };
  }

  // Strategy 2: Direct INV format (e.g., "INV-2026-00002")
  const invMatch = reference.match(/INV-(\d{4})-(\d{5})/i);
  if (invMatch) {
    const year = invMatch[1];
    const sequence = invMatch[2];
    return {
      type: 'invoice',
      invoiceNumber: `INV-${year}-${sequence}`,
      rawReference: reference,
    };
  }

  // Strategy 3: Date-based format (e.g., "CT-20260227-52bd7f62") — likely order/contract
  if (/^CT-\d{8}-/i.test(reference)) {
    return {
      type: 'order',
      invoiceNumber: undefined,
      rawReference: reference,
    };
  }

  // Unknown format
  return {
    type: 'unknown',
    invoiceNumber: undefined,
    rawReference: reference,
  };
}

/**
 * Check if a reference contains an invoice number
 */
export function hasInvoiceNumber(reference: string): boolean {
  const parsed = parsePayNowReference(reference);
  return parsed.type === 'invoice' && !!parsed.invoiceNumber;
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- __tests__/lib/billing/invoice-reference-parser.test.ts
```

Expected: All tests PASS

- [ ] **Step 3: Commit implementation**

```bash
git add lib/billing/invoice-reference-parser.ts
git commit -m "feat(billing): add invoice reference parser for PayNow references"
```

---

## Chunk 2: Invoice Matcher Service

### Task 2.1: Create Invoice Matcher Tests

**Files:**
- Create: `__tests__/lib/billing/invoice-matcher.test.ts`

- [ ] **Step 1: Create test file with mocked Supabase**

```typescript
// __tests__/lib/billing/invoice-matcher.test.ts
import { matchInvoiceByReference, type InvoiceMatchResult } from '@/lib/billing/invoice-matcher';

// Mock Supabase client
const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

const mockSupabase = {
  from: mockFrom,
} as any;

describe('matchInvoiceByReference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('matching by invoice number', () => {
    it('matches invoice when CT-INV reference contains valid invoice number', async () => {
      const mockInvoice = {
        id: 'inv-uuid-123',
        invoice_number: 'INV-2026-00002',
        status: 'sent',
        total_amount: 899.00,
      };

      mockSingle.mockResolvedValueOnce({ data: mockInvoice, error: null });

      const result = await matchInvoiceByReference(
        'CT-INV2026-00002-1771356357084',
        mockSupabase
      );

      expect(result).toEqual<InvoiceMatchResult>({
        matched: true,
        invoice: mockInvoice,
        matchMethod: 'invoice_number',
      });

      expect(mockFrom).toHaveBeenCalledWith('customer_invoices');
      expect(mockEq).toHaveBeenCalledWith('invoice_number', 'INV-2026-00002');
    });

    it('returns not matched when invoice number not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSingle.mockResolvedValueOnce({ data: null, error: null }); // fallback also fails

      const result = await matchInvoiceByReference(
        'CT-INV2026-99999-1771356357084',
        mockSupabase
      );

      expect(result.matched).toBe(false);
      expect(result.invoice).toBeUndefined();
    });
  });

  describe('fallback to paynow_transaction_ref', () => {
    it('falls back to paynow_transaction_ref when invoice number not found', async () => {
      const mockInvoice = {
        id: 'inv-uuid-456',
        invoice_number: 'INV-2026-00003',
        status: 'sent',
        paynow_transaction_ref: 'CT-20260227-52bd7f62',
      };

      // First call (by invoice_number) returns nothing
      mockSingle.mockResolvedValueOnce({ data: null, error: null });
      // Second call (by paynow_transaction_ref) returns invoice
      mockSingle.mockResolvedValueOnce({ data: mockInvoice, error: null });

      const result = await matchInvoiceByReference(
        'CT-20260227-52bd7f62',
        mockSupabase
      );

      expect(result).toEqual<InvoiceMatchResult>({
        matched: true,
        invoice: mockInvoice,
        matchMethod: 'paynow_transaction_ref',
      });
    });
  });

  describe('error handling', () => {
    it('returns not matched with error on database error', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const result = await matchInvoiceByReference('CT-INV2026-00002-123', mockSupabase);

      expect(result.matched).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/lib/billing/invoice-matcher.test.ts
```

Expected: FAIL with "Cannot find module '@/lib/billing/invoice-matcher'"

- [ ] **Step 3: Commit test file**

```bash
git add __tests__/lib/billing/invoice-matcher.test.ts
git commit -m "test: add invoice matcher tests"
```

---

### Task 2.2: Implement Invoice Matcher Service

**Files:**
- Create: `lib/billing/invoice-matcher.ts`

- [ ] **Step 1: Create the matcher implementation**

```typescript
// lib/billing/invoice-matcher.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { parsePayNowReference, type ParsedReference } from './invoice-reference-parser';
import { billingLogger } from '@/lib/logging';

/**
 * Result of invoice matching attempt
 */
export interface InvoiceMatchResult {
  /** Whether an invoice was found */
  matched: boolean;
  /** The matched invoice (if found) */
  invoice?: {
    id: string;
    invoice_number: string;
    customer_id: string;
    status: string;
    total_amount: number;
    amount_paid?: number;
    amount_due: number;
    [key: string]: any;
  };
  /** How the invoice was matched */
  matchMethod?: 'invoice_number' | 'paynow_transaction_ref';
  /** Parsed reference information */
  parsedReference?: ParsedReference;
  /** Error message if matching failed */
  error?: string;
}

/**
 * Match a PayNow reference to an invoice using multiple strategies
 *
 * Strategy chain:
 * 1. Parse reference to extract invoice number (CT-INV... → INV-...)
 * 2. If invoice number found, query by invoice_number
 * 3. Fallback: query by paynow_transaction_ref
 *
 * @param reference - The PayNow reference string
 * @param supabase - Supabase client instance
 * @returns Match result with invoice data or error
 */
export async function matchInvoiceByReference(
  reference: string,
  supabase: SupabaseClient
): Promise<InvoiceMatchResult> {
  const parsed = parsePayNowReference(reference);

  billingLogger.debug('[InvoiceMatcher] Parsing reference', {
    reference,
    type: parsed.type,
    invoiceNumber: parsed.invoiceNumber,
  });

  // Strategy 1: Try by extracted invoice number
  if (parsed.invoiceNumber) {
    const { data: invoice, error } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('invoice_number', parsed.invoiceNumber)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      billingLogger.error('[InvoiceMatcher] Database error on invoice_number lookup', {
        error: error.message,
        invoiceNumber: parsed.invoiceNumber,
      });
      return {
        matched: false,
        parsedReference: parsed,
        error: `Database error: ${error.message}`,
      };
    }

    if (invoice) {
      billingLogger.info('[InvoiceMatcher] Matched by invoice_number', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
      });
      return {
        matched: true,
        invoice,
        matchMethod: 'invoice_number',
        parsedReference: parsed,
      };
    }
  }

  // Strategy 2: Fallback to paynow_transaction_ref
  const { data: invoiceByRef, error: refError } = await supabase
    .from('customer_invoices')
    .select('*')
    .eq('paynow_transaction_ref', reference)
    .single();

  if (refError && refError.code !== 'PGRST116') {
    billingLogger.error('[InvoiceMatcher] Database error on paynow_transaction_ref lookup', {
      error: refError.message,
      reference,
    });
    return {
      matched: false,
      parsedReference: parsed,
      error: `Database error: ${refError.message}`,
    };
  }

  if (invoiceByRef) {
    billingLogger.info('[InvoiceMatcher] Matched by paynow_transaction_ref', {
      invoiceId: invoiceByRef.id,
      invoiceNumber: invoiceByRef.invoice_number,
    });
    return {
      matched: true,
      invoice: invoiceByRef,
      matchMethod: 'paynow_transaction_ref',
      parsedReference: parsed,
    };
  }

  // No match found
  billingLogger.warn('[InvoiceMatcher] No invoice match found', {
    reference,
    parsedType: parsed.type,
    parsedInvoiceNumber: parsed.invoiceNumber,
  });

  return {
    matched: false,
    parsedReference: parsed,
  };
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
npm test -- __tests__/lib/billing/invoice-matcher.test.ts
```

Expected: All tests PASS

- [ ] **Step 3: Commit implementation**

```bash
git add lib/billing/invoice-matcher.ts
git commit -m "feat(billing): add invoice matcher with multi-strategy lookup"
```

---

## Chunk 3: Webhook Fix

### Task 3.1: Update Netcash Webhook to Use Invoice Matcher

**Files:**
- Modify: `app/api/payments/netcash/webhook/route.ts:462-514`

- [ ] **Step 1: Add import for invoice matcher**

At the top of the file, add:

```typescript
import { matchInvoiceByReference } from '@/lib/billing/invoice-matcher';
```

- [ ] **Step 2: Replace invoice matching logic (lines 462-514)**

Find the section starting with `// Check if this is an invoice payment (reference starts with INV-)` and replace with:

```typescript
        // Match invoice using multi-strategy matcher
        const invoiceMatch = await matchInvoiceByReference(reference, supabase);

        if (invoiceMatch.matched && invoiceMatch.invoice) {
          const invoice = invoiceMatch.invoice;
          webhookLogger.info('[Invoice Payment] Matched invoice', {
            reference,
            invoiceNumber: invoice.invoice_number,
            matchMethod: invoiceMatch.matchMethod,
          });

          // Get customer data for email
          const { data: customer } = await supabase
            .from('customers')
            .select('id, email, first_name, last_name')
            .eq('id', invoice.customer_id)
            .single();

          // Calculate new amount paid and remaining balance
          const newAmountPaid = (invoice.amount_paid || 0) + amount;
          const newAmountDue = Math.max(0, invoice.total_amount - newAmountPaid);
          const newStatus = newAmountDue <= 0 ? 'paid' : 'partial';

          // Update invoice
          const { error: invoiceUpdateError } = await supabase
            .from('customer_invoices')
            .update({
              status: newStatus,
              amount_paid: newAmountPaid,
              amount_due: newAmountDue,
              paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', invoice.id);

          if (invoiceUpdateError) {
            webhookLogger.error('[Invoice Payment] Failed to update invoice', {
              error: invoiceUpdateError.message,
            });
          } else {
            webhookLogger.info('[Invoice Payment] Invoice updated', {
              invoice_number: invoice.invoice_number,
              status: newStatus,
              amount_paid: newAmountPaid,
              amount_due: newAmountDue,
            });

            // Link payment transaction to invoice
            if (existingTransaction) {
              await supabase
                .from('payment_transactions')
                .update({
                  invoice_id: invoice.id,
                  customer_invoice_id: invoice.id,
                  customer_id: invoice.customer_id,
                })
                .eq('id', existingTransaction.id);
            }

            // Send payment receipt email
            if (customer?.email) {
              const paymentMethod = String(
                bodyParsed.PaymentMethod || bodyParsed.payment_method || 'Online Payment'
              );

              EnhancedEmailService.sendPaymentReceipt({
                invoice_id: invoice.id,
                customer_id: customer.id,
                email: customer.email,
                customer_name: `${customer.first_name} ${customer.last_name}`,
                invoice_number: invoice.invoice_number,
                payment_amount: amount,
                payment_date: new Date().toISOString(),
                payment_method: formatPaymentMethod(paymentMethod),
                payment_reference: transactionId,
                remaining_balance: newAmountDue,
              })
                .then((result) => {
                  if (result.success) {
                    webhookLogger.info('[Invoice Payment] Receipt email sent', {
                      message_id: result.message_id,
                    });
                  }
                })
                .catch((error) => {
                  webhookLogger.error('[Invoice Payment] Receipt email error', {
                    error: error instanceof Error ? error.message : String(error),
                  });
                });
            }
          }
        } else if (invoiceMatch.parsedReference?.type === 'order') {
          // Handle order payments (existing logic)
          webhookLogger.info('[Payment Processing] Processing order payment', { reference });
          updateOrderFromPayment(reference, paymentTransaction.id, amount)
            .then((orderResult) => {
              if (orderResult.success) {
                webhookLogger.info('[Order Update] Order updated successfully', {
                  order_number: orderResult.order_number,
                });
              }
            })
            .catch((error) => {
              webhookLogger.error('[Order Update] Error', {
                error: error instanceof Error ? error.message : String(error),
              });
            });
        } else {
          // Unknown reference type - log for manual review
          webhookLogger.warn('[Payment Processing] Unmatched reference', {
            reference,
            parsedType: invoiceMatch.parsedReference?.type,
          });
        }
```

- [ ] **Step 3: Run type check**

```bash
npm run type-check:memory
```

Expected: No TypeScript errors

- [ ] **Step 4: Commit webhook fix**

```bash
git add app/api/payments/netcash/webhook/route.ts
git commit -m "fix(webhook): use invoice matcher for PayNow reference parsing

Replaces inline INV- prefix check with multi-strategy matcher:
- Parses CT-INV... format to extract invoice number
- Falls back to paynow_transaction_ref lookup
- Handles order references separately"
```

---

## Chunk 4: Zoho Billing Client Fix

### Task 4.1: Add Query Param Support to Zoho Billing Client

**Files:**
- Modify: `lib/integrations/zoho/billing-client.ts`

- [ ] **Step 1: Update request method to accept query params**

Find the `request` method (around line 79) and update signature:

```typescript
  /**
   * Generic API request handler with error handling
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    queryParams?: Record<string, string>
  ): Promise<T> {
    const accessToken = await this.getAccessToken();
    const url = this.buildUrl(endpoint, queryParams);
    // ... rest of method unchanged
```

- [ ] **Step 2: Update buildUrl to merge additional params**

Find the `buildUrl` method (around line 70) and update:

```typescript
  /**
   * Build full URL with organization ID and optional additional params
   */
  private buildUrl(endpoint: string, additionalParams?: Record<string, string>): string {
    const baseUrl = this.getBillingBaseUrl();
    const params = new URLSearchParams({
      organization_id: this.organizationId,
      ...additionalParams,
    });
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${baseUrl}${endpoint}${separator}${params.toString()}`;
  }
```

- [ ] **Step 3: Update createInvoice to use ignore_auto_number_generation**

Find the `createInvoice` method (around line 835) and update:

```typescript
  /**
   * Create a new invoice for a customer
   * Uses ignore_auto_number_generation to preserve our invoice number
   */
  async createInvoice(payload: {
    customer_id: string;
    invoice_number?: string;
    date?: string;
    due_date?: string;
    payment_terms?: number;
    payment_terms_label?: string;
    line_items: Array<{
      item_id?: string;
      name: string;
      description?: string;
      rate: number;
      quantity: number;
    }>;
    notes?: string;
    terms?: string;
    [key: string]: any;
  }): Promise<any> {
    try {
      const itemCount = payload.line_items?.length || (payload as any).invoice_items?.length || 0;
      zohoLogger.debug(' Creating invoice:', {
        customer_id: payload.customer_id,
        invoice_number: payload.invoice_number,
        items: itemCount,
      });

      // Zoho Billing API expects 'invoice_items' not 'line_items'
      const zohoPayload = { ...payload };
      if (payload.line_items && !(payload as any).invoice_items) {
        (zohoPayload as any).invoice_items = payload.line_items;
        delete (zohoPayload as any).line_items;
      }

      // Use ignore_auto_number_generation to preserve our invoice number
      const queryParams = payload.invoice_number
        ? { ignore_auto_number_generation: 'true' }
        : undefined;

      const response = await this.request<any>(
        '/invoices',
        'POST',
        zohoPayload,
        queryParams
      );

      if (!response.invoice) {
        throw new Error('Failed to create invoice');
      }

      zohoLogger.debug(' Invoice created successfully:', {
        invoice_id: response.invoice.invoice_id,
        invoice_number: response.invoice.invoice_number,
        total: response.invoice.total,
      });

      return response.invoice;
    } catch (error) {
      zohoLogger.error('[ZohoBillingClient] Error creating invoice', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
```

- [ ] **Step 4: Run type check**

```bash
npm run type-check:memory
```

Expected: No TypeScript errors

- [ ] **Step 5: Commit Zoho client fix**

```bash
git add lib/integrations/zoho/billing-client.ts
git commit -m "feat(zoho): add ignore_auto_number_generation for custom invoice numbers

- Updates buildUrl to accept additional query params
- Updates request method to pass params
- createInvoice now uses ignore_auto_number_generation=true
  when invoice_number is provided"
```

---

### Task 4.2: Fix Invoice Sync Service - Remove Overwrite

**Files:**
- Modify: `lib/integrations/zoho/invoice-sync-service.ts`

- [ ] **Step 1: Remove line 183 that overwrites invoice_number**

Find lines 176-188 and update to NOT overwrite invoice_number:

```typescript
    // Update invoice with ZOHO invoice ID
    // IMPORTANT: Do NOT overwrite invoice_number - Supabase is source of truth
    await supabase
      .from('customer_invoices')
      .update({
        zoho_billing_invoice_id: zoho_invoice_id,
        zoho_invoice_id: zoho_invoice_id, // Legacy field for compatibility
        // REMOVED: invoice_number: zohoInvoice.invoice_number,
        zoho_sync_status: 'synced',
        zoho_last_synced_at: new Date().toISOString(),
        zoho_last_sync_error: null
      })
      .eq('id', invoice_id);
```

- [ ] **Step 2: Add comment explaining why**

Add above the update:

```typescript
    // Update invoice with ZOHO invoice ID
    // IMPORTANT: We do NOT overwrite invoice_number from Zoho response.
    // Supabase is the source of truth for invoice numbers.
    // We use ignore_auto_number_generation=true when creating in Zoho
    // to ensure Zoho accepts our invoice number.
```

- [ ] **Step 3: Run type check**

```bash
npm run type-check:memory
```

Expected: No TypeScript errors

- [ ] **Step 4: Commit sync service fix**

```bash
git add lib/integrations/zoho/invoice-sync-service.ts
git commit -m "fix(zoho): preserve Supabase invoice numbers as source of truth

Remove line that overwrote invoice_number with Zoho's response.
Supabase generates invoice numbers (INV-2026-XXXXX) and Zoho
accepts them via ignore_auto_number_generation=true."
```

---

## Chunk 5: Daily Reconciliation Cron

### Task 5.1: Create Reconciliation Cron Endpoint

**Files:**
- Create: `app/api/cron/paynow-reconciliation/route.ts`

- [ ] **Step 1: Create the reconciliation cron handler**

```typescript
// app/api/cron/paynow-reconciliation/route.ts

/**
 * Daily PayNow Reconciliation Cron Job
 *
 * Runs daily at 09:00 SAST to reconcile PayNow payments
 * that may have been missed by webhooks.
 *
 * Vercel Cron: 0 7 * * * (07:00 UTC = 09:00 SAST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { netcashStatementService } from '@/lib/payments/netcash-statement-service';
import { matchInvoiceByReference } from '@/lib/billing/invoice-matcher';
import { syncPaymentToZohoBilling } from '@/lib/integrations/zoho/payment-sync-service';
import { cronLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes max

interface UnmatchedTransaction {
  netcashRef: string;
  yourRef: string;
  amount: number;
  reason: string;
}

interface ReconciliationResult {
  date: string;
  source: 'netcash_statement';
  totalTransactions: number;
  matched: number;
  alreadyPaid: number;
  newlyMatched: number;
  unmatched: number;
  unmatchedDetails: UnmatchedTransaction[];
  errors: string[];
  duration_ms: number;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runPayNowReconciliation();
    return NextResponse.json(result);
  } catch (error) {
    cronLogger.error('[PayNow Reconciliation] Cron error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Reconciliation failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// Allow POST for manual triggers with custom date
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const customDate = body.date ? new Date(body.date) : undefined;

    const result = await runPayNowReconciliation(customDate);
    return NextResponse.json(result);
  } catch (error) {
    cronLogger.error('[PayNow Reconciliation] Error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Reconciliation failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

async function runPayNowReconciliation(customDate?: Date): Promise<ReconciliationResult> {
  const startTime = Date.now();
  const supabase = await createClient();

  // Default to yesterday
  const reconciliationDate = customDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dateStr = reconciliationDate.toISOString().split('T')[0];

  cronLogger.info(`[PayNow Reconciliation] Starting for ${dateStr}`);

  const result: ReconciliationResult = {
    date: dateStr,
    source: 'netcash_statement',
    totalTransactions: 0,
    matched: 0,
    alreadyPaid: 0,
    newlyMatched: 0,
    unmatched: 0,
    unmatchedDetails: [],
    errors: [],
    duration_ms: 0,
  };

  // Get Netcash statement for the date
  const statement = await netcashStatementService.getStatement(reconciliationDate);

  if (!statement.success) {
    result.errors.push(`Failed to get Netcash statement: ${statement.error}`);
    await logReconciliation(supabase, result, startTime);
    return result;
  }

  // Filter to PayNow transactions (Ozow, Card, EFT - not debit orders)
  const payNowTransactions = (statement.transactions || []).filter((tx: any) => {
    const method = (tx.paymentMethod || tx.Method || '').toLowerCase();
    const isPayNow = method.includes('ozow') ||
                     method.includes('card') ||
                     method.includes('eft') ||
                     method.includes('instant');
    const isSuccess = tx.status === 'successful' || tx.Result === 'Complete';
    return isPayNow && isSuccess;
  });

  result.totalTransactions = payNowTransactions.length;
  cronLogger.info(`[PayNow Reconciliation] Found ${payNowTransactions.length} PayNow transactions`);

  // Process each transaction
  for (const tx of payNowTransactions) {
    const netcashRef = tx.ourReference || tx.OurReference || '';
    const yourRef = tx.accountReference || tx.YourReference || '';
    const amount = parseFloat(tx.amount || tx.Amount || '0');

    // Check idempotency - skip if already processed
    const { data: existingPayment } = await supabase
      .from('payment_transactions')
      .select('id')
      .eq('provider_reference', netcashRef)
      .single();

    if (existingPayment) {
      result.alreadyPaid++;
      continue;
    }

    // Try to match invoice
    const match = await matchInvoiceByReference(yourRef, supabase);

    if (match.matched && match.invoice) {
      result.matched++;

      // Check if invoice already paid
      if (match.invoice.status === 'paid') {
        result.alreadyPaid++;
        continue;
      }

      result.newlyMatched++;

      // Update invoice
      const newAmountPaid = (match.invoice.amount_paid || 0) + amount;
      const newAmountDue = Math.max(0, match.invoice.total_amount - newAmountPaid);
      const newStatus = newAmountDue <= 0 ? 'paid' : 'partial';

      const { error: updateError } = await supabase
        .from('customer_invoices')
        .update({
          status: newStatus,
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', match.invoice.id);

      if (updateError) {
        result.errors.push(`Failed to update invoice ${match.invoice.invoice_number}: ${updateError.message}`);
        continue;
      }

      // Create payment transaction record
      const { data: paymentTx, error: txError } = await supabase
        .from('payment_transactions')
        .insert({
          transaction_id: `RECONCILE-${netcashRef}-${Date.now()}`,
          reference: yourRef,
          provider: 'netcash',
          provider_reference: netcashRef,
          amount,
          currency: 'ZAR',
          status: 'completed',
          payment_method: tx.paymentMethod || tx.Method || 'paynow',
          customer_id: match.invoice.customer_id,
          invoice_id: match.invoice.id,
          customer_invoice_id: match.invoice.id,
          initiated_at: new Date(tx.transactionDate || tx.Date).toISOString(),
          completed_at: new Date(tx.transactionDate || tx.Date).toISOString(),
          metadata: { source: 'reconciliation', original_tx: tx },
        })
        .select()
        .single();

      if (txError) {
        result.errors.push(`Failed to create payment record: ${txError.message}`);
      } else if (paymentTx) {
        // Sync to Zoho (async, non-blocking)
        syncPaymentToZohoBilling(paymentTx.id).catch((err) => {
          cronLogger.error('[PayNow Reconciliation] Zoho sync failed', {
            paymentId: paymentTx.id,
            error: err.message,
          });
        });
      }

      cronLogger.info('[PayNow Reconciliation] Matched and updated', {
        invoiceNumber: match.invoice.invoice_number,
        amount,
        netcashRef,
      });
    } else {
      result.unmatched++;
      result.unmatchedDetails.push({
        netcashRef,
        yourRef,
        amount,
        reason: match.parsedReference?.type === 'order'
          ? 'Order reference (not invoice)'
          : 'No matching invoice found',
      });
    }
  }

  await logReconciliation(supabase, result, startTime);

  result.duration_ms = Date.now() - startTime;
  cronLogger.info('[PayNow Reconciliation] Complete', {
    matched: result.matched,
    newlyMatched: result.newlyMatched,
    unmatched: result.unmatched,
    duration_ms: result.duration_ms,
  });

  return result;
}

async function logReconciliation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  result: ReconciliationResult,
  startTime: number
) {
  try {
    await supabase.from('cron_execution_log').insert({
      job_name: 'paynow-reconciliation',
      status: result.errors.length > 0 ? 'completed_with_errors' : 'completed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      result,
    });
  } catch (error) {
    cronLogger.error('[PayNow Reconciliation] Failed to log', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
```

- [ ] **Step 2: Run type check**

```bash
npm run type-check:memory
```

Expected: No TypeScript errors

- [ ] **Step 3: Commit cron handler**

```bash
git add app/api/cron/paynow-reconciliation/route.ts
git commit -m "feat(cron): add daily PayNow reconciliation job

Catches missed webhook payments by:
- Fetching Netcash statement for previous day
- Matching transactions to invoices
- Updating invoice status and creating payment records
- Syncing to Zoho Billing"
```

---

### Task 5.2: Add Cron Schedule to Vercel

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Add paynow-reconciliation cron**

Add to the `crons` array in vercel.json:

```json
{
  "path": "/api/cron/paynow-reconciliation",
  "schedule": "0 7 * * *"
}
```

- [ ] **Step 2: Commit vercel.json**

```bash
git add vercel.json
git commit -m "chore: add PayNow reconciliation cron schedule (09:00 SAST daily)"
```

---

## Chunk 6: Admin UI

### Task 6.1: Create Reconciliation Status API

**Files:**
- Create: `app/api/admin/billing/reconciliation/status/route.ts`

- [ ] **Step 1: Create the status API endpoint**

```typescript
// app/api/admin/billing/reconciliation/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export interface ReconciliationStatus {
  lastRun: {
    date: string;
    status: 'success' | 'partial' | 'failed';
    duration_ms: number;
  } | null;
  counts: {
    total: number;
    matched: number;
    alreadyPaid: number;
    newlyMatched: number;
    unmatched: number;
  };
  unmatchedTransactions: Array<{
    netcashRef: string;
    yourRef: string;
    amount: number;
    reason: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get latest reconciliation run
    const { data: latestRun, error } = await supabase
      .from('cron_execution_log')
      .select('*')
      .eq('job_name', 'paynow-reconciliation')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!latestRun) {
      return NextResponse.json<ReconciliationStatus>({
        lastRun: null,
        counts: { total: 0, matched: 0, alreadyPaid: 0, newlyMatched: 0, unmatched: 0 },
        unmatchedTransactions: [],
      });
    }

    const result = latestRun.result as any;

    const status: ReconciliationStatus = {
      lastRun: {
        date: latestRun.started_at,
        status: latestRun.status === 'completed' ? 'success' :
                latestRun.status === 'completed_with_errors' ? 'partial' : 'failed',
        duration_ms: result?.duration_ms || 0,
      },
      counts: {
        total: result?.totalTransactions || 0,
        matched: result?.matched || 0,
        alreadyPaid: result?.alreadyPaid || 0,
        newlyMatched: result?.newlyMatched || 0,
        unmatched: result?.unmatched || 0,
      },
      unmatchedTransactions: result?.unmatchedDetails || [],
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit API endpoint**

```bash
git add app/api/admin/billing/reconciliation/status/route.ts
git commit -m "feat(api): add reconciliation status endpoint for admin UI"
```

---

### Task 6.2: Create ReconciliationStatusCard Component

**Files:**
- Create: `components/admin/billing/ReconciliationStatusCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/admin/billing/ReconciliationStatusCard.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  PiCheckCircleBold,
  PiWarningBold,
  PiXCircleBold,
  PiArrowClockwiseBold,
  PiClockBold,
} from 'react-icons/pi';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { StatCard } from '@/components/admin/shared/StatCard';

interface ReconciliationStatus {
  lastRun: {
    date: string;
    status: 'success' | 'partial' | 'failed';
    duration_ms: number;
  } | null;
  counts: {
    total: number;
    matched: number;
    alreadyPaid: number;
    newlyMatched: number;
    unmatched: number;
  };
  unmatchedTransactions: Array<{
    netcashRef: string;
    yourRef: string;
    amount: number;
    reason: string;
  }>;
}

export function ReconciliationStatusCard() {
  const [status, setStatus] = useState<ReconciliationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/billing/reconciliation/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getStatusIcon = (runStatus: string) => {
    switch (runStatus) {
      case 'success':
        return <PiCheckCircleBold className="h-5 w-5 text-green-500" />;
      case 'partial':
        return <PiWarningBold className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <PiXCircleBold className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (runStatus: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[runStatus as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <SectionCard title="PayNow Reconciliation" icon={PiArrowClockwiseBold}>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <PiArrowClockwiseBold className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : status ? (
        <div className="space-y-4">
          {/* Last Run Status */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <PiClockBold className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Last Run:</span>
              <span className="text-sm font-medium">
                {status.lastRun ? formatDate(status.lastRun.date) : 'Never'}
              </span>
            </div>
            {status.lastRun && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(status.lastRun.status)}`}>
                {getStatusIcon(status.lastRun.status)}
                <span className="capitalize">{status.lastRun.status}</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-slate-900">{status.counts.total}</div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">{status.counts.newlyMatched}</div>
              <div className="text-xs text-green-600">Newly Matched</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">{status.counts.alreadyPaid}</div>
              <div className="text-xs text-blue-600">Already Paid</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-700">{status.counts.unmatched}</div>
              <div className="text-xs text-orange-600">Unmatched</div>
            </div>
          </div>

          {/* Unmatched Transactions */}
          {status.unmatchedTransactions.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Unmatched Transactions</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {status.unmatchedTransactions.map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 rounded text-sm">
                    <div>
                      <span className="font-mono text-slate-600">{tx.netcashRef}</span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span className="font-mono">{tx.yourRef}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">R{tx.amount.toFixed(2)}</span>
                      <span className="text-xs text-orange-600">{tx.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm"
          >
            <PiArrowClockwiseBold className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      ) : (
        <div className="text-slate-500 text-sm">No reconciliation data available</div>
      )}
    </SectionCard>
  );
}
```

- [ ] **Step 2: Commit component**

```bash
git add components/admin/billing/ReconciliationStatusCard.tsx
git commit -m "feat(admin): add ReconciliationStatusCard component"
```

---

### Task 6.3: Add ReconciliationStatusCard to Zoho Billing Page

**Files:**
- Modify: `app/admin/integrations/zoho-billing/page.tsx`

- [ ] **Step 1: Import the component**

Add at top of file:

```typescript
import { ReconciliationStatusCard } from '@/components/admin/billing/ReconciliationStatusCard';
```

- [ ] **Step 2: Add component to page layout**

Find the section with Health Checks and API Scopes (around line 170) and add after:

```typescript
        {/* Reconciliation Status */}
        <div className="mt-6">
          <ReconciliationStatusCard />
        </div>
```

- [ ] **Step 3: Run type check**

```bash
npm run type-check:memory
```

Expected: No TypeScript errors

- [ ] **Step 4: Commit page update**

```bash
git add app/admin/integrations/zoho-billing/page.tsx
git commit -m "feat(admin): add PayNow reconciliation status to Zoho Billing page"
```

---

## Final Steps

### Task 7.1: Run Full Type Check

- [ ] **Step 1: Run type check**

```bash
npm run type-check:memory
```

Expected: No TypeScript errors

### Task 7.2: Run Tests

- [ ] **Step 1: Run all billing tests**

```bash
npm test -- --testPathPattern="billing" --passWithNoTests
```

Expected: All tests PASS

### Task 7.3: Final Commit

- [ ] **Step 1: Verify all changes**

```bash
git status
git log --oneline -10
```

- [ ] **Step 2: Create summary commit if needed**

If any uncommitted changes remain:

```bash
git add .
git commit -m "chore: finalize Netcash PayNow + Zoho reconciliation implementation"
```

---

## Testing Checklist

After implementation, verify:

- [ ] Unit tests pass for invoice-reference-parser
- [ ] Unit tests pass for invoice-matcher
- [ ] Webhook correctly matches CT-INV... references
- [ ] Webhook falls back to paynow_transaction_ref
- [ ] Zoho createInvoice uses ignore_auto_number_generation
- [ ] Invoice numbers NOT overwritten by Zoho sync
- [ ] Reconciliation cron runs without errors
- [ ] Admin UI shows reconciliation status
- [ ] Type check passes
- [ ] Build succeeds

---

## Rollback Plan

If issues occur:

1. **Revert webhook changes:** `git revert <commit-hash>` for webhook fix
2. **Disable cron:** Remove from vercel.json, redeploy
3. **Zoho sync:** Revert billing-client.ts changes

The changes are isolated and can be reverted independently.
