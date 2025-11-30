/**
 * Invoice Notification Service
 * Handles invoice creation workflow:
 * 1. Create invoice in Zoho Billing
 * 2. Send invoice email to customer via Resend
 * 3. Log notification status
 * 
 * Features:
 * - Idempotency: Prevents duplicate emails for the same trigger event
 * - Delivery verification: Checks email delivery status via Resend API
 * - Audit logging: Full history of all notification attempts
 */

import { createClient } from '@/lib/supabase/server';
import { sendInvoiceGenerated } from '@/lib/emails/enhanced-notification-service';
import { ZohoBillingClient } from '@/lib/integrations/zoho/billing-client';

// =============================================================================
// TYPES
// =============================================================================

export type NotificationTrigger = 
  | 'invoice_created'      // When invoice is first generated
  | 'invoice_updated'      // When invoice is modified
  | 'manual_send'          // Admin manually sends
  | 'payment_reminder'     // Automated reminder
  | 'overdue_notice';      // Overdue notification

export interface InvoiceNotificationParams {
  invoice_id: string;
  trigger: NotificationTrigger; // Required - identifies the event type
  sync_to_zoho?: boolean; // Default true
  send_email?: boolean; // Default true
  force_send?: boolean; // Override duplicate check (default false)
}

export interface InvoiceNotificationResult {
  success: boolean;
  zoho_invoice_id?: string;
  zoho_synced: boolean;
  email_sent: boolean;
  email_message_id?: string;
  email_verified?: boolean; // Whether delivery was confirmed
  skipped_duplicate?: boolean; // True if skipped due to duplicate
  errors: string[];
}

// =============================================================================
// INVOICE NOTIFICATION SERVICE
// =============================================================================

export class InvoiceNotificationService {
  private static RESEND_API_KEY = process.env.RESEND_API_KEY;

