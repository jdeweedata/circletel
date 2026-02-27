/**
 * WhatsApp PayNow Service
 *
 * Handles sending PayNow payment links via WhatsApp.
 * Integrates with existing PayNow URL generation and notification tracking.
 *
 * Usage:
 * 1. Billing day processor - sends WhatsApp notifications to consented customers
 * 2. Failed debit handler - WhatsApp fallback when debit order fails
 * 3. Manual admin actions - resend PayNow via WhatsApp
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { whatsAppService } from '@/lib/integrations/whatsapp';
import type {
  WhatsAppSendResult,
  InvoicePaymentParams,
  PaymentReminderParams,
  DebitFailedParams,
} from '@/lib/integrations/whatsapp/types';
import { billingLogger } from '@/lib/logging';

// =============================================================================
// TYPES
// =============================================================================

export interface WhatsAppPayNowResult {
  success: boolean;
  invoiceId: string;
  invoiceNumber: string;
  whatsappSent: boolean;
  messageId?: string;
  waId?: string;
  error?: string;
}

export interface WhatsAppBatchResult {
  total: number;
  sent: number;
  failed: number;
  skippedNoConsent: number;
  skippedNoPhone: number;
  results: WhatsAppPayNowResult[];
  errors: string[];
}

export interface InvoiceForWhatsApp {
  id: string;
  invoice_number: string;
  total_amount: number;
  due_date: string;
  status: string;
  customer_id: string;
  paynow_url?: string | null;
  paynow_transaction_ref?: string | null;
  whatsapp_sent_at?: string | null;
  customer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    whatsapp_consent: boolean;
  } | null;
}

export type WhatsAppNotificationType =
  | 'invoice_payment'
  | 'payment_reminder'
  | 'debit_failed';

// =============================================================================
// SHORT URL HELPER
// =============================================================================

/**
 * Generate short payment URL for WhatsApp
 * Uses circletel.co.za/api/paynow/[ref] which redirects to full NetCash URL
 */
function getShortPaymentUrl(transactionRef: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';
  return `${baseUrl}/api/paynow/${transactionRef}`;
}

/**
 * Format date for WhatsApp message (e.g., "28 February 2026")
 */
function formatDateForWhatsApp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format amount for WhatsApp message (e.g., "899.00")
 */
function formatAmountForWhatsApp(amount: number): string {
  return amount.toFixed(2);
}

// =============================================================================
// WHATSAPP PAYNOW SERVICE
// =============================================================================

