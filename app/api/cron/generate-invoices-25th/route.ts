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
import { inngest } from '@/lib/inngest/client';
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
  monthly_price: number;
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
    cronLogger.warn('[GenerateInvoices25th] CRON_SECRET not configured — allowing request (dev mode)');
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
      trigger_source: 'vercel_cron',
      environment: process.env.NODE_ENV || 'production',
    });
  } catch (err) {
    cronLogger.error('[GenerateInvoices25th] Failed to write cron_execution_log', {
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

    // Calculate dates
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // period covers the NEXT month (invoiced on 25th, billed on 1st of next month)
    const periodStart = new Date(currentYear, currentMonth + 1, 1).toISOString().split('T')[0];
    const periodEnd = new Date(currentYear, currentMonth + 2, 0).toISOString().split('T')[0];
    const billingDate = new Date(currentYear, currentMonth + 1, 1).toISOString().split('T')[0]; // due date = 1st of next month

    // Duplicate guard: skip services that already have last_invoice_date >= 24th of this month
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = (query as any).eq('customer_id', customerId);
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
        due_date: billingDate,
        services: services.map((s) => {
          const svc = s as unknown as ServiceRecord;
          return {
            service_id: svc.id,
            customer_id: svc.customer_id,
            billing_day: svc.billing_day,
            monthly_price: svc.monthly_price,
            last_invoice_date: svc.last_invoice_date,
          };
        }),
      });
    }

    // Process each service
    for (const rawService of services) {
      const service = rawService as unknown as ServiceRecord;
      service.customer = Array.isArray(rawService.customer)
        ? rawService.customer[0]
        : (rawService.customer as ServiceRecord['customer']);

      try {
        // Build line items
        const lineItems = buildInvoiceLineItems(
          'recurring',
          {
            package_name: service.package_name,
            monthly_price: typeof service.monthly_price === 'string'
              ? parseFloat(service.monthly_price)
              : service.monthly_price,
            installation_fee: 0,
            router_fee: 0,
          },
          undefined,
          { start: periodStart, end: periodEnd }
        );

        // Generate invoice — invoice_date = 25th (today), due_date = 1st of next month
        const invoice = await generateCustomerInvoice({
          customer_id: service.customer_id,
          service_id: service.id,
          invoice_type: 'recurring',
          line_items: lineItems,
          period_start: periodStart,
          period_end: periodEnd,
          billing_date: billingDate,
          invoice_days_before_billing: 6,
        });

        // Mark service as invoiced this cycle
        await supabase
          .from('customer_services')
          .update({ last_invoice_date: now.toISOString().split('T')[0] })
          .eq('id', service.id);

        // Update customer account balance
        await BillingService.updateAccountBalance(
          service.customer_id,
          invoice.total_amount,
          `Invoice ${invoice.invoice_number} generated`
        );

        // Fire Inngest event — invoice-notification handles email + SMS
        await inngest.send({
          name: 'billing/invoice.generated',
          data: {
            invoice_id: invoice.invoice_id,
            customer_id: service.customer_id,
            triggered_by: 'cron' as const,
          },
        });

        cronLogger.info(
          `[GenerateInvoices25th] Generated ${invoice.invoice_number} for service ${service.id}`
        );
        recordsProcessed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        cronLogger.error(
          `[GenerateInvoices25th] Failed for service ${service.id}`,
          { error: msg }
        );
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

    cronLogger.info(
      `[GenerateInvoices25th] Complete: ${recordsProcessed} generated, ${recordsFailed} failed, ${recordsSkipped} skipped`
    );

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

    return NextResponse.json(
      { error: 'Invoice generation failed', details: msg },
      { status: 500 }
    );
  }
}
