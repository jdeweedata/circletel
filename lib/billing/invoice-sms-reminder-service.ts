/**
 * Invoice SMS Reminder Service
 *
 * Handles automated SMS reminders for overdue invoices via Clickatell API.
 * Sends SMS notifications to customers with outstanding payments.
 *
 * @module lib/billing/invoice-sms-reminder-service
 */

import { createClient } from '@/lib/supabase/server';
import { ClickatellService } from '@/lib/integrations/clickatell/sms-service';
import { NotificationTrackingService } from '@/lib/billing/notification-tracking-service';
import { billingLogger } from '@/lib/logging';

// =============================================================================
// Types
// =============================================================================

export interface InvoiceForSmsReminder {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  days_overdue: number;
  sms_reminder_sent_at?: string;
  sms_reminder_count: number;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    account_number?: string;
  };
}

export interface SmsReminderResult {
  invoice_id: string;
  invoice_number: string;
  customer_phone: string;
  success: boolean;
  message_id?: string;
  error?: string;
}

export interface BatchSmsReminderResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  results: SmsReminderResult[];
  duration_ms: number;
}

export interface ProcessSmsRemindersOptions {
  minDaysOverdue?: number;
  maxDaysOverdue?: number;
  invoiceIds?: string[];
  dryRun?: boolean;
  maxReminders?: number; // Max SMS reminders per invoice (default: 3)
}

// =============================================================================
// SMS Message Templates
// =============================================================================

const SMS_TEMPLATES = {
  // First reminder (1-3 days overdue)
  first_reminder: (data: {
    customer_name: string;
    invoice_number: string;
    amount_due: number;
    days_overdue: number;
  }) =>
    `Hi ${data.customer_name}, your CircleTel invoice ${data.invoice_number} for R${data.amount_due.toFixed(2)} is ${data.days_overdue} day(s) overdue. Pay now: circletel.co.za/pay/${data.invoice_number} or email us on billing@circletel.co.za`,

  // Second reminder (4-7 days overdue)
  second_reminder: (data: {
    customer_name: string;
    invoice_number: string;
    amount_due: number;
    days_overdue: number;
  }) =>
    `URGENT: ${data.customer_name}, invoice ${data.invoice_number} (R${data.amount_due.toFixed(2)}) is ${data.days_overdue} days overdue. Service may be suspended. Pay: circletel.co.za/pay/${data.invoice_number} or email billing@circletel.co.za`,

  // Final reminder (8+ days overdue)
  final_reminder: (data: {
    customer_name: string;
    invoice_number: string;
    amount_due: number;
    days_overdue: number;
  }) =>
    `FINAL NOTICE: ${data.customer_name}, invoice ${data.invoice_number} (R${data.amount_due.toFixed(2)}) is ${data.days_overdue} days overdue. Pay immediately: circletel.co.za/pay/${data.invoice_number} or email billing@circletel.co.za`,
};

// =============================================================================
// Invoice SMS Reminder Service
// =============================================================================

export class InvoiceSmsReminderService {
  private static clickatell: ClickatellService | null = null;

  /**
   * Get Clickatell service instance (lazy initialization)
   */
  private static getClickatellService(): ClickatellService {
    if (!this.clickatell) {
      this.clickatell = new ClickatellService();
    }
    return this.clickatell;
  }

