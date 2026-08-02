/**
 * Zoho Books Retry Cron
 *
 * Scheduled job that runs every 15 minutes
 *
 * Purpose:
 * - Process retry queue for failed syncs
 * - Uses exponential backoff (5min → 15min → 1hr → 4hr → 24hr)
 * - Sends alerts when retry count exceeds 5
 *
 * Schedule: * /15 * * * * (every 15 minutes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getZohoBooksClient } from '@/lib/integrations/zoho/books-api-client';
import { sendZohoBooksAlert } from '@/lib/integrations/zoho/books-alerting-service';
import { logZohoSync } from '@/lib/integrations/zoho/billing-sync-logger';
import {
  assertInvoiceVatHeaders,
  buildZohoTaxInclusiveInvoicePayload,
} from '@/lib/billing/invoice-vat-contract';
import { cronLogger } from '@/lib/logging';

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

interface RetryResult {
  entity_type: 'customer' | 'invoice' | 'payment';
  entity_id: string;
  success: boolean;
  zoho_id?: string;
  error?: string;
  retry_count: number;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // =========================================================================
    // Verify Vercel Cron Secret
    // =========================================================================
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      cronLogger.error('[ZohoBooks Retry] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      cronLogger.error('[ZohoBooks Retry] Invalid authorization');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // =========================================================================
    // Parse Query Parameters
    // =========================================================================
    const searchParams = request.nextUrl.searchParams;
    const dryRun = searchParams.get('dryRun') === 'true';
    const maxRetries = searchParams.get('maxRetries')
      ? parseInt(searchParams.get('maxRetries')!, 10)
      : 20;

    cronLogger.info('[ZohoBooks Retry] ═══════════════════════════════════════════════════════════');
    cronLogger.info('[ZohoBooks Retry]   Starting Retry Queue Processing');
    cronLogger.info('[ZohoBooks Retry] ═══════════════════════════════════════════════════════════');
    cronLogger.info(`[ZohoBooks Retry]   Timestamp: ${new Date().toISOString()}`);
    cronLogger.info(`[ZohoBooks Retry]   Mode: ${dryRun ? '🧪 DRY RUN' : '🚀 LIVE'}`);
    cronLogger.info(`[ZohoBooks Retry]   Max Retries: ${maxRetries}`);
    cronLogger.info('[ZohoBooks Retry] ═══════════════════════════════════════════════════════════\n');

    const supabase = await createClient();
    const client = getZohoBooksClient();
    const results: RetryResult[] = [];
    const now = new Date().toISOString();

    // Track entities that exceeded retry count for alerting
    const exhaustedEntities: Array<{
      type: string;
      id: string;
      error: string;
    }> = [];

    // =========================================================================
    // Process Customer Retries
    // =========================================================================
    const { data: customersToRetry } = await supabase
      .from('customers')
      .select('*')
      .eq('zoho_sync_status', 'failed')
      .lt('zoho_books_retry_count', 5)
      .lte('zoho_books_next_retry_at', now)
      .limit(Math.ceil(maxRetries / 3));

    cronLogger.info(`[ZohoBooks Retry] Found ${customersToRetry?.length || 0} customers to retry`);

    for (const customer of customersToRetry || []) {
      if (dryRun) {
        cronLogger.debug('[ZohoBooks Retry] [DRY RUN] Would retry customer', {
          id: customer.id,
          retry_count: customer.zoho_books_retry_count,
        });
        continue;
      }

      const retryCount = (customer.zoho_books_retry_count || 0) + 1;

      try {
        // Attempt sync
        const contactPayload = {
          contact_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
          contact_type: 'customer' as const,
          email: customer.email,
          phone: customer.phone || undefined,
        };

        const zohoContactId = await client.upsertContact(customer.email, contactPayload);

        // Success - update record
        await supabase
          .from('customers')
          .update({
            zoho_books_contact_id: zohoContactId,
            zoho_sync_status: 'synced',
            zoho_last_synced_at: now,
            zoho_last_sync_error: null,
            zoho_books_retry_count: 0,
            zoho_books_next_retry_at: null,
          })
          .eq('id', customer.id);

        await logZohoSync({
          entity_type: 'customer',
          entity_id: customer.id,
          zoho_entity_type: 'BooksContact',
          zoho_entity_id: zohoContactId,
          status: 'success',
          attempt_number: retryCount,
          request_payload: contactPayload,
          response_payload: { contact_id: zohoContactId },
        });

        results.push({
          entity_type: 'customer',
          entity_id: customer.id,
          success: true,
          zoho_id: zohoContactId,
          retry_count: retryCount,
        });

        cronLogger.info('[ZohoBooks Retry] ✅ Customer retry succeeded', {
          id: customer.id,
          retryCount,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Calculate next retry or mark as exhausted
        const nextRetryAt =
          retryCount < 5 ? calculateNextRetry(retryCount) : null;

        await supabase
          .from('customers')
          .update({
            zoho_sync_status: 'failed',
            zoho_last_sync_error: errorMessage,
            zoho_books_retry_count: retryCount,
            zoho_books_next_retry_at: nextRetryAt,
          })
          .eq('id', customer.id);

        await logZohoSync({
          entity_type: 'customer',
          entity_id: customer.id,
          zoho_entity_type: 'BooksContact',
          zoho_entity_id: null,
          status: 'failed',
          attempt_number: retryCount,
          error_message: errorMessage,
          request_payload: null,
          response_payload: null,
        });

        results.push({
          entity_type: 'customer',
          entity_id: customer.id,
          success: false,
          error: errorMessage,
          retry_count: retryCount,
        });

        // Track if retry exhausted
        if (retryCount >= 5) {
          exhaustedEntities.push({
            type: 'customer',
            id: customer.id,
            error: errorMessage,
          });
        }

        cronLogger.warn('[ZohoBooks Retry] ❌ Customer retry failed', {
          id: customer.id,
          retryCount,
          error: errorMessage,
        });
      }
    }

    // =========================================================================
    // Process Invoice Retries
    // =========================================================================
    // Include failed invoices with null next_retry_at (e.g. Billing path
    // previously marked recurring as failed without scheduling a Books retry).
    const { data: invoicesToRetry } = await supabase
      .from('customer_invoices')
      .select(`
        *,
        customer:customers(id, email, zoho_books_contact_id)
      `)
      .eq('zoho_sync_status', 'failed')
      .is('zoho_books_invoice_id', null)
      .lt('zoho_books_retry_count', 5)
      .or(`zoho_books_next_retry_at.is.null,zoho_books_next_retry_at.lte.${now}`)
      .not('status', 'in', '(voided,cancelled)')
      .limit(Math.ceil(maxRetries / 3));

    cronLogger.info(`[ZohoBooks Retry] Found ${invoicesToRetry?.length || 0} invoices to retry`);

    for (const invoice of invoicesToRetry || []) {
      if (dryRun) {
        cronLogger.debug('[ZohoBooks Retry] [DRY RUN] Would retry invoice', {
          id: invoice.id,
          retry_count: invoice.zoho_books_retry_count,
        });
        continue;
      }

      const retryCount = (invoice.zoho_books_retry_count || 0) + 1;

      try {
        // Check customer dependency
        if (!invoice.customer?.zoho_books_contact_id) {
          throw new Error('Customer not synced to Zoho Books');
        }

        const headerCheck = assertInvoiceVatHeaders(invoice);
        if (!headerCheck.ok) {
          throw new Error(
            `VAT amount guard failed before Books create: ${headerCheck.error}`
          );
        }

        const money = buildZohoTaxInclusiveInvoicePayload(
          {
            subtotal: invoice.subtotal,
            tax_amount: invoice.tax_amount,
            total_amount: invoice.total_amount,
            line_items: invoice.line_items,
            notes: invoice.notes,
          },
          'Service Charge'
        );

        const invoicePayload = {
          customer_id: invoice.customer.zoho_books_contact_id,
          invoice_number: invoice.invoice_number || undefined,
          date: invoice.invoice_date || new Date().toISOString().split('T')[0],
          due_date: invoice.due_date || undefined,
          is_inclusive_tax: money.is_inclusive_tax,
          line_items: money.line_items,
        };

        const zohoInvoice = await client.createInvoice(invoicePayload);

        const ctTotal =
          Math.round(Number(invoice.total_amount || 0) * 100) / 100;
        const booksTotal =
          Math.round(Number(zohoInvoice.total || 0) * 100) / 100;
        if (Math.abs(booksTotal - ctTotal) > 0.05) {
          try {
            await client.voidInvoice(zohoInvoice.invoice_id);
          } catch {
            // best-effort cleanup
          }
          throw new Error(
            `VAT amount guard: Books total ${booksTotal} !== CT total_amount ${ctTotal}`
          );
        }

        // Mark as sent
        try {
          await client.markInvoiceAsSent(zohoInvoice.invoice_id);
        } catch {
          // Non-fatal
        }

        // Success - update record
        await supabase
          .from('customer_invoices')
          .update({
            zoho_books_invoice_id: zohoInvoice.invoice_id,
            zoho_sync_status: 'synced',
            zoho_last_synced_at: now,
            zoho_last_sync_error: null,
            zoho_books_retry_count: 0,
            zoho_books_next_retry_at: null,
          })
          .eq('id', invoice.id);

        await logZohoSync({
          entity_type: 'invoice',
          entity_id: invoice.id,
          zoho_entity_type: 'BooksInvoice',
          zoho_entity_id: zohoInvoice.invoice_id,
          status: 'success',
          attempt_number: retryCount,
          request_payload: invoicePayload,
          response_payload: zohoInvoice,
        });

        results.push({
          entity_type: 'invoice',
          entity_id: invoice.id,
          success: true,
          zoho_id: zohoInvoice.invoice_id,
          retry_count: retryCount,
        });

        cronLogger.info('[ZohoBooks Retry] ✅ Invoice retry succeeded', {
          id: invoice.id,
          retryCount,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const nextRetryAt =
          retryCount < 5 ? calculateNextRetry(retryCount) : null;

        await supabase
          .from('customer_invoices')
          .update({
            zoho_sync_status: 'failed',
            zoho_last_sync_error: errorMessage,
            zoho_books_retry_count: retryCount,
            zoho_books_next_retry_at: nextRetryAt,
          })
          .eq('id', invoice.id);

        await logZohoSync({
          entity_type: 'invoice',
          entity_id: invoice.id,
          zoho_entity_type: 'BooksInvoice',
          zoho_entity_id: null,
          status: 'failed',
          attempt_number: retryCount,
          error_message: errorMessage,
          request_payload: null,
          response_payload: null,
        });

        results.push({
          entity_type: 'invoice',
          entity_id: invoice.id,
          success: false,
          error: errorMessage,
          retry_count: retryCount,
        });

        if (retryCount >= 5) {
          exhaustedEntities.push({
            type: 'invoice',
            id: invoice.id,
            error: errorMessage,
          });
        }

        cronLogger.warn('[ZohoBooks Retry] ❌ Invoice retry failed', {
          id: invoice.id,
          retryCount,
          error: errorMessage,
        });
      }
    }

    // =========================================================================
    // Process Payment Retries
    // =========================================================================
    const { data: paymentsToRetry } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        customer:customers(id, email, zoho_books_contact_id),
        invoice:customer_invoices(id, invoice_number, zoho_books_invoice_id)
      `)
      .eq('zoho_sync_status', 'failed')
      .eq('status', 'completed')
      .lt('zoho_books_retry_count', 5)
      .lte('zoho_books_next_retry_at', now)
      .limit(Math.ceil(maxRetries / 3));

    cronLogger.info(`[ZohoBooks Retry] Found ${paymentsToRetry?.length || 0} payments to retry`);

    for (const payment of paymentsToRetry || []) {
      if (dryRun) {
        cronLogger.debug('[ZohoBooks Retry] [DRY RUN] Would retry payment', {
          id: payment.id,
          retry_count: payment.zoho_books_retry_count,
        });
        continue;
      }

      const retryCount = (payment.zoho_books_retry_count || 0) + 1;

      try {
        // Check customer dependency
        if (!payment.customer?.zoho_books_contact_id) {
          throw new Error('Customer not synced to Zoho Books');
        }

        const paymentPayload = {
          customer_id: payment.customer.zoho_books_contact_id,
          payment_mode: 'Bank Transfer',
          amount: parseFloat(payment.amount || 0),
          date: payment.completed_at
            ? new Date(payment.completed_at).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          reference_number: payment.transaction_reference || payment.id.substring(0, 8),
          invoices: payment.invoice?.zoho_books_invoice_id
            ? [
                {
                  invoice_id: payment.invoice.zoho_books_invoice_id,
                  amount_applied: parseFloat(payment.amount || 0),
                },
              ]
            : undefined,
        };

        const zohoPayment = await client.recordPayment(paymentPayload);

        // Success - update record
        await supabase
          .from('payment_transactions')
          .update({
            zoho_books_payment_id: zohoPayment.payment_id,
            zoho_sync_status: 'synced',
            zoho_last_synced_at: now,
            zoho_last_sync_error: null,
            zoho_books_retry_count: 0,
            zoho_books_next_retry_at: null,
          })
          .eq('id', payment.id);

        await logZohoSync({
          entity_type: 'payment',
          entity_id: payment.id,
          zoho_entity_type: 'BooksPayment',
          zoho_entity_id: zohoPayment.payment_id,
          status: 'success',
          attempt_number: retryCount,
          request_payload: paymentPayload,
          response_payload: zohoPayment,
        });

        results.push({
          entity_type: 'payment',
          entity_id: payment.id,
          success: true,
          zoho_id: zohoPayment.payment_id,
          retry_count: retryCount,
        });

        cronLogger.info('[ZohoBooks Retry] ✅ Payment retry succeeded', {
          id: payment.id,
          retryCount,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const nextRetryAt =
          retryCount < 5 ? calculateNextRetry(retryCount) : null;

        await supabase
          .from('payment_transactions')
          .update({
            zoho_sync_status: 'failed',
            zoho_last_sync_error: errorMessage,
            zoho_books_retry_count: retryCount,
            zoho_books_next_retry_at: nextRetryAt,
          })
          .eq('id', payment.id);

        await logZohoSync({
          entity_type: 'payment',
          entity_id: payment.id,
          zoho_entity_type: 'BooksPayment',
          zoho_entity_id: null,
          status: 'failed',
          attempt_number: retryCount,
          error_message: errorMessage,
          request_payload: null,
          response_payload: null,
        });

        results.push({
          entity_type: 'payment',
          entity_id: payment.id,
          success: false,
          error: errorMessage,
          retry_count: retryCount,
        });

        if (retryCount >= 5) {
          exhaustedEntities.push({
            type: 'payment',
            id: payment.id,
            error: errorMessage,
          });
        }

        cronLogger.warn('[ZohoBooks Retry] ❌ Payment retry failed', {
          id: payment.id,
          retryCount,
          error: errorMessage,
        });
      }
    }

    // =========================================================================
    // Send Alert for Exhausted Retries
    // =========================================================================
    if (exhaustedEntities.length > 0 && !dryRun) {
      try {
        await sendZohoBooksAlert({
          type: 'retry_exhausted',
          message: `${exhaustedEntities.length} entities exceeded retry limit`,
          details: {
            entities: exhaustedEntities,
            timestamp: now,
          },
        });
        cronLogger.info('[ZohoBooks Retry] ⚠️ Retry exhausted alert sent', {
          count: exhaustedEntities.length,
        });
      } catch (alertError) {
        cronLogger.error('[ZohoBooks Retry] Failed to send alert', {
          error: alertError instanceof Error ? alertError.message : String(alertError),
        });
      }
    }

    // =========================================================================
    // Log Execution
    // =========================================================================
    const duration = Date.now() - startTime;
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    try {
      await supabase.from('cron_execution_log').insert({
        job_name: 'zoho-books-retry',
        status: failed > 0 ? 'partial' : 'success',
        execution_time_ms: duration,
        result_summary: {
          processed: results.length,
          succeeded,
          failed,
          exhaustedCount: exhaustedEntities.length,
          dryRun,
        },
        error_message: failed > 0 ? `${failed} retries failed` : null,
      });
    } catch (logError) {
      cronLogger.warn('[ZohoBooks Retry] Failed to log execution', {
        error: logError instanceof Error ? logError.message : String(logError),
      });
    }

    cronLogger.info('[ZohoBooks Retry] ═══════════════════════════════════════════════════════════');
    cronLogger.info('[ZohoBooks Retry]   Retry Processing Completed');
    cronLogger.info('[ZohoBooks Retry] ═══════════════════════════════════════════════════════════');
    cronLogger.info(`[ZohoBooks Retry]   Processed: ${results.length}`);
    cronLogger.info(`[ZohoBooks Retry]   Succeeded: ✅ ${succeeded}`);
    cronLogger.info(`[ZohoBooks Retry]   Failed: ❌ ${failed}`);
    cronLogger.info(`[ZohoBooks Retry]   Exhausted: ⚠️ ${exhaustedEntities.length}`);
    cronLogger.info(`[ZohoBooks Retry]   Duration: ${(duration / 1000).toFixed(1)}s`);
    cronLogger.info('[ZohoBooks Retry] ═══════════════════════════════════════════════════════════\n');

    return NextResponse.json({
      success: true,
      message: 'Retry queue processing completed',
      timestamp: now,
      duration_ms: duration,
      dryRun,
      summary: {
        processed: results.length,
        succeeded,
        failed,
        exhaustedCount: exhaustedEntities.length,
      },
      results: results.slice(0, 10),
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);

    cronLogger.error('[ZohoBooks Retry] Fatal error', { error: message });

    // Log fatal error
    try {
      const supabase = await createClient();
      await supabase.from('cron_execution_log').insert({
        job_name: 'zoho-books-retry',
        status: 'failed',
        execution_time_ms: duration,
        error_message: message,
      });
    } catch {
      // Ignore logging error
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: message,
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate next retry time using exponential backoff
 */
function calculateNextRetry(retryCount: number): string {
  const delays = [
    5 * 60 * 1000, // 5 minutes
    15 * 60 * 1000, // 15 minutes
    60 * 60 * 1000, // 1 hour
    4 * 60 * 60 * 1000, // 4 hours
    24 * 60 * 60 * 1000, // 24 hours
  ];

  const delay = delays[Math.min(retryCount - 1, delays.length - 1)];
  return new Date(Date.now() + delay).toISOString();
}
