/**
 * PayNow Reconciliation Cron Job
 *
 * Runs daily at 09:00 SAST (07:00 UTC) to catch missed webhook payments.
 * Fetches the previous day's NetCash statement and matches PayNow transactions
 * (Ozow, Card, EFT, Instant EFT) to open invoices using the invoice matcher.
 *
 * Vercel Cron: 0 7 * * * (07:00 UTC = 09:00 SAST)
 *
 * Why this exists:
 * - Netcash PayNow webhooks can fail or be delayed
 * - This job provides a daily safety net to catch any missed payments
 * - Idempotent: skips transactions already recorded in payment_transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { netcashStatementService } from '@/lib/payments/netcash-statement-service';
import { matchInvoiceByReference } from '@/lib/billing/invoice-matcher';
import { syncPaymentToZohoBilling } from '@/lib/integrations/zoho/payment-sync-service';
import { cronLogger } from '@/lib/logging';
import { inngest } from '@/lib/inngest';
import { v4 as uuidv4 } from 'uuid';

// Vercel cron configuration
export const runtime = 'nodejs';
export const maxDuration = 60;

// PayNow-relevant transaction codes from the NetCash statement
// These are credit entries representing PayNow gateway collections
const PAYNOW_TRANSACTION_CODES = new Set([
  'EFT',  // EFT / Instant EFT
  'CRD',  // Card payment
  'OZW',  // Ozow instant EFT
  'INS',  // Instant payment
  'PNW',  // Pay Now generic
  'WEB',  // Web payment
  'ONL',  // Online payment
]);

export interface PayNowReconciliationResult {
  date: string;
  statementFetched: boolean;
  totalPayNowTransactions: number;
  matched: number;
  alreadyRecorded: number;
  invoiceUpdated: number;
  zohoSynced: number;
  noInvoiceFound: number;
  errors: string[];
  durationMs: number;
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * GET handler — called by Vercel Cron scheduler.
 * Triggers the Inngest function instead of running directly, so the job
 * benefits from retries, step durability, and the Inngest dashboard.
 * Secured via CRON_SECRET header.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const processLogId = uuidv4();

    await inngest.send({
      name: 'paynow/reconciliation.requested',
      data: {
        triggered_by: 'cron',
        process_log_id: processLogId,
      },
    });

    cronLogger.info('[PayNowRecon] Reconciliation triggered via Inngest', {
      processLogId,
    });

    return NextResponse.json({
      message: 'PayNow reconciliation triggered',
      process_log_id: processLogId,
    });
  } catch (error) {
    cronLogger.error('[PayNowRecon] Failed to trigger Inngest function', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: 'Failed to trigger PayNow reconciliation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler — manual trigger with optional custom date and dry-run support.
 * Body: { date?: "YYYY-MM-DD", dryRun?: boolean }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request
      .json()
      .catch(() => ({})) as { date?: string; dryRun?: boolean };

    const processLogId = uuidv4();

    await inngest.send({
      name: 'paynow/reconciliation.requested',
      data: {
        triggered_by: 'manual',
        process_log_id: processLogId,
        ...(body.date ? { reconciliation_date: body.date } : {}),
        ...(body.dryRun !== undefined
          ? { options: { dryRun: body.dryRun } }
          : {}),
      },
    });

    cronLogger.info(
      '[PayNowRecon] Manual reconciliation triggered via Inngest',
      { processLogId, date: body.date, dryRun: body.dryRun }
    );

    return NextResponse.json({
      message: 'PayNow reconciliation triggered',
      process_log_id: processLogId,
    });
  } catch (error) {
    cronLogger.error(
      '[PayNowRecon] Failed to trigger manual Inngest function',
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
    return NextResponse.json(
      {
        error: 'Failed to trigger PayNow reconciliation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// CORE RECONCILIATION LOGIC
// ============================================================================

/**
 * Main reconciliation function.
 *
 * @param customDate - Override the reconciliation date (defaults to yesterday)
 */
