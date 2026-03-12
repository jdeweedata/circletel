/**
 * Zoho Books Sync Orchestrator
 *
 * Orchestrates syncing of customers, invoices, and payments to Zoho Books
 * for accounting/financial reporting purposes.
 *
 * Key differences from Zoho Billing sync:
 * - ALL invoice types are synced (no exclusion of recurring)
 * - Uses Zoho Books API v3 (not Billing API)
 * - Preserves CircleTel invoice numbers via ignore_auto_number_generation
 *
 * Sync Order (dependency chain):
 * 1. Customers → Creates/updates Zoho Books contacts
 * 2. Invoices → Creates invoices (requires customer sync first)
 * 3. Payments → Records payments (requires invoice sync if linked)
 *
 * Rate Limiting: 90 calls/min max (safety buffer under 100/min limit)
 */

import { createClient } from '@/lib/supabase/server';
import { getZohoBooksClient, ZohoBooksClient } from './books-api-client';
import { logZohoSync } from './billing-sync-logger';
import { zohoLogger } from '@/lib/logging';

// ============================================================================
// Types
// ============================================================================

export interface SyncResult {
  success: boolean;
  entity_type: 'customer' | 'invoice' | 'payment';
  entity_id: string;
  zoho_id?: string;
  error?: string;
}

export interface OrchestratorSummary {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  customers: { processed: number; succeeded: number; failed: number };
  invoices: { processed: number; succeeded: number; failed: number };
  payments: { processed: number; succeeded: number; failed: number };
  results: SyncResult[];
}

export interface OrchestratorOptions {
  dryRun?: boolean;
  maxCustomers?: number;
  maxInvoices?: number;
  maxPayments?: number;
}

// ============================================================================
// Orchestrator Class
// ============================================================================

export class ZohoBooksSyncOrchestrator {
  private client: ZohoBooksClient;
  private results: SyncResult[] = [];

  constructor() {
    this.client = getZohoBooksClient();
  }

  /**
   * Run full sync workflow
   */
  async runFullSync(options: OrchestratorOptions = {}): Promise<OrchestratorSummary> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    const summary: OrchestratorSummary = {
      startedAt,
      completedAt: '',
      durationMs: 0,
      customers: { processed: 0, succeeded: 0, failed: 0 },
      invoices: { processed: 0, succeeded: 0, failed: 0 },
      payments: { processed: 0, succeeded: 0, failed: 0 },
      results: [],
    };

    try {
      zohoLogger.info('[BooksOrchestrator] Starting Zoho Books sync workflow');

      // Test connection first
      const connectionTest = await this.client.testConnection();
      if (!connectionTest.success) {
        throw new Error(`OAUTH_ERROR: ${connectionTest.error}`);
      }
      zohoLogger.info('[BooksOrchestrator] Connection verified', {
        org: connectionTest.org_name,
      });

      // Step 1: Sync customers
      zohoLogger.info('[BooksOrchestrator] Step 1: Syncing customers...');
      const customerResults = await this.syncCustomers(options);
      summary.customers = customerResults;

      // Step 2: Sync invoices (ALL types - no exclusion)
      zohoLogger.info('[BooksOrchestrator] Step 2: Syncing invoices...');
      const invoiceResults = await this.syncInvoices(options);
      summary.invoices = invoiceResults;

      // Step 3: Sync payments
      zohoLogger.info('[BooksOrchestrator] Step 3: Syncing payments...');
      const paymentResults = await this.syncPayments(options);
      summary.payments = paymentResults;

      summary.results = this.results;
      summary.completedAt = new Date().toISOString();
      summary.durationMs = Date.now() - startTime;

      zohoLogger.info('[BooksOrchestrator] Sync completed', {
        customers: summary.customers,
        invoices: summary.invoices,
        payments: summary.payments,
        durationMs: summary.durationMs,
      });

      return summary;
    } catch (error) {
      zohoLogger.error('[BooksOrchestrator] Sync failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      summary.results = this.results;
      summary.completedAt = new Date().toISOString();
      summary.durationMs = Date.now() - startTime;

      // Re-throw OAuth errors for alerting
      if (error instanceof Error && error.message.startsWith('OAUTH_ERROR:')) {
        throw error;
      }

      return summary;
    }
  }

  // ============================================================================
  // Customer Sync
  // ============================================================================

