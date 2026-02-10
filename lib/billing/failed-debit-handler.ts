/**
 * Failed Debit Order Handler
 *
 * Automatically sends Pay Now payment links when debit orders fail.
 * This provides a seamless fallback payment option for customers
 * whose debit orders could not be collected.
 *
 * Trigger points:
 * 1. NetCash debit order webhook (failure callback)
 * 2. Batch processing result (failed items)
 * 3. Manual admin action
 *
 * Flow:
 * 1. Record debit order failure on invoice
 * 2. Generate Pay Now link
 * 3. Send notification via email + SMS
 * 4. Update invoice tracking
 */

import { createClient } from '@/lib/supabase/server';
import {
  PayNowBillingService,
  PayNowProcessResult,
} from './paynow-billing-service';
import { billingLogger } from '@/lib/logging';

// =============================================================================
// TYPES
// =============================================================================

export interface DebitFailureDetails {
  invoiceId: string;
  transactionRef?: string;
  failureReason: string;
  failureCode?: string;
  failedAt?: Date;
}

export interface FailedDebitHandlerResult {
  success: boolean;
  invoiceId: string;
  invoiceNumber: string;
  failureRecorded: boolean;
  paynowSent: boolean;
  paynowResult?: PayNowProcessResult;
  errors: string[];
}

// Common debit order failure reasons
export const DEBIT_FAILURE_REASONS: Record<string, string> = {
  'insufficient_funds': 'Insufficient funds in account',
  'account_closed': 'Bank account has been closed',
  'account_blocked': 'Bank account is blocked or frozen',
  'mandate_cancelled': 'Debit order mandate was cancelled',
  'mandate_expired': 'Debit order mandate has expired',
  'technical_error': 'Technical error during processing',
  'bank_rejected': 'Rejected by customer\'s bank',
  'disputed': 'Customer disputed the debit order',
  'unknown': 'Unknown failure reason',
};

// =============================================================================
// FAILED DEBIT HANDLER SERVICE
// =============================================================================

