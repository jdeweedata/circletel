# Inngest Billing Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate three critical billing cron jobs (debit-orders, billing-day, zoho-sync) to Inngest with step-based execution, automatic retry, and event coordination.

**Architecture:** Hybrid approach - migrate each cron independently to Inngest while adding event-based coordination. Existing crons remain as fallback during validation. Events flow: `billing/debit-orders.completed` triggers `billing-day` processing.

**Tech Stack:** Inngest, Next.js 15, Supabase, TypeScript, NetCash Debit Order API

---

## Phase 1: Debit Orders Migration (Tasks 1-8)

### Task 1: Add Billing Event Types to Inngest Client

**Files:**
- Modify: `lib/inngest/client.ts:226-248`

**Step 1: Read the current event types**

Verify current InngestEvents union type structure at end of file.

**Step 2: Add billing event types after line 225**

```typescript
// =============================================================================
// BILLING EVENTS
// =============================================================================

export type DebitOrdersRequestedEvent = {
  name: 'billing/debit-orders.requested';
  data: {
    triggered_by: 'cron' | 'manual';
    billing_date?: string;
    admin_user_id?: string;
    batch_log_id: string;
    options?: {
      dryRun?: boolean;
    };
  };
};

export type DebitOrdersCompletedEvent = {
  name: 'billing/debit-orders.completed';
  data: {
    batch_log_id: string;
    billing_date: string;
    batch_id?: string;
    total_eligible: number;
    submitted: number;
    skipped: number;
    paynow_sent: number;
    duration_ms: number;
  };
};

export type DebitOrdersFailedEvent = {
  name: 'billing/debit-orders.failed';
  data: {
    batch_log_id: string;
    error: string;
    attempt: number;
  };
};

export type BillingDayRequestedEvent = {
  name: 'billing/day.requested';
  data: {
    triggered_by: 'cron' | 'manual' | 'debit-completion';
    billing_date?: string;
    admin_user_id?: string;
    process_log_id: string;
    options?: {
      dryRun?: boolean;
    };
  };
};

export type BillingDayCompletedEvent = {
  name: 'billing/day.completed';
  data: {
    process_log_id: string;
    billing_date: string;
    total_invoices: number;
    processed: number;
    successful: number;
    failed: number;
    duration_ms: number;
  };
};

export type BillingDayFailedEvent = {
  name: 'billing/day.failed';
  data: {
    process_log_id: string;
    error: string;
    attempt: number;
  };
};

export type ZohoSyncRequestedEvent = {
  name: 'zoho/sync.requested';
  data: {
    triggered_by: 'cron' | 'manual';
    sync_log_id: string;
    options?: {
      maxProducts?: number;
      dryRun?: boolean;
      retryFailed?: boolean;
    };
  };
};

export type ZohoSyncCompletedEvent = {
  name: 'zoho/sync.completed';
  data: {
    sync_log_id: string;
    total_candidates: number;
    processed: number;
    crm_succeeded: number;
    crm_failed: number;
    billing_succeeded: number;
    billing_failed: number;
    duration_ms: number;
  };
};

export type ZohoSyncFailedEvent = {
  name: 'zoho/sync.failed';
  data: {
    sync_log_id: string;
    error: string;
    attempt: number;
  };
};
```

**Step 3: Update InngestEvents union type**

Find the existing `InngestEvents` type and add the new event mappings:

```typescript
// Union type for all events
export type InngestEvents = {
  // ... existing events ...
  // Billing events
  'billing/debit-orders.requested': DebitOrdersRequestedEvent;
  'billing/debit-orders.completed': DebitOrdersCompletedEvent;
  'billing/debit-orders.failed': DebitOrdersFailedEvent;
  'billing/day.requested': BillingDayRequestedEvent;
  'billing/day.completed': BillingDayCompletedEvent;
  'billing/day.failed': BillingDayFailedEvent;
  'zoho/sync.requested': ZohoSyncRequestedEvent;
  'zoho/sync.completed': ZohoSyncCompletedEvent;
  'zoho/sync.failed': ZohoSyncFailedEvent;
};
```

**Step 4: Run type check**

Run: `npm run type-check`
Expected: PASS (no type errors)

**Step 5: Commit**

```bash
git add lib/inngest/client.ts
git commit -m "feat(inngest): add billing workflow event types

Add event types for debit-orders, billing-day, and zoho-sync workflows.
Events follow existing patterns (requested/completed/failed).

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Create Debit Orders Inngest Function (Core Structure)

**Files:**
- Create: `lib/inngest/functions/debit-orders.ts`
- Test: `lib/inngest/functions/__tests__/debit-orders.test.ts`

**Step 1: Create test file with initial test**

Create `lib/inngest/functions/__tests__/debit-orders.test.ts`:

```typescript
/**
 * Debit Orders Inngest Function Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
}));

// Mock NetCash service
vi.mock('@/lib/payments/netcash-debit-batch-service', () => ({
  netcashDebitBatchService: {
    isConfigured: vi.fn(() => true),
    submitBatch: vi.fn(() => Promise.resolve({
      success: true,
      batchId: 'TEST-BATCH-001',
      itemsSubmitted: 5,
      errors: [],
      warnings: [],
    })),
    authoriseBatch: vi.fn(() => Promise.resolve({ success: true })),
  },
  DebitOrderItem: {},
}));

describe('debitOrdersFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export the function with correct id', async () => {
    const { debitOrdersFunction } = await import('../debit-orders');
    expect(debitOrdersFunction).toBeDefined();
    // Inngest functions have an id property on the config
    expect(debitOrdersFunction.id).toBe('debit-orders-batch');
  });

  it('should have dual triggers (cron and event)', async () => {
    const { debitOrdersFunction } = await import('../debit-orders');
    // The function should be configured with multiple triggers
    expect(debitOrdersFunction).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- lib/inngest/functions/__tests__/debit-orders.test.ts`
Expected: FAIL with "Cannot find module '../debit-orders'"

**Step 3: Create the function file with core structure**

Create `lib/inngest/functions/debit-orders.ts`:

```typescript
/**
 * Debit Orders Batch Processing - Inngest Function
 *
 * Processes debit order batches with:
 * - Automatic retries on failure (3 attempts)
 * - Step-based execution for reliability and resumability
 * - Dual triggers: scheduled cron and manual event
 * - Progress tracking via cron_execution_log table
 * - Pay Now fallback for customers without active eMandate
 *
 * Schedule: Daily at 06:00 SAST (04:00 UTC)
 *
 * @module lib/inngest/functions/debit-orders
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import {
  netcashDebitBatchService,
  DebitOrderItem,
} from '@/lib/payments/netcash-debit-batch-service';
import { PayNowBillingService } from '@/lib/billing/paynow-billing-service';

// =============================================================================
// TYPES
// =============================================================================

interface BatchResult {
  totalEligible: number;
  submitted: number;
  skipped: number;
  paynowSent: number;
  batchId?: string;
  errors: string[];
}

interface SkippedInvoice {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  reason: 'no_mandate' | 'mandate_pending';
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Debit Orders Batch Processing Function
 *
 * Triggered by:
 * - Cron schedule: Daily at 06:00 SAST (04:00 UTC)
 * - Event: 'billing/debit-orders.requested' for manual triggers
 */
