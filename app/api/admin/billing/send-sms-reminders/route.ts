/**
 * Send Invoice SMS Reminders API
 * POST /api/admin/billing/send-sms-reminders
 *
 * Manually trigger SMS reminders for overdue invoices via Clickatell.
 * Admin authentication required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { InvoiceSmsReminderService } from '@/lib/billing/invoice-sms-reminder-service';

interface SendSmsRemindersRequest {
  invoice_ids?: string[];
  min_days_overdue?: number;
  max_days_overdue?: number;
  dry_run?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const sessionClient = await createClientWithSession();
    const {
      data: { user },
      error: authError,
    } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const supabase = await createClient();
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', user.email)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    let body: SendSmsRemindersRequest = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine - will use defaults
    }

    const {
      invoice_ids,
      min_days_overdue = 1,
      max_days_overdue = 30,
      dry_run = false,
    } = body;

    // Process SMS reminders
    const result = await InvoiceSmsReminderService.processReminders({
      invoiceIds: invoice_ids,
      minDaysOverdue: min_days_overdue,
      maxDaysOverdue: max_days_overdue,
      dryRun: dry_run,
    });

    // Log admin action
    await supabase.from('admin_activity_log').insert({
      admin_user_id: adminUser.id,
      action: dry_run ? 'preview_invoice_sms_reminders' : 'send_invoice_sms_reminders',
      resource_type: 'customer_invoice',
      resource_id: invoice_ids?.[0] || null,
      details: {
        invoice_ids: invoice_ids || 'all_overdue',
        min_days_overdue,
        max_days_overdue,
        dry_run,
        processed: result.processed,
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
      },
    });

    return NextResponse.json({
      success: true,
      message: dry_run
        ? `Dry run complete: ${result.processed} invoices would receive SMS reminders`
        : `SMS reminders processed: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`,
      ...result,
      dry_run,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Send SMS reminders failed:', errorMessage);

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

/**
 * GET /api/admin/billing/send-sms-reminders
 *
 * Preview overdue invoices that would receive SMS reminders.
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const sessionClient = await createClientWithSession();
    const {
      data: { user },
      error: authError,
    } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const supabase = await createClient();
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const minDaysOverdue = parseInt(searchParams.get('min_days') || '1', 10);
    const maxDaysOverdue = parseInt(searchParams.get('max_days') || '30', 10);

    // Find invoices needing SMS reminders
    const invoices = await InvoiceSmsReminderService.findInvoicesNeedingSmsReminder(
      minDaysOverdue,
      maxDaysOverdue
    );

    // Group by reminder count for summary
    const byReminderCount = {
      no_reminders: invoices.filter((inv) => inv.sms_reminder_count === 0).length,
      one_reminder: invoices.filter((inv) => inv.sms_reminder_count === 1).length,
      two_reminders: invoices.filter((inv) => inv.sms_reminder_count === 2).length,
    };

    // Calculate total outstanding
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.amount_due, 0);

    return NextResponse.json({
      success: true,
      min_days_overdue: minDaysOverdue,
      max_days_overdue: maxDaysOverdue,
      count: invoices.length,
      total_outstanding: totalOutstanding,
      by_reminder_count: byReminderCount,
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        due_date: inv.due_date,
        days_overdue: inv.days_overdue,
        total_amount: inv.total_amount,
        amount_due: inv.amount_due,
        customer_name: `${inv.customer.first_name} ${inv.customer.last_name}`,
        customer_phone: inv.customer.phone,
        sms_reminder_count: inv.sms_reminder_count,
        sms_reminder_sent_at: inv.sms_reminder_sent_at,
      })),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get pending SMS reminders failed:', errorMessage);

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
