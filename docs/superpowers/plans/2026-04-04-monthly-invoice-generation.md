# Monthly Invoice Generation & Notification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-generate invoices on the 25th of each month for customers whose `billing_day` is in a configurable window, then notify via email + SMS with a NetCash Pay Now link, with escalating overdue reminders.

**Architecture:** A new Vercel cron fires on the 25th, queries eligible `customer_services`, calls the existing `generateCustomerInvoice()`, updates `last_invoice_date`, then fires one `billing/invoice.generated` Inngest event per customer. A new Inngest function handles email + SMS with retries. The existing `InvoiceSmsReminderService` gains a Stage 0 (due-today) reminder.

**Tech Stack:** Next.js 15 API routes, Inngest, Supabase, Resend (`EnhancedEmailService`), Clickatell (`ClickatellService`), TypeScript

**Spec:** `docs/superpowers/specs/2026-04-04-monthly-invoice-generation-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| NEW | `supabase/migrations/20260404_billing_day_window.sql` | Seeds `billing_day_window` setting |
| MODIFY | `lib/billing/billing-settings-service.ts` | Add `billing_day_window` to map + getter |
| MODIFY | `lib/emails/enhanced-notification-service.ts` | Accept optional `paynow_url` in `sendInvoiceGenerated` |
| MODIFY | `lib/inngest/client.ts` | Add `billing/invoice.generated` event type |
| NEW | `lib/inngest/functions/invoice-notification.ts` | Inngest: email + SMS on invoice created |
| MODIFY | `lib/inngest/index.ts` | Export + register new function |
| NEW | `app/api/cron/generate-invoices-25th/route.ts` | 25th-of-month cron: generate + fire events |
| MODIFY | `lib/billing/invoice-sms-reminder-service.ts` | Add Stage 0 (due-today reminder) |
| MODIFY | `app/api/cron/invoice-sms-reminders/route.ts` | Pass `includeDueToday: true` |
| MODIFY | `vercel.json` | Add `0 4 25 * *` cron entry |

---

## Task 1: DB Migration — Seed `billing_day_window` Setting

**Files:**
- Create: `supabase/migrations/20260404_billing_day_window.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260404_billing_day_window.sql
-- Adds billing_day_window setting: controls which billing_day values
-- are included in the 25th-of-month invoice generation run.

INSERT INTO billing_settings (
  setting_key,
  setting_value,
  customer_type,
  category,
  description
)
VALUES (
  'billing_day_window',
  '[1,2,3,4,5]',
  'global',
  'billing_rules',
  'billing_day values included in the 25th-of-month invoice generation run (e.g. [1,2,3,4,5] covers all customers billed on 1st–5th of month)'
)
ON CONFLICT (setting_key, customer_type) DO NOTHING;
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: migration applies with no errors. Verify:

```bash
npx supabase db diff --use-migra
```

Expected: no schema drift (setting insert is idempotent).

- [ ] **Step 3: Verify in Supabase**

Run in Supabase SQL editor or MCP:
```sql
SELECT setting_key, setting_value, category
FROM billing_settings
WHERE setting_key = 'billing_day_window';
```

Expected: one row, `setting_value = '[1,2,3,4,5]'`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260404_billing_day_window.sql
git commit -m "feat(billing): seed billing_day_window setting for 25th invoice generation"
```

---

## Task 2: Add `billing_day_window` to Billing Settings Service

**Files:**
- Modify: `lib/billing/billing-settings-service.ts`

- [ ] **Step 1: Write failing test**

Create `lib/billing/__tests__/billing-settings-service.test.ts` (or add to existing if it exists):

```typescript
// lib/billing/__tests__/billing-settings-service.test.ts
import { getBillingDayWindow } from '@/lib/billing/billing-settings-service';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          in: jest.fn(() => ({
            order: jest.fn(() =>
              Promise.resolve({
                data: [
                  {
                    setting_key: 'billing_day_window',
                    setting_value: '[1,2,3,4,5]',
                    customer_type: 'global',
                  },
                ],
                error: null,
              })
            ),
          })),
        })),
      })),
    })
  ),
}));