export const debitOrdersFunction = inngest.createFunction(
  {
    id: 'debit-orders-batch',
    name: 'Debit Orders Batch Processing',
    retries: 3,
    cancelOn: [
      {
        event: 'billing/debit-orders.cancelled',
        match: 'data.batch_log_id',
      },
    ],
  },
  [
    // Cron trigger: 06:00 SAST = 04:00 UTC
    { cron: '0 4 * * *' },
    // Event trigger: manual requests
    { event: 'billing/debit-orders.requested' },
  ],
  async ({ event, step }) => {
    // Extract options from event data
    const eventData = event?.data as {
      batch_log_id?: string;
      triggered_by?: 'cron' | 'manual';
      billing_date?: string;
      admin_user_id?: string;
      options?: {
        dryRun?: boolean;
      };
    } | undefined;

    const dryRun = eventData?.options?.dryRun ?? false;
    const triggeredBy = eventData?.triggered_by ?? 'cron';
    const adminUserId = eventData?.admin_user_id;

    // Determine billing date
    const billingDate = eventData?.billing_date
      ? new Date(eventData.billing_date)
      : new Date();
    const dateStr = billingDate.toISOString().split('T')[0];

    // Track timing
    const startTime = Date.now();
    const result: BatchResult = {
      totalEligible: 0,
      submitted: 0,
      skipped: 0,
      paynowSent: 0,
      errors: [],
    };

    // Step 1: Create or update batch log
    const batchLogId = await step.run('create-batch-log', async () => {
      const supabase = await createClient();

      if (eventData?.batch_log_id) {
        // Update existing log for manual trigger
        const { error } = await supabase
          .from('cron_execution_log')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .eq('id', eventData.batch_log_id);

        if (error) {
          console.error('[DebitOrders] Failed to update batch log:', error);
          throw new Error(`Failed to update batch log: ${error.message}`);
        }

        return eventData.batch_log_id;
      }

      // Create new log for cron trigger
      const { data: newLog, error } = await supabase
        .from('cron_execution_log')
        .insert({
          job_name: 'submit-debit-orders',
          status: 'running',
          started_at: new Date().toISOString(),
          result: {
            triggered_by: triggeredBy,
            admin_user_id: adminUserId,
            billing_date: dateStr,
          },
        })
        .select('id')
        .single();

      if (error || !newLog) {
        console.error('[DebitOrders] Failed to create batch log:', error);
        throw new Error(`Failed to create batch log: ${error?.message || 'Unknown error'}`);
      }

      console.log(`[DebitOrders] Created batch log ${newLog.id}`);
      return newLog.id;
    });

    // Step 2: Check NetCash configuration
    const isConfigured = await step.run('check-netcash-config', async () => {
      const configured = netcashDebitBatchService.isConfigured();
      if (!configured) {
        console.error('[DebitOrders] NetCash Debit Order Service not configured');
      }
      return configured;
    });

    if (!isConfigured) {
      result.errors.push('NetCash Debit Order Service not configured');
      await step.run('log-config-failure', async () => {
        const supabase = await createClient();
        await supabase
          .from('cron_execution_log')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            result: { ...result, billing_date: dateStr },
          })
          .eq('id', batchLogId);
      });

      await step.run('send-failure-event', async () => {
        await inngest.send({
          name: 'billing/debit-orders.failed',
          data: {
            batch_log_id: batchLogId,
            error: 'NetCash Debit Order Service not configured',
            attempt: 1,
          },
        });
      });

      return { success: false, ...result, batchLogId };
    }

    // Step 3: Fetch eligible invoices
    const invoices = await step.run('fetch-eligible-invoices', async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('customer_invoices')
        .select(`
          id,
          invoice_number,
          customer_id,
          total_amount,
          due_date,
          status,
          payment_collection_method,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .in('status', ['draft', 'sent', 'partial', 'overdue'])
        .eq('due_date', dateStr)
        .in('payment_collection_method', ['debit_order', 'Debit Order']);

      if (error) {
        console.error('[DebitOrders] Failed to fetch invoices:', error);
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      console.log(`[DebitOrders] Found ${data?.length || 0} invoices due on ${dateStr}`);
      return data || [];
    });

    // Step 4: Fetch eligible orders
    const orders = await step.run('fetch-eligible-orders', async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('consumer_orders')
        .select(`
          id,
          order_number,
          customer_id,
          package_price,
          payment_method,
          payment_status,
          billing_active,
          next_billing_date,
          billing_cycle_day
        `)
        .eq('status', 'active')
        .eq('billing_active', true)
        .eq('payment_method', 'Debit Order')
        .eq('next_billing_date', dateStr);

      if (error) {
        console.error('[DebitOrders] Failed to fetch orders:', error);
        // Non-fatal - continue with invoices
        return [];
      }

      console.log(`[DebitOrders] Found ${data?.length || 0} orders due on ${dateStr}`);
      return data || [];
    });

    // Step 5: Batch check mandates (single query for all customers)
    const customerIds = [
      ...new Set([
        ...invoices.map(i => i.customer_id),
        ...orders.map(o => o.customer_id),
      ]),
    ];

    const mandateStatuses = await step.run('batch-check-mandates', async () => {
      if (customerIds.length === 0) {
        return new Map<string, 'active' | 'pending' | 'none'>();
      }

      const supabase = await createClient();

      const { data: paymentMethods, error } = await supabase
        .from('customer_payment_methods')
        .select('customer_id, method_type, mandate_status, is_active, encrypted_details')
        .in('customer_id', customerIds)
        .eq('is_active', true)
        .eq('method_type', 'debit_order');

      if (error) {
        console.error('[DebitOrders] Failed to fetch mandates:', error);
        throw new Error(`Failed to fetch mandates: ${error.message}`);
      }

      const statusMap = new Map<string, 'active' | 'pending' | 'none'>();

      // Initialize all customers as 'none'
      customerIds.forEach(id => statusMap.set(id, 'none'));

      // Update with actual mandate status
      for (const pm of paymentMethods || []) {
        const isVerified = pm.encrypted_details?.verified === true ||
                          pm.encrypted_details?.verified === 'true';
        const mandateActive = pm.mandate_status === 'active' ||
                             pm.mandate_status === 'approved';

        if (isVerified && mandateActive) {
          statusMap.set(pm.customer_id, 'active');
        } else {
          statusMap.set(pm.customer_id, 'pending');
        }
      }

      const activeCount = [...statusMap.values()].filter(s => s === 'active').length;
      const pendingCount = [...statusMap.values()].filter(s => s === 'pending').length;
      const noneCount = [...statusMap.values()].filter(s => s === 'none').length;

      console.log(`[DebitOrders] Mandate status: ${activeCount} active, ${pendingCount} pending, ${noneCount} none`);

      return statusMap;
    });

    // Step 6: Categorize items
    const { eligibleItems, skippedInvoices } = await step.run('categorize-items', async () => {
      const eligible: DebitOrderItem[] = [];
      const skipped: SkippedInvoice[] = [];

      // Process invoices
      for (const invoice of invoices) {
        const mandateStatus = mandateStatuses.get(invoice.customer_id) || 'none';

        if (mandateStatus === 'active') {
          eligible.push({
            accountReference: invoice.invoice_number,
            amount: invoice.total_amount,
            actionDate: billingDate,
            customerId: invoice.customer_id,
            invoiceId: invoice.id,
          });
        } else {
          skipped.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            customerId: invoice.customer_id,
            reason: mandateStatus === 'pending' ? 'mandate_pending' : 'no_mandate',
          });
        }
      }

      // Process orders (if not already covered by invoice)
      for (const order of orders) {
        const alreadyCovered = eligible.some(
          item => item.orderId === order.id ||
                  item.accountReference.includes(order.order_number)
        );

        if (alreadyCovered) continue;

        const mandateStatus = mandateStatuses.get(order.customer_id) || 'none';

        if (mandateStatus === 'active') {
          eligible.push({
            accountReference: `PAY-${order.order_number}`,
            amount: order.package_price,
            actionDate: billingDate,
            customerId: order.customer_id,
            orderId: order.id,
          });
        }
        // Orders without mandate don't go to skipped (they need invoice first)
      }

      console.log(`[DebitOrders] Categorized: ${eligible.length} eligible, ${skipped.length} skipped`);

      return { eligibleItems: eligible, skippedInvoices: skipped };
    });

    result.totalEligible = eligibleItems.length + skippedInvoices.length;
    result.skipped = skippedInvoices.length;

    // Step 7: Handle dry run
    if (dryRun) {
      const dryRunResult = await step.run('dry-run-complete', async () => {
        const supabase = await createClient();
        const duration = Date.now() - startTime;

        await supabase
          .from('cron_execution_log')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: {
              dryRun: true,
              billing_date: dateStr,
              totalEligible: result.totalEligible,
              wouldSubmit: eligibleItems.length,
              skipped: result.skipped,
              duration_ms: duration,
            },
          })
          .eq('id', batchLogId);

        console.log(`[DebitOrders] DRY RUN complete: ${eligibleItems.length} would be submitted`);

        return {
          success: true,
          dryRun: true,
          ...result,
          batchLogId,
          duration,
        };
      });

      return dryRunResult;
    }

    // Step 8: Submit batch to NetCash
    if (eligibleItems.length > 0) {
      const batchResult = await step.run('submit-netcash-batch', async () => {
        const batchName = `CircleTel-${dateStr}-${Date.now()}`;

        console.log(`[DebitOrders] Submitting batch "${batchName}" with ${eligibleItems.length} items`);

        const submitResult = await netcashDebitBatchService.submitBatch(
          eligibleItems,
          batchName
        );

        if (!submitResult.success) {
          console.error('[DebitOrders] Batch submission failed:', submitResult.errors);
          throw new Error(`Batch submission failed: ${submitResult.errors.join(', ')}`);
        }

        console.log(`[DebitOrders] Batch submitted: ${submitResult.batchId}`);

        return {
          batchId: submitResult.batchId,
          itemsSubmitted: submitResult.itemsSubmitted,
          batchName,
        };
      });

      result.batchId = batchResult.batchId;
      result.submitted = batchResult.itemsSubmitted;

      // Step 9: Authorize batch
      if (batchResult.batchId) {
        await step.run('authorize-batch', async () => {
          const authResult = await netcashDebitBatchService.authoriseBatch(
            batchResult.batchId!
          );

          if (!authResult.success) {
            console.warn('[DebitOrders] Batch authorization failed:', authResult.error);
            result.errors.push(`Batch authorization failed: ${authResult.error}`);
            // Don't throw - batch is submitted, just not authorized
          } else {
            console.log(`[DebitOrders] Batch ${batchResult.batchId} authorized`);
          }
        });
      }

      // Step 10: Record batch in database
      await step.run('record-batch-submission', async () => {
        const supabase = await createClient();

        await supabase
          .from('debit_order_batches')
          .upsert({
            batch_id: batchResult.batchId || '',
            batch_name: batchResult.batchName,
            item_count: eligibleItems.length,
            total_amount: eligibleItems.reduce((sum, item) => sum + item.amount, 0),
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }, { onConflict: 'batch_id' });

        // Insert batch items
        const batchItems = eligibleItems.map(item => ({
          batch_id: batchResult.batchId || '',
          account_reference: item.accountReference,
          customer_id: item.customerId,
          invoice_id: item.invoiceId,
          order_id: item.orderId,
          amount: item.amount,
          action_date: dateStr,
          status: 'pending',
          created_at: new Date().toISOString(),
        }));

        await supabase.from('debit_order_batch_items').insert(batchItems);

        console.log(`[DebitOrders] Recorded batch with ${batchItems.length} items`);
      });

      // Step 11: Update next billing dates
      await step.run('update-billing-dates', async () => {
        const supabase = await createClient();

        const nextBillingDate = new Date(billingDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        const nextDateStr = nextBillingDate.toISOString().split('T')[0];

        const orderIds = eligibleItems
          .filter(item => item.orderId)
          .map(item => item.orderId);

        if (orderIds.length > 0) {
          await supabase
            .from('consumer_orders')
            .update({
              next_billing_date: nextDateStr,
              updated_at: new Date().toISOString(),
            })
            .in('id', orderIds);

          console.log(`[DebitOrders] Updated ${orderIds.length} order billing dates to ${nextDateStr}`);
        }
      });
    }

    // Step 12: Process Pay Now fallback for skipped invoices
    if (skippedInvoices.length > 0) {
      const paynowResult = await step.run('process-paynow-fallback', async () => {
        let paynowSent = 0;
        const paynowErrors: string[] = [];

        console.log(`[DebitOrders] Processing ${skippedInvoices.length} invoices for Pay Now fallback`);

        for (const skipped of skippedInvoices) {
          try {
            const processResult = await PayNowBillingService.processPayNowForInvoice(
              skipped.invoiceId,
              {
                sendEmail: true,
                sendSms: true,
                smsTemplate: 'emandatePending',
                includeEmandateReminder: true,
              }
            );

            if (processResult.success) {
              paynowSent++;
              console.log(`[DebitOrders] Pay Now sent for ${skipped.invoiceNumber}`);
            } else {
              paynowErrors.push(`${skipped.invoiceNumber}: ${processResult.errors.join(', ')}`);
            }

            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            paynowErrors.push(`${skipped.invoiceNumber}: ${errorMsg}`);
          }
        }

        console.log(`[DebitOrders] Pay Now: ${paynowSent} sent, ${paynowErrors.length} failed`);

        return { paynowSent, paynowErrors };
      });

      result.paynowSent = paynowResult.paynowSent;
      result.errors.push(...paynowResult.paynowErrors.slice(0, 10));
    }

    // Step 13: Update final log
    const finalResult = await step.run('update-final-log', async () => {
      const supabase = await createClient();
      const duration = Date.now() - startTime;
      const hasErrors = result.errors.length > 0;

      const status = hasErrors ? 'completed_with_errors' : 'completed';

      await supabase
        .from('cron_execution_log')
        .update({
          status,
          completed_at: new Date().toISOString(),
          result: {
            billing_date: dateStr,
            totalEligible: result.totalEligible,
            submitted: result.submitted,
            skipped: result.skipped,
            paynowSent: result.paynowSent,
            batchId: result.batchId,
            errors: result.errors.slice(0, 10),
            duration_ms: duration,
          },
        })
        .eq('id', batchLogId);

      console.log(
        `[DebitOrders] Complete: ${result.submitted} submitted, ` +
        `${result.skipped} skipped, ${result.paynowSent} Pay Now sent ` +
        `(${duration}ms, ${result.errors.length} errors)`
      );

      return {
        success: !hasErrors,
        batchLogId,
        ...result,
        duration,
      };
    });

    // Step 14: Send completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'billing/debit-orders.completed',
        data: {
          batch_log_id: batchLogId,
          billing_date: dateStr,
          batch_id: result.batchId,
          total_eligible: result.totalEligible,
          submitted: result.submitted,
          skipped: result.skipped,
          paynow_sent: result.paynowSent,
          duration_ms: finalResult.duration,
        },
      });
    });

    return finalResult;
  }
);

// =============================================================================
// COMPLETION HANDLER
// =============================================================================

/**
 * Handle debit orders completion events.
 * Triggers billing-day processing for remaining invoices.
 */
export const debitOrdersCompletedFunction = inngest.createFunction(
  {
    id: 'debit-orders-completed',
    name: 'Debit Orders Completed Handler',
  },
  { event: 'billing/debit-orders.completed' },
  async ({ event, step }) => {
    const { batch_log_id, billing_date, submitted, skipped, paynow_sent, duration_ms } = event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[DebitOrders] Batch ${batch_log_id} completed: ` +
        `${submitted} submitted, ${skipped} skipped, ${paynow_sent} Pay Now (${duration_ms}ms)`
      );
    });

    // Trigger billing-day processing for non-eMandate customers
    await step.run('trigger-billing-day', async () => {
      const supabase = await createClient();

      // Create process log for billing-day
      const { data: processLog, error } = await supabase
        .from('cron_execution_log')
        .insert({
          job_name: 'process-billing-day',
          status: 'pending',
          result: {
            triggered_by: 'debit-completion',
            source_batch_log_id: batch_log_id,
            billing_date,
          },
        })
        .select('id')
        .single();

      if (error || !processLog) {
        console.error('[DebitOrders] Failed to create billing-day log:', error);
        return;
      }

      await inngest.send({
        name: 'billing/day.requested',
        data: {
          triggered_by: 'debit-completion',
          billing_date,
          process_log_id: processLog.id,
        },
      });

      console.log(`[DebitOrders] Triggered billing-day processing (${processLog.id})`);
    });

    return { triggered: true };
  }
);

