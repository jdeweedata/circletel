/**
 * Invoice Reminder Edge Function
 *
 * Automatically sends invoice reminder emails to customers 5 calendar days
 * before their payment due date.
 *
 * Schedule: Run daily at 06:00 UTC (08:00 SAST)
 * Trigger: pg_cron or external scheduler
 *
 * @module supabase/functions/invoice-reminder
 * @spec 20251130-invoice-email-reminder
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default days before due date to send reminder
const DEFAULT_DAYS_BEFORE_DUE = 5;

// Rate limiting: delay between emails (ms)
const EMAIL_DELAY_MS = 100;

interface ReminderResult {
  invoice_id: string;
  invoice_number: string;
  customer_email: string;
  success: boolean;
  error?: string;
}

interface InvoiceRecord {
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
  line_items?: Array<{ description: string; amount: number }>;
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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results: ReminderResult[] = [];
  let processed = 0;
  let sent = 0;
  let failed = 0;

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const baseUrl = Deno.env.get('NEXT_PUBLIC_BASE_URL') || 'https://www.circletel.co.za';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional parameters
    let daysBeforeDue = DEFAULT_DAYS_BEFORE_DUE;
    let invoiceIds: string[] | null = null;
    let dryRun = false;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        daysBeforeDue = body.days_before_due || DEFAULT_DAYS_BEFORE_DUE;
        invoiceIds = body.invoice_ids || null;
        dryRun = body.dry_run || false;
      } catch {
        // No body or invalid JSON - use defaults
      }
    }

    // Calculate target due date
    const today = new Date();
    const targetDueDate = new Date(today);
    targetDueDate.setDate(targetDueDate.getDate() + daysBeforeDue);
    const targetDateStr = targetDueDate.toISOString().split('T')[0];

    console.log(`Processing invoice reminders for due date: ${targetDateStr} (${daysBeforeDue} days from now)`);

    // Query invoices needing reminders
    let query = supabase
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
      .is('reminder_sent_at', null);

    // If specific invoice IDs provided, use those
    if (invoiceIds && invoiceIds.length > 0) {
      query = query.in('id', invoiceIds);
    } else {
      // Otherwise, filter by due date
      query = query.eq('due_date', targetDateStr);
    }

    const { data: invoices, error: queryError } = await query;

    if (queryError) {
      throw new Error(`Failed to query invoices: ${queryError.message}`);
    }

    if (!invoices || invoices.length === 0) {
      console.log('No invoices found needing reminders');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No invoices found needing reminders',
          target_due_date: targetDateStr,
          processed: 0,
          sent: 0,
          failed: 0,
          duration_ms: Date.now() - startTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${invoices.length} invoices needing reminders`);

    // Process each invoice
    for (const invoice of invoices as InvoiceRecord[]) {
      processed++;

      // Validate customer email
      if (!invoice.customer?.email || !invoice.customer.email.includes('@')) {
        console.log(`Skipping invoice ${invoice.invoice_number}: Invalid email`);
        results.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_email: invoice.customer?.email || 'MISSING',
          success: false,
          error: 'Invalid or missing customer email'
        });
        failed++;
        continue;
      }

      // Calculate days until due
      const dueDate = new Date(invoice.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Build service description
      const serviceDescription = invoice.line_items?.map(item => item.description).join(', ')
        || invoice.service?.service_name
        || 'Internet Service';

      // Calculate amount due
      const amountDue = invoice.total_amount - (invoice.amount_paid || 0);

      if (dryRun) {
        console.log(`[DRY RUN] Would send reminder for ${invoice.invoice_number} to ${invoice.customer.email}`);
        results.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_email: invoice.customer.email,
          success: true,
          error: 'DRY RUN - not sent'
        });
        sent++;
        continue;
      }

      // Send email via Resend API
      try {
        if (!resendApiKey) {
          throw new Error('RESEND_API_KEY not configured');
        }

        const emailHtml = buildEmailHtml({
          customer_name: `${invoice.customer.first_name} ${invoice.customer.last_name}`,
          invoice_number: invoice.invoice_number,
          invoice_date: formatDate(invoice.invoice_date),
          due_date: formatDate(invoice.due_date),
          amount_due: amountDue,
          service_description: serviceDescription,
          pdf_url: invoice.pdf_url,
          days_until_due: daysUntilDue,
          account_number: invoice.customer.account_number
        });

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'CircleTel <noreply@notifications.circletelsa.co.za>',
            to: invoice.customer.email,
            subject: `Payment Reminder: Invoice ${invoice.invoice_number} due in ${daysUntilDue} days`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          throw new Error(errorData.message || 'Email send failed');
        }

        const emailResult = await emailResponse.json();

        // Update invoice with reminder sent
        await supabase
          .from('customer_invoices')
          .update({
            reminder_sent_at: new Date().toISOString(),
            reminder_count: (invoice.reminder_count || 0) + 1,
            reminder_error: null
          })
          .eq('id', invoice.id);

        // Log to audit
        await supabase
          .from('invoice_audit_log')
          .insert({
            invoice_id: invoice.id,
            action: 'reminder_sent',
            new_data: {
              recipient_email: invoice.customer.email,
              message_id: emailResult.id,
              days_until_due: daysUntilDue
            },
            created_at: new Date().toISOString()
          });

        console.log(`Sent reminder for ${invoice.invoice_number} to ${invoice.customer.email}`);
        results.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_email: invoice.customer.email,
          success: true
        });
        sent++;

      } catch (emailError) {
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
        console.error(`Failed to send reminder for ${invoice.invoice_number}:`, errorMessage);

        // Update invoice with error
        await supabase
          .from('customer_invoices')
          .update({ reminder_error: errorMessage })
          .eq('id', invoice.id);

        // Log failure to audit
        await supabase
          .from('invoice_audit_log')
          .insert({
            invoice_id: invoice.id,
            action: 'reminder_failed',
            new_data: {
              recipient_email: invoice.customer.email,
              error: errorMessage
            },
            created_at: new Date().toISOString()
          });

        results.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          customer_email: invoice.customer.email,
          success: false,
          error: errorMessage
        });
        failed++;
      }

      // Rate limiting delay
      await delay(EMAIL_DELAY_MS);
    }

    const duration_ms = Date.now() - startTime;
    console.log(`Reminder processing complete: ${sent} sent, ${failed} failed, ${duration_ms}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processed} invoices: ${sent} sent, ${failed} failed`,
        target_due_date: targetDateStr,
        processed,
        sent,
        failed,
        results: failed > 0 ? results.filter(r => !r.success) : [],
        duration_ms,
        dry_run: dryRun
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Invoice reminder processing failed:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        processed,
        sent,
        failed,
        duration_ms: Date.now() - startTime
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// =============================================================================
// Helper Functions
// =============================================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

interface EmailData {
  customer_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount_due: number;
  service_description: string;
  pdf_url?: string;
  days_until_due: number;
  account_number?: string;
}

function buildEmailHtml(data: EmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.6;
          color: #1F2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border: 1px solid #E6E9EF;
          border-top: none;
        }
        .footer {
          background-color: #E6E9EF;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #4B5563;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #F5831F;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 20px 0;
        }
        .info-box {
          background-color: #FEF3C7;
          padding: 15px;
          border-radius: 6px;
          margin: 15px 0;
          border-left: 4px solid #F59E0B;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }
        .label {
          font-weight: bold;
          color: #4B5563;
        }
        .value {
          color: #1F2937;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">⏰ Payment Reminder</h1>
        <p style="margin: 5px 0 0; font-size: 14px;">Invoice ${data.invoice_number} due in ${data.days_until_due} days</p>
      </div>
      <div class="content">
        <h2>Hello ${data.customer_name},</h2>
        <p>This is a friendly reminder that payment for your invoice is due in <strong>${data.days_until_due} days</strong>.</p>

        <div class="info-box">
          <h3 style="margin-top: 0; color: #92400E;">Invoice Details</h3>
          <div class="info-row">
            <span class="label">Invoice Number:</span>
            <span class="value"><strong>${data.invoice_number}</strong></span>
          </div>
          <div class="info-row">
            <span class="label">Invoice Date:</span>
            <span class="value">${data.invoice_date}</span>
          </div>
          <div class="info-row">
            <span class="label">Due Date:</span>
            <span class="value"><strong style="color: #D97706;">${data.due_date}</strong></span>
          </div>
          <div class="info-row">
            <span class="label">Service:</span>
            <span class="value">${data.service_description}</span>
          </div>
          <div class="info-row" style="border-top: 2px solid #E6E9EF; padding-top: 10px; margin-top: 10px;">
            <span class="label">Amount Due:</span>
            <span class="value"><strong style="color: #F5831F; font-size: 20px;">R ${data.amount_due.toFixed(2)}</strong></span>
          </div>
        </div>

        <h3>💳 Payment Options</h3>
        <div class="info-box" style="background-color: #F3F4F6; border-left-color: #9CA3AF;">
          <p style="margin-top: 0;"><strong>EFT / Bank Transfer:</strong></p>
          <div class="info-row">
            <span class="label">Bank:</span>
            <span class="value">First National Bank (FNB)</span>
          </div>
          <div class="info-row">
            <span class="label">Account Name:</span>
            <span class="value">CircleTel (Pty) Ltd</span>
          </div>
          <div class="info-row">
            <span class="label">Account Number:</span>
            <span class="value">62956619547</span>
          </div>
          <div class="info-row">
            <span class="label">Branch Code:</span>
            <span class="value">250655</span>
          </div>
          <div class="info-row">
            <span class="label">Reference:</span>
            <span class="value"><strong>${data.invoice_number}</strong></span>
          </div>
        </div>

        ${data.pdf_url ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.pdf_url}" class="button">
            📄 View Invoice PDF
          </a>
        </div>
        ` : ''}

        <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Important:</strong> Please use your invoice number <strong>${data.invoice_number}</strong> as the payment reference to ensure your payment is allocated correctly.</p>
        </div>

        <p>If you have already made this payment, please disregard this reminder. If you have any questions about your invoice, please don't hesitate to contact us.</p>

        <p>Thank you for being a valued CircleTel customer!</p>
      </div>
      <div class="footer">
        <p>CircleTel (Pty) Ltd</p>
        <p>accounts@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
        ${data.account_number ? `<p>Account Number: ${data.account_number}</p>` : ''}
      </div>
    </body>
    </html>
  `;
}