  /**
   * Find overdue invoices that need an SMS reminder.
   *
   * Criteria:
   * - Status is 'overdue' or 'unpaid' with due date in the past
   * - Customer has a valid phone number
   * - SMS reminder count is below max limit
   * - Hasn't received an SMS in the last 24 hours
   *
   * @param minDaysOverdue - Minimum days overdue to include (default: 1)
   * @param maxDaysOverdue - Maximum days overdue to include (default: 30)
   * @returns Array of invoices needing SMS reminders
   */
  static async findInvoicesNeedingSmsReminder(
    minDaysOverdue: number = 1,
    maxDaysOverdue: number = 30
  ): Promise<InvoiceForSmsReminder[]> {
    const supabase = await createClient();

    // Calculate date range
    const today = new Date();
    const maxOverdueDate = new Date(today);
    maxOverdueDate.setDate(maxOverdueDate.getDate() - minDaysOverdue);
    const minOverdueDate = new Date(today);
    minOverdueDate.setDate(minOverdueDate.getDate() - maxDaysOverdue);

    // 24 hours ago for rate limiting
    const twentyFourHoursAgo = new Date(today);
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: invoices, error } = await supabase
      .from('customer_invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        due_date,
        total_amount,
        amount_paid,
        amount_due,
        status,
        sms_reminder_sent_at,
        sms_reminder_count,
        customer:customers(
          id, first_name, last_name, phone, email, account_number
        )
      `)
      .in('status', ['overdue', 'unpaid', 'partial'])
      .lte('due_date', maxOverdueDate.toISOString().split('T')[0])
      .gte('due_date', minOverdueDate.toISOString().split('T')[0])
      .lt('sms_reminder_count', 3) // Max 3 SMS reminders
      .or(`sms_reminder_sent_at.is.null,sms_reminder_sent_at.lt.${twentyFourHoursAgo.toISOString()}`);

    if (error) {
      throw new Error(`Failed to fetch invoices needing SMS reminders: ${error.message}`);
    }

    // Filter and transform results
    const validInvoices: InvoiceForSmsReminder[] = [];

    for (const inv of invoices || []) {
      // Extract customer from relation (Supabase returns array for relations)
      const customer = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer;

      // Skip if no valid phone number
      if (!customer?.phone || !this.isValidPhoneNumber(customer.phone)) {
        continue;
      }

      // Calculate days overdue
      const dueDate = new Date(inv.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue < minDaysOverdue) {
        continue;
      }

      validInvoices.push({
        id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        total_amount: inv.total_amount,
        amount_paid: inv.amount_paid || 0,
        amount_due: inv.amount_due || (inv.total_amount - (inv.amount_paid || 0)),
        status: inv.status,
        days_overdue: daysOverdue,
        sms_reminder_sent_at: inv.sms_reminder_sent_at,
        sms_reminder_count: inv.sms_reminder_count || 0,
        customer: customer as InvoiceForSmsReminder['customer'],
      });
    }

    return validInvoices;
  }

  /**
   * Send an SMS reminder for a single invoice.
   *
   * @param invoiceId - The invoice ID to send reminder for
   * @returns Result indicating success or failure
   */
  static async sendSmsReminder(invoiceId: string): Promise<SmsReminderResult> {
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
        amount_due,
        status,
        sms_reminder_sent_at,
        sms_reminder_count,
        customer:customers(
          id, first_name, last_name, phone, email, account_number
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      return {
        invoice_id: invoiceId,
        invoice_number: 'UNKNOWN',
        customer_phone: 'UNKNOWN',
        success: false,
        error: `Invoice not found: ${fetchError?.message || 'No data returned'}`,
      };
    }

    // Extract customer from relation (Supabase returns array for relations)
    const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;

    // Validate customer phone
    if (!customer?.phone || !this.isValidPhoneNumber(customer.phone)) {
      await this.updateSmsReminderError(invoiceId, 'Invalid or missing customer phone number');
      return {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        customer_phone: customer?.phone || 'MISSING',
        success: false,
        error: 'Invalid or missing customer phone number',
      };
    }

    // Check if already sent today
    if (invoice.sms_reminder_sent_at) {
      const lastSent = new Date(invoice.sms_reminder_sent_at);
      const hoursSinceLastSms = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastSms < 24) {
        return {
          invoice_id: invoiceId,
          invoice_number: invoice.invoice_number,
          customer_phone: customer.phone,
          success: false,
          error: 'SMS already sent within last 24 hours',
        };
      }
    }

    // Check max reminders
    const reminderCount = invoice.sms_reminder_count || 0;
    if (reminderCount >= 3) {
      return {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        customer_phone: customer.phone,
        success: false,
        error: 'Maximum SMS reminders (3) already sent',
      };
    }

    // Calculate days overdue
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    // Select appropriate template based on reminder count and days overdue
    const amountDue = invoice.amount_due || (invoice.total_amount - (invoice.amount_paid || 0));
    const templateData = {
      customer_name: customer.first_name,
      invoice_number: invoice.invoice_number,
      amount_due: amountDue,
      days_overdue: daysOverdue,
    };

    let message: string;
    if (reminderCount === 0 && daysOverdue <= 3) {
      message = SMS_TEMPLATES.first_reminder(templateData);
    } else if (reminderCount <= 1 && daysOverdue <= 7) {
      message = SMS_TEMPLATES.second_reminder(templateData);
    } else {
      message = SMS_TEMPLATES.final_reminder(templateData);
    }

    // Determine template name based on reminder count
    let templateName: 'first_reminder' | 'second_reminder' | 'final_notice' = 'first_reminder';
    if (reminderCount === 0 && daysOverdue <= 3) {
      templateName = 'first_reminder';
    } else if (reminderCount <= 1 && daysOverdue <= 7) {
      templateName = 'second_reminder';
    } else {
      templateName = 'final_notice';
    }

    // Send SMS via Clickatell
    try {
      const clickatell = this.getClickatellService();
      const smsResult = await clickatell.sendSMS({
        to: customer.phone,
        text: message,
      });

      if (!smsResult.success) {
        throw new Error(smsResult.error || 'SMS send failed');
      }

      // Update invoice with SMS sent timestamp
      await supabase
        .from('customer_invoices')
        .update({
          sms_reminder_sent_at: new Date().toISOString(),
          sms_reminder_count: reminderCount + 1,
          sms_reminder_error: null,
        })
        .eq('id', invoiceId);

      // Log to notification tracking (for AR analytics)
      await NotificationTrackingService.logNotification({
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        customer_id: customer.id,
        notification_type: 'sms',
        notification_template: templateName,
        recipient: customer.phone,
        message_content: message,
        status: 'sent',
        provider: 'clickatell',
        provider_message_id: smsResult.messageId,
        amount_due: amountDue,
        days_overdue: daysOverdue,
        metadata: {
          reminder_number: reminderCount + 1,
        },
      });

      // Log to audit
      await this.logAudit(invoiceId, 'sms_reminder_sent', {
        recipient_phone: customer.phone,
        message_id: smsResult.messageId,
        days_overdue: daysOverdue,
        reminder_number: reminderCount + 1,
      });

      return {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        customer_phone: customer.phone,
        success: true,
        message_id: smsResult.messageId,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update invoice with error
      await this.updateSmsReminderError(invoiceId, errorMessage);

      // Log failed notification to tracking
      await NotificationTrackingService.logNotification({
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        customer_id: customer.id,
        notification_type: 'sms',
        notification_template: templateName,
        recipient: customer.phone,
        message_content: message,
        status: 'failed',
        provider: 'clickatell',
        error_message: errorMessage,
        amount_due: amountDue,
        days_overdue: daysOverdue,
      });

      // Log failure to audit
      await this.logAudit(invoiceId, 'sms_reminder_failed', {
        recipient_phone: customer.phone,
        error: errorMessage,
      });

      return {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
        customer_phone: customer.phone,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Process all overdue invoices needing SMS reminders.
   *
   * @param options - Processing options
   * @returns Batch result with success/failure counts
   */
  static async processReminders(
    options: ProcessSmsRemindersOptions = {}
  ): Promise<BatchSmsReminderResult> {
    const startTime = Date.now();
    const {
      minDaysOverdue = 1,
      maxDaysOverdue = 30,
      invoiceIds,
      dryRun = false,
      maxReminders = 3,
    } = options;

    const results: SmsReminderResult[] = [];
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    // Get invoices to process
    let invoices: InvoiceForSmsReminder[];

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
          amount_due,
          status,
          sms_reminder_sent_at,
          sms_reminder_count,
          customer:customers(
            id, first_name, last_name, phone, email, account_number
          )
        `)
        .in('id', invoiceIds);