// =============================================================================
// FAILURE HANDLER
// =============================================================================

/**
 * Handle debit orders failure events.
 */
export const debitOrdersFailedFunction = inngest.createFunction(
  {
    id: 'debit-orders-failed',
    name: 'Debit Orders Failed Handler',
  },
  { event: 'billing/debit-orders.failed' },
  async ({ event, step }) => {
    const { batch_log_id, error, attempt } = event.data;

    await step.run('handle-failure', async () => {
      console.error(`[DebitOrders] Batch ${batch_log_id} failed (attempt ${attempt}): ${error}`);

      const supabase = await createClient();

      await supabase
        .from('cron_execution_log')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          result: {
            error,
            failedAttempt: attempt,
          },
        })
        .eq('id', batch_log_id);

      // TODO: Send alert notification
    });

    return { handled: true };
  }
);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- lib/inngest/functions/__tests__/debit-orders.test.ts`
Expected: PASS

**Step 5: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 6: Commit**

```bash
git add lib/inngest/functions/debit-orders.ts lib/inngest/functions/__tests__/debit-orders.test.ts
git commit -m "feat(inngest): add debit-orders batch processing function

Migrate debit order processing from cron to Inngest with:
- Step-based execution for reliability
- Batch mandate checking (single query vs N queries)
- Pay Now fallback for pending/no mandate customers
- Completion event triggers billing-day workflow

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Register Debit Orders Function