export class FailedDebitHandler {
  /**
   * Handle a failed debit order
   * Records failure and immediately sends Pay Now link
   */
  static async handleFailedDebit(
    details: DebitFailureDetails
  ): Promise<FailedDebitHandlerResult> {
    const { invoiceId, failureReason, failureCode, failedAt } = details;
    const errors: string[] = [];
    let failureRecorded = false;
    let paynowSent = false;
    let paynowResult: PayNowProcessResult | undefined;
    let invoiceNumber = 'UNKNOWN';

    try {
      const supabase = await createClient();

      billingLogger.info('Handling failed debit order', {
        invoiceId,
        failureReason,
        failureCode,
      });

      // 1. Fetch invoice details
      const { data: invoice, error: fetchError } = await supabase
        .from('customer_invoices')
        .select('id, invoice_number, customer_id, status')
        .eq('id', invoiceId)
        .single();

      if (fetchError || !invoice) {
        const errorMsg = `Invoice not found: ${invoiceId}`;
        billingLogger.error('Failed debit handler: Invoice not found', { invoiceId });
        return {
          success: false,
          invoiceId,
          invoiceNumber,
          failureRecorded: false,
          paynowSent: false,
          errors: [errorMsg],
        };
      }

      invoiceNumber = invoice.invoice_number;

      // 2. Record debit order failure on invoice
      const normalizedReason = this.normalizeFailureReason(failureReason);
      const { error: updateError } = await supabase
        .from('customer_invoices')
        .update({
          debit_order_failed_at: (failedAt || new Date()).toISOString(),
          debit_order_failure_reason: normalizedReason,
          payment_collection_method: 'debit_order_failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateError) {
        errors.push(`Failed to record failure: ${updateError.message}`);
        billingLogger.error('Failed to record debit failure', {
          invoiceId,
          error: updateError.message,
        });
      } else {
        failureRecorded = true;
        billingLogger.info('Debit failure recorded', {
          invoiceNumber,
          reason: normalizedReason,
        });
      }

      // 3. Generate and send Pay Now link
      paynowResult = await PayNowBillingService.processPayNowForInvoice(
        invoiceId,
        {
          sendEmail: true,
          sendSms: true,
          smsTemplate: 'debitFailed',
          forceRegenerate: true, // Generate new link even if one exists
        }
      );

      paynowSent = paynowResult.success;

      if (!paynowResult.success) {
        errors.push(...paynowResult.errors);
      }

      const success = failureRecorded && paynowSent;

      billingLogger.info('Failed debit handling complete', {
        invoiceNumber,
        failureRecorded,
        paynowSent,
        success,
      });

      return {
        success,
        invoiceId,
        invoiceNumber,
        failureRecorded,
        paynowSent,
        paynowResult,
        errors,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      billingLogger.error('Failed debit handler error', { invoiceId, error: errorMsg });
      return {
        success: false,
        invoiceId,
        invoiceNumber,
        failureRecorded,
        paynowSent,
        paynowResult,
        errors: [errorMsg],
      };
    }
  }

  /**
   * Process multiple failed debit orders
   * Used when processing batch failure results
   */
  static async handleBatchFailures(
    failures: DebitFailureDetails[]
  ): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: FailedDebitHandlerResult[];
  }> {
    const results: FailedDebitHandlerResult[] = [];
    let successful = 0;
    let failed = 0;

    billingLogger.info('Processing batch debit failures', {
      count: failures.length,
    });

    for (const failure of failures) {
      const result = await this.handleFailedDebit(failure);
      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Small delay between processing
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    billingLogger.info('Batch debit failure processing complete', {
      processed: failures.length,
      successful,
      failed,
    });

    return {
      processed: failures.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Check if an invoice has a recent debit failure
   * Used to prevent duplicate handling
   */
  static async hasRecentFailure(invoiceId: string, withinHours = 24): Promise<boolean> {
    try {
      const supabase = await createClient();
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - withinHours);

      const { data: invoice } = await supabase
        .from('customer_invoices')
        .select('debit_order_failed_at')
        .eq('id', invoiceId)
        .single();

      if (!invoice?.debit_order_failed_at) {
        return false;
      }

      const failedAt = new Date(invoice.debit_order_failed_at);
      return failedAt > cutoffTime;
    } catch {
      return false;
    }
  }

  /**
   * Normalize failure reason to standard format
   */
  private static normalizeFailureReason(reason: string): string {
    const lowerReason = reason.toLowerCase();

    // Map common variations to standard reasons
    if (lowerReason.includes('insufficient') || lowerReason.includes('funds')) {
      return 'insufficient_funds';
    }
    if (lowerReason.includes('closed')) {
      return 'account_closed';
    }
    if (lowerReason.includes('blocked') || lowerReason.includes('frozen')) {
      return 'account_blocked';
    }
    if (lowerReason.includes('cancelled') || lowerReason.includes('canceled')) {
      return 'mandate_cancelled';
    }
    if (lowerReason.includes('expired')) {
      return 'mandate_expired';
    }
    if (lowerReason.includes('technical') || lowerReason.includes('error')) {
      return 'technical_error';
    }
    if (lowerReason.includes('rejected') || lowerReason.includes('declined')) {
      return 'bank_rejected';
    }
    if (lowerReason.includes('disputed') || lowerReason.includes('dispute')) {
      return 'disputed';
    }

    // Return original if no match, or 'unknown' if empty
    return reason || 'unknown';
  }

  /**
   * Get human-readable failure reason
   */
  static getFailureReasonDisplay(code: string): string {
    return DEBIT_FAILURE_REASONS[code] || code;
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export const handleFailedDebit = FailedDebitHandler.handleFailedDebit.bind(FailedDebitHandler);
export const handleBatchFailures = FailedDebitHandler.handleBatchFailures.bind(FailedDebitHandler);
export const hasRecentFailure = FailedDebitHandler.hasRecentFailure.bind(FailedDebitHandler);
export const getFailureReasonDisplay = FailedDebitHandler.getFailureReasonDisplay.bind(FailedDebitHandler);