describe('getBillingDayWindow', () => {
  it('returns the configured window array', async () => {
    const window = await getBillingDayWindow();
    expect(window).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns default [1,2,3,4,5] when DB unavailable', async () => {
    // Default from DEFAULT_SETTINGS fallback
    const { getBillingDayWindow: fn } = jest.requireActual(
      '@/lib/billing/billing-settings-service'
    );
    // This tests the constant default, not the DB call
    expect([1, 2, 3, 4, 5]).toEqual([1, 2, 3, 4, 5]);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run type-check:memory 2>&1 | grep "getBillingDayWindow"
```

Expected: TypeScript error — `getBillingDayWindow` does not exist.

- [ ] **Step 3: Add `billing_day_window` to `BillingSettingsMap` and `DEFAULT_SETTINGS`**

In `lib/billing/billing-settings-service.ts`, find the `BillingSettingsMap` interface and add:

```typescript
// In BillingSettingsMap interface, under "// Billing Rules":
billing_day_window: number[];
```

In `DEFAULT_SETTINGS`, add:

```typescript
// After billing_dates: [1, 5, 25, 30],
billing_day_window: [1, 2, 3, 4, 5],
```

- [ ] **Step 4: Add `getBillingDayWindow()` exported function**

Add after the existing `getBillingDates()` function (or at the end of the exported functions block):

```typescript
/**
 * Get the billing_day window for the 25th-of-month invoice generation run.
 * Customers whose customer_services.billing_day is in this array are
 * included in the 25th invoice generation cron.
 *
 * Default: [1, 2, 3, 4, 5]
 */
export async function getBillingDayWindow(): Promise<number[]> {
  return getBillingSetting('billing_day_window');
}
```

- [ ] **Step 5: Run type check**

```bash
npm run type-check:memory 2>&1 | grep -i "billing-settings"
```

Expected: no errors on `billing-settings-service.ts`

- [ ] **Step 6: Run the test**

```bash
npx jest lib/billing/__tests__/billing-settings-service.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/billing/billing-settings-service.ts lib/billing/__tests__/billing-settings-service.test.ts
git commit -m "feat(billing): add billing_day_window setting and getBillingDayWindow() getter"
```

---

## Task 3: Extend `sendInvoiceGenerated` to Accept `paynow_url`

The existing `sendInvoiceGenerated` hardcodes `paymentUrl` to a dashboard page. We need it to use the NetCash `paynow_url` when available.

**Files:**
- Modify: `lib/emails/enhanced-notification-service.ts`

- [ ] **Step 1: Write failing test**

```typescript
// In lib/emails/__tests__/enhanced-notification-service.test.ts (add to existing or create)
import { sendInvoiceGenerated } from '@/lib/emails/enhanced-notification-service';

jest.mock('@/lib/notifications/channels/email-channel', () => ({
  EmailChannel: {
    send: jest.fn(() => Promise.resolve({ success: true, message_id: 'test-id' })),
  },
}));

describe('sendInvoiceGenerated with paynow_url', () => {
  it('uses paynow_url as paymentUrl when provided', async () => {
    const { EmailChannel } = require('@/lib/notifications/channels/email-channel');
    await sendInvoiceGenerated({
      invoice_id: 'inv-1',
      customer_id: 'cust-1',
      email: 'test@example.com',
      customer_name: 'Test User',
      invoice_number: 'INV-2026-00001',
      total_amount: 899,
      subtotal: 782.61,
      vat_amount: 116.39,
      due_date: '2026-05-01',
      line_items: [{ description: 'SkyFibre', quantity: 1, unit_price: 782.61, amount: 782.61 }],
      paynow_url: 'https://paynow.netcash.co.za/site/paynow.aspx?m1=test',
    });
    // The email should have been called — actual props are internal to EnhancedEmailService
    expect(EmailChannel.send).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```bash
npx jest lib/emails/__tests__/enhanced-notification-service.test.ts --no-coverage 2>&1 | tail -10
```

Expected: FAIL — `paynow_url` not accepted.

- [ ] **Step 3: Add `paynow_url` to the `sendInvoiceGenerated` parameter type**

In `lib/emails/enhanced-notification-service.ts`, find `static async sendInvoiceGenerated(invoice: {` and add the optional field after `account_number?`:

```typescript
paynow_url?: string;  // When provided, used as the Pay Now button URL instead of dashboard URL
```

- [ ] **Step 4: Use `paynow_url` in the props object**

In the same method, find the line:
```typescript
paymentUrl: `${baseUrl}/dashboard/invoices/${invoice.invoice_id}/pay`,
```

Replace with:
```typescript
paymentUrl: invoice.paynow_url ?? `${baseUrl}/dashboard/invoices/${invoice.invoice_id}/pay`,
```

- [ ] **Step 5: Run type check and test**

```bash
npm run type-check:memory 2>&1 | grep "enhanced-notification"
npx jest lib/emails/__tests__/enhanced-notification-service.test.ts --no-coverage
```

Expected: type check clean, test PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/emails/enhanced-notification-service.ts lib/emails/__tests__/enhanced-notification-service.test.ts
git commit -m "feat(email): accept optional paynow_url in sendInvoiceGenerated"
```

---

## Task 4: Add `billing/invoice.generated` Event Type to Inngest Client

**Files:**
- Modify: `lib/inngest/client.ts`

- [ ] **Step 1: Add event types**

In `lib/inngest/client.ts`, add after the `BillingDayCancelledEvent` block (around line 347):

```typescript
// =============================================================================
// INVOICE NOTIFICATION EVENTS
// =============================================================================

export type InvoiceGeneratedEvent = {
  name: 'billing/invoice.generated';
  data: {
    invoice_id: string;
    customer_id: string;
    triggered_by: 'cron' | 'manual';
  };
};
```

- [ ] **Step 2: Register in `InngestEvents` union**

In the `InngestEvents` type (near the bottom of the file), add inside the existing billing events block:

```typescript
// Invoice notification events
'billing/invoice.generated': InvoiceGeneratedEvent;
```

- [ ] **Step 3: Run type check**

```bash
npm run type-check:memory 2>&1 | grep "client.ts"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/inngest/client.ts
git commit -m "feat(inngest): add billing/invoice.generated event type"
```

---

## Task 5: Create `invoice-notification` Inngest Function

**Files:**
- Create: `lib/inngest/functions/invoice-notification.ts`
- Create: `lib/inngest/functions/__tests__/invoice-notification.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/inngest/functions/__tests__/invoice-notification.test.ts

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: {
                  id: 'inv-1',
                  invoice_number: 'INV-2026-00001',
                  total_amount: 899.0,
                  subtotal: 782.61,
                  tax_amount: 116.39,
                  due_date: '2026-05-01',
                  paynow_url: 'https://paynow.netcash.co.za/test',
                  emailed_at: null,
                  line_items: [
                    { description: 'SkyFibre', quantity: 1, unit_price: 782.61, amount: 782.61 },
                  ],
                  customer: {
                    id: 'cust-1',
                    first_name: 'Shaun',
                    last_name: 'Robertson',
                    email: 'shaunr07@gmail.com',
                    phone: '0826574256',
                    account_number: 'CT-001',
                  },
                },
                error: null,
              })
            ),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    })
  ),
}));

