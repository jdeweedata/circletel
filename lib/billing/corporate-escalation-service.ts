import { createClient } from '@/lib/supabase/server';
import { EmailChannel } from '@/lib/notifications/channels/email-channel';
import { NotificationTrackingService } from '@/lib/billing/notification-tracking-service';
import { billingLogger } from '@/lib/logging';

interface OverdueClinicInvoice {
  invoice_id: string;
  invoice_number: string;
  site_name: string;
  nurse_name: string;
  nurse_email: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  due_date: string;
  days_overdue: number;
  sms_reminder_count: number;
  transaction_ref: string | null;
}

interface CorporateEscalationResult {
  corporate_account_id: string;
  corporate_name: string;
  billing_email: string;
  overdue_count: number;
  total_overdue_amount: number;
  email_sent: boolean;
  error?: string;
}

export interface EscalationBatchResult {
  processed: number;
  sent: number;
  failed: number;
  results: CorporateEscalationResult[];
  duration_ms: number;
}

const MIN_DAYS_OVERDUE = 8;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

export class CorporateEscalationService {

  static async findOverdueCorporateInvoices(): Promise<Map<string, OverdueClinicInvoice[]>> {
    const supabase = await createClient();

    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - MIN_DAYS_OVERDUE);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const { data: invoices, error } = await supabase
      .from('customer_invoices')
      .select(`
        id,
        invoice_number,
        total_amount,
        amount_paid,
        due_date,
        sms_reminder_count,
        transaction_ref,
        corporate_account_id,
        corporate_site_id,
        customer:customers(
          first_name, last_name, email
        )
      `)
      .in('status', ['overdue', 'unpaid', 'partial'])
      .not('corporate_account_id', 'is', null)
      .lte('due_date', cutoffStr);

    if (error) {
      throw new Error(`Failed to fetch overdue corporate invoices: ${error.message}`);
    }

    if (!invoices || invoices.length === 0) {
      return new Map();
    }

    const siteIds = [...new Set(invoices.map(i => i.corporate_site_id).filter(Boolean))];
    const { data: sites } = await supabase
      .from('corporate_sites')
      .select('id, site_name')
      .in('id', siteIds as string[]);

    const siteMap = new Map((sites || []).map(s => [s.id, s.site_name]));

    const grouped = new Map<string, OverdueClinicInvoice[]>();

    for (const inv of invoices) {
      if (!inv.corporate_account_id) continue;

      const customer = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer;
      if (!customer) continue;

      const dueDate = new Date(inv.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const record: OverdueClinicInvoice = {
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        site_name: siteMap.get(inv.corporate_site_id ?? '') || 'Unknown Site',
        nurse_name: `${customer.first_name} ${customer.last_name}`,
        nurse_email: customer.email,
        total_amount: inv.total_amount,
        amount_paid: inv.amount_paid || 0,
        amount_due: inv.total_amount - (inv.amount_paid || 0),
        due_date: inv.due_date,
        days_overdue: daysOverdue,
        sms_reminder_count: inv.sms_reminder_count || 0,
        transaction_ref: inv.transaction_ref,
      };

      const existing = grouped.get(inv.corporate_account_id) || [];
      existing.push(record);
      grouped.set(inv.corporate_account_id, existing);
    }

    return grouped;
  }

