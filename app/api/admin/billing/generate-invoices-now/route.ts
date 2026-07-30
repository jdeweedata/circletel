/**
 * Admin Manual Invoice Generation API
 * POST /api/admin/billing/generate-invoices-now
 *
 * Phase 1b: sole generate path via billingEngine.generateRecurring
 * (delegate → MonthlyInvoiceGenerator). Replaces BillingService / invoice-generator dual path.
 */

import { NextRequest, NextResponse } from 'next/server';
import { billingEngine } from '@/lib/billing/engine';
import { apiLogger } from '@/lib/logging';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

/**
 * Body:
 * {
 *   dryRun?: boolean
 *   billingDay?: number  // default: today
 *   customer_id?: string // optional single customer
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const body = await request.json().catch(() => ({}));
    const dryRun = Boolean(body.dryRun);
    const billingDay =
      typeof body.billingDay === 'number'
        ? body.billingDay
        : new Date().getDate();
    const customerId =
      typeof body.customer_id === 'string' ? body.customer_id : undefined;

    // service_ids not supported on sole MonthlyInvoiceGenerator path — refuse rather than widen scope
    if (body.service_ids && Array.isArray(body.service_ids) && body.service_ids.length > 0) {
      return NextResponse.json(
        {
          error:
            'service_ids is not supported; pass customer_id for a single customer, or omit for all services due today',
        },
        { status: 400 }
      );
    }

    const result = await billingEngine.generateRecurring(
      {
        dryRun,
        billingDay,
        customerId,
      },
      {
        source: 'admin',
        user_id: authResult.adminUser.id,
        user_email: authResult.adminUser.email || undefined,
        user_role: authResult.adminUser.role,
      }
    );

    return NextResponse.json({
      message: `Invoice generation completed: ${result.summary.successful} generated, ${result.summary.failed} failed, ${result.summary.skipped} skipped`,
      generated: result.summary.successful,
      failed: result.summary.failed,
      skipped: result.summary.skipped,
      dryRun: result.dryRun,
      billingDay: result.billingDay,
      runId: result.runId,
      invoices: result.results
        .filter((r) => r.success)
        .map((r) => ({
          service_id: r.serviceId,
          invoice_number: r.invoiceNumber,
          total_amount: r.amount,
          customer_id: r.customerId,
          invoice_id: r.invoiceId,
        })),
      results: result.results,
      errors: result.results
        .filter((r) => !r.success)
        .flatMap((r) => r.errors.map((e) => `Service ${r.serviceId}: ${e}`)),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('generate-invoices-now failed', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
