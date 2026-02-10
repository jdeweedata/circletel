/**
 * PayNow Billing Service
 *
 * Handles Pay Now payment link generation and notification for customer invoices.
 * Used by:
 * 1. Billing day processor cron - sends Pay Now to non-eMandate customers
 * 2. Failed debit handler - fallback when debit order fails
 * 3. Manual admin actions - resend Pay Now link
 *
 * Flow:
 * 1. Generate Pay Now URL via NetCash
 * 2. Store transaction reference in invoice for webhook reconciliation
 * 3. Send notification via email AND SMS
 * 4. Update invoice tracking fields
 */

import { createClient } from '@/lib/supabase/server';
import { netcashService } from '@/lib/payments/netcash-service';
import { clickatellService } from '@/lib/integrations/clickatell/sms-service';
import { billingLogger } from '@/lib/logging';
import type { CustomerInvoice } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface PayNowGenerationResult {
  success: boolean;
  paymentUrl?: string;
  transactionRef?: string;
  error?: string;
}

export interface PayNowNotificationResult {
  success: boolean;
  emailSent: boolean;
  smsSent: boolean;
  emailMessageId?: string;
  smsMessageId?: string;
  errors: string[];
}

export interface PayNowProcessResult {
  success: boolean;
  invoiceId: string;
  invoiceNumber: string;
  paymentUrl?: string;
  transactionRef?: string;
  notificationResult?: PayNowNotificationResult;
  errors: string[];
}

export interface InvoiceForPayNow {
  id: string;
  invoice_number: string;
  total_amount: number;
  due_date: string;
  status: string;
  customer_id: string;
  paynow_url?: string | null;
  paynow_transaction_ref?: string | null;
  paynow_sent_at?: string | null;
  customer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    account_number: string | null;
  } | null;
}

// =============================================================================
// SMS TEMPLATES
// =============================================================================

const SMS_TEMPLATES = {
  paymentDue: (name: string, invoiceNumber: string, amount: number, url: string) =>
    `Hi ${name}, your CircleTel invoice ${invoiceNumber} for R${amount.toFixed(2)} is due today. Pay now: ${url}`,

  paymentReminder: (name: string, invoiceNumber: string, amount: number, url: string) =>
    `Reminder: Your CircleTel invoice ${invoiceNumber} (R${amount.toFixed(2)}) is due. Pay securely: ${url}`,

  debitFailed: (name: string, invoiceNumber: string, amount: number, url: string) =>
    `Hi ${name}, your debit order for CircleTel invoice ${invoiceNumber} (R${amount.toFixed(2)}) could not be processed. Please pay here: ${url}`,

  emandatePending: (name: string, invoiceNumber: string, amount: number, url: string) =>
    `Hi ${name}, your CircleTel invoice ${invoiceNumber} (R${amount.toFixed(2)}) is due. Your debit order is not yet active. Pay now: ${url} or complete your debit order setup at circletel.co.za/dashboard/billing`,
};

// =============================================================================
// PAYNOW BILLING SERVICE
// =============================================================================

