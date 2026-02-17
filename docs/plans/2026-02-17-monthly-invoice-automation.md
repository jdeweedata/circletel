# Monthly Invoice Automation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-generate monthly invoices, sync to ZOHO Books, and send Pay Now links via Email + SMS.

**Architecture:** Single cron job on 1st of month queries active services, generates invoices, syncs to ZOHO via existing `invoice-sync-service`, then sends notifications via existing `paynow-billing-service`.

**Tech Stack:** Next.js 15 API routes, Supabase, ZOHO Billing API, NetCash Pay Now, Resend (email), Clickatell (SMS)

**Test Customer:**
- ID: `cb4837a2-ee97-4b85-b2ca-35886d6d56c2`
- Name: Shaun Robertson
- Email: shaunr07@gmail.com
- Phone: 0826574256

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260217000001_add_billing_columns.sql`

**Step 1: Create migration file**

```sql
-- Add billing columns to customer_services for monthly invoice generation
-- billing_day: Day of month to generate invoice (1-28)
-- last_invoice_date: Prevents duplicate billing in same month

ALTER TABLE customer_services
ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 1
CHECK (billing_day >= 1 AND billing_day <= 28);

ALTER TABLE customer_services
ADD COLUMN IF NOT EXISTS last_invoice_date DATE;

-- Add service_id to customer_invoices for tracking which service was billed
ALTER TABLE customer_invoices
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES customer_services(id);

-- Index for efficient billing queries
CREATE INDEX IF NOT EXISTS idx_customer_services_billing
ON customer_services(status, billing_day)
WHERE status = 'active';

COMMENT ON COLUMN customer_services.billing_day IS 'Day of month (1-28) to generate invoice';
COMMENT ON COLUMN customer_services.last_invoice_date IS 'Date of last invoice to prevent duplicate billing';
COMMENT ON COLUMN customer_invoices.service_id IS 'The service this invoice was generated for';
```

**Step 2: Apply migration**

Run: `npx supabase db push` or apply via Supabase MCP tool

Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add supabase/migrations/20260217000001_add_billing_columns.sql
git commit -m "feat(db): add billing_day and last_invoice_date columns for monthly invoicing"
```

---

## Task 2: Create Monthly Invoice Generator Service

**Files:**
- Create: `lib/billing/monthly-invoice-generator.ts`

**Step 1: Create the service file**