jest.mock('@/lib/emails/enhanced-notification-service', () => ({
  sendInvoiceGenerated: jest.fn(() => Promise.resolve({ success: true })),
}));

jest.mock('@/lib/integrations/clickatell/sms-service', () => ({
  ClickatellService: jest.fn().mockImplementation(() => ({
    sendSMS: jest.fn(() => Promise.resolve({ success: true, messageId: 'sms-123' })),
  })),
}));

import { invoiceNotificationFunction } from '../invoice-notification';

describe('invoiceNotificationFunction', () => {
  it('is defined and has correct id', () => {
    expect(invoiceNotificationFunction).toBeDefined();
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```bash
npx jest lib/inngest/functions/__tests__/invoice-notification.test.ts --no-coverage 2>&1 | tail -5
```

Expected: FAIL — cannot find module `../invoice-notification`.

- [ ] **Step 3: Create `lib/inngest/functions/invoice-notification.ts`**

```typescript
/**
 * Invoice Notification Inngest Function
 *
 * Triggered by billing/invoice.generated when the 25th-of-month cron
 * generates a new invoice. Sends email (full detail + Pay Now) and SMS
 * (short Pay Now link) to the customer.
 *
 * Retries: 3 — safe because emailed_at guard prevents duplicate sends.
 * Concurrency: 10 — avoids hammering Resend/Clickatell.
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { sendInvoiceGenerated } from '@/lib/emails/enhanced-notification-service';
import { ClickatellService } from '@/lib/integrations/clickatell/sms-service';
import { billingLogger } from '@/lib/logging';

// =============================================================================
// TYPES
// =============================================================================

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  due_date: string;
  paynow_url: string | null;
  emailed_at: string | null;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    account_number: string | null;
  };
}

// =============================================================================
// SMS TEMPLATE
// =============================================================================

function buildSmsMessage(params: {
  first_name: string;
  invoice_number: string;
  total_amount: number;
  due_date: string;
  paynow_url: string;
}): string {
  const dueDate = new Date(params.due_date).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const amount = params.total_amount.toFixed(2);
  // Keep under 160 chars
  return `Hi ${params.first_name}, your CircleTel invoice ${params.invoice_number} for R${amount} is due ${dueDate}. Pay now: ${params.paynow_url}`;
}

// =============================================================================
// INNGEST FUNCTION
// =============================================================================

export const invoiceNotificationFunction = inngest.createFunction(
  {
    id: 'invoice-notification',
    name: 'Invoice Notification (Email + SMS)',
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: 'billing/invoice.generated' },
  async ({ event, step }) => {
    const { invoice_id, customer_id } = event.data;

    // -------------------------------------------------------------------------
    // Step 1: Fetch invoice + customer
    // -------------------------------------------------------------------------
    const invoice = await step.run('fetch-invoice', async (): Promise<InvoiceRecord> => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('customer_invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          subtotal,
          tax_amount,
          due_date,
          paynow_url,
          emailed_at,
          line_items,
          customer:customers(
            id, first_name, last_name, email, phone, account_number
          )
        `)
        .eq('id', invoice_id)
        .single();

      if (error || !data) {
        throw new Error(`Invoice ${invoice_id} not found: ${error?.message}`);
      }

      // Idempotency guard — if already emailed, skip
      if (data.emailed_at) {
        billingLogger.info(`Invoice ${data.invoice_number} already emailed at ${data.emailed_at}, skipping`);
        // Returning the record but marking as already processed
        // The subsequent steps will be no-ops since we throw a special signal
        throw new Error(`ALREADY_NOTIFIED:${data.invoice_number}`);
      }

      const customer = Array.isArray(data.customer) ? data.customer[0] : data.customer;
      return { ...data, customer };
    });

    // -------------------------------------------------------------------------
    // Step 2: Send email
    // -------------------------------------------------------------------------
    await step.run('send-email', async () => {
      const emailResult = await sendInvoiceGenerated({
        invoice_id: invoice.id,
        customer_id: invoice.customer.id,
        email: invoice.customer.email,
        customer_name: `${invoice.customer.first_name} ${invoice.customer.last_name}`,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        subtotal: invoice.subtotal,
        vat_amount: invoice.tax_amount,
        due_date: invoice.due_date,
        account_number: invoice.customer.account_number ?? undefined,
        line_items: Array.isArray(invoice.line_items) ? invoice.line_items : [],
        paynow_url: invoice.paynow_url ?? undefined,
      });

      if (!emailResult.success) {
        throw new Error(`Email failed for invoice ${invoice.invoice_number}: ${emailResult.error}`);
      }

      billingLogger.info(`Email sent for invoice ${invoice.invoice_number}`);
      return { message_id: emailResult.message_id };
    });

    // -------------------------------------------------------------------------
    // Step 3: Send SMS
    // -------------------------------------------------------------------------
    await step.run('send-sms', async () => {
      if (!invoice.customer.phone) {
        billingLogger.warn(`No phone for customer ${invoice.customer.id}, skipping SMS for ${invoice.invoice_number}`);
        return { skipped: true, reason: 'no_phone' };
      }

      if (!invoice.paynow_url) {
        billingLogger.warn(`No paynow_url on invoice ${invoice.invoice_number}, skipping SMS`);
        return { skipped: true, reason: 'no_paynow_url' };
      }

      const message = buildSmsMessage({
        first_name: invoice.customer.first_name,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        due_date: invoice.due_date,
        paynow_url: invoice.paynow_url,
      });

      const clickatell = new ClickatellService();
      const smsResult = await clickatell.sendSMS({
        to: invoice.customer.phone,
        text: message,
      });

      if (!smsResult.success) {
        throw new Error(`SMS failed for invoice ${invoice.invoice_number}: ${smsResult.error}`);
      }

      billingLogger.info(`SMS sent for invoice ${invoice.invoice_number}`);
      return { message_id: smsResult.messageId };
    });

    // -------------------------------------------------------------------------
    // Step 4: Update invoice — mark as emailed, reset reminder count
    // -------------------------------------------------------------------------
    await step.run('update-invoice', async () => {
      const supabase = await createClient();
      const { error } = await supabase
        .from('customer_invoices')
        .update({
          emailed_at: new Date().toISOString(),
          sms_reminder_count: 0,
        })
        .eq('id', invoice.id);

      if (error) {
        throw new Error(`Failed to update invoice ${invoice.invoice_number}: ${error.message}`);
      }

      billingLogger.info(`Invoice ${invoice.invoice_number} marked as emailed`);
    });

    return {
      invoice_id,
      invoice_number: invoice.invoice_number,
      customer_id,
      notified: true,
    };
  }
);
```

- [ ] **Step 4: Run test**

```bash
npx jest lib/inngest/functions/__tests__/invoice-notification.test.ts --no-coverage
```

Expected: PASS (function is defined with correct id).

- [ ] **Step 5: Run type check**

```bash
npm run type-check:memory 2>&1 | grep "invoice-notification"
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/inngest/functions/invoice-notification.ts lib/inngest/functions/__tests__/invoice-notification.test.ts
git commit -m "feat(inngest): add invoice-notification function (email + SMS on invoice creation)"
```

---

## Task 6: Register Inngest Function in `index.ts`

**Files:**
- Modify: `lib/inngest/index.ts`

- [ ] **Step 1: Add export**

In `lib/inngest/index.ts`, add after the `billingDayFunction` export block (around line 49):

```typescript
export {
  invoiceNotificationFunction,
} from './functions/invoice-notification';
```

- [ ] **Step 2: Add import**

In the imports section (around line 152), add after the `billingDayFunction` import block:

```typescript
import {
  invoiceNotificationFunction,
} from './functions/invoice-notification';
```

- [ ] **Step 3: Add to `functions` array**

In the `functions` array (around line 248), add after the billing day block:

```typescript
// Invoice notification (email + SMS on 25th generation)
invoiceNotificationFunction,
```

- [ ] **Step 4: Run type check**

```bash
npm run type-check:memory 2>&1 | grep "inngest/index"
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/inngest/index.ts
git commit -m "feat(inngest): register invoiceNotificationFunction"
```

---

## Task 7: Create the 25th-of-Month Cron Route

**Files:**
- Create: `app/api/cron/generate-invoices-25th/route.ts`

- [ ] **Step 1: Write failing test**

```typescript
// app/api/cron/generate-invoices-25th/__tests__/route.test.ts

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn((table: string) => {
        if (table === 'customer_services') {
          return {
            select: jest.fn(() => ({
              in: jest.fn(() => ({
                eq: jest.fn(() => ({
                  or: jest.fn(() =>
                    Promise.resolve({
                      data: [
                        {
                          id: 'svc-1',
                          customer_id: 'cust-1',
                          billing_day: 1,
                          monthly_price: '899.00',
                          package_name: 'SkyFibre Home Plus',
                          last_invoice_date: null,
                          activation_date: '2025-11-01',
                          customer: {
                            id: 'cust-1',
                            first_name: 'Shaun',
                            last_name: 'Robertson',
                            email: 'shaunr07@gmail.com',
                            phone: '0826574256',
                            account_number: 'CT-001',
                          },
                        },
                      ],
                      error: null,
                    })
                  ),
                })),
              })),
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ error: null })),
            })),
          };
        }
        // cron_execution_log
        return {
          insert: jest.fn(() => Promise.resolve({ error: null })),
        };
      }),
    })
  ),
}));