  static async processEscalations(): Promise<EscalationBatchResult> {
    const startTime = Date.now();
    const results: CorporateEscalationResult[] = [];
    let sent = 0;
    let failed = 0;

    const grouped = await this.findOverdueCorporateInvoices();

    if (grouped.size === 0) {
      billingLogger.info('No overdue corporate invoices found for escalation');
      return { processed: 0, sent: 0, failed: 0, results: [], duration_ms: Date.now() - startTime };
    }

    const supabase = await createClient();
    const corporateIds = [...grouped.keys()];

    const { data: accounts } = await supabase
      .from('corporate_accounts')
      .select('id, company_name, billing_contact_email, billing_contact_name')
      .in('id', corporateIds);

    if (!accounts || accounts.length === 0) {
      billingLogger.warn('No corporate accounts found for escalation IDs', { corporateIds });
      return { processed: 0, sent: 0, failed: 0, results: [], duration_ms: Date.now() - startTime };
    }

    for (const account of accounts) {
      const overdueInvoices = grouped.get(account.id);
      if (!overdueInvoices || overdueInvoices.length === 0) continue;

      const billingEmail = account.billing_contact_email;
      if (!billingEmail) {
        results.push({
          corporate_account_id: account.id,
          corporate_name: account.company_name,
          billing_email: 'MISSING',
          overdue_count: overdueInvoices.length,
          total_overdue_amount: overdueInvoices.reduce((sum, i) => sum + i.amount_due, 0),
          email_sent: false,
          error: 'No billing contact email configured',
        });
        failed++;
        continue;
      }

      const totalOverdue = overdueInvoices.reduce((sum, i) => sum + i.amount_due, 0);

      try {
        const alreadySentToday = await this.hasEscalationSentToday(account.id);
        if (alreadySentToday) {
          billingLogger.info(`Escalation already sent today for ${account.company_name}, skipping`);
          continue;
        }

        const html = this.renderEscalationEmail(
          account.company_name,
          account.billing_contact_name || 'Finance Team',
          overdueInvoices,
          totalOverdue
        );

        const emailResult = await EmailChannel.send({
          to: billingEmail,
          subject: `CircleTel: ${overdueInvoices.length} Overdue Invoice${overdueInvoices.length > 1 ? 's' : ''} — Action Required`,
          html,
          from: 'CircleTel Billing <billing@notify.circletel.co.za>',
        });

        if (!emailResult.success) {
          throw new Error(emailResult.error || 'Email send failed');
        }

        await this.logEscalation(account.id, overdueInvoices, billingEmail, emailResult.message_id);

        results.push({
          corporate_account_id: account.id,
          corporate_name: account.company_name,
          billing_email: billingEmail,
          overdue_count: overdueInvoices.length,
          total_overdue_amount: totalOverdue,
          email_sent: true,
        });
        sent++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        billingLogger.error(`Corporate escalation failed for ${account.company_name}`, { error: errorMessage });
        results.push({
          corporate_account_id: account.id,
          corporate_name: account.company_name,
          billing_email: billingEmail,
          overdue_count: overdueInvoices.length,
          total_overdue_amount: totalOverdue,
          email_sent: false,
          error: errorMessage,
        });
        failed++;
      }
    }

    return {
      processed: results.length,
      sent,
      failed,
      results,
      duration_ms: Date.now() - startTime,
    };
  }

  private static async hasEscalationSentToday(corporateAccountId: string): Promise<boolean> {
    const supabase = await createClient();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('invoice_notification_log')
      .select('id')
      .eq('notification_template', 'corporate_escalation')
      .gte('sent_at', todayStart.toISOString())
      .eq('metadata->>corporate_account_id', corporateAccountId)
      .limit(1);

    return (data && data.length > 0) || false;
  }

  private static async logEscalation(
    corporateAccountId: string,
    invoices: OverdueClinicInvoice[],
    recipientEmail: string,
    messageId?: string
  ): Promise<void> {
    const totalOverdue = invoices.reduce((sum, i) => sum + i.amount_due, 0);

    for (const inv of invoices) {
      await NotificationTrackingService.logNotification({
        invoice_id: inv.invoice_id,
        invoice_number: inv.invoice_number,
        customer_id: '',
        notification_type: 'email',
        notification_template: 'corporate_escalation',
        recipient: recipientEmail,
        message_content: `Corporate escalation: ${inv.site_name} - R${inv.amount_due.toFixed(2)} overdue ${inv.days_overdue} days`,
        status: 'sent',
        provider: 'resend',
        provider_message_id: messageId,
        amount_due: inv.amount_due,
        days_overdue: inv.days_overdue,
        metadata: {
          corporate_account_id: corporateAccountId,
          site_name: inv.site_name,
          nurse_name: inv.nurse_name,
          total_escalation_amount: totalOverdue,
          invoices_in_escalation: invoices.length,
        },
      });
    }
  }