```typescript
/**
 * Monthly Invoice Generator Service
 *
 * Generates invoices for active customer services on their billing day.
 * Integrates with:
 * - ZOHO Billing (invoice sync)
 * - NetCash Pay Now (payment links)
 * - Resend (email notifications)
 * - Clickatell (SMS notifications)
 *
 * @see docs/plans/2026-02-17-monthly-invoice-automation-design.md
 */

import { createClient } from '@supabase/supabase-js';
import { syncInvoiceToZohoBilling } from '@/lib/integrations/zoho/invoice-sync-service';
import { processPayNowForInvoice } from '@/lib/billing/paynow-billing-service';
import { billingLogger } from '@/lib/logging';

// =============================================================================
// TYPES
// =============================================================================

export interface ServiceToBill {
  id: string;
  customer_id: string;
  package_id: string;
  monthly_price: number;
  billing_day: number;
  last_invoice_date: string | null;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    account_number: string | null;
    zoho_billing_customer_id: string | null;
  };
  package: {
    id: string;
    name: string;
    description: string | null;
    price: number;
  };
}

export interface InvoiceGenerationResult {
  serviceId: string;
  customerId: string;
  customerName: string;
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  amount?: number;
  zohoSynced: boolean;
  zohoInvoiceId?: string;
  emailSent: boolean;
  smsSent: boolean;
  errors: string[];
  skipped?: boolean;
  skipReason?: string;
}

export interface MonthlyBillingResult {
  runDate: string;
  billingDay: number;
  dryRun: boolean;
  servicesFound: number;
  servicesProcessed: number;
  invoicesCreated: number;
  zohoSynced: number;
  emailsSent: number;
  smsSent: number;
  failed: number;
  skipped: number;
  results: InvoiceGenerationResult[];
}

// =============================================================================
// MONTHLY INVOICE GENERATOR
// =============================================================================

export class MonthlyInvoiceGenerator {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  /**
   * Main entry point: Generate invoices for all services due on billing day
   */
  async generateMonthlyInvoices(options: {
    dryRun?: boolean;
    billingDay?: number;
    customerId?: string; // For testing single customer
  } = {}): Promise<MonthlyBillingResult> {
    const {
      dryRun = false,
      billingDay = new Date().getDate(),
      customerId,
    } = options;

    const runDate = new Date().toISOString();

    billingLogger.info('Monthly invoice generation started', {
      runDate,
      billingDay,
      dryRun,
      customerId: customerId || 'all',
    });

    // 1. Get services due for billing
    const services = await this.getServicesDueForBilling(billingDay, customerId);

    billingLogger.info(`Found ${services.length} services due for billing`);

    if (dryRun) {
      // Return preview without processing
      return this.buildDryRunResult(services, runDate, billingDay);
    }

    // 2. Process each service
    const results: InvoiceGenerationResult[] = [];

    for (const service of services) {
      try {
        const result = await this.processServiceBilling(service);
        results.push(result);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          serviceId: service.id,
          customerId: service.customer_id,
          customerName: this.getCustomerName(service.customer),
          success: false,
          zohoSynced: false,
          emailSent: false,
          smsSent: false,
          errors: [errorMsg],
        });
      }
    }

    // 3. Build and log summary
    const summary = this.buildResult(results, runDate, billingDay, dryRun);

    // 4. Log to billing_cron_logs
    await this.logBillingRun(summary);

    billingLogger.info('Monthly invoice generation completed', {
      servicesProcessed: summary.servicesProcessed,
      invoicesCreated: summary.invoicesCreated,
      failed: summary.failed,
    });

    return summary;
  }

  /**
   * Get active services due for billing on the given day
   */
  private async getServicesDueForBilling(
    billingDay: number,
    customerId?: string
  ): Promise<ServiceToBill[]> {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    const firstOfMonthStr = firstOfMonth.toISOString().split('T')[0];

    let query = this.supabase
      .from('customer_services')
      .select(`
        id,
        customer_id,
        package_id,
        monthly_price,
        billing_day,
        last_invoice_date,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          account_number,
          zoho_billing_customer_id
        ),
        package:service_packages(
          id,
          name,
          description,
          price
        )
      `)
      .eq('status', 'active')
      .eq('billing_day', billingDay)
      .or(`last_invoice_date.is.null,last_invoice_date.lt.${firstOfMonthStr}`);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      billingLogger.error('Failed to fetch services for billing', { error: error.message });
      throw new Error(`Failed to fetch services: ${error.message}`);
    }

    // Handle Supabase join returning arrays
    return (data || []).map(service => ({
      ...service,
      customer: Array.isArray(service.customer) ? service.customer[0] : service.customer,
      package: Array.isArray(service.package) ? service.package[0] : service.package,
    })) as ServiceToBill[];
  }

  /**
   * Process billing for a single service
   */
  private async processServiceBilling(service: ServiceToBill): Promise<InvoiceGenerationResult> {
    const customerName = this.getCustomerName(service.customer);
    const errors: string[] = [];

    billingLogger.info(`Processing billing for ${customerName}`, {
      serviceId: service.id,
      package: service.package?.name,
      amount: service.monthly_price,
    });

    // 1. Check for existing invoice this month (duplicate prevention)
    const existingInvoice = await this.checkExistingInvoice(service.id);
    if (existingInvoice) {
      return {
        serviceId: service.id,
        customerId: service.customer_id,
        customerName,
        success: true,
        zohoSynced: false,
        emailSent: false,
        smsSent: false,
        errors: [],
        skipped: true,
        skipReason: `Already billed this month (Invoice: ${existingInvoice})`,
      };
    }

    // 2. Generate invoice
    const invoice = await this.createInvoice(service);
    if (!invoice) {
      return {
        serviceId: service.id,
        customerId: service.customer_id,
        customerName,
        success: false,
        zohoSynced: false,
        emailSent: false,
        smsSent: false,
        errors: ['Failed to create invoice'],
      };
    }

    // 3. Sync to ZOHO
    let zohoSynced = false;
    let zohoInvoiceId: string | undefined;

    try {
      const zohoResult = await syncInvoiceToZohoBilling(invoice.id);
      if (zohoResult.success) {
        zohoSynced = true;
        zohoInvoiceId = zohoResult.zoho_invoice_id;
      } else {
        errors.push(`ZOHO sync failed: ${zohoResult.error}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown ZOHO error';
      errors.push(`ZOHO sync error: ${errorMsg}`);
    }

    // 4. Send Pay Now + notifications
    let emailSent = false;
    let smsSent = false;

    try {
      const notifyResult = await processPayNowForInvoice(invoice.id, {
        sendEmail: true,
        sendSms: true,
        smsTemplate: 'paymentDue',
      });

      emailSent = notifyResult.notificationResult?.emailSent || false;
      smsSent = notifyResult.notificationResult?.smsSent || false;

      if (notifyResult.errors.length > 0) {
        errors.push(...notifyResult.errors);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown notification error';
      errors.push(`Notification error: ${errorMsg}`);
    }

    // 5. Update last_invoice_date
    await this.updateLastInvoiceDate(service.id);

    return {
      serviceId: service.id,
      customerId: service.customer_id,
      customerName,
      success: errors.length === 0,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.total_amount,
      zohoSynced,
      zohoInvoiceId,
      emailSent,
      smsSent,
      errors,
    };
  }

  /**
   * Check if invoice already exists for this service this month
   */
  private async checkExistingInvoice(serviceId: string): Promise<string | null> {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const { data } = await this.supabase
      .from('customer_invoices')
      .select('invoice_number')
      .eq('service_id', serviceId)
      .gte('invoice_date', firstOfMonth.toISOString().split('T')[0])
      .limit(1)
      .single();

    return data?.invoice_number || null;
  }

  /**
   * Create invoice in customer_invoices table
   */
  private async createInvoice(service: ServiceToBill): Promise<{
    id: string;
    invoice_number: string;
    total_amount: number;
  } | null> {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    const amount = service.monthly_price || service.package?.price || 0;
    const packageName = service.package?.name || 'Internet Service';
    const packageDesc = service.package?.description || 'Monthly subscription';

    const lineItems = [
      {
        description: packageName,
        quantity: 1,
        unit_price: amount,
        amount: amount,
        type: 'recurring',
      },
    ];

    const { data, error } = await this.supabase
      .from('customer_invoices')
      .insert({
        customer_id: service.customer_id,
        service_id: service.id,
        invoice_type: 'recurring',
        invoice_date: today.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal: amount,
        vat_amount: 0, // VAT inclusive
        total_amount: amount,
        line_items: lineItems,
        status: 'unpaid',
        notes: `Monthly subscription - ${packageName}`,
        zoho_sync_status: 'pending',
      })
      .select('id, invoice_number, total_amount')
      .single();

    if (error) {
      billingLogger.error('Failed to create invoice', {
        serviceId: service.id,
        error: error.message,
      });
      return null;
    }

    billingLogger.info('Invoice created', {
      invoiceId: data.id,
      invoiceNumber: data.invoice_number,
      amount: data.total_amount,
    });

    return data;
  }

  /**
   * Update last_invoice_date on the service
   */
  private async updateLastInvoiceDate(serviceId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await this.supabase
      .from('customer_services')
      .update({ last_invoice_date: today })
      .eq('id', serviceId);
  }

  /**
   * Log billing run to audit table
   */
  private async logBillingRun(summary: MonthlyBillingResult): Promise<void> {
    try {
      await this.supabase.from('billing_cron_logs').insert({
        cron_type: 'monthly_invoice_generation',
        run_date: summary.runDate,
        services_processed: summary.servicesProcessed,
        invoices_created: summary.invoicesCreated,
        zoho_synced: summary.zohoSynced,
        emails_sent: summary.emailsSent,
        sms_sent: summary.smsSent,
        failed: summary.failed,
        skipped: summary.skipped,
        dry_run: summary.dryRun,
        details: summary.results,
      });
    } catch (error) {
      billingLogger.error('Failed to log billing run', { error });
    }
  }

  /**
   * Build dry run preview result
   */
  private buildDryRunResult(
    services: ServiceToBill[],
    runDate: string,
    billingDay: number
  ): MonthlyBillingResult {
    return {
      runDate,
      billingDay,
      dryRun: true,
      servicesFound: services.length,
      servicesProcessed: 0,
      invoicesCreated: 0,
      zohoSynced: 0,
      emailsSent: 0,
      smsSent: 0,
      failed: 0,
      skipped: 0,
      results: services.map(service => ({
        serviceId: service.id,
        customerId: service.customer_id,
        customerName: this.getCustomerName(service.customer),
        success: true,
        amount: service.monthly_price || service.package?.price,
        zohoSynced: false,
        emailSent: false,
        smsSent: false,
        errors: [],
        skipped: false,
      })),
    };
  }

  /**
   * Build final result summary
   */
  private buildResult(
    results: InvoiceGenerationResult[],
    runDate: string,
    billingDay: number,
    dryRun: boolean
  ): MonthlyBillingResult {
    return {
      runDate,
      billingDay,
      dryRun,
      servicesFound: results.length,
      servicesProcessed: results.filter(r => !r.skipped).length,
      invoicesCreated: results.filter(r => r.invoiceId && !r.skipped).length,
      zohoSynced: results.filter(r => r.zohoSynced).length,
      emailsSent: results.filter(r => r.emailSent).length,
      smsSent: results.filter(r => r.smsSent).length,
      failed: results.filter(r => !r.success && !r.skipped).length,
      skipped: results.filter(r => r.skipped).length,
      results,
    };
  }

  /**
   * Helper: Get customer display name
   */
  private getCustomerName(customer: ServiceToBill['customer'] | null): string {
    if (!customer) return 'Unknown Customer';
    const name = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    return name || customer.email || 'Unknown Customer';
  }
}