export class WhatsAppPayNowService {
  /**
   * Send WhatsApp PayNow notification for a single invoice
   */
  static async sendPayNowWhatsApp(
    invoiceId: string,
    notificationType: WhatsAppNotificationType = 'invoice_payment',
    options: {
      daysOverdue?: number; // For payment_reminder template
      createdBy?: string; // For audit logging
    } = {}
  ): Promise<WhatsAppPayNowResult> {
    const { daysOverdue = 0, createdBy = 'api' } = options;

    try {
      // Check if WhatsApp service is configured
      if (!whatsAppService.isConfigured()) {
        billingLogger.error('WhatsApp PayNow: Service not configured');
        return {
          success: false,
          invoiceId,
          invoiceNumber: 'UNKNOWN',
          whatsappSent: false,
          error: 'WhatsApp service not configured',
        };
      }

      // Create Supabase client
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Fetch invoice with customer
      const { data: invoice, error: invoiceError } = await supabase
        .from('customer_invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          due_date,
          status,
          customer_id,
          paynow_url,
          paynow_transaction_ref,
          whatsapp_sent_at
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        billingLogger.error('WhatsApp PayNow: Invoice not found', {
          invoiceId,
          error: invoiceError?.message,
        });
        return {
          success: false,
          invoiceId,
          invoiceNumber: 'UNKNOWN',
          whatsappSent: false,
          error: `Invoice not found: ${invoiceError?.message || 'No data'}`,
        };
      }

      // Fetch customer separately
      const { data: customer } = await supabase
        .from('customers')
        .select('id, first_name, last_name, phone, whatsapp_consent')
        .eq('id', invoice.customer_id)
        .single();

      // Validate customer consent and phone
      if (!customer?.whatsapp_consent) {
        billingLogger.info('WhatsApp PayNow: No consent', { invoiceId });
        return {
          success: false,
          invoiceId,
          invoiceNumber: invoice.invoice_number,
          whatsappSent: false,
          error: 'Customer has not consented to WhatsApp notifications',
        };
      }

      if (!customer?.phone) {
        billingLogger.info('WhatsApp PayNow: No phone', { invoiceId });
        return {
          success: false,
          invoiceId,
          invoiceNumber: invoice.invoice_number,
          whatsappSent: false,
          error: 'Customer has no phone number',
        };
      }

      // Check if Pay Now URL exists
      if (!invoice.paynow_transaction_ref) {
        billingLogger.error('WhatsApp PayNow: No PayNow URL', { invoiceId });
        return {
          success: false,
          invoiceId,
          invoiceNumber: invoice.invoice_number,
          whatsappSent: false,
          error: 'Invoice has no PayNow URL. Generate PayNow first.',
        };
      }

      // Generate short URL for WhatsApp
      const paymentUrl = getShortPaymentUrl(invoice.paynow_transaction_ref);
      const customerName = customer.first_name || 'Customer';

      // Send appropriate template
      let sendResult: WhatsAppSendResult;

      switch (notificationType) {
        case 'invoice_payment': {
          const params: InvoicePaymentParams = {
            customerName,
            invoiceNumber: invoice.invoice_number,
            amount: formatAmountForWhatsApp(invoice.total_amount),
            dueDate: formatDateForWhatsApp(invoice.due_date),
            paymentUrl,
          };
          sendResult = await whatsAppService.sendInvoicePayment(customer.phone, params);
          break;
        }

        case 'payment_reminder': {
          const params: PaymentReminderParams = {
            invoiceNumber: invoice.invoice_number,
            amount: formatAmountForWhatsApp(invoice.total_amount),
            daysOverdue: String(daysOverdue),
            paymentUrl,
          };
          sendResult = await whatsAppService.sendPaymentReminder(customer.phone, params);
          break;
        }

        case 'debit_failed': {
          const params: DebitFailedParams = {
            customerName,
            invoiceNumber: invoice.invoice_number,
            amount: formatAmountForWhatsApp(invoice.total_amount),
            paymentUrl,
          };
          sendResult = await whatsAppService.sendDebitFailed(customer.phone, params);
          break;
        }
      }

      if (!sendResult.success) {
        billingLogger.error('WhatsApp PayNow: Send failed', {
          invoiceId,
          error: sendResult.error,
        });
        return {
          success: false,
          invoiceId,
          invoiceNumber: invoice.invoice_number,
          whatsappSent: false,
          error: sendResult.error,
        };
      }

      // Update invoice with WhatsApp tracking
      await supabase
        .from('customer_invoices')
        .update({
          whatsapp_sent_at: new Date().toISOString(),
          whatsapp_message_id: sendResult.messageId,
        })
        .eq('id', invoiceId);

      // Log message
      await supabase.rpc('log_whatsapp_message', {
        p_message_id: sendResult.messageId,
        p_wa_id: sendResult.waId,
        p_phone: customer.phone,
        p_template_name: `circletel_${notificationType}`,
        p_customer_id: customer.id,
        p_invoice_id: invoiceId,
        p_created_by: createdBy,
      });

      billingLogger.info('WhatsApp PayNow: Sent successfully', {
        invoiceId,
        invoiceNumber: invoice.invoice_number,
        messageId: sendResult.messageId,
      });

      return {
        success: true,
        invoiceId,
        invoiceNumber: invoice.invoice_number,
        whatsappSent: true,
        messageId: sendResult.messageId,
        waId: sendResult.waId,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      billingLogger.error('WhatsApp PayNow: Unexpected error', {
        invoiceId,
        error: errorMsg,
      });
      return {
        success: false,
        invoiceId,
        invoiceNumber: 'UNKNOWN',
        whatsappSent: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Send WhatsApp PayNow notifications in bulk
   * Filters to only customers with consent and phone numbers
   */
  static async sendBulkPayNowWhatsApp(
    invoiceIds: string[],
    notificationType: WhatsAppNotificationType = 'invoice_payment',
    options: {
      daysOverdue?: number;
      createdBy?: string;
      delayMs?: number; // Delay between messages for rate limiting
    } = {}
  ): Promise<WhatsAppBatchResult> {
    const { daysOverdue, createdBy = 'batch', delayMs = 100 } = options;

    const result: WhatsAppBatchResult = {
      total: invoiceIds.length,
      sent: 0,
      failed: 0,
      skippedNoConsent: 0,
      skippedNoPhone: 0,
      results: [],
      errors: [],
    };

    billingLogger.info('WhatsApp PayNow: Starting bulk send', {
      total: invoiceIds.length,
      notificationType,
    });

    for (const invoiceId of invoiceIds) {
      const sendResult = await this.sendPayNowWhatsApp(invoiceId, notificationType, {
        daysOverdue,
        createdBy,
      });

      result.results.push(sendResult);

      if (sendResult.whatsappSent) {
        result.sent++;
      } else if (sendResult.error?.includes('not consented')) {
        result.skippedNoConsent++;
      } else if (sendResult.error?.includes('no phone')) {
        result.skippedNoPhone++;
      } else {
        result.failed++;
        if (sendResult.error) {
          result.errors.push(`${sendResult.invoiceNumber}: ${sendResult.error}`);
        }
      }

      // Rate limiting delay
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    billingLogger.info('WhatsApp PayNow: Bulk send complete', {
      total: result.total,
      sent: result.sent,
      failed: result.failed,
      skippedNoConsent: result.skippedNoConsent,
      skippedNoPhone: result.skippedNoPhone,
    });

    return result;
  }

  /**
   * Get invoices eligible for WhatsApp notifications
   * Returns invoices where customer has consent and phone number
   */
  static async getEligibleInvoices(
    invoiceIds: string[]
  ): Promise<InvoiceForWhatsApp[]> {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabase.rpc('get_whatsapp_eligible_customers', {
      p_invoice_ids: invoiceIds,
    });

    if (error) {
      billingLogger.error('WhatsApp PayNow: Failed to get eligible invoices', {
        error: error.message,
      });
      return [];
    }

    return data || [];
  }

  /**
   * Check if a customer has WhatsApp consent
   */
  static async hasWhatsAppConsent(customerId: string): Promise<boolean> {
    try {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data } = await supabase
        .from('customers')
        .select('whatsapp_consent')
        .eq('id', customerId)
        .single();

      return data?.whatsapp_consent === true;
    } catch {
      return false;
    }
  }

  /**
   * Update customer WhatsApp consent
   */
  static async updateConsent(
    customerId: string,
    consent: boolean,
    source: 'signup' | 'sms_optin' | 'admin_import' | 'order_form' | 'partner_registration',
    adminUserId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Update customer consent
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          whatsapp_consent: consent,
          whatsapp_consent_at: consent ? new Date().toISOString() : null,
          whatsapp_consent_source: consent ? source : null,
        })
        .eq('id', customerId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Log admin consent updates
      if (adminUserId && source === 'admin_import') {
        await supabase.from('whatsapp_consent_audit').insert({
          admin_user_id: adminUserId,
          action: consent ? 'single_update' : 'revoke',
          customer_id: customerId,
          customer_count: 1,
        });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export const sendPayNowWhatsApp = WhatsAppPayNowService.sendPayNowWhatsApp.bind(
  WhatsAppPayNowService
);
export const sendBulkPayNowWhatsApp = WhatsAppPayNowService.sendBulkPayNowWhatsApp.bind(
  WhatsAppPayNowService
);
export const getEligibleInvoices = WhatsAppPayNowService.getEligibleInvoices.bind(
  WhatsAppPayNowService
);
export const hasWhatsAppConsent = WhatsAppPayNowService.hasWhatsAppConsent.bind(
  WhatsAppPayNowService
);
export const updateWhatsAppConsent = WhatsAppPayNowService.updateConsent.bind(
  WhatsAppPayNowService
);