export class PayNowBillingService {
  /**
   * Process Pay Now for an invoice - main entry point
   * Generates payment URL, stores in invoice, sends notifications
   */
  static async processPayNowForInvoice(
    invoiceId: string,
    options: {
      sendEmail?: boolean;
      sendSms?: boolean;
      smsTemplate?: 'paymentDue' | 'paymentReminder' | 'debitFailed' | 'emandatePending';
      forceRegenerate?: boolean;
      includeEmandateReminder?: boolean; // Include CTA to complete eMandate setup
    } = {}
  ): Promise<PayNowProcessResult> {
    const {
      sendEmail = true,
      sendSms = true,
      smsTemplate = 'paymentDue',
      forceRegenerate = false,
      includeEmandateReminder = false,
    } = options;

    const errors: string[] = [];
    let paymentUrl: string | undefined;
    let transactionRef: string | undefined;
    let notificationResult: PayNowNotificationResult | undefined;

    try {
      const supabase = await createClient();

      // 1. Fetch invoice with customer details
      const { data: invoice, error: fetchError } = await supabase
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
          paynow_sent_at,
          customer:customers(
            id,
            first_name,
            last_name,
            email,
            phone,
            account_number
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (fetchError || !invoice) {
        const errorMsg = fetchError
          ? `Invoice fetch error: ${fetchError.message} (code: ${fetchError.code})`
          : `Invoice not found: ${invoiceId}`;
        billingLogger.error('PayNow: Invoice fetch failed', { invoiceId, error: fetchError?.message, code: fetchError?.code });
        return {
          success: false,
          invoiceId,
          invoiceNumber: 'UNKNOWN',
          errors: [errorMsg],
        };
      }

      billingLogger.info('PayNow: Processing invoice', {
        invoiceId,
        invoiceNumber: invoice.invoice_number,
        amount: invoice.total_amount,
        hasExistingPayNow: !!invoice.paynow_url,
      });

      // 2. Check if Pay Now already generated (unless force regenerate)
      if (invoice.paynow_url && invoice.paynow_transaction_ref && !forceRegenerate) {
        billingLogger.info('PayNow: Using existing payment URL', {
          invoiceId,
          transactionRef: invoice.paynow_transaction_ref,
        });
        paymentUrl = invoice.paynow_url;
        transactionRef = invoice.paynow_transaction_ref;
      } else {
        // 3. Generate new Pay Now URL
        const generateResult = await this.generatePayNowUrl(invoiceId);

        if (!generateResult.success || !generateResult.paymentUrl) {
          errors.push(generateResult.error || 'Failed to generate Pay Now URL');
          return {
            success: false,
            invoiceId,
            invoiceNumber: invoice.invoice_number,
            errors,
          };
        }

        paymentUrl = generateResult.paymentUrl;
        transactionRef = generateResult.transactionRef;

        // 4. Store Pay Now details in invoice
        const { error: updateError } = await supabase
          .from('customer_invoices')
          .update({
            paynow_url: paymentUrl,
            paynow_transaction_ref: transactionRef,
            payment_collection_method: 'paynow',
          })
          .eq('id', invoiceId);

        if (updateError) {
          billingLogger.error('PayNow: Failed to update invoice', { invoiceId, error: updateError.message });
          errors.push(`Failed to store payment URL: ${updateError.message}`);
        }
      }

      // 5. Send notifications
      if ((sendEmail || sendSms) && paymentUrl) {
        // Handle Supabase join returning customer as array
        const customerData = Array.isArray(invoice.customer)
          ? invoice.customer[0]
          : invoice.customer;

        const invoiceForPayNow: InvoiceForPayNow = {
          ...invoice,
          customer: customerData || null,
        };

        notificationResult = await this.sendPayNowNotifications(
          invoiceForPayNow,
          paymentUrl,
          {
            sendEmail,
            sendSms,
            smsTemplate,
            includeEmandateReminder,
          }
        );

        // Update invoice with notification tracking
        const sentVia: string[] = [];
        if (notificationResult.emailSent) sentVia.push('email');
        if (notificationResult.smsSent) sentVia.push('sms');

        if (sentVia.length > 0) {
          await supabase
            .from('customer_invoices')
            .update({
              paynow_sent_at: new Date().toISOString(),
              paynow_sent_via: sentVia,
            })
            .eq('id', invoiceId);
        }

        errors.push(...notificationResult.errors);
      }

      const success = errors.length === 0;

      billingLogger.info('PayNow: Processing complete', {
        invoiceId,
        invoiceNumber: invoice.invoice_number,
        success,
        emailSent: notificationResult?.emailSent,
        smsSent: notificationResult?.smsSent,
        errorsCount: errors.length,
      });

      return {
        success,
        invoiceId,
        invoiceNumber: invoice.invoice_number,
        paymentUrl,
        transactionRef,
        notificationResult,
        errors,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      billingLogger.error('PayNow: Processing failed', { invoiceId, error: errorMsg });
      return {
        success: false,
        invoiceId,
        invoiceNumber: 'UNKNOWN',
        errors: [errorMsg],
      };
    }
  }

  /**
   * Generate Pay Now payment URL for an invoice
   * Does NOT send notifications - use processPayNowForInvoice for full workflow
   */
  static async generatePayNowUrl(invoiceId: string): Promise<PayNowGenerationResult> {
    try {
      // Check if NetCash is configured
      if (!netcashService.isConfigured()) {
        billingLogger.error('PayNow: NetCash service not configured');
        return {
          success: false,
          error: 'Payment gateway not configured',
        };
      }

      // Generate payment using NetCash service
      const paymentData = await netcashService.initiatePaymentForInvoice(invoiceId);

      billingLogger.info('PayNow: URL generated', {
        invoiceId,
        transactionRef: paymentData.transactionReference,
      });

      return {
        success: true,
        paymentUrl: paymentData.paymentUrl,
        transactionRef: paymentData.transactionReference,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate payment URL';
      billingLogger.error('PayNow: URL generation failed', { invoiceId, error: errorMsg });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Send Pay Now notifications via email and SMS
   */
  static async sendPayNowNotifications(
    invoice: InvoiceForPayNow,
    paymentUrl: string,
    options: {
      sendEmail?: boolean;
      sendSms?: boolean;
      smsTemplate?: 'paymentDue' | 'paymentReminder' | 'debitFailed' | 'emandatePending';
      includeEmandateReminder?: boolean;
    } = {}
  ): Promise<PayNowNotificationResult> {
    const { sendEmail = true, sendSms = true, smsTemplate = 'paymentDue', includeEmandateReminder = false } = options;
    const errors: string[] = [];
    let emailSent = false;
    let smsSent = false;
    let emailMessageId: string | undefined;
    let smsMessageId: string | undefined;

    const customer = invoice.customer;
    const customerName = customer
      ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer'
      : 'Customer';

    // Send Email
    if (sendEmail && customer?.email) {
      try {
        const emailResult = await this.sendPayNowEmail(invoice, paymentUrl, customerName, includeEmandateReminder);
        if (emailResult.success) {
          emailSent = true;
          emailMessageId = emailResult.messageId;
          billingLogger.info('PayNow: Email sent', {
            invoiceId: invoice.id,
            email: customer.email,
            messageId: emailMessageId,
          });
        } else {
          errors.push(`Email failed: ${emailResult.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Email sending failed';
        errors.push(`Email error: ${errorMsg}`);
        billingLogger.error('PayNow: Email send error', { invoiceId: invoice.id, error: errorMsg });
      }
    } else if (sendEmail && !customer?.email) {
      errors.push('No email address available for customer');
    }

    // Send SMS
    if (sendSms && customer?.phone) {
      try {
        const smsText = SMS_TEMPLATES[smsTemplate](
          customerName,
          invoice.invoice_number,
          invoice.total_amount,
          paymentUrl
        );

        const smsResult = await clickatellService.sendSMS({
          to: customer.phone,
          text: smsText,
        });

        if (smsResult.success) {
          smsSent = true;
          smsMessageId = smsResult.messageId;
          billingLogger.info('PayNow: SMS sent', {
            invoiceId: invoice.id,
            phone: customer.phone,
            messageId: smsMessageId,
          });
        } else {
          errors.push(`SMS failed: ${smsResult.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'SMS sending failed';
        errors.push(`SMS error: ${errorMsg}`);
        billingLogger.error('PayNow: SMS send error', { invoiceId: invoice.id, error: errorMsg });
      }
    } else if (sendSms && !customer?.phone) {
      errors.push('No phone number available for customer');
    }

    return {
      success: emailSent || smsSent,
      emailSent,
      smsSent,
      emailMessageId,
      smsMessageId,
      errors,
    };
  }

  /**
   * Send Pay Now email notification
   * Uses Resend API for reliable delivery
   */
  private static async sendPayNowEmail(
    invoice: InvoiceForPayNow,
    paymentUrl: string,
    customerName: string,
    includeEmandateReminder = false
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' };
    }

    const customer = invoice.customer;
    if (!customer?.email) {
      return { success: false, error: 'No recipient email' };
    }

    try {
      // Build email HTML
      const emailHtml = this.buildPayNowEmailHtml({
        customerName,
        invoiceNumber: invoice.invoice_number,
        totalAmount: invoice.total_amount,
        dueDate: invoice.due_date,
        paymentUrl,
        accountNumber: customer.account_number || undefined,
        includeEmandateReminder,
      });

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'CircleTel Billing <billing@circletel.co.za>',
          to: [customer.email],
          subject: `Payment Due Today - Invoice ${invoice.invoice_number}`,
          html: emailHtml,
          tags: [
            { name: 'type', value: 'paynow' },
            { name: 'invoice', value: invoice.invoice_number },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email send failed',
      };
    }
  }

  /**
   * Build Pay Now email HTML
   * Simple, responsive template with prominent CTA
   */
  private static buildPayNowEmailHtml(params: {
    customerName: string;
    invoiceNumber: string;
    totalAmount: number;
    dueDate: string;
    paymentUrl: string;
    accountNumber?: string;
    includeEmandateReminder?: boolean;
  }): string {
    const { customerName, invoiceNumber, totalAmount, dueDate, paymentUrl, accountNumber, includeEmandateReminder = false } = params;
    const formattedAmount = `R ${totalAmount.toFixed(2)}`;
    const formattedDate = new Date(dueDate).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Due - CircleTel</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color: #F5831F; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">CircleTel</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1F2937; margin: 0 0 20px 0; font-size: 22px;">Payment Due Today</h2>

              <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Hi ${customerName},
              </p>

              <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                Your invoice payment is due today. Please pay now to keep your services active.
              </p>

              <!-- Invoice Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #6B7280; font-size: 14px; padding-bottom: 10px;">Invoice Number</td>
                        <td style="color: #1F2937; font-size: 14px; font-weight: bold; text-align: right; padding-bottom: 10px;">${invoiceNumber}</td>
                      </tr>
                      ${accountNumber ? `
                      <tr>
                        <td style="color: #6B7280; font-size: 14px; padding-bottom: 10px;">Account Number</td>
                        <td style="color: #1F2937; font-size: 14px; text-align: right; padding-bottom: 10px;">${accountNumber}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="color: #6B7280; font-size: 14px; padding-bottom: 10px;">Due Date</td>
                        <td style="color: #1F2937; font-size: 14px; text-align: right; padding-bottom: 10px;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="color: #6B7280; font-size: 14px; border-top: 1px solid #E5E7EB; padding-top: 15px;">Amount Due</td>
                        <td style="color: #F5831F; font-size: 24px; font-weight: bold; text-align: right; border-top: 1px solid #E5E7EB; padding-top: 15px;">${formattedAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Pay Now Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <a href="${paymentUrl}" style="display: inline-block; background-color: #F5831F; color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: none; padding: 16px 48px; border-radius: 8px;">Pay Now</a>
                  </td>
                </tr>
              </table>

              <p style="color: #6B7280; font-size: 14px; line-height: 20px; margin: 30px 0 0 0; text-align: center;">
                Pay securely via Card, EFT, or Instant EFT
              </p>

              <!-- Debit Order CTA -->
              ${includeEmandateReminder ? `
              <!-- URGENT: eMandate Pending Alert -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                <tr>
                  <td style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px;">
                    <p style="color: #92400E; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                      ⚠️ Your Debit Order Is Not Yet Active
                    </p>
                    <p style="color: #78350F; font-size: 14px; margin: 0 0 15px 0;">
                      We noticed your debit order authorization is still pending. To avoid manual payments each month, please complete your debit order setup now.
                    </p>
                    <a href="https://www.circletel.co.za/dashboard/billing/setup-debit-order" style="display: inline-block; background-color: #F59E0B; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 6px;">Complete Debit Order Setup →</a>
                  </td>
                </tr>
              </table>
              ` : `
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 30px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #1F2937; font-size: 16px; margin: 0 0 15px 0;">
                      <strong>Set up debit order for hassle-free payments</strong>
                    </p>
                    <p style="color: #6B7280; font-size: 14px; margin: 0 0 20px 0;">
                      Never worry about missing a payment again. Set up a debit order and we'll automatically collect your monthly bill.
                    </p>
                    <a href="https://www.circletel.co.za/dashboard/billing/setup-debit-order" style="display: inline-block; background-color: #1F2937; color: #ffffff; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 6px;">Set Up Debit Order</a>
                  </td>
                </tr>
              </table>
              `}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 30px; text-align: center;">
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 10px 0;">
                Questions? Contact us at <a href="mailto:support@circletel.co.za" style="color: #F5831F;">support@circletel.co.za</a>
              </p>
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                CircleTel (Pty) Ltd | South Africa
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Check if customer has active eMandate
   * Returns false if no mandate or mandate is not approved
   */
  static async hasActiveEmandate(customerId: string): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { data: paymentMethod } = await supabase
        .from('customer_payment_methods')
        .select('id, method_type, mandate_status')
        .eq('customer_id', customerId)
        .eq('method_type', 'debit_order')
        .eq('mandate_status', 'approved')
        .eq('is_active', true)
        .single();

      return !!paymentMethod;
    } catch {
      return false;
    }
  }

  /**
   * Batch process Pay Now for multiple invoices
   * Used by billing day cron to process all non-eMandate customers
   */
  static async processPayNowBatch(
    invoiceIds: string[],
    options: {
      sendEmail?: boolean;
      sendSms?: boolean;
      smsTemplate?: 'paymentDue' | 'paymentReminder' | 'debitFailed' | 'emandatePending';
    } = {}
  ): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: PayNowProcessResult[];
  }> {
    const results: PayNowProcessResult[] = [];
    let successful = 0;
    let failed = 0;

    billingLogger.info('PayNow: Starting batch processing', {
      count: invoiceIds.length,
    });

    for (const invoiceId of invoiceIds) {
      const result = await this.processPayNowForInvoice(invoiceId, options);
      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    billingLogger.info('PayNow: Batch processing complete', {
      processed: invoiceIds.length,
      successful,
      failed,
    });

    return {
      processed: invoiceIds.length,
      successful,
      failed,
      results,
    };
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export const processPayNowForInvoice = PayNowBillingService.processPayNowForInvoice.bind(PayNowBillingService);
export const generatePayNowUrl = PayNowBillingService.generatePayNowUrl.bind(PayNowBillingService);
export const sendPayNowNotifications = PayNowBillingService.sendPayNowNotifications.bind(PayNowBillingService);
export const hasActiveEmandate = PayNowBillingService.hasActiveEmandate.bind(PayNowBillingService);
export const processPayNowBatch = PayNowBillingService.processPayNowBatch.bind(PayNowBillingService);