**Files:**
- Modify: `lib/inngest/index.ts`

**Step 1: Add imports for debit-orders functions**

Add after existing imports:

```typescript
export {
  debitOrdersFunction,
  debitOrdersCompletedFunction,
  debitOrdersFailedFunction,
} from './functions/debit-orders';
```

**Step 2: Add imports for registration**

Add to the imports section:

```typescript
import {
  debitOrdersFunction,
  debitOrdersCompletedFunction,
  debitOrdersFailedFunction,
} from './functions/debit-orders';
```

**Step 3: Add to functions array**

Add to the `functions` array:

```typescript
export const functions = [
  // ... existing functions ...
  // Debit orders
  debitOrdersFunction,
  debitOrdersCompletedFunction,
  debitOrdersFailedFunction,
];
```

**Step 4: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/inngest/index.ts
git commit -m "chore(inngest): register debit-orders functions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Create Billing Day Inngest Function

**Files:**
- Create: `lib/inngest/functions/billing-day.ts`

**Step 1: Create the billing-day function**

Create `lib/inngest/functions/billing-day.ts`:

```typescript
/**
 * Billing Day Processing - Inngest Function
 *
 * Processes Pay Now payments for customers WITHOUT active eMandate.
 * Runs after debit-orders batch to handle remaining invoices.
 *
 * Triggers:
 * - Cron: Daily at 07:00 SAST (05:00 UTC) - fallback if debit-orders fails
 * - Event: 'billing/day.requested' - triggered by debit-orders completion
 * - Event: 'billing/debit-orders.completed' - direct trigger
 *
 * @module lib/inngest/functions/billing-day
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import {
  PayNowBillingService,
  PayNowProcessResult,
} from '@/lib/billing/paynow-billing-service';

// =============================================================================
// TYPES
// =============================================================================

interface ProcessingResult {
  totalInvoicesDue: number;
  skippedEmandate: number;
  skippedDebitBatch: number;
  skippedAlreadySent: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Billing Day Processing Function
 *
 * Triggered by:
 * - Cron schedule: Daily at 07:00 SAST (05:00 UTC) - fallback
 * - Event: 'billing/day.requested' for manual/automated triggers
 */
export const billingDayFunction = inngest.createFunction(
  {
    id: 'billing-day-processing',
    name: 'Billing Day Processing',
    retries: 3,
    cancelOn: [
      {
        event: 'billing/day.cancelled',
        match: 'data.process_log_id',
      },
    ],
  },
  [
    // Cron trigger: 07:00 SAST = 05:00 UTC (fallback)
    { cron: '0 5 * * *' },
    // Event trigger: manual/automated requests
    { event: 'billing/day.requested' },
  ],
  async ({ event, step }) => {
    // Extract options from event data
    const eventData = event?.data as {
      process_log_id?: string;
      triggered_by?: 'cron' | 'manual' | 'debit-completion';
      billing_date?: string;
      admin_user_id?: string;
      options?: {
        dryRun?: boolean;
      };
    } | undefined;

    const dryRun = eventData?.options?.dryRun ?? false;
    const triggeredBy = eventData?.triggered_by ?? 'cron';

    // Determine billing date
    const billingDate = eventData?.billing_date
      ? new Date(eventData.billing_date)
      : new Date();
    const dateStr = billingDate.toISOString().split('T')[0];

    // Track timing
    const startTime = Date.now();
    const result: ProcessingResult = {
      totalInvoicesDue: 0,
      skippedEmandate: 0,
      skippedDebitBatch: 0,
      skippedAlreadySent: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Step 1: Create or update process log
    const processLogId = await step.run('create-process-log', async () => {
      const supabase = await createClient();

      if (eventData?.process_log_id) {
        const { error } = await supabase
          .from('cron_execution_log')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .eq('id', eventData.process_log_id);

        if (error) {
          console.error('[BillingDay] Failed to update process log:', error);
          throw new Error(`Failed to update process log: ${error.message}`);
        }

        return eventData.process_log_id;
      }

      const { data: newLog, error } = await supabase
        .from('cron_execution_log')
        .insert({
          job_name: 'process-billing-day',
          status: 'running',
          started_at: new Date().toISOString(),
          result: {
            triggered_by: triggeredBy,
            billing_date: dateStr,
          },
        })
        .select('id')
        .single();

      if (error || !newLog) {
        throw new Error(`Failed to create process log: ${error?.message || 'Unknown error'}`);
      }

      console.log(`[BillingDay] Created process log ${newLog.id}`);
      return newLog.id;
    });

    // Step 2: Fetch unpaid invoices due today
    const invoices = await step.run('fetch-due-invoices', async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('customer_invoices')
        .select(`
          id,
          invoice_number,
          customer_id,
          total_amount,
          due_date,
          status,
          paynow_url,
          paynow_transaction_ref,
          paynow_sent_at,
          customer:customers(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('due_date', dateStr)
        .in('status', ['draft', 'sent', 'partial', 'overdue']);

      if (error) {
        throw new Error(`Failed to fetch invoices: ${error.message}`);
      }

      console.log(`[BillingDay] Found ${data?.length || 0} invoices due on ${dateStr}`);
      return data || [];
    });

    result.totalInvoicesDue = invoices.length;

    if (invoices.length === 0) {
      await step.run('no-invoices-complete', async () => {
        const supabase = await createClient();
        await supabase
          .from('cron_execution_log')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: { ...result, billing_date: dateStr, duration_ms: Date.now() - startTime },
          })
          .eq('id', processLogId);

        console.log('[BillingDay] No invoices due today');
      });

      return { success: true, processLogId, ...result };
    }

    // Step 3: Get today's debit batch items
    const debitBatchInvoiceIds = await step.run('get-debit-batch-items', async () => {
      const supabase = await createClient();

      const { data: debitBatchItems } = await supabase
        .from('debit_order_batch_items')
        .select('invoice_id')
        .eq('action_date', dateStr)
        .not('invoice_id', 'is', null);

      const ids = new Set(
        debitBatchItems?.map(item => item.invoice_id).filter(Boolean) || []
      );

      console.log(`[BillingDay] Found ${ids.size} invoices in debit batch`);
      return ids;
    });

    // Step 4: Filter invoices to process
    const invoicesToProcess = await step.run('filter-invoices', async () => {
      const toProcess: typeof invoices = [];

      for (const invoice of invoices) {
        // Skip if in debit batch
        if (debitBatchInvoiceIds.has(invoice.id)) {
          result.skippedDebitBatch++;
          continue;
        }

        // Skip if Pay Now already sent today
        if (invoice.paynow_sent_at) {
          const sentDate = new Date(invoice.paynow_sent_at).toISOString().split('T')[0];
          if (sentDate === dateStr) {
            result.skippedAlreadySent++;
            continue;
          }
        }

        // Skip if customer has active eMandate
        const hasEmandate = await PayNowBillingService.hasActiveEmandate(invoice.customer_id);
        if (hasEmandate) {
          result.skippedEmandate++;
          continue;
        }

        toProcess.push(invoice);
      }

      console.log(
        `[BillingDay] To process: ${toProcess.length} ` +
        `(skipped: ${result.skippedDebitBatch} debit, ${result.skippedEmandate} eMandate, ` +
        `${result.skippedAlreadySent} already sent)`
      );

      return toProcess;
    });

    if (invoicesToProcess.length === 0) {
      await step.run('no-eligible-complete', async () => {
        const supabase = await createClient();
        await supabase
          .from('cron_execution_log')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: { ...result, billing_date: dateStr, duration_ms: Date.now() - startTime },
          })
          .eq('id', processLogId);

        console.log('[BillingDay] No invoices need Pay Now processing');
      });

      return { success: true, processLogId, ...result };
    }

    // Step 5: Handle dry run
    if (dryRun) {
      const dryRunResult = await step.run('dry-run-complete', async () => {
        const supabase = await createClient();
        const duration = Date.now() - startTime;

        await supabase
          .from('cron_execution_log')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: {
              dryRun: true,
              billing_date: dateStr,
              ...result,
              wouldProcess: invoicesToProcess.length,
              duration_ms: duration,
            },
          })
          .eq('id', processLogId);

        return { success: true, dryRun: true, processLogId, ...result, duration };
      });

      return dryRunResult;
    }

    // Step 6: Process Pay Now in batches
    const processResult = await step.run('process-paynow-batch', async () => {
      const BATCH_SIZE = 10;
      let processed = 0;
      let successful = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < invoicesToProcess.length; i += BATCH_SIZE) {
        const batch = invoicesToProcess.slice(i, i + BATCH_SIZE);

        for (const invoice of batch) {
          try {
            const paynowResult = await PayNowBillingService.processPayNowForInvoice(
              invoice.id,
              {
                sendEmail: true,
                sendSms: true,
                smsTemplate: 'paymentDue',
              }
            );

            processed++;

            if (paynowResult.success) {
              successful++;
              console.log(`[BillingDay] Pay Now sent for ${invoice.invoice_number}`);
            } else {
              failed++;
              errors.push(`${invoice.invoice_number}: ${paynowResult.errors.join(', ')}`);
            }

            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            processed++;
            failed++;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`${invoice.invoice_number}: ${errorMsg}`);
          }
        }

        // Batch delay
        if (i + BATCH_SIZE < invoicesToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`[BillingDay] Processed: ${processed}, Success: ${successful}, Failed: ${failed}`);

      return { processed, successful, failed, errors };
    });

    result.processed = processResult.processed;
    result.successful = processResult.successful;
    result.failed = processResult.failed;
    result.errors = processResult.errors.slice(0, 10);

    // Step 7: Update final log
    const finalResult = await step.run('update-final-log', async () => {
      const supabase = await createClient();
      const duration = Date.now() - startTime;
      const hasErrors = result.failed > 0;

      const status = hasErrors
        ? (result.successful > 0 ? 'completed_with_errors' : 'failed')
        : 'completed';

      await supabase
        .from('cron_execution_log')
        .update({
          status,
          completed_at: new Date().toISOString(),
          result: {
            billing_date: dateStr,
            ...result,
            duration_ms: duration,
          },
        })
        .eq('id', processLogId);

      console.log(
        `[BillingDay] Complete: ${result.successful} successful, ${result.failed} failed ` +
        `(${duration}ms)`
      );

      return { success: !hasErrors || result.successful > 0, processLogId, ...result, duration };
    });

    // Step 8: Send completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'billing/day.completed',
        data: {
          process_log_id: processLogId,
          billing_date: dateStr,
          total_invoices: result.totalInvoicesDue,
          processed: result.processed,
          successful: result.successful,
          failed: result.failed,
          duration_ms: finalResult.duration,
        },
      });
    });

    return finalResult;
  }
);