export async function runPayNowReconciliation(
  customDate?: Date
): Promise<PayNowReconciliationResult> {
  const startedAt = Date.now();
  const supabase = await createClient();

  // Default to yesterday — statements are available from 08:30 SAST for the previous day
  const reconciliationDate = customDate ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dateStr = reconciliationDate.toISOString().split('T')[0];

  cronLogger.info('[PayNowRecon] Starting PayNow reconciliation', { date: dateStr });

  const result: PayNowReconciliationResult = {
    date: dateStr,
    statementFetched: false,
    totalPayNowTransactions: 0,
    matched: 0,
    alreadyRecorded: 0,
    invoiceUpdated: 0,
    zohoSynced: 0,
    noInvoiceFound: 0,
    errors: [],
    durationMs: 0,
  };

  // ── 1. Fetch NetCash statement ──────────────────────────────────────────────

  let statement;
  try {
    statement = await netcashStatementService.getStatement(reconciliationDate);
  } catch (error) {
    const msg = `Failed to fetch NetCash statement: ${error instanceof Error ? error.message : String(error)}`;
    cronLogger.error('[PayNowRecon] ' + msg);
    result.errors.push(msg);
    result.durationMs = Date.now() - startedAt;
    await logCronExecution(supabase, result, dateStr);
    return result;
  }

  if (!statement.success) {
    const msg = `NetCash statement not available: ${statement.error ?? 'Unknown error'}`;
    cronLogger.warn('[PayNowRecon] ' + msg);
    result.errors.push(msg);
    result.durationMs = Date.now() - startedAt;
    await logCronExecution(supabase, result, dateStr);
    return result;
  }

  result.statementFetched = true;
  cronLogger.info('[PayNowRecon] Statement fetched', {
    totalTransactions: statement.transactions.length,
  });

  // ── 2. Filter to PayNow credit transactions ─────────────────────────────────
  // Credit entries (effect '+') with PayNow-related transaction codes represent
  // successful PayNow gateway collections that may have missed the webhook.

  const payNowTransactions = statement.transactions.filter((tx) => {
    // Only credits (money coming in)
    if (tx.effect !== '+') return false;

    // Match PayNow-specific codes, or fall back to description-based heuristics
    const isPayNowCode = PAYNOW_TRANSACTION_CODES.has(tx.transactionCode);
    const hasPayNowDescription =
      tx.description?.toLowerCase().includes('paynow') ||
      tx.description?.toLowerCase().includes('ozow') ||
      tx.description?.toLowerCase().includes('online') ||
      tx.description?.toLowerCase().includes('web payment');

    return isPayNowCode || hasPayNowDescription;
  });

  result.totalPayNowTransactions = payNowTransactions.length;
  cronLogger.info('[PayNowRecon] PayNow transactions identified', {
    count: payNowTransactions.length,
  });

  if (payNowTransactions.length === 0) {
    cronLogger.info('[PayNowRecon] No PayNow transactions to reconcile');
    result.durationMs = Date.now() - startedAt;
    await logCronExecution(supabase, result, dateStr);
    return result;
  }

  // ── 3. Process each PayNow transaction ─────────────────────────────────────

  for (const tx of payNowTransactions) {
    const reference = tx.accountReference ?? tx.reference ?? tx.description;
    if (!reference) {
      result.errors.push(`Transaction with no reference skipped: ${JSON.stringify(tx)}`);
      continue;
    }

    try {
      // ── 3a. Idempotency check — skip if already recorded ──────────────────
      const { data: existing } = await supabase
        .from('payment_transactions')
        .select('id')
        .eq('provider_reference', reference)
        .maybeSingle();

      if (existing) {
        cronLogger.debug('[PayNowRecon] Transaction already recorded, skipping', { reference });
        result.alreadyRecorded++;
        continue;
      }

      // ── 3b. Match reference to an invoice ────────────────────────────────
      const matchResult = await matchInvoiceByReference(reference, supabase);

      if (!matchResult.matched || !matchResult.invoice) {
        cronLogger.warn('[PayNowRecon] No invoice found for reference', { reference });
        result.noInvoiceFound++;
        continue;
      }

      result.matched++;
      const invoice = matchResult.invoice;

      // Skip invoices already paid
      if (invoice.status === 'paid') {
        cronLogger.debug('[PayNowRecon] Invoice already paid, skipping', {
          invoiceId: invoice.id,
          reference,
        });
        result.alreadyRecorded++;
        continue;
      }

      // ── 3c. Create payment_transactions record ────────────────────────────
      const now = new Date().toISOString();
      const { data: paymentRecord, error: insertError } = await supabase
        .from('payment_transactions')
        .insert({
          invoice_id: invoice.id,
          transaction_id: `PAYNOW-RECON-${reference}-${dateStr}`,
          provider_reference: reference,
          amount: tx.amount,
          currency: 'ZAR',
          payment_method: 'paynow',
          status: 'completed',
          netcash_reference: reference,
          netcash_response: tx,
          webhook_received_at: null,
          completed_at: now,
        })
        .select('id')
        .single();

      if (insertError) {
        const msg = `Failed to create payment record for ${reference}: ${insertError.message}`;
        cronLogger.error('[PayNowRecon] ' + msg);
        result.errors.push(msg);
        continue;
      }

      // ── 3d. Update invoice status to paid ─────────────────────────────────
      const { error: invoiceError } = await supabase
        .from('customer_invoices')
        .update({
          status: 'paid',
          amount_paid: tx.amount,
          paid_at: now,
          payment_method: 'paynow',
          payment_reference: reference,
          updated_at: now,
        })
        .eq('id', invoice.id);

      if (invoiceError) {
        const msg = `Failed to update invoice ${invoice.invoice_number}: ${invoiceError.message}`;
        cronLogger.error('[PayNowRecon] ' + msg);
        result.errors.push(msg);
        continue;
      }

      result.invoiceUpdated++;
      cronLogger.info('[PayNowRecon] Invoice marked as paid via reconciliation', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        reference,
        amount: tx.amount,
        matchMethod: matchResult.matchMethod,
      });

      // ── 3e. Sync payment to Zoho Billing ──────────────────────────────────
      if (paymentRecord?.id) {
        try {
          const zohoResult = await syncPaymentToZohoBilling(paymentRecord.id);
          if (zohoResult.success) {
            result.zohoSynced++;
            cronLogger.info('[PayNowRecon] Payment synced to Zoho', {
              paymentId: paymentRecord.id,
              zohoPaymentId: zohoResult.zoho_payment_id,
            });
          } else {
            cronLogger.warn('[PayNowRecon] Zoho sync failed (non-fatal)', {
              paymentId: paymentRecord.id,
              error: zohoResult.error,
            });
          }
        } catch (zohoError) {
          // Zoho sync failure is non-fatal — invoice is already updated locally
          cronLogger.warn('[PayNowRecon] Zoho sync threw error (non-fatal)', {
            paymentId: paymentRecord.id,
            error: zohoError instanceof Error ? zohoError.message : String(zohoError),
          });
        }
      }
    } catch (error) {
      const msg = `Unexpected error processing reference ${reference}: ${
        error instanceof Error ? error.message : String(error)
      }`;
      cronLogger.error('[PayNowRecon] ' + msg);
      result.errors.push(msg);
    }
  }

  // ── 4. Finalize ────────────────────────────────────────────────────────────

  result.durationMs = Date.now() - startedAt;

  cronLogger.info('[PayNowRecon] Reconciliation complete', {
    date: dateStr,
    matched: result.matched,
    invoiceUpdated: result.invoiceUpdated,
    zohoSynced: result.zohoSynced,
    alreadyRecorded: result.alreadyRecorded,
    noInvoiceFound: result.noInvoiceFound,
    errors: result.errors.length,
    durationMs: result.durationMs,
  });

  await logCronExecution(supabase, result, dateStr);

  return result;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Log this cron run to cron_execution_log for observability.
 * Non-fatal — failure to log does not abort the job.
 */
async function logCronExecution(
  supabase: Awaited<ReturnType<typeof createClient>>,
  result: PayNowReconciliationResult,
  dateStr: string
): Promise<void> {
  try {
    await supabase.from('cron_execution_log').insert({
      job_name: 'paynow-reconciliation',
      status: result.errors.length > 0 ? 'completed_with_errors' : 'completed',
      started_at: new Date(Date.now() - result.durationMs).toISOString(),
      completed_at: new Date().toISOString(),
      result: {
        ...result,
        reconciliation_date: dateStr,
      },
    });
  } catch (error) {
    cronLogger.error('[PayNowRecon] Failed to write cron execution log', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
