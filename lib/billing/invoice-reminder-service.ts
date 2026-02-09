/**
 * Invoice Reminder Service
 *
 * Handles automated invoice reminder emails sent to customers
 * 5 calendar days before payment due date.
 *
 * @module lib/billing/invoice-reminder-service
 * @spec 20251130-invoice-email-reminder
 */

import { createClient } from '@/lib/supabase/server';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import { NotificationTrackingService } from '@/lib/billing/notification-tracking-service';
import { billingLogger } from '@/lib/logging';

// =============================================================================
// Types
// =============================================================================

export interface InvoiceForReminder {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  status: string;
  pdf_url?: string;
  reminder_sent_at?: string;
  reminder_count: number;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    account_number?: string;
  };
  service?: {
    service_name?: string;
  };
  line_items?: Array<{
    description: string;
    amount: number;
  }>;
}

export interface ReminderResult {
  invoice_id: string;
  invoice_number: string;
  customer_email: string;
  success: boolean;
  error?: string;
}

export interface BatchReminderResult {
  processed: number;
  sent: number;
  failed: number;
  results: ReminderResult[];
  duration_ms: number;
}

export interface ProcessRemindersOptions {
  daysBeforeDue?: number;
  invoiceIds?: string[];
  dryRun?: boolean;
}

// =============================================================================
// Invoice Reminder Service
// =============================================================================

export class InvoiceReminderService {