      if (error) {
        throw new Error(`Failed to fetch specified invoices: ${error.message}`);
      }

      // Transform and calculate days overdue
      const today = new Date();
      invoices = (data || []).map((inv) => {
        const dueDate = new Date(inv.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        // Extract customer from relation (Supabase returns array for relations)
        const customer = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer;
        return {
          ...inv,
          amount_due: inv.amount_due || (inv.total_amount - (inv.amount_paid || 0)),
          days_overdue: daysOverdue,
          sms_reminder_count: inv.sms_reminder_count || 0,
          customer: customer as InvoiceForSmsReminder['customer'],
        };
      });
    } else {
      // Find overdue invoices
      invoices = await this.findInvoicesNeedingSmsReminder(minDaysOverdue, maxDaysOverdue);
    }

    // Process each invoice
    for (const invoice of invoices) {
      // Skip if max reminders reached
      if (invoice.sms_reminder_count >= maxReminders) {
        skipped++;
        results.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_phone: invoice.customer?.phone || 'UNKNOWN',
          success: false,
          error: `Max reminders (${maxReminders}) already sent`,
        });
        continue;
      }

      if (dryRun) {
        // Dry run - just log what would be sent
        billingLogger.info(
          `[DRY RUN] Would send SMS reminder for invoice ${invoice.invoice_number} to ${invoice.customer?.phone}`
        );
        results.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_phone: invoice.customer?.phone || 'UNKNOWN',
          success: true,
          error: 'DRY RUN - not sent',
        });
        sent++;
        continue;
      }

      const result = await this.sendSmsReminder(invoice.id);
      results.push(result);

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Delay between SMS to avoid rate limiting (500ms)
      await this.delay(500);
    }

    return {
      processed: invoices.length,
      sent,
      failed,
      skipped,
      results,
      duration_ms: Date.now() - startTime,
    };
  }

  /**
   * Get SMS reminder status for a specific invoice.
   */
  static async getReminderStatus(invoiceId: string): Promise<{
    invoice_id: string;
    sms_reminder_sent_at: string | null;
    sms_reminder_count: number;
    sms_reminder_error: string | null;
  }> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('customer_invoices')
      .select('id, sms_reminder_sent_at, sms_reminder_count, sms_reminder_error')
      .eq('id', invoiceId)
      .single();

    if (error || !data) {
      throw new Error(`Invoice not found: ${error?.message || 'No data'}`);
    }

    return {
      invoice_id: data.id,
      sms_reminder_sent_at: data.sms_reminder_sent_at,
      sms_reminder_count: data.sms_reminder_count || 0,
      sms_reminder_error: data.sms_reminder_error,
    };
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Validate phone number format (South African)
   */
  private static isValidPhoneNumber(phone: string): boolean {
    if (!phone) return false;

    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // South African mobile numbers: 10 digits starting with 0, or 11 digits starting with 27
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return true;
    }
    if (cleaned.length === 11 && cleaned.startsWith('27')) {
      return true;
    }
    if (cleaned.length === 9 && !cleaned.startsWith('0')) {
      // 9 digits without leading 0 (e.g., 821234567)
      return true;
    }

    return false;
  }

  /**
   * Update SMS reminder error on invoice.
   */
  private static async updateSmsReminderError(invoiceId: string, error: string): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('customer_invoices')
      .update({ sms_reminder_error: error })
      .eq('id', invoiceId);
  }

  /**
   * Log SMS reminder action to audit log.
   */
  private static async logAudit(
    invoiceId: string,
    action: 'sms_reminder_sent' | 'sms_reminder_failed',
    data: Record<string, unknown>
  ): Promise<void> {
    const supabase = await createClient();

    await supabase.from('invoice_audit_log').insert({
      invoice_id: invoiceId,
      action,
      new_data: data,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Delay helper for rate limiting.
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