  private static formatCurrency(amount: number): string {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private static formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private static renderEscalationEmail(
    companyName: string,
    contactName: string,
    invoices: OverdueClinicInvoice[],
    totalOverdue: number
  ): string {
    const sorted = [...invoices].sort((a, b) => b.days_overdue - a.days_overdue);

    const rows = sorted.map(inv => {
      const payNowUrl = inv.transaction_ref
        ? `${BASE_URL}/api/paynow/${inv.transaction_ref}`
        : '';
      const payNowLink = payNowUrl
        ? `<a href="${payNowUrl}" style="color:#F5831F;text-decoration:underline;">Pay Now</a>`
        : '—';

      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #E6E9EF;">${inv.site_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E6E9EF;">${inv.nurse_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E6E9EF;">${inv.invoice_number}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E6E9EF;text-align:right;">${this.formatCurrency(inv.amount_due)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E6E9EF;text-align:center;">${inv.days_overdue}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #E6E9EF;text-align:center;">${payNowLink}</td>
        </tr>`;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1F2937;max-width:700px;margin:0 auto;padding:20px;">
        <div style="background-color:#1B2A4A;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;font-size:22px;">Overdue Invoice Summary</h1>
          <p style="margin:5px 0 0;opacity:0.9;">CircleTel — ${companyName}</p>
        </div>

        <div style="background:#ffffff;padding:30px;border:1px solid #E6E9EF;border-top:none;">
          <p>Dear ${contactName},</p>

          <p>This is an automated notification that <strong>${invoices.length} invoice${invoices.length > 1 ? 's' : ''}</strong>
          across your clinic sites ${invoices.length > 1 ? 'are' : 'is'} currently overdue, totalling
          <strong>${this.formatCurrency(totalOverdue)}</strong>.</p>

          <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
            <thead>
              <tr style="background-color:#F8F9FA;">
                <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #1B2A4A;">Clinic</th>
                <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #1B2A4A;">Nurse</th>
                <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #1B2A4A;">Invoice</th>
                <th style="padding:10px 12px;text-align:right;border-bottom:2px solid #1B2A4A;">Amount Due</th>
                <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #1B2A4A;">Days Overdue</th>
                <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #1B2A4A;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
            <tfoot>
              <tr style="background-color:#FEF3E2;">
                <td colspan="3" style="padding:10px 12px;font-weight:bold;">Total Outstanding</td>
                <td style="padding:10px 12px;text-align:right;font-weight:bold;">${this.formatCurrency(totalOverdue)}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>

          <p>Each nurse operator has received individual SMS and email reminders. If a nurse requires assistance
          with payment, you can use the <strong>Pay Now</strong> links above or contact our support team.</p>

          <div style="background-color:#F0F9FF;border-left:4px solid #1B2A4A;padding:15px;margin:20px 0;">
            <strong>Need help?</strong><br>
            WhatsApp: <a href="https://wa.me/27824873900" style="color:#F5831F;">082 487 3900</a><br>
            Email: <a href="mailto:contactus@circletel.co.za" style="color:#F5831F;">contactus@circletel.co.za</a>
          </div>

          <p style="color:#6B7280;font-size:13px;">This is an automated daily summary. You will receive one email per day while invoices remain overdue.</p>
        </div>

        <div style="background-color:#F8F9FA;padding:15px;text-align:center;border-radius:0 0 8px 8px;border:1px solid #E6E9EF;border-top:none;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;">
            CircleTel (Pty) Ltd &bull; South Africa &bull;
            <a href="https://www.circletel.co.za" style="color:#F5831F;text-decoration:none;">www.circletel.co.za</a>
          </p>
        </div>
      </body>
      </html>
    `;
  }
}