// =============================================================================
// CONVENIENCE EXPORT
// =============================================================================

export const monthlyInvoiceGenerator = new MonthlyInvoiceGenerator();
```

**Step 2: Run type check**

Run: `npm run type-check:memory 2>&1 | grep -E "(error|monthly-invoice)" | head -20`

Expected: No errors for this file (may see existing project errors)

**Step 3: Commit**

```bash
git add lib/billing/monthly-invoice-generator.ts
git commit -m "feat(billing): add monthly invoice generator service"
```

---

## Task 3: Create Cron API Endpoint

**Files:**
- Create: `app/api/cron/generate-monthly-invoices/route.ts`

**Step 1: Create the cron endpoint**

```typescript
/**
 * Monthly Invoice Generation Cron
 *
 * Runs on 1st of month at 06:00 SAST (04:00 UTC)
 * Generates invoices for all active services, syncs to ZOHO, sends Pay Now notifications
 *
 * Test modes:
 * - POST { "dryRun": true } - Preview what would be billed
 * - POST { "customerId": "xxx" } - Bill single customer
 * - POST { "billingDay": 15 } - Override billing day
 *
 * @see docs/plans/2026-02-17-monthly-invoice-automation-design.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { MonthlyInvoiceGenerator } from '@/lib/billing/monthly-invoice-generator';
import { cronLogger } from '@/lib/logging';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow if no secret configured (dev mode) or if secret matches
  if (!cronSecret) {
    cronLogger.warn('CRON_SECRET not configured - allowing request');
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization
    if (!verifyCronSecret(request)) {
      cronLogger.warn('Unauthorized cron request attempted');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const {
      dryRun = false,
      billingDay,
      customerId,
    } = body as {
      dryRun?: boolean;
      billingDay?: number;
      customerId?: string;
    };

    cronLogger.info('Monthly invoice generation cron started', {
      dryRun,
      billingDay,
      customerId: customerId || 'all',
    });

    // Run invoice generation
    const generator = new MonthlyInvoiceGenerator();
    const result = await generator.generateMonthlyInvoices({
      dryRun,
      billingDay,
      customerId,
    });

    const duration = Date.now() - startTime;

    cronLogger.info('Monthly invoice generation cron completed', {
      duration: `${duration}ms`,
      servicesProcessed: result.servicesProcessed,
      invoicesCreated: result.invoicesCreated,
      failed: result.failed,
    });

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...result,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    cronLogger.error('Monthly invoice generation cron failed', {
      duration: `${duration}ms`,
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel cron (cron jobs use GET by default)
export async function GET(request: NextRequest) {
  // Convert GET to POST with empty body for cron execution
  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === 'true';

  // Create a mock request with the dryRun parameter
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ dryRun }),
  });

  return POST(mockRequest);
}
```

**Step 2: Run type check**

Run: `npm run type-check:memory 2>&1 | grep -E "(error|generate-monthly)" | head -20`

Expected: No errors

**Step 3: Commit**

```bash
git add app/api/cron/generate-monthly-invoices/route.ts
git commit -m "feat(api): add monthly invoice generation cron endpoint"
```

---

## Task 4: Add Vercel Cron Configuration

**Files:**
- Modify: `vercel.json`

**Step 1: Check current vercel.json**

Read the file to see existing crons configuration.

**Step 2: Add the new cron entry**

Add to the `crons` array:

```json
{
  "path": "/api/cron/generate-monthly-invoices",
  "schedule": "0 4 1 * *"
}
```

Note: `0 4 1 * *` = 04:00 UTC on 1st of month = 06:00 SAST

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat(vercel): add monthly invoice generation cron schedule"
```

---

## Task 5: Create Billing Cron Logs Table

**Files:**
- Create: `supabase/migrations/20260217000002_add_billing_cron_logs.sql`

**Step 1: Create migration**

```sql
-- Billing cron audit log table
CREATE TABLE IF NOT EXISTS billing_cron_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_type TEXT NOT NULL,
  run_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  services_processed INTEGER DEFAULT 0,
  invoices_created INTEGER DEFAULT 0,
  zoho_synced INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  dry_run BOOLEAN DEFAULT FALSE,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent runs
CREATE INDEX IF NOT EXISTS idx_billing_cron_logs_run_date
ON billing_cron_logs(run_date DESC);

CREATE INDEX IF NOT EXISTS idx_billing_cron_logs_cron_type
ON billing_cron_logs(cron_type, run_date DESC);

COMMENT ON TABLE billing_cron_logs IS 'Audit log for billing cron jobs';
```

**Step 2: Apply migration**

Run via Supabase MCP or `npx supabase db push`

**Step 3: Commit**

```bash
git add supabase/migrations/20260217000002_add_billing_cron_logs.sql
git commit -m "feat(db): add billing_cron_logs audit table"
```

---

## Task 6: Manual Testing

**Step 1: Test dry run**

```bash
curl -X POST http://localhost:3000/api/cron/generate-monthly-invoices \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

Expected: JSON response with services that would be billed

**Step 2: Test single customer (Shaun)**

```bash
curl -X POST http://localhost:3000/api/cron/generate-monthly-invoices \
  -H "Content-Type: application/json" \
  -d '{"customerId": "cb4837a2-ee97-4b85-b2ca-35886d6d56c2", "dryRun": false}'
```

Expected:
- Invoice created in `customer_invoices`
- Invoice synced to ZOHO Books
- Email sent to shaunr07@gmail.com
- SMS sent to 0826574256

**Step 3: Verify in Supabase**

```sql
SELECT * FROM customer_invoices
WHERE customer_id = 'cb4837a2-ee97-4b85-b2ca-35886d6d56c2'
ORDER BY created_at DESC
LIMIT 1;
```

**Step 4: Verify in ZOHO Books**

Log into ZOHO Books and check for the new invoice under the customer.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(billing): complete monthly invoice automation

- Database migrations for billing columns
- Monthly invoice generator service
- Cron endpoint with dry run support
- Billing cron audit logs

Closes #XXX"
```

---

## Verification Checklist

- [ ] Migration applied: `billing_day` and `last_invoice_date` columns exist
- [ ] Migration applied: `billing_cron_logs` table exists
- [ ] Type check passes: `npm run type-check:memory`
- [ ] Dry run works: Returns preview of services to bill
- [ ] Single customer test: Invoice created, ZOHO synced, notifications sent
- [ ] Email received with Pay Now link
- [ ] SMS received with short Pay Now link
- [ ] Pay Now link works (shows correct amount)
- [ ] Duplicate prevention: Running again skips already-billed services
- [ ] Cron logged to `billing_cron_logs`