  /**
   * Find invoices that need a reminder email.
   *
   * Criteria:
   * - Status is 'sent' (invoice has been sent to customer)
   * - Due date is exactly N days from today
   * - No reminder has been sent yet (reminder_sent_at is NULL)
   *
   * @param daysBeforeDue - Number of days before due date to send reminder (default: 5)
   * @returns Array of invoices needing reminders
   */
  static async findInvoicesNeedingReminder(daysBeforeDue: number = 5): Promise<InvoiceForReminder[]> {
    const supabase = await createClient();

    // Calculate the target due date (today + N days)
    const today = new Date();
    const targetDueDate = new Date(today);
    targetDueDate.setDate(targetDueDate.getDate() + daysBeforeDue);
    const targetDateStr = targetDueDate.toISOString().split('T')[0];

    const { data: invoices, error } = await supabase
      .from('customer_invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        due_date,
        total_amount,
        amount_paid,
        status,
        pdf_url,
        reminder_sent_at,
        reminder_count,
        line_items,
        customer:customers(
          id, first_name, last_name, email, account_number
        ),
        service:customer_services(
          service_name
        )
      `)
      .eq('status', 'sent')
      .eq('due_date', targetDateStr)
      .is('reminder_sent_at', null);

    if (error) {
      throw new Error(`Failed to fetch invoices needing reminders: ${error.message}`);
    }

    // Filter out invoices without valid customer email
    return (invoices || []).filter(inv =>
      inv.customer?.email && inv.customer.email.includes('@')
    ) as InvoiceForReminder[];
  }

  /**
   * Send a reminder email for a single invoice.
   *
   * @param invoiceId - The invoice ID to send reminder for
   * @returns Result indicating success or failure
   */
  static async sendReminder(invoiceId: string): Promise<ReminderResult> {
    const supabase = await createClient();

    // Fetch invoice with customer data
    const { data: invoice, error: fetchError } = await supabase
      .from('customer_invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        due_date,
        total_amount,
        amount_paid,
        status,
        pdf_url,
        reminder_sent_at,
        reminder_count,
        line_items,
        customer:customers(
          id, first_name, last_name, email, account_number
        ),
        service:customer_services(
          service_name
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      return {
        invoice_id: invoiceId,
        invoice_number: 'UNKNOWN',
        customer_email: 'UNKNOWN',
        success: false,
        error: `Invoice not found: ${fetchError?.message || 'No data returned'}`
      };
    }

    const typedInvoice = invoice as InvoiceForReminder;

    // Validate customer email
    if (!typedInvoice.customer?.email || !typedInvoice.customer.email.includes('@')) {
      await this.updateReminderError(invoiceId, 'Invalid or missing customer email');
      return {
        invoice_id: invoiceId,
        invoice_number: typedInvoice.invoice_number,
        customer_email: typedInvoice.customer?.email || 'MISSING',
        success: false,
        error: 'Invalid or missing customer email'
      };
    }

    // Check if already sent
    if (typedInvoice.reminder_sent_at) {
      return {
        invoice_id: invoiceId,
        invoice_number: typedInvoice.invoice_number,
        customer_email: typedInvoice.customer.email,
        success: false,
        error: 'Reminder already sent'
      };
    }

    // Calculate days until due
    const today = new Date();
    const dueDate = new Date(typedInvoice.due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Build service description from line items
    const serviceDescription = typedInvoice.line_items?.map(item => item.description).join(', ')
      || typedInvoice.service?.service_name
      || 'Internet Service';

    // Send email
    try {
      const emailResult = await EmailNotificationService.send({
        to: typedInvoice.customer.email,
        subject: `Payment Reminder: Invoice ${typedInvoice.invoice_number} due in ${daysUntilDue} days`,
        template: 'invoice_due_reminder',
        data: {
          customer_name: `${typedInvoice.customer.first_name} ${typedInvoice.customer.last_name}`,
          invoice_number: typedInvoice.invoice_number,
          invoice_date: this.formatDate(typedInvoice.invoice_date),
          due_date: this.formatDate(typedInvoice.due_date),
          total_amount: typedInvoice.total_amount,
          amount_due: typedInvoice.total_amount - (typedInvoice.amount_paid || 0),
          service_description: serviceDescription,
          pdf_url: typedInvoice.pdf_url,
          days_until_due: daysUntilDue,
          account_number: typedInvoice.customer.account_number
        },
        // Include tags for Resend webhook tracking
        tags: {
          template_id: 'invoice_due_reminder',
          invoice_id: invoiceId,
          customer_id: typedInvoice.customer.id,
          notification_type: 'billing_reminder'
        }
      });

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Email send failed');
      }

      // Update invoice with reminder sent timestamp
      await supabase
        .from('customer_invoices')
        .update({
          reminder_sent_at: new Date().toISOString(),
          reminder_count: (typedInvoice.reminder_count || 0) + 1,
          reminder_error: null
        })
        .eq('id', invoiceId);

      // Log to notification tracking for AR analytics
      const amountDue = typedInvoice.total_amount - (typedInvoice.amount_paid || 0);
      await NotificationTrackingService.logNotification({
        invoice_id: invoiceId,
        invoice_number: typedInvoice.invoice_number,
        customer_id: typedInvoice.customer.id,
        notification_type: 'email',
        notification_template: daysUntilDue > 0 ? 'due_reminder' : 'overdue_reminder',
        recipient: typedInvoice.customer.email,
        message_content: `Payment reminder for invoice ${typedInvoice.invoice_number}`,
        status: 'sent',
        provider: 'resend',
        provider_message_id: emailResult.message_id,
        amount_due: amountDue,
        days_overdue: daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0,
        metadata: {
          days_until_due: daysUntilDue,
          reminder_count: (typedInvoice.reminder_count || 0) + 1,
          template: 'invoice_due_reminder'
        }
      });

      // Log to audit
      await this.logAudit(invoiceId, 'reminder_sent', {
        recipient_email: typedInvoice.customer.email,
        message_id: emailResult.message_id,
        days_until_due: daysUntilDue
      });

      return {
        invoice_id: invoiceId,
        invoice_number: typedInvoice.invoice_number,
        customer_email: typedInvoice.customer.email,
        success: true
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update invoice with error
      await this.updateReminderError(invoiceId, errorMessage);

      // Log failed notification for AR analytics
      const amountDue = typedInvoice.total_amount - (typedInvoice.amount_paid || 0);
      await NotificationTrackingService.logNotification({
        invoice_id: invoiceId,
        invoice_number: typedInvoice.invoice_number,
        customer_id: typedInvoice.customer.id,
        notification_type: 'email',
        notification_template: daysUntilDue > 0 ? 'due_reminder' : 'overdue_reminder',
        recipient: typedInvoice.customer.email,
        message_content: `Payment reminder for invoice ${typedInvoice.invoice_number}`,
        status: 'failed',
        provider: 'resend',
        error_message: errorMessage,
        amount_due: amountDue,
        days_overdue: daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0,
        metadata: {
          days_until_due: daysUntilDue,
          reminder_count: (typedInvoice.reminder_count || 0) + 1
        }
      });

      // Log failure to audit
      await this.logAudit(invoiceId, 'reminder_failed', {
        recipient_email: typedInvoice.customer.email,
        error: errorMessage
      });

      return {
        invoice_id: invoiceId,
        invoice_number: typedInvoice.invoice_number,
        customer_email: typedInvoice.customer.email,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Process all invoices needing reminders.
   *
   * @param options - Processing options
   * @returns Batch result with success/failure counts
   */
  static async processReminders(options: ProcessRemindersOptions = {}): Promise<BatchReminderResult> {
    const startTime = Date.now();
    const { daysBeforeDue = 5, invoiceIds, dryRun = false } = options;

    const results: ReminderResult[] = [];
    let sent = 0;
    let failed = 0;

    // Get invoices to process
    let invoices: InvoiceForReminder[];

    if (invoiceIds && invoiceIds.length > 0) {
      // Process specific invoices
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('customer_invoices')
        .select(`
          id,
          invoice_number,
          invoice_date,
          due_date,
          total_amount,
          amount_paid,
          status,
          pdf_url,
          reminder_sent_at,
          reminder_count,
          line_items,
          customer:customers(
            id, first_name, last_name, email, account_number
          ),
          service:customer_services(
            service_name
          )
        `)
        .in('id', invoiceIds);

      if (error) {
        throw new Error(`Failed to fetch specified invoices: ${error.message}`);
      }

      invoices = (data || []) as InvoiceForReminder[];
    } else {
      // Find invoices due in N days
      invoices = await this.findInvoicesNeedingReminder(daysBeforeDue);
    }

    // Process each invoice
    for (const invoice of invoices) {
      if (dryRun) {
        // Dry run - just log what would be sent
        billingLogger.info(`[DRY RUN] Would send reminder for invoice ${invoice.invoice_number} to ${invoice.customer?.email}`);
        results.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_email: invoice.customer?.email || 'UNKNOWN',
          success: true,
          error: 'DRY RUN - not sent'
        });
        sent++;
        continue;
      }

      const result = await this.sendReminder(invoice.id);
      results.push(result);

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Small delay between emails to avoid rate limiting
      await this.delay(100);
    }

    return {
      processed: invoices.length,
      sent,
      failed,
      results,
      duration_ms: Date.now() - startTime
    };
  }

  /**
   * Get reminder status for a specific invoice.
   *
   * @param invoiceId - The invoice ID
   * @returns Reminder status info
   */
  static async getReminderStatus(invoiceId: string): Promise<{
    invoice_id: string;
    reminder_sent_at: string | null;
    reminder_count: number;
    reminder_error: string | null;
  }> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('customer_invoices')
      .select('id, reminder_sent_at, reminder_count, reminder_error')
      .eq('id', invoiceId)
      .single();

    if (error || !data) {
      throw new Error(`Invoice not found: ${error?.message || 'No data'}`);
    }

    return {
      invoice_id: data.id,
      reminder_sent_at: data.reminder_sent_at,
      reminder_count: data.reminder_count || 0,
      reminder_error: data.reminder_error
    };
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Update reminder error on invoice.
   */
  private static async updateReminderError(invoiceId: string, error: string): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('customer_invoices')
      .update({ reminder_error: error })
      .eq('id', invoiceId);
  }

  /**
   * Log reminder action to audit log.
   */
  private static async logAudit(
    invoiceId: string,
    action: 'reminder_sent' | 'reminder_failed',
    data: Record<string, unknown>
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('invoice_audit_log')
      .insert({
        invoice_id: invoiceId,
        action,
        new_data: data,
        created_at: new Date().toISOString()
      });
  }

  /**
   * Format date for email display.
   */
  private static formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Delay helper for rate limiting.
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