  /**
   * Process invoice notification workflow
   * 1. Check for duplicate notifications (idempotency)
   * 2. Fetch invoice details
   * 3. Sync to Zoho Billing (if enabled)
   * 4. Send email notification (if enabled)
   * 5. Verify email delivery
   */
  static async processInvoice(
    params: InvoiceNotificationParams
  ): Promise<InvoiceNotificationResult> {
    const { 
      invoice_id, 
      trigger, 
      sync_to_zoho = true, 
      send_email = true,
      force_send = false 
    } = params;
    
    const errors: string[] = [];
    let zoho_invoice_id: string | undefined;
    let zoho_synced = false;
    let email_sent = false;
    let email_message_id: string | undefined;
    let email_verified = false;
    let skipped_duplicate = false;

    try {
      const supabase = await createClient();

      // 1. Check for duplicate notification (idempotency check)
      if (!force_send && send_email) {
        const isDuplicate = await this.checkDuplicateNotification(invoice_id, trigger);
        if (isDuplicate) {
          console.log(`[InvoiceNotification] Skipping duplicate ${trigger} for invoice ${invoice_id}`);
          return {
            success: true,
            zoho_synced: false,
            email_sent: false,
            skipped_duplicate: true,
            errors: [],
          };
        }
      }

      // 2. Fetch invoice with customer details
      console.log(`[InvoiceNotification] Fetching invoice: ${invoice_id}`);
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('customer_invoices')
        .select(`
          *,
          customer:customers(
            id,
            first_name,
            last_name,
            email,
            phone,
            account_number,
            business_name
          )
        `)
        .eq('id', invoice_id)
        .single();

      if (invoiceError) {
        console.error(`[InvoiceNotification] Query error:`, invoiceError);
        throw new Error(`Invoice query failed: ${invoiceError.message}`);
      }
      
      if (!invoice) {
        throw new Error(`Invoice not found: ${invoice_id}`);
      }
      
      console.log(`[InvoiceNotification] Found invoice:`, invoice.invoice_number, 'Customer:', invoice.customer?.email);

      console.log(`[InvoiceNotification] Processing ${trigger} for invoice ${invoice.invoice_number}`);

      // 2. Sync to Zoho Billing
      if (sync_to_zoho) {
        try {
          const zohoResult = await this.syncToZoho(invoice);
          if (zohoResult.success) {
            zoho_invoice_id = zohoResult.zoho_invoice_id;
            zoho_synced = true;
            console.log(`[InvoiceNotification] Synced to Zoho: ${zoho_invoice_id}`);

            // Update invoice with Zoho ID
            await supabase
              .from('customer_invoices')
              .update({ zoho_invoice_id })
              .eq('id', invoice_id);
          } else {
            errors.push(`Zoho sync failed: ${zohoResult.error}`);
          }
        } catch (zohoError: any) {
          errors.push(`Zoho sync error: ${zohoError.message}`);
          console.error('[InvoiceNotification] Zoho sync error:', zohoError);
        }
      }

      // 4. Send email notification
      if (send_email && invoice.customer?.email) {
        try {
          const emailResult = await this.sendInvoiceEmail(invoice);
          if (emailResult.success) {
            email_sent = true;
            email_message_id = emailResult.message_id;
            console.log(`[InvoiceNotification] Email sent: ${email_message_id}`);

            // 5. Verify email delivery (async check after short delay)
            if (email_message_id) {
              // Wait 2 seconds for email to be processed
              await new Promise(resolve => setTimeout(resolve, 2000));
              email_verified = await this.verifyEmailDelivery(email_message_id);
              console.log(`[InvoiceNotification] Email verified: ${email_verified}`);
            }

            // Update invoice status to 'sent' if it was 'draft'
            if (invoice.status === 'draft') {
              await supabase
                .from('customer_invoices')
                .update({ status: 'unpaid' })
                .eq('id', invoice_id);
            }
          } else {
            errors.push(`Email failed: ${emailResult.error}`);
          }
        } catch (emailError: any) {
          errors.push(`Email error: ${emailError.message}`);
          console.error('[InvoiceNotification] Email error:', emailError);
        }
      }

      // 6. Log notification result
      await this.logNotification(invoice_id, {
        trigger,
        zoho_synced,
        zoho_invoice_id,
        email_sent,
        email_message_id,
        email_verified,
        errors,
      });

      return {
        success: errors.length === 0,
        zoho_invoice_id,
        zoho_synced,
        email_sent,
        email_message_id,
        email_verified,
        errors,
      };
    } catch (error: any) {
      console.error('[InvoiceNotification] Error:', error);
      return {
        success: false,
        zoho_synced: false,
        email_sent: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Sync invoice to Zoho Billing
   */
  private static async syncToZoho(invoice: any): Promise<{
    success: boolean;
    zoho_invoice_id?: string;
    error?: string;
  }> {
    try {
      // Check if customer has Zoho ID
      const supabase = await createClient();
      const { data: customer } = await supabase
        .from('customers')
        .select('zoho_billing_customer_id')
        .eq('id', invoice.customer_id)
        .single();

      if (!customer?.zoho_billing_customer_id) {
        return {
          success: false,
          error: 'Customer not synced to Zoho Billing',
        };
      }

      const billingClient = new ZohoBillingClient();

      // Build Zoho invoice payload
      const rawLineItems = invoice.line_items || [];
      console.log('[InvoiceNotification] Raw line items:', JSON.stringify(rawLineItems));
      
      if (!rawLineItems || rawLineItems.length === 0) {
        return {
          success: false,
          error: 'Invoice has no line items to sync',
        };
      }
      
      const lineItems = rawLineItems.map((item: any) => ({
        name: item.description || 'Service',
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        rate: Number(item.unit_price) || Number(item.amount) || 0,
      }));

      console.log('[InvoiceNotification] Zoho line items:', JSON.stringify(lineItems));

      const zohoPayload = {
        customer_id: customer.zoho_billing_customer_id,
        // Don't send invoice_number - let Zoho auto-generate it
        // We'll store the Zoho invoice number in our reference field
        date: invoice.invoice_date,
        due_date: invoice.due_date,
        line_items: lineItems,
        notes: `CircleTel Invoice ${invoice.invoice_number}`,
        // Custom field to reference our invoice number
        reference_number: invoice.invoice_number,
      };

      console.log('[InvoiceNotification] Zoho payload:', JSON.stringify(zohoPayload));

      const zohoInvoice = await billingClient.createInvoice(zohoPayload);

      return {
        success: true,
        zoho_invoice_id: zohoInvoice.invoice_id,
      };
    } catch (error: any) {
      console.error('[InvoiceNotification] Zoho sync error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send invoice email via Resend
   */
  private static async sendInvoiceEmail(invoice: any): Promise<{
    success: boolean;
    message_id?: string;
    error?: string;
  }> {
    try {
      const customer = invoice.customer;
      if (!customer?.email) {
        return {
          success: false,
          error: 'Customer email not found',
        };
      }

      const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer';

      // Parse line items
      const lineItems = (invoice.line_items || []).map((item: any) => ({
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || item.amount,
        amount: item.amount,
      }));

      const result = await sendInvoiceGenerated({
        invoice_id: invoice.id,
        customer_id: customer.id,
        email: customer.email,
        customer_name: customerName,
        company_name: customer.business_name,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        subtotal: invoice.subtotal,
        vat_amount: invoice.tax_amount || invoice.vat_amount || 0,
        due_date: invoice.due_date,
        account_number: customer.account_number,
        line_items: lineItems,
      });

      return result;
    } catch (error: any) {
      console.error('[InvoiceNotification] Email error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if a notification was already sent for this trigger
   * Prevents duplicate emails for the same event
   */
  private static async checkDuplicateNotification(
    invoiceId: string,
    trigger: NotificationTrigger
  ): Promise<boolean> {
    try {
      const supabase = await createClient();

      // Check for successful email sent in the last 24 hours for this trigger
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: existing } = await supabase
        .from('invoice_notification_log')
        .select('id')
        .eq('invoice_id', invoiceId)
        .eq('trigger', trigger)
        .eq('email_sent', true)
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .limit(1);

      return !!(existing && existing.length > 0);
    } catch (error) {
      console.error('[InvoiceNotification] Error checking duplicate:', error);
      // If check fails, allow the notification to proceed
      return false;
    }
  }

  /**
   * Verify email delivery status via Resend API
   */
  private static async verifyEmailDelivery(messageId: string): Promise<boolean> {
    try {
      if (!this.RESEND_API_KEY) {
        return false;
      }

      const response = await fetch(`https://api.resend.com/emails/${messageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.RESEND_API_KEY}`,
        },
      });

      if (!response.ok) {
        console.error('[InvoiceNotification] Failed to verify email:', response.statusText);
        return false;
      }

      const data = await response.json();
      
      // Resend email statuses: queued, sent, delivered, delivery_delayed, complained, bounced
      const successStatuses = ['sent', 'delivered'];
      const isDelivered = successStatuses.includes(data.last_event);
      
      console.log(`[InvoiceNotification] Email ${messageId} status: ${data.last_event}`);
      
      return isDelivered;
    } catch (error) {
      console.error('[InvoiceNotification] Error verifying email:', error);
      return false;
    }
  }

  /**
   * Log notification result
   */
  private static async logNotification(
    invoiceId: string,
    result: {
      trigger: NotificationTrigger;
      zoho_synced: boolean;
      zoho_invoice_id?: string;
      email_sent: boolean;
      email_message_id?: string;
      email_verified?: boolean;
      errors: string[];
    }
  ): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase.from('invoice_notification_log').insert({
        invoice_id: invoiceId,
        trigger: result.trigger,
        zoho_synced: result.zoho_synced,
        zoho_invoice_id: result.zoho_invoice_id,
        email_sent: result.email_sent,
        email_message_id: result.email_message_id,
        email_verified: result.email_verified || false,
        errors: result.errors.length > 0 ? result.errors : null,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[InvoiceNotification] Failed to log notification:', error);
      // Don't fail the main process if logging fails
    }
  }

  /**
   * Resend invoice email (for manual retry)
   */
  static async resendInvoiceEmail(invoiceId: string): Promise<{
    success: boolean;
    message_id?: string;
    error?: string;
  }> {
    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from('customer_invoices')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          account_number,
          business_name
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return {
        success: false,
        error: `Invoice not found: ${invoiceId}`,
      };
    }

    return this.sendInvoiceEmail(invoice);
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export const processInvoiceNotification = InvoiceNotificationService.processInvoice.bind(InvoiceNotificationService);
export const resendInvoiceEmail = InvoiceNotificationService.resendInvoiceEmail.bind(InvoiceNotificationService);