  async syncCustomers(
    options: OrchestratorOptions
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    const supabase = await createClient();
    const stats = { processed: 0, succeeded: 0, failed: 0 };

    // Find customers needing sync (pending status, no Zoho Books ID)
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .is('zoho_books_contact_id', null)
      .or('zoho_sync_status.eq.pending,zoho_sync_status.is.null')
      .limit(options.maxCustomers || 30);

    if (error || !customers) {
      zohoLogger.error('[BooksOrchestrator] Failed to fetch customers', {
        error: error?.message,
      });
      return stats;
    }

    zohoLogger.info(`[BooksOrchestrator] Found ${customers.length} customers to sync`);

    for (const customer of customers) {
      if (options.dryRun) {
        zohoLogger.debug('[BooksOrchestrator] [DRY RUN] Would sync customer', {
          id: customer.id,
          email: customer.email,
        });
        stats.processed++;
        continue;
      }

      try {
        stats.processed++;

        // Update status to syncing
        await supabase
          .from('customers')
          .update({ zoho_sync_status: 'syncing' })
          .eq('id', customer.id);

        // Build contact payload for Zoho Books
        const contactPayload = {
          contact_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
          contact_type: 'customer' as const,
          first_name: customer.first_name || undefined,
          last_name: customer.last_name || undefined,
          email: customer.email,
          phone: customer.phone || undefined,
          mobile: customer.phone || undefined,
          company_name: customer.company_name || undefined,
          billing_address: customer.billing_address || customer.address
            ? {
                street: customer.billing_address?.street || customer.address?.street,
                city: customer.billing_address?.city || customer.address?.city,
                state: customer.billing_address?.state || customer.address?.state,
                zip: customer.billing_address?.postal_code || customer.address?.postal_code,
                country: customer.billing_address?.country || customer.address?.country || 'South Africa',
              }
            : undefined,
          custom_fields: [
            { label: 'CircleTel Customer ID', value: customer.id },
            { label: 'Account Number', value: customer.account_number || '' },
          ].filter(f => f.value),
        };

        // Upsert to Zoho Books
        const zohoContactId = await this.client.upsertContact(
          customer.email,
          contactPayload
        );

        // Update customer with success
        await supabase
          .from('customers')
          .update({
            zoho_books_contact_id: zohoContactId,
            zoho_sync_status: 'synced',
            zoho_last_synced_at: new Date().toISOString(),
            zoho_last_sync_error: null,
            zoho_books_retry_count: 0,
            zoho_books_next_retry_at: null,
          })
          .eq('id', customer.id);

        // Log success
        await logZohoSync({
          entity_type: 'customer',
          entity_id: customer.id,
          zoho_entity_type: 'BooksContact',
          zoho_entity_id: zohoContactId,
          status: 'success',
          attempt_number: 1,
          request_payload: contactPayload,
          response_payload: { contact_id: zohoContactId },
        });

        this.results.push({
          success: true,
          entity_type: 'customer',
          entity_id: customer.id,
          zoho_id: zohoContactId,
        });

        stats.succeeded++;
        zohoLogger.debug('[BooksOrchestrator] Customer synced', {
          id: customer.id,
          zohoContactId,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        stats.failed++;

        // Update with failure and retry info
        const currentRetryCount = customer.zoho_books_retry_count || 0;
        const nextRetryCount = currentRetryCount + 1;

        await supabase
          .from('customers')
          .update({
            zoho_sync_status: 'failed',
            zoho_last_sync_error: errorMessage,
            zoho_books_retry_count: nextRetryCount,
            zoho_books_next_retry_at:
              nextRetryCount < 5
                ? this.calculateNextRetry(nextRetryCount)
                : null,
          })
          .eq('id', customer.id);

        // Log failure
        await logZohoSync({
          entity_type: 'customer',
          entity_id: customer.id,
          zoho_entity_type: 'BooksContact',
          zoho_entity_id: null,
          status: 'failed',
          attempt_number: nextRetryCount,
          error_message: errorMessage,
          request_payload: null,
          response_payload: null,
        });

        this.results.push({
          success: false,
          entity_type: 'customer',
          entity_id: customer.id,
          error: errorMessage,
        });

        zohoLogger.error('[BooksOrchestrator] Customer sync failed', {
          id: customer.id,
          error: errorMessage,
        });

        // Re-throw OAuth errors
        if (errorMessage.startsWith('OAUTH_ERROR:')) {
          throw error;
        }
      }
    }

    return stats;
  }

  // ============================================================================
  // Invoice Sync (ALL types - no exclusion)
  // ============================================================================

  async syncInvoices(
    options: OrchestratorOptions
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    const supabase = await createClient();
    const stats = { processed: 0, succeeded: 0, failed: 0 };

    // Find invoices needing sync - ALL TYPES (no type filter!)
    // This is the key change from Zoho Billing sync
    const { data: invoices, error } = await supabase
      .from('customer_invoices')
      .select(`
        *,
        customer:customers(id, email, zoho_books_contact_id)
      `)
      .is('zoho_books_invoice_id', null)
      .or('zoho_sync_status.eq.pending,zoho_sync_status.is.null')
      .limit(options.maxInvoices || 40);

    if (error || !invoices) {
      zohoLogger.error('[BooksOrchestrator] Failed to fetch invoices', {
        error: error?.message,
      });
      return stats;
    }

    zohoLogger.info(`[BooksOrchestrator] Found ${invoices.length} invoices to sync`);

    for (const invoice of invoices) {
      if (options.dryRun) {
        zohoLogger.debug('[BooksOrchestrator] [DRY RUN] Would sync invoice', {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          invoice_type: invoice.invoice_type,
        });
        stats.processed++;
        continue;
      }

      try {
        stats.processed++;

        // Check if customer has Zoho Books contact ID
        if (!invoice.customer?.zoho_books_contact_id) {
          zohoLogger.warn('[BooksOrchestrator] Invoice customer not synced', {
            invoice_id: invoice.id,
            customer_id: invoice.customer_id,
          });

          // Mark as failed - customer dependency
          await supabase
            .from('customer_invoices')
            .update({
              zoho_sync_status: 'failed',
              zoho_last_sync_error: 'Customer not synced to Zoho Books',
            })
            .eq('id', invoice.id);

          stats.failed++;
          this.results.push({
            success: false,
            entity_type: 'invoice',
            entity_id: invoice.id,
            error: 'Customer not synced to Zoho Books',
          });
          continue;
        }

        // Update status to syncing
        await supabase
          .from('customer_invoices')
          .update({ zoho_sync_status: 'syncing' })
          .eq('id', invoice.id);

        // Build invoice payload
        const lineItems = Array.isArray(invoice.line_items)
          ? invoice.line_items.map((item: any) => ({
              name: item.name || item.description || 'Service',
              description: item.description || undefined,
              rate: parseFloat(item.price || item.rate || 0),
              quantity: parseInt(item.quantity || 1),
            }))
          : [
              {
                name: this.getInvoiceDescription(invoice.invoice_type),
                description: invoice.notes || undefined,
                rate: parseFloat(invoice.total_amount || 0),
                quantity: 1,
              },
            ];

        const invoicePayload = {
          customer_id: invoice.customer.zoho_books_contact_id,
          invoice_number: invoice.invoice_number || undefined,
          date: invoice.invoice_date || new Date().toISOString().split('T')[0],
          due_date: invoice.due_date || undefined,
          payment_terms: invoice.payment_terms || 30,
          payment_terms_label: invoice.payment_terms_label || 'Net 30',
          line_items: lineItems,
          notes: invoice.notes || undefined,
          terms: invoice.terms || undefined,
          custom_fields: [
            { label: 'CircleTel Invoice ID', value: invoice.id },
            { label: 'Invoice Type', value: invoice.invoice_type || '' },
            { label: 'Service ID', value: invoice.service_id || '' },
          ].filter(f => f.value),
        };

        // Create invoice in Zoho Books
        const zohoInvoice = await this.client.createInvoice(invoicePayload);

        // Mark as sent (so it shows as outstanding)
        try {
          await this.client.markInvoiceAsSent(zohoInvoice.invoice_id);
        } catch {
          // Non-fatal - invoice is created, just not marked as sent
          zohoLogger.warn('[BooksOrchestrator] Could not mark invoice as sent', {
            invoice_id: zohoInvoice.invoice_id,
          });
        }

        // Update invoice with success
        // Do NOT overwrite invoice_number - Supabase is source of truth
        await supabase
          .from('customer_invoices')
          .update({
            zoho_books_invoice_id: zohoInvoice.invoice_id,
            zoho_sync_status: 'synced',
            zoho_last_synced_at: new Date().toISOString(),
            zoho_last_sync_error: null,
            zoho_books_retry_count: 0,
            zoho_books_next_retry_at: null,
          })
          .eq('id', invoice.id);

        // Log success
        await logZohoSync({
          entity_type: 'invoice',
          entity_id: invoice.id,
          zoho_entity_type: 'BooksInvoice',
          zoho_entity_id: zohoInvoice.invoice_id,
          status: 'success',
          attempt_number: 1,
          request_payload: invoicePayload,
          response_payload: zohoInvoice,
        });

        this.results.push({
          success: true,
          entity_type: 'invoice',
          entity_id: invoice.id,
          zoho_id: zohoInvoice.invoice_id,
        });

        stats.succeeded++;
        zohoLogger.debug('[BooksOrchestrator] Invoice synced', {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          zohoInvoiceId: zohoInvoice.invoice_id,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        stats.failed++;

        // Update with failure and retry info
        const currentRetryCount = invoice.zoho_books_retry_count || 0;
        const nextRetryCount = currentRetryCount + 1;

        await supabase
          .from('customer_invoices')
          .update({
            zoho_sync_status: 'failed',
            zoho_last_sync_error: errorMessage,
            zoho_books_retry_count: nextRetryCount,
            zoho_books_next_retry_at:
              nextRetryCount < 5
                ? this.calculateNextRetry(nextRetryCount)
                : null,
          })
          .eq('id', invoice.id);

        // Log failure
        await logZohoSync({
          entity_type: 'invoice',
          entity_id: invoice.id,
          zoho_entity_type: 'BooksInvoice',
          zoho_entity_id: null,
          status: 'failed',
          attempt_number: nextRetryCount,
          error_message: errorMessage,
          request_payload: null,
          response_payload: null,
        });

        this.results.push({
          success: false,
          entity_type: 'invoice',
          entity_id: invoice.id,
          error: errorMessage,
        });

        zohoLogger.error('[BooksOrchestrator] Invoice sync failed', {
          id: invoice.id,
          error: errorMessage,
        });

        // Re-throw OAuth errors
        if (errorMessage.startsWith('OAUTH_ERROR:')) {
          throw error;
        }
      }
    }

    return stats;
  }

  // ============================================================================
  // Payment Sync
  // ============================================================================

  async syncPayments(
    options: OrchestratorOptions
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    const supabase = await createClient();
    const stats = { processed: 0, succeeded: 0, failed: 0 };

    // Find completed payments needing sync
    const { data: payments, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        customer:customers(id, email, zoho_books_contact_id),
        invoice:customer_invoices(id, invoice_number, zoho_books_invoice_id)
      `)
      .eq('status', 'completed')
      .is('zoho_books_payment_id', null)
      .or('zoho_sync_status.eq.pending,zoho_sync_status.is.null')
      .limit(options.maxPayments || 20);

    if (error || !payments) {
      zohoLogger.error('[BooksOrchestrator] Failed to fetch payments', {
        error: error?.message,
      });
      return stats;
    }

    zohoLogger.info(`[BooksOrchestrator] Found ${payments.length} payments to sync`);

    for (const payment of payments) {
      if (options.dryRun) {
        zohoLogger.debug('[BooksOrchestrator] [DRY RUN] Would sync payment', {
          id: payment.id,
          amount: payment.amount,
        });
        stats.processed++;
        continue;
      }

      try {
        stats.processed++;

        // Check if customer has Zoho Books contact ID
        if (!payment.customer?.zoho_books_contact_id) {
          zohoLogger.warn('[BooksOrchestrator] Payment customer not synced', {
            payment_id: payment.id,
            customer_id: payment.customer_id,
          });

          await supabase
            .from('payment_transactions')
            .update({
              zoho_sync_status: 'failed',
              zoho_last_sync_error: 'Customer not synced to Zoho Books',
            })
            .eq('id', payment.id);

          stats.failed++;
          this.results.push({
            success: false,
            entity_type: 'payment',
            entity_id: payment.id,
            error: 'Customer not synced to Zoho Books',
          });
          continue;
        }

        // Update status to syncing
        await supabase
          .from('payment_transactions')
          .update({ zoho_sync_status: 'syncing' })
          .eq('id', payment.id);

        // Build payment payload
        const paymentPayload = {
          customer_id: payment.customer.zoho_books_contact_id,
          payment_mode: this.mapPaymentMethod(payment.payment_method || 'other'),
          amount: parseFloat(payment.amount || 0),
          date: payment.completed_at
            ? new Date(payment.completed_at).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          reference_number: payment.transaction_reference || payment.id.substring(0, 8),
          description: payment.description || `Payment via ${payment.payment_method}`,
          // Link to invoice if synced
          invoices: payment.invoice?.zoho_books_invoice_id
            ? [
                {
                  invoice_id: payment.invoice.zoho_books_invoice_id,
                  amount_applied: parseFloat(payment.amount || 0),
                },
              ]
            : undefined,
        };

        // Record payment in Zoho Books
        const zohoPayment = await this.client.recordPayment(paymentPayload);

        // Update payment with success
        await supabase
          .from('payment_transactions')
          .update({
            zoho_books_payment_id: zohoPayment.payment_id,
            zoho_sync_status: 'synced',
            zoho_last_synced_at: new Date().toISOString(),
            zoho_last_sync_error: null,
            zoho_books_retry_count: 0,
            zoho_books_next_retry_at: null,
          })
          .eq('id', payment.id);

        // Log success
        await logZohoSync({
          entity_type: 'payment',
          entity_id: payment.id,
          zoho_entity_type: 'BooksPayment',
          zoho_entity_id: zohoPayment.payment_id,
          status: 'success',
          attempt_number: 1,
          request_payload: paymentPayload,
          response_payload: zohoPayment,
        });

        this.results.push({
          success: true,
          entity_type: 'payment',
          entity_id: payment.id,
          zoho_id: zohoPayment.payment_id,
        });

        stats.succeeded++;
        zohoLogger.debug('[BooksOrchestrator] Payment synced', {
          id: payment.id,
          zohoPaymentId: zohoPayment.payment_id,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        stats.failed++;

        // Update with failure and retry info
        const currentRetryCount = payment.zoho_books_retry_count || 0;
        const nextRetryCount = currentRetryCount + 1;

        await supabase
          .from('payment_transactions')
          .update({
            zoho_sync_status: 'failed',
            zoho_last_sync_error: errorMessage,
            zoho_books_retry_count: nextRetryCount,
            zoho_books_next_retry_at:
              nextRetryCount < 5
                ? this.calculateNextRetry(nextRetryCount)
                : null,
          })
          .eq('id', payment.id);

        // Log failure
        await logZohoSync({
          entity_type: 'payment',
          entity_id: payment.id,
          zoho_entity_type: 'BooksPayment',
          zoho_entity_id: null,
          status: 'failed',
          attempt_number: nextRetryCount,
          error_message: errorMessage,
          request_payload: null,
          response_payload: null,
        });

        this.results.push({
          success: false,
          entity_type: 'payment',
          entity_id: payment.id,
          error: errorMessage,
        });

        zohoLogger.error('[BooksOrchestrator] Payment sync failed', {
          id: payment.id,
          error: errorMessage,
        });

        // Re-throw OAuth errors
        if (errorMessage.startsWith('OAUTH_ERROR:')) {
          throw error;
        }
      }
    }

    return stats;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Calculate next retry time using exponential backoff
   * 5min → 15min → 1hr → 4hr → 24hr
   */
  private calculateNextRetry(retryCount: number): string {
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

  /**
   * Get human-readable description for invoice type
   */
  private getInvoiceDescription(invoiceType: string): string {
    const descriptions: Record<string, string> = {
      installation: 'Installation Fee',
      pro_rata: 'Pro-Rata Service Fee',
      equipment: 'Equipment Charge',
      adjustment: 'Account Adjustment',
      recurring: 'Monthly Service Fee',
      monthly: 'Monthly Service Fee',
    };
    return descriptions[invoiceType] || 'Service Charge';
  }

  /**
   * Map CircleTel payment method to Zoho Books payment mode
   */
  private mapPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      netcash: 'Bank Transfer',
      paynow: 'Bank Transfer',
      eft: 'Bank Transfer',
      bank_transfer: 'Bank Transfer',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      debit_order: 'Debit Order',
      cash: 'Cash',
      check: 'Check',
      other: 'Other',
    };

    const normalized = method.toLowerCase().replace(/[\s-_]/g, '_');
    return methodMap[normalized] || 'Other';
  }
}

/**
 * Convenience function to run full sync
 */
export async function runZohoBooksSyncWorkflow(
  options: OrchestratorOptions = {}
): Promise<OrchestratorSummary> {
  const orchestrator = new ZohoBooksSyncOrchestrator();
  return orchestrator.runFullSync(options);
}
