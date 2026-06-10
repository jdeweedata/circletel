/**
 * Clinic Vetting SLA Reminder Inngest Function
 *
 * Daily cron job that checks for clinics awaiting document vetting with due dates
 * approaching or past. Sends digest email to sales admin with overdue clinics.
 *
 * Trigger: Daily at 09:00 SAST (configured in vercel.json, when activated)
 * Retries: 2
 * Concurrency: 1 (digest only)
 *
 * IMPORTANT: This function must be wired in Coolify's cron settings.
 * vercel.json cron definitions are inactive (Coolify uses its own cron system).
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { differenceInDays } from 'date-fns';
import { Resend } from 'resend';

interface OverdueClinic {
  account_number: string;
  business_name: string;
  province: string;
  vetting_due_date: string;
  daysOverdue: number;
  customerEmail?: string;
}

// =============================================================================
// INNGEST FUNCTION
// =============================================================================

export const clinicVettingSlaFunction = inngest.createFunction(
  {
    id: 'clinic-vetting-sla',
    name: 'Clinic Vetting SLA Reminder',
    retries: 2,
    concurrency: { limit: 1 }, // Digest only; no parallelization needed
  },
  { cron: 'TZ=Africa/Johannesburg 0 9 * * *' }, // Daily at 09:00 SAST
  async ({ step }) => {
    const supabase = await createClient();
    const now = new Date();
    const reminderDeadline = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day from now

    apiLogger.info('[SLA Cron] Running clinic vetting SLA reminder');

    try {
      // Fetch clinics awaiting vetting with due dates approaching or overdue
      const { data: submissions, error: submissionsError } = await supabase
        .from('onboarding_submissions')
        .select(
          `
          id,
          customer_id,
          vetting_due_date,
          document_vetting_status,
          customers:customer_id (
            id,
            account_number,
            business_name,
            email,
            phone,
            clinic_details
          )
        `
        )
        .eq('status', 'submitted')
        .in('document_vetting_status', ['documents_pending', 'under_review'])
        .not('vetting_due_date', 'is', null)
        .lte('vetting_due_date', reminderDeadline.toISOString());

      if (submissionsError) {
        apiLogger.error('[SLA Cron] Failed to fetch submissions', { error: submissionsError });
        return {
          success: false,
          error: 'Failed to fetch submissions',
        };
      }

      const overdue: OverdueClinic[] = [];
      const soonDue: OverdueClinic[] = [];

      // Categorize clinics
      for (const submission of submissions || []) {
        const customer = Array.isArray(submission.customers)
          ? submission.customers[0]
          : submission.customers;

        if (!customer) continue;

        const dueDate = new Date(submission.vetting_due_date);
        const daysLeft = differenceInDays(dueDate, now);

        const clinic: OverdueClinic = {
          account_number: customer.account_number,
          business_name: customer.business_name,
          province:
            customer.clinic_details && typeof customer.clinic_details === 'object'
              ? (customer.clinic_details as any).province || ''
              : '',
          vetting_due_date: submission.vetting_due_date,
          daysOverdue: daysLeft < 0 ? Math.abs(daysLeft) : 0,
          customerEmail: customer.email,
        };

        if (daysLeft < 0) {
          overdue.push(clinic);
        } else if (daysLeft <= 1) {
          soonDue.push(clinic);
        }
      }

      const totalDue = overdue.length + soonDue.length;

      if (totalDue === 0) {
        apiLogger.info('[SLA Cron] No clinics with SLA concerns');
        return {
          success: true,
          totalDue: 0,
          overdueCount: 0,
          soonDueCount: 0,
        };
      }

      // Step: Send digest email to sales admin
      const emailSent = await step.run('send-sla-digest-email', async () => {
        const salesAdminEmail = process.env.CLINIC_VETTING_EMAIL || 'sales@circletel.co.za';
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Build HTML content for the digest
        const overdueHtml =
          overdue.length > 0
            ? `
          <h3 style="color: #d00;">Overdue (${overdue.length})</h3>
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 13px;">
            <thead>
              <tr style="background-color: #fee; border-bottom: 1px solid #ddd;">
                <th style="text-align: left; padding: 8px 4px;">Account</th>
                <th style="text-align: left; padding: 8px 4px;">Clinic</th>
                <th style="text-align: left; padding: 8px 4px;">Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              ${overdue.map(c => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 6px 4px; font-family: monospace;">${c.account_number}</td>
                  <td style="padding: 6px 4px;">${c.business_name}</td>
                  <td style="padding: 6px 4px; font-weight: bold; color: #d00;">${c.daysOverdue}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `
            : '';

        const soonDueHtml =
          soonDue.length > 0
            ? `
          <h3 style="color: #f80;">Due Soon (${soonDue.length})</h3>
          <table style="border-collapse: collapse; width: 100%; font-size: 13px;">
            <thead>
              <tr style="background-color: #ffe; border-bottom: 1px solid #ddd;">
                <th style="text-align: left; padding: 8px 4px;">Account</th>
                <th style="text-align: left; padding: 8px 4px;">Clinic</th>
                <th style="text-align: left; padding: 8px 4px;">Due Date</th>
              </tr>
            </thead>
            <tbody>
              ${soonDue.map(c => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 6px 4px; font-family: monospace;">${c.account_number}</td>
                  <td style="padding: 6px 4px;">${c.business_name}</td>
                  <td style="padding: 6px 4px;">${new Date(c.vetting_due_date).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `
            : '';

        const htmlContent = `
          <h2 style="color: #333; margin-top: 0;">Clinic Vetting SLA Alert</h2>
          <p style="font-size: 14px; color: #666;">Total clinics awaiting vetting: <strong>${totalDue}</strong></p>

          ${overdueHtml}
          ${soonDueHtml}

          <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
            <a href="https://www.circletel.co.za/admin/unjani/onboarding" style="color: #0066cc;">View Onboarding Pipeline</a>
          </p>
        `;

        try {
          const result = await resend.emails.send({
            from: 'billing@notify.circletel.co.za',
            to: salesAdminEmail,
            subject: `⏰ Clinic Vetting SLA Alert: ${overdue.length} overdue, ${soonDue.length} due soon`,
            html: htmlContent,
          });

          return { success: !result.error, error: result.error?.message };
        } catch (err) {
          return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to send email',
          };
        }
      });

      apiLogger.info('[SLA Cron] Digest sent', {
        totalDue,
        overdueCount: overdue.length,
        soonDueCount: soonDue.length,
        emailSent: emailSent.success,
      });

      return {
        success: true,
        totalDue,
        overdueCount: overdue.length,
        soonDueCount: soonDue.length,
        emailSent: emailSent.success,
      };
    } catch (error) {
      apiLogger.error('[SLA Cron] Unexpected error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error',
      };
    }
  }
);