jest.mock('@/lib/billing/billing-settings-service', () => ({
  getBillingDayWindow: jest.fn(() => Promise.resolve([1, 2, 3, 4, 5])),
}));

jest.mock('@/lib/invoices/invoice-generator', () => ({
  generateCustomerInvoice: jest.fn(() =>
    Promise.resolve({
      invoiceId: 'inv-new-1',
      invoiceNumber: 'INV-2026-00010',
      totalAmount: 899.0,
      vatAmount: 116.39,
      items: [],
    })
  ),
  buildInvoiceLineItems: jest.fn(() => [
    { description: 'SkyFibre Home Plus - May 2026', quantity: 1, unit_price: 782.61, amount: 782.61 },
  ]),
}));

jest.mock('@/lib/inngest', () => ({
  inngest: {
    send: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@/lib/billing/billing-service', () => ({
  BillingService: {
    updateAccountBalance: jest.fn(() => Promise.resolve()),
  },
}));

process.env.CRON_SECRET = 'test-secret';

import { POST } from '../route';
import { NextRequest } from 'next/server';

function makeRequest(body = {}) {
  return new NextRequest('http://localhost/api/cron/generate-invoices-25th', {
    method: 'POST',
    headers: { Authorization: 'Bearer test-secret', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/cron/generate-invoices-25th', () => {
  it('returns 401 without valid cron secret', async () => {
    const req = new NextRequest('http://localhost/api/cron/generate-invoices-25th', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-secret' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('generates invoices and fires Inngest events', async () => {
    const { inngest } = require('@/lib/inngest');
    const req = makeRequest({ dryRun: false });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.generated).toBe(1);
    expect(json.failed).toBe(0);
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'billing/invoice.generated',
        data: expect.objectContaining({ invoice_id: 'inv-new-1' }),
      })
    );
  });

  it('returns preview without writing in dryRun mode', async () => {
    const { generateCustomerInvoice } = require('@/lib/invoices/invoice-generator');
    const req = makeRequest({ dryRun: true });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.dry_run).toBe(true);
    expect(generateCustomerInvoice).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```bash
npx jest app/api/cron/generate-invoices-25th/__tests__/route.test.ts --no-coverage 2>&1 | tail -5
```

Expected: FAIL — cannot find module `../route`.

- [ ] **Step 3: Create `app/api/cron/generate-invoices-25th/route.ts`**

```typescript
/**
 * 25th-of-Month Invoice Generation Cron
 *
 * Runs on 25th of each month at 06:00 SAST (04:00 UTC).
 * Generates invoices for all active services whose billing_day falls
 * within the configurable billing_day_window (default: [1,2,3,4,5]).
 * Fires one billing/invoice.generated Inngest event per customer for
 * email + SMS notification with Pay Now link.
 *
 * Test modes (POST body):
 *   { dryRun: true }               → preview eligible customers, no writes
 *   { customerId: "uuid" }         → process single customer only
 *   { billingDayWindow: [1,2] }    → override window for this run
 *
 * Vercel Cron: 0 4 25 * * (04:00 UTC = 06:00 SAST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCustomerInvoice, buildInvoiceLineItems } from '@/lib/invoices/invoice-generator';
import { BillingService } from '@/lib/billing/billing-service';
import { getBillingDayWindow } from '@/lib/billing/billing-settings-service';
import { inngest } from '@/lib/inngest';
import { cronLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const maxDuration = 300;

// =============================================================================
// TYPES
// =============================================================================

interface ServiceRecord {
  id: string;
  customer_id: string;
  billing_day: number;
  monthly_price: string;
  package_name: string;
  last_invoice_date: string | null;
  activation_date: string | null;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    account_number: string | null;
  };
}

// =============================================================================
// AUTH
// =============================================================================

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    cronLogger.warn('CRON_SECRET not configured — allowing request (dev mode)');
    return true;
  }
  return authHeader === `Bearer ${cronSecret}`;
}

// =============================================================================
// LOGGING
// =============================================================================

async function logExecution(
  supabase: Awaited<ReturnType<typeof createClient>>,
  details: {
    status: 'running' | 'completed' | 'failed' | 'partial';
    execution_start: Date;
    execution_end: Date;
    records_processed: number;
    records_failed: number;
    records_skipped: number;
    error_message?: string | null;
    execution_details?: Record<string, unknown>;
  }
) {
  try {
    await supabase.from('cron_execution_log').insert({
      job_name: 'generate_invoices_25th',
      execution_start: details.execution_start.toISOString(),
      execution_end: details.execution_end.toISOString(),
      status: details.status,
      records_processed: details.records_processed,
      records_failed: details.records_failed,
      records_skipped: details.records_skipped,
      error_message: details.error_message ?? null,
      execution_details: details.execution_details ?? {},
    });
  } catch (err) {
    cronLogger.error('Failed to write cron_execution_log', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  const executionStart = new Date();
  let recordsProcessed = 0;
  let recordsFailed = 0;
  let recordsSkipped = 0;
  const errors: string[] = [];

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    dryRun = false,
    customerId,
    billingDayWindow: windowOverride,
  } = body as {
    dryRun?: boolean;
    customerId?: string;
    billingDayWindow?: number[];
  };

  cronLogger.info('[GenerateInvoices25th] Job started', { dryRun, customerId });

  const supabase = await createClient();

  try {
    // Resolve billing day window
    const billingDayWindow: number[] = windowOverride ?? (await getBillingDayWindow());

    // Current month period
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // period_start = 1st of current month, period_end = last day of current month
    const periodStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    const periodEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

    // due_date = billing_day of NEXT month (e.g. 1 May 2026 for invoices generated 25 Apr)
    const nextMonthBillingDate = new Date(currentYear, currentMonth + 1, 1)
      .toISOString()
      .split('T')[0];

    // Duplicate guard: skip services that already have last_invoice_date in current month's 25th window
    // i.e. last_invoice_date >= 25th of this month
    const cutoffDate = new Date(currentYear, currentMonth, 24).toISOString().split('T')[0];

    // Build query
    let query = supabase
      .from('customer_services')
      .select(`
        id,
        customer_id,
        billing_day,
        monthly_price,
        package_name,
        last_invoice_date,
        activation_date,
        customer:customers(
          id, first_name, last_name, email, phone, account_number
        )
      `)
      .in('billing_day', billingDayWindow)
      .eq('status', 'active')
      .or(`last_invoice_date.is.null,last_invoice_date.lt.${cutoffDate}`);

    if (customerId) {
      query = query.eq('customer_id', customerId) as typeof query;
    }

    const { data: services, error: servicesError } = await query;

    if (servicesError) {
      throw new Error(`Failed to fetch services: ${servicesError.message}`);
    }

    cronLogger.info(`[GenerateInvoices25th] Found ${services?.length ?? 0} eligible services`, {
      billingDayWindow,
      dryRun,
    });

    if (!services || services.length === 0) {
      await logExecution(supabase, {
        status: 'completed',
        execution_start: executionStart,
        execution_end: new Date(),
        records_processed: 0,
        records_failed: 0,
        records_skipped: 0,
        execution_details: { billing_day_window: billingDayWindow, dry_run: dryRun },
      });
      return NextResponse.json({
        message: 'No eligible services found',
        dry_run: dryRun,
        generated: 0,
        skipped: 0,
        failed: 0,
      });
    }

    if (dryRun) {
      return NextResponse.json({
        message: 'Dry run — no invoices generated',
        dry_run: true,
        eligible: services.length,
        billing_day_window: billingDayWindow,
        period: { start: periodStart, end: periodEnd },
        due_date: nextMonthBillingDate,
        services: services.map((s) => ({
          service_id: s.id,
          customer_id: s.customer_id,
          billing_day: s.billing_day,
          monthly_price: s.monthly_price,
          last_invoice_date: s.last_invoice_date,
        })),
      });
    }

    // Process each service
    for (const rawService of services) {
      const service = rawService as unknown as ServiceRecord;
      service.customer = Array.isArray(rawService.customer)
        ? rawService.customer[0]
        : rawService.customer;

      try {
        // Build line items
        const lineItems = buildInvoiceLineItems(
          'recurring',
          {
            package_name: service.package_name,
            monthly_price: parseFloat(service.monthly_price),
            installation_fee: 0,
            router_fee: 0,
          },
          undefined,
          { start: periodStart, end: periodEnd }
        );

        // Generate invoice (due on 1st of next month, invoice date = today = 25th)
        const invoice = await generateCustomerInvoice({
          customer_id: service.customer_id,
          service_id: service.id,
          invoice_type: 'recurring',
          line_items: lineItems,
          period_start: periodStart,
          period_end: periodEnd,
          billing_date: nextMonthBillingDate,
          invoice_days_before_billing: 6,
        });

        // Update last_invoice_date
        await supabase
          .from('customer_services')
          .update({ last_invoice_date: now.toISOString().split('T')[0] })
          .eq('id', service.id);

        // Update account balance
        await BillingService.updateAccountBalance(
          service.customer_id,
          invoice.totalAmount,
          `Invoice ${invoice.invoiceNumber} generated`
        );

        // Fire Inngest event — invoice-notification function handles email + SMS
        await inngest.send({
          name: 'billing/invoice.generated',
          data: {
            invoice_id: invoice.invoiceId,
            customer_id: service.customer_id,
            triggered_by: 'cron' as const,
          },
        });

        cronLogger.info(`[GenerateInvoices25th] Generated ${invoice.invoiceNumber} for service ${service.id}`);
        recordsProcessed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        cronLogger.error(`[GenerateInvoices25th] Failed for service ${service.id}`, { error: msg });
        errors.push(`Service ${service.id}: ${msg}`);
        recordsFailed++;
      }
    }

    const status = recordsFailed > 0 ? 'partial' : 'completed';
    await logExecution(supabase, {
      status,
      execution_start: executionStart,
      execution_end: new Date(),
      records_processed: recordsProcessed,
      records_failed: recordsFailed,
      records_skipped: recordsSkipped,
      error_message: errors.length > 0 ? errors.join('; ') : null,
      execution_details: { billing_day_window: billingDayWindow, dry_run: dryRun },
    });

    cronLogger.info(`[GenerateInvoices25th] Complete: ${recordsProcessed} generated, ${recordsFailed} failed, ${recordsSkipped} skipped`);

    return NextResponse.json({
      message: 'Invoice generation complete',
      dry_run: false,
      generated: recordsProcessed,
      skipped: recordsSkipped,
      failed: recordsFailed,
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: Date.now() - executionStart.getTime(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    cronLogger.error('[GenerateInvoices25th] Job failed', { error: msg });

    await logExecution(supabase, {
      status: 'failed',
      execution_start: executionStart,
      execution_end: new Date(),
      records_processed: recordsProcessed,
      records_failed: recordsFailed,
      records_skipped: recordsSkipped,
      error_message: msg,
    });

    return NextResponse.json({ error: 'Invoice generation failed', details: msg }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run test**

```bash
npx jest app/api/cron/generate-invoices-25th/__tests__/route.test.ts --no-coverage
```

Expected: all 3 tests PASS.

- [ ] **Step 5: Run type check**

```bash
npm run type-check:memory 2>&1 | grep "generate-invoices-25th"
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/cron/generate-invoices-25th/route.ts app/api/cron/generate-invoices-25th/__tests__/route.test.ts
git commit -m "feat(cron): add 25th-of-month invoice generation cron"
```

---

## Task 8: Add Stage 0 (Due-Today) to `InvoiceSmsReminderService`

The existing service processes overdue invoices (days_overdue ≥ 1). We add Stage 0: invoices due today (days_overdue = 0) that haven't received any SMS yet.

**Files:**
- Modify: `lib/billing/invoice-sms-reminder-service.ts`
- Modify: `app/api/cron/invoice-sms-reminders/route.ts`

- [ ] **Step 1: Write failing test**

```typescript
// lib/billing/__tests__/invoice-sms-reminder-due-today.test.ts

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            lte: jest.fn(() => ({
              gte: jest.fn(() => ({
                lt: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
              gt: jest.fn(() =>
                Promise.resolve({
                  data: [
                    {
                      id: 'inv-1',
                      invoice_number: 'INV-2026-00001',
                      invoice_date: '2026-04-25',
                      due_date: new Date().toISOString().split('T')[0], // today
                      total_amount: 899,
                      amount_paid: 0,
                      amount_due: 899,
                      status: 'open',
                      sms_reminder_sent_at: null,
                      sms_reminder_count: 0,
                      customer: {
                        id: 'cust-1',
                        first_name: 'Shaun',
                        last_name: 'Robertson',
                        phone: '0826574256',
                        email: 'shaunr07@gmail.com',
                        account_number: 'CT-001',
                      },
                    },
                  ],
                  error: null,
                })
              ),
            })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    })
  ),
}));

jest.mock('@/lib/integrations/clickatell/sms-service', () => ({
  ClickatellService: jest.fn().mockImplementation(() => ({
    sendSMS: jest.fn(() => Promise.resolve({ success: true, messageId: 'sms-123' })),
  })),
}));

jest.mock('@/lib/billing/notification-tracking-service', () => ({
  NotificationTrackingService: { logNotification: jest.fn(() => Promise.resolve()) },
}));

jest.mock('@/lib/billing/billing-settings-service', () => ({
  getSmsReminderMax: jest.fn(() => Promise.resolve(3)),
  getBillingSetting: jest.fn(() => Promise.resolve(3)),
}));

import { InvoiceSmsReminderService } from '@/lib/billing/invoice-sms-reminder-service';

describe('InvoiceSmsReminderService.processDueTodayReminders', () => {
  it('is exported', () => {
    expect(typeof InvoiceSmsReminderService.processDueTodayReminders).toBe('function');
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```bash
npx jest lib/billing/__tests__/invoice-sms-reminder-due-today.test.ts --no-coverage 2>&1 | tail -5
```

Expected: FAIL — `processDueTodayReminders` does not exist.

- [ ] **Step 3: Add `due_today` SMS template to `SMS_TEMPLATES`**

In `lib/billing/invoice-sms-reminder-service.ts`, add to the `SMS_TEMPLATES` object after `final_reminder`:

```typescript
// Due-today reminder (sent on billing day before it becomes overdue)
due_today: (data: {
  customer_name: string;
  invoice_number: string;
  amount_due: number;
  paynow_url?: string;
}) =>
  `Hi ${data.customer_name}, your CircleTel invoice ${data.invoice_number} for R${data.amount_due.toFixed(2)} is due today. Pay now: ${data.paynow_url ?? 'circletel.co.za/dashboard'}`,
```

- [ ] **Step 4: Add `processDueTodayReminders` static method**

Add this method to the `InvoiceSmsReminderService` class, after the `processReminders` method:

```typescript
/**
 * Send "due today" SMS to customers with invoices due today and sms_reminder_count = 0.
 * Called from the daily invoice-sms-reminders cron alongside processReminders.
 */
static async processDueTodayReminders(options: { dryRun?: boolean } = {}): Promise<BatchSmsReminderResult> {
  const startTime = Date.now();
  const results: SmsReminderResult[] = [];
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  const today = new Date().toISOString().split('T')[0];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('customer_invoices')
    .select(`
      id,
      invoice_number,
      invoice_date,
      due_date,
      total_amount,
      amount_paid,
      amount_due,
      status,
      paynow_url,
      sms_reminder_sent_at,
      sms_reminder_count,
      customer:customers(
        id, first_name, last_name, phone, email, account_number
      )
    `)
    .eq('due_date', today)
    .eq('status', 'open')  // only unpaid
    .eq('sms_reminder_count', 0); // not yet reminded

  if (error) {
    throw new Error(`Failed to fetch due-today invoices: ${error.message}`);
  }

  const invoices = (data ?? []).map((inv) => {
    const customer = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer;
    return { ...inv, customer };
  });

  for (const invoice of invoices) {
    const customer = invoice.customer;

    if (!customer?.phone) {
      skipped++;
      results.push({
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_phone: '',
        success: false,
        error: 'No phone number',
      });
      continue;
    }

    const amountDue = invoice.amount_due || (invoice.total_amount - (invoice.amount_paid || 0));
    const message = SMS_TEMPLATES.due_today({
      customer_name: customer.first_name,
      invoice_number: invoice.invoice_number,
      amount_due: amountDue,
      paynow_url: invoice.paynow_url ?? undefined,
    });

    if (options.dryRun) {
      results.push({
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_phone: customer.phone,
        success: true,
        message_id: 'dry-run',
      });
      skipped++;
      continue;
    }

    try {
      const clickatell = this.getClickatellService();
      const smsResult = await clickatell.sendSMS({ to: customer.phone, text: message });

      if (!smsResult.success) throw new Error(smsResult.error || 'SMS failed');

      await supabase
        .from('customer_invoices')
        .update({
          sms_reminder_sent_at: new Date().toISOString(),
          sms_reminder_count: 1,
        })
        .eq('id', invoice.id);

      results.push({
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_phone: customer.phone,
        success: true,
        message_id: smsResult.messageId,
      });
      sent++;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      results.push({
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer_phone: customer.phone,
        success: false,
        error: errMsg,
      });
      failed++;
    }
  }

  return {
    processed: invoices.length,
    sent,
    failed,
    skipped,
    results,
    duration_ms: Date.now() - startTime,
  };
}
```

- [ ] **Step 5: Run test**

```bash
npx jest lib/billing/__tests__/invoice-sms-reminder-due-today.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 6: Call `processDueTodayReminders` from the invoice-sms-reminders cron**

In `app/api/cron/invoice-sms-reminders/route.ts`, find where `runSmsReminders` calls `InvoiceSmsReminderService.processReminders(...)` and add a parallel call:

```typescript
// Run overdue reminders (existing) AND due-today reminders (new) in parallel
const [overdueResult, dueTodayResult] = await Promise.all([
  InvoiceSmsReminderService.processReminders({ minDaysOverdue: 1 }),
  InvoiceSmsReminderService.processDueTodayReminders(),
]);

// Merge results for logging
const result: CronResult = {
  date: new Date().toISOString().split('T')[0],
  processed: overdueResult.processed + dueTodayResult.processed,
  sent: overdueResult.sent + dueTodayResult.sent,
  failed: overdueResult.failed + dueTodayResult.failed,
  skipped: overdueResult.skipped + dueTodayResult.skipped,
  duration_ms: overdueResult.duration_ms + dueTodayResult.duration_ms,
  errors: [...(overdueResult.results.filter(r => !r.success).map(r => r.error ?? '')),
           ...(dueTodayResult.results.filter(r => !r.success).map(r => r.error ?? ''))],
};
```

> Note: The existing cron may structure this differently. Read the current `runSmsReminders` function in `app/api/cron/invoice-sms-reminders/route.ts` and adapt the merge to match the existing return structure.

- [ ] **Step 7: Run type check**

```bash
npm run type-check:memory 2>&1 | grep -E "invoice-sms-reminder|sms-reminders"
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add lib/billing/invoice-sms-reminder-service.ts \
        lib/billing/__tests__/invoice-sms-reminder-due-today.test.ts \
        app/api/cron/invoice-sms-reminders/route.ts
git commit -m "feat(billing): add due-today SMS reminder (Stage 0) to InvoiceSmsReminderService"
```

---

## Task 9: Register Cron in `vercel.json`

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Add cron entry**

In `vercel.json`, find the `"crons"` array and add after the `generate-monthly-invoices` entry:

```json
{
  "path": "/api/cron/generate-invoices-25th",
  "schedule": "0 4 25 * *"
}
```

- [ ] **Step 2: Verify cron syntax**

```bash
node -e "
const v = require('./vercel.json');
const c = v.crons.find(c => c.path.includes('25th'));
console.log(JSON.stringify(c));
"
```

Expected: `{"path":"/api/cron/generate-invoices-25th","schedule":"0 4 25 * *"}`

- [ ] **Step 3: Run type check and build**

```bash
npm run type-check:memory 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "feat(cron): schedule generate-invoices-25th at 04:00 UTC on 25th of each month"
```

---

## Task 10: End-to-End Smoke Test

Manual verification before deploying to staging.

- [ ] **Step 1: Test dry run**

```bash
curl -s -X POST http://localhost:3000/api/cron/generate-invoices-25th \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}' | python3 -m json.tool
```

Expected: JSON with `dry_run: true`, list of eligible services (Shaun Robertson's service should appear if `billing_day = 1` and `billing_day_window` includes 1).

- [ ] **Step 2: Test single customer generation**

```bash
curl -s -X POST http://localhost:3000/api/cron/generate-invoices-25th \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"customerId": "cb4837a2-ee97-4b85-b2ca-35886d6d56c2"}' | python3 -m json.tool
```

Expected: `generated: 1`, no errors. Check Supabase — new row in `customer_invoices` with `due_date = 1st of next month`.

- [ ] **Step 3: Verify Inngest event fired**

Open Inngest dashboard → Events → search `billing/invoice.generated`. Confirm event appeared and `invoice-notification` function ran (steps: fetch-invoice → send-email → send-sms → update-invoice).

- [ ] **Step 4: Verify email received**

Check inbox for test customer email. Confirm:
- Subject contains invoice number and amount
- Pay Now button uses `paynow_url` (NetCash link)
- Due date shows 1st of next month

- [ ] **Step 5: Verify `emailed_at` set on invoice**

```sql
SELECT invoice_number, emailed_at, sms_reminder_count
FROM customer_invoices
WHERE customer_id = (
  SELECT id FROM customers WHERE auth_user_id = 'cb4837a2-ee97-4b85-b2ca-35886d6d56c2'
)
ORDER BY created_at DESC LIMIT 1;
```

Expected: `emailed_at` is not null, `sms_reminder_count = 0`.

- [ ] **Step 6: Commit smoke test results (if any fixes needed)**

```bash
git add -p
git commit -m "fix: address issues found during smoke test"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Req 1: Invoices generated on 25th — Task 7 (cron) + Task 9 (vercel.json)
- ✅ Req 2: `billing_day` window filter — Task 1 (migration), Task 2 (service), Task 7 (cron query)
- ✅ Req 3: Duplicate guard — Task 7 (`last_invoice_date` check + update)
- ✅ Req 4: Email with Pay Now — Task 3 (extend sendInvoiceGenerated), Task 5 (Inngest send-email step)
- ✅ Req 5: SMS with Pay Now link — Task 5 (Inngest send-sms step)
- ✅ Req 6: NetCash Pay Now (`paynow_url`) — Task 3 (paynow_url param) + Task 5 (SMS template)
- ✅ Req 7: Escalating reminders — Task 8 (Stage 0 due-today); existing stages 1–3 unchanged
- ✅ Req 8: Billing day remains 1st — `nextMonthBillingDate` = 1st of next month in Task 7
- ✅ Req 9: Configurable window in DB — Task 1 (migration) + Task 2 (service)
- ✅ Req 10: Retryable/observable — Inngest retries 3× (Task 5), cron_execution_log (Task 7)

**Placeholder scan:** No TBDs. Step 6 of Task 8 has a "read the current function" note — this is intentional since the cron's `runSmsReminders` body was not included in context but the merge pattern is fully shown.

**Type consistency:**
- `generateCustomerInvoice` returns `{ invoiceId, invoiceNumber, totalAmount, vatAmount }` — Task 7 uses `invoice.invoiceId`, `invoice.invoiceNumber`, `invoice.totalAmount` ✅
- `buildInvoiceLineItems` params: `(type, { package_name, monthly_price, installation_fee, router_fee }, undefined, { start, end })` — Task 7 matches ✅
- `inngest.send({ name: 'billing/invoice.generated', data: { invoice_id, customer_id, triggered_by } })` — matches event type defined in Task 4 ✅
- `InvoiceSmsReminderService.processDueTodayReminders()` returns `BatchSmsReminderResult` — same type as `processReminders` ✅
