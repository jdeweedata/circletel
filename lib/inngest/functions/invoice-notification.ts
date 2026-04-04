/**
 * Invoice Notification Inngest Function
 *
 * Triggered by billing/invoice.generated when the 25th-of-month cron
 * generates a new invoice. Sends email (full detail + Pay Now) and SMS
 * (short Pay Now link) to the customer.
 *
 * Retries: 3 — safe because emailed_at guard prevents duplicate sends.
 * Concurrency: 10 — avoids hammering Resend/Clickatell.
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { sendInvoiceGenerated } from '@/lib/emails/enhanced-notification-service';
import { ClickatellService } from '@/lib/integrations/clickatell/sms-service';
import { billingLogger } from '@/lib/logging';

// =============================================================================
// TYPES
// =============================================================================

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  due_date: string;
  paynow_url: string | null;
  emailed_at: string | null;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    account_number: string | null;
  };
}

// =============================================================================
// SMS TEMPLATE
// =============================================================================

function buildSmsMessage(params: {
  first_name: string;
  invoice_number: string;
  total_amount: number;
  due_date: string;
  paynow_url: string;
}): string {
  const dueDate = new Date(params.due_date).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const amount = params.total_amount.toFixed(2);
  return `Hi ${params.first_name}, your CircleTel invoice ${params.invoice_number} for R${amount} is due ${dueDate}. Pay now: ${params.paynow_url}`;
}

// =============================================================================
// INNGEST FUNCTION
// =============================================================================

export const invoiceNotificationFunction = inngest.createFunction(
  {
    id: 'invoice-notification',
    name: 'Invoice Notification (Email + SMS)',
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: 'billing/invoice.generated' },
  async ({ event, step }) => {
    const { invoice_id, customer_id } = event.data;

    // -------------------------------------------------------------------------
    // Step 1: Fetch invoice + customer
    // -------------------------------------------------------------------------
    const invoice = await step.run('fetch-invoice', async (): Promise<InvoiceRecord> => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('customer_invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          subtotal,
          tax_amount,
          due_date,
          paynow_url,
          emailed_at,
          line_items,
          customer:customers(
            id, first_name, last_name, email, phone, account_number
          )
        `)
        .eq('id', invoice_id)
        .single();

      if (error || !data) {
        throw new Error(`Invoice ${invoice_id} not found: ${error?.message}`);
      }

      if (data.emailed_at) {
        billingLogger.info(`Invoice ${data.invoice_number} already emailed at ${data.emailed_at}, skipping`);
        throw new Error(`ALREADY_NOTIFIED:${data.invoice_number}`);
      }

      const customer = Array.isArray(data.customer) ? data.customer[0] : data.customer;
      return { ...data, customer } as InvoiceRecord;
    });

    // -------------------------------------------------------------------------
    // Step 2: Send email
    // -------------------------------------------------------------------------
    await step.run('send-email', async () => {
      const emailResult = await sendInvoiceGenerated({
        invoice_id: invoice.id,
        customer_id: invoice.customer.id,
        email: invoice.customer.email,
        customer_name: `${invoice.customer.first_name} ${invoice.customer.last_name}`,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        subtotal: invoice.subtotal,
        vat_amount: invoice.tax_amount,
        due_date: invoice.due_date,
        account_number: invoice.customer.account_number ?? undefined,
        line_items: Array.isArray(invoice.line_items) ? invoice.line_items : [],
        paynow_url: invoice.paynow_url ?? undefined,
      });

      if (!emailResult.success) {
        throw new Error(`Email failed for invoice ${invoice.invoice_number}: ${emailResult.error}`);
      }

      billingLogger.info(`Email sent for invoice ${invoice.invoice_number}`);
      return { message_id: emailResult.message_id };
    });

    // -------------------------------------------------------------------------
    // Step 3: Send SMS
    // -------------------------------------------------------------------------
    await step.run('send-sms', async () => {
      if (!invoice.customer.phone) {
        billingLogger.warn(`No phone for customer ${invoice.customer.id}, skipping SMS for ${invoice.invoice_number}`);
        return { skipped: true, reason: 'no_phone' };
      }

      if (!invoice.paynow_url) {
        billingLogger.warn(`No paynow_url on invoice ${invoice.invoice_number}, skipping SMS`);
        return { skipped: true, reason: 'no_paynow_url' };
      }

      const message = buildSmsMessage({
        first_name: invoice.customer.first_name,
        invoice_number: invoice.invoice_number,
        total_amount: invoice.total_amount,
        due_date: invoice.due_date,
        paynow_url: invoice.paynow_url,
      });

      const clickatell = new ClickatellService();
      const smsResult = await clickatell.sendSMS({
        to: invoice.customer.phone,
        text: message,
      });

      if (!smsResult.success) {
        throw new Error(`SMS failed for invoice ${invoice.invoice_number}: ${smsResult.error}`);
      }

      billingLogger.info(`SMS sent for invoice ${invoice.invoice_number}`);
      return { message_id: smsResult.messageId };
    });

    // -------------------------------------------------------------------------
    // Step 4: Update invoice — mark as emailed, reset reminder count
    // -------------------------------------------------------------------------
    await step.run('update-invoice', async () => {
      const supabase = await createClient();
      const { error } = await supabase
        .from('customer_invoices')
        .update({
          emailed_at: new Date().toISOString(),
          sms_reminder_count: 0,
        })
        .eq('id', invoice.id);

      if (error) {
        throw new Error(`Failed to update invoice ${invoice.invoice_number}: ${error.message}`);
      }

      billingLogger.info(`Invoice ${invoice.invoice_number} marked as emailed`);
    });

    return {
      invoice_id,
      invoice_number: invoice.invoice_number,
      customer_id,
      notified: true,
    };
  }
);