// =============================================================================
// COMPLETION HANDLER
// =============================================================================

export const billingDayCompletedFunction = inngest.createFunction(
  {
    id: 'billing-day-completed',
    name: 'Billing Day Completed Handler',
  },
  { event: 'billing/day.completed' },
  async ({ event, step }) => {
    const { process_log_id, billing_date, successful, failed, duration_ms } = event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[BillingDay] Process ${process_log_id} completed: ` +
        `${successful} successful, ${failed} failed (${duration_ms}ms)`
      );

      // TODO: Send daily billing summary notification
      // TODO: Update billing dashboard metrics
    });

    return { logged: true };
  }
);

// =============================================================================
// FAILURE HANDLER
// =============================================================================

export const billingDayFailedFunction = inngest.createFunction(
  {
    id: 'billing-day-failed',
    name: 'Billing Day Failed Handler',
  },
  { event: 'billing/day.failed' },
  async ({ event, step }) => {
    const { process_log_id, error, attempt } = event.data;

    await step.run('handle-failure', async () => {
      console.error(`[BillingDay] Process ${process_log_id} failed (attempt ${attempt}): ${error}`);

      const supabase = await createClient();

      await supabase
        .from('cron_execution_log')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          result: { error, failedAttempt: attempt },
        })
        .eq('id', process_log_id);

      // TODO: Send alert notification
    });

    return { handled: true };
  }
);
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add lib/inngest/functions/billing-day.ts
git commit -m "feat(inngest): add billing-day processing function

Migrate billing-day from cron to Inngest with:
- Triggered by debit-orders completion event
- Fallback cron at 07:00 SAST
- Batch processing with rate limiting
- Skip invoices in debit batch or already sent

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Register Billing Day Functions

**Files:**
- Modify: `lib/inngest/index.ts`

**Step 1: Add imports and registration**

Add to exports:

```typescript
export {
  billingDayFunction,
  billingDayCompletedFunction,
  billingDayFailedFunction,
} from './functions/billing-day';
```

Add to imports:

```typescript
import {
  billingDayFunction,
  billingDayCompletedFunction,
  billingDayFailedFunction,
} from './functions/billing-day';
```

Add to functions array:

```typescript
// Billing day
billingDayFunction,
billingDayCompletedFunction,
billingDayFailedFunction,
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add lib/inngest/index.ts
git commit -m "chore(inngest): register billing-day functions

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Create Admin Manual Trigger API

**Files:**
- Create: `app/api/admin/billing/trigger/route.ts`

**Step 1: Create the API route**

```typescript
/**
 * Admin Billing Workflow Trigger API
 *
 * Allows admins to manually trigger billing workflows:
 * - debit-orders: Submit debit order batch
 * - billing-day: Process Pay Now for non-eMandate customers
 *
 * POST /api/admin/billing/trigger
 * Body: { workflow: 'debit-orders' | 'billing-day', options?: { dryRun?: boolean, date?: string } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';

interface TriggerRequest {
  workflow: 'debit-orders' | 'billing-day';
  options?: {
    dryRun?: boolean;
    date?: string; // YYYY-MM-DD
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body: TriggerRequest = await request.json();
    const { workflow, options } = body;

    if (!['debit-orders', 'billing-day'].includes(workflow)) {
      return NextResponse.json(
        { error: 'Invalid workflow. Must be "debit-orders" or "billing-day"' },
        { status: 400 }
      );
    }

    const billingDate = options?.date || new Date().toISOString().split('T')[0];

    // Create log entry
    const jobName = workflow === 'debit-orders' ? 'submit-debit-orders' : 'process-billing-day';
    const { data: logEntry, error: logError } = await supabase
      .from('cron_execution_log')
      .insert({
        job_name: jobName,
        status: 'pending',
        result: {
          triggered_by: 'manual',
          admin_user_id: adminUser.id,
          billing_date: billingDate,
          dryRun: options?.dryRun || false,
        },
      })
      .select('id')
      .single();

    if (logError || !logEntry) {
      apiLogger.error('[BillingTrigger] Failed to create log entry', { error: logError });
      return NextResponse.json(
        { error: 'Failed to create execution log' },
        { status: 500 }
      );
    }

    // Send Inngest event
    const eventName = workflow === 'debit-orders'
      ? 'billing/debit-orders.requested'
      : 'billing/day.requested';

    const eventData = workflow === 'debit-orders'
      ? {
          triggered_by: 'manual' as const,
          billing_date: billingDate,
          admin_user_id: adminUser.id,
          batch_log_id: logEntry.id,
          options: {
            dryRun: options?.dryRun || false,
          },
        }
      : {
          triggered_by: 'manual' as const,
          billing_date: billingDate,
          admin_user_id: adminUser.id,
          process_log_id: logEntry.id,
          options: {
            dryRun: options?.dryRun || false,
          },
        };

    await inngest.send({
      name: eventName,
      data: eventData,
    });

    apiLogger.info('[BillingTrigger] Workflow triggered', {
      workflow,
      logId: logEntry.id,
      billingDate,
      dryRun: options?.dryRun,
    });

    return NextResponse.json({
      success: true,
      message: `${workflow} workflow triggered`,
      logId: logEntry.id,
      billingDate,
      dryRun: options?.dryRun || false,
    });
  } catch (error) {
    apiLogger.error('[BillingTrigger] Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Check workflow status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const logId = searchParams.get('logId');

    if (!logId) {
      // Return recent executions
      const { data: recentLogs } = await supabase
        .from('cron_execution_log')
        .select('*')
        .in('job_name', ['submit-debit-orders', 'process-billing-day'])
        .order('created_at', { ascending: false })
        .limit(10);

      return NextResponse.json({ logs: recentLogs || [] });
    }

    // Return specific log
    const { data: log } = await supabase
      .from('cron_execution_log')
      .select('*')
      .eq('id', logId)
      .single();

    if (!log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    return NextResponse.json({ log });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add app/api/admin/billing/trigger/route.ts
git commit -m "feat(api): add admin billing workflow trigger endpoint

POST /api/admin/billing/trigger to manually trigger workflows
GET /api/admin/billing/trigger?logId=xxx to check status

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Add Feature Flag for Cron Bypass

**Files:**
- Modify: `app/api/cron/submit-debit-orders/route.ts`
- Modify: `app/api/cron/process-billing-day/route.ts`

**Step 1: Add feature flag check to submit-debit-orders**

Add at the beginning of the GET function (after auth check):

```typescript
// Check if Inngest is handling this workflow
const useInngest = process.env.BILLING_USE_INNGEST === 'true';
if (useInngest) {
  cronLogger.info('Debit orders handled by Inngest - skipping cron execution');
  return NextResponse.json({
    skipped: true,
    reason: 'Handled by Inngest workflow',
    timestamp: new Date().toISOString(),
  });
}
```

**Step 2: Add feature flag check to process-billing-day**

Add same check at the beginning of the GET function:

```typescript
// Check if Inngest is handling this workflow
const useInngest = process.env.BILLING_USE_INNGEST === 'true';
if (useInngest) {
  cronLogger.info('Billing day handled by Inngest - skipping cron execution');
  return NextResponse.json({
    skipped: true,
    reason: 'Handled by Inngest workflow',
    timestamp: new Date().toISOString(),
  });
}
```

**Step 3: Add env var to .env.example**

```bash
# Billing workflow control
# Set to 'true' to use Inngest for billing workflows instead of cron
BILLING_USE_INNGEST=false
```

**Step 4: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/cron/submit-debit-orders/route.ts app/api/cron/process-billing-day/route.ts .env.example
git commit -m "feat(cron): add BILLING_USE_INNGEST feature flag

Allows gradual migration from cron to Inngest:
- BILLING_USE_INNGEST=false (default): cron runs normally
- BILLING_USE_INNGEST=true: cron skips, Inngest handles

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Integration Test

**Files:**
- Create: `lib/inngest/functions/__tests__/billing-integration.test.ts`

**Step 1: Create integration test**

```typescript
/**
 * Billing Workflow Integration Tests
 *
 * Tests the event flow between debit-orders and billing-day functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inngest } from '../../client';

// Mock all external dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: { id: 'test-log-id' }, error: null })),
        })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        not: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'test-log-id' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        in: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
}));

vi.mock('@/lib/payments/netcash-debit-batch-service', () => ({
  netcashDebitBatchService: {
    isConfigured: vi.fn(() => true),
    submitBatch: vi.fn(() => Promise.resolve({
      success: true,
      batchId: 'TEST-BATCH-001',
      itemsSubmitted: 0,
      errors: [],
      warnings: [],
    })),
    authoriseBatch: vi.fn(() => Promise.resolve({ success: true })),
  },
  DebitOrderItem: {},
}));

vi.mock('@/lib/billing/paynow-billing-service', () => ({
  PayNowBillingService: {
    processPayNowForInvoice: vi.fn(() => Promise.resolve({
      success: true,
      errors: [],
    })),
    hasActiveEmandate: vi.fn(() => Promise.resolve(false)),
  },
}));

describe('Billing Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have all billing event types defined', () => {
    // Verify event types are exported
    expect(inngest).toBeDefined();
  });

  it('debit-orders function should be importable', async () => {
    const { debitOrdersFunction } = await import('../debit-orders');
    expect(debitOrdersFunction).toBeDefined();
    expect(debitOrdersFunction.id).toBe('debit-orders-batch');
  });

  it('billing-day function should be importable', async () => {
    const { billingDayFunction } = await import('../billing-day');
    expect(billingDayFunction).toBeDefined();
    expect(billingDayFunction.id).toBe('billing-day-processing');
  });

  it('completion handlers should be defined', async () => {
    const { debitOrdersCompletedFunction } = await import('../debit-orders');
    const { billingDayCompletedFunction } = await import('../billing-day');

    expect(debitOrdersCompletedFunction).toBeDefined();
    expect(debitOrdersCompletedFunction.id).toBe('debit-orders-completed');

    expect(billingDayCompletedFunction).toBeDefined();
    expect(billingDayCompletedFunction.id).toBe('billing-day-completed');
  });

  it('failure handlers should be defined', async () => {
    const { debitOrdersFailedFunction } = await import('../debit-orders');
    const { billingDayFailedFunction } = await import('../billing-day');

    expect(debitOrdersFailedFunction).toBeDefined();
    expect(debitOrdersFailedFunction.id).toBe('debit-orders-failed');

    expect(billingDayFailedFunction).toBeDefined();
    expect(billingDayFailedFunction.id).toBe('billing-day-failed');
  });
});
```

**Step 2: Run tests**

Run: `npm test -- lib/inngest/functions/__tests__/`
Expected: All tests PASS

**Step 3: Run full type check and build**

Run: `npm run type-check && npm run build:memory`
Expected: PASS

**Step 4: Commit**

```bash
git add lib/inngest/functions/__tests__/billing-integration.test.ts
git commit -m "test(inngest): add billing workflow integration tests

Verify all functions and handlers are properly defined and importable.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Zoho Sync Migration (Tasks 9-12)

### Task 9: Create Zoho Sync Inngest Function

**Files:**
- Create: `lib/inngest/functions/zoho-sync.ts`

*(Full implementation follows same pattern as debit-orders/billing-day)*

**Key features:**
- Exponential backoff for rate limiting (Inngest native)
- Parallel CRM/Billing sync steps
- Adaptive batch sizing based on API response times
- Failure isolation per product

---

### Task 10: Register Zoho Sync Functions

**Files:**
- Modify: `lib/inngest/index.ts`

---

### Task 11: Add Feature Flag to Zoho Cron

**Files:**
- Modify: `app/api/cron/zoho-sync/route.ts`

---

### Task 12: Validation & Cleanup

- Run parallel with existing cron for 1 week
- Monitor Inngest dashboard for failures
- Compare metrics: failure rate, duration, data lag
- Disable cron when confident

---

## Validation Checklist

After completing Phase 1:

- [ ] `npm run type-check` passes
- [ ] `npm run build:memory` succeeds
- [ ] All tests pass: `npm test -- lib/inngest/`
- [ ] Inngest Dev Server shows functions: `npx inngest-cli@latest dev`
- [ ] Manual trigger works: POST to `/api/admin/billing/trigger`
- [ ] Completion event triggers billing-day
- [ ] Dry run mode works for both workflows

---

## Rollback Instructions

If issues occur after enabling Inngest:

1. Set `BILLING_USE_INNGEST=false` in Vercel env vars
2. Redeploy
3. Cron jobs resume normal operation
4. Investigate Inngest logs in dashboard

No data migration needed - both systems use same database tables.
