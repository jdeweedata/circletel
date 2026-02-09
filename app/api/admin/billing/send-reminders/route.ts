/**
 * Send Invoice Reminders API
 * POST /api/admin/billing/send-reminders
 *
 * Manually trigger invoice reminder emails.
 * Admin authentication required.
 *
 * @spec 20251130-invoice-email-reminder
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { InvoiceReminderService } from '@/lib/billing/invoice-reminder-service';
import { apiLogger } from '@/lib/logging';

interface SendRemindersRequest {
  invoice_ids?: string[];
  days_before_due?: number;
  dry_run?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const sessionClient = await createClientWithSession();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const supabase = await createClient();
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', user.email)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    let body: SendRemindersRequest = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine - will use defaults
    }

    const { invoice_ids, days_before_due = 5, dry_run = false } = body;

    // Process reminders
    const result = await InvoiceReminderService.processReminders({
      invoiceIds: invoice_ids,
      daysBeforeDue: days_before_due,
      dryRun: dry_run
    });

    // Log admin action
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_user_id: adminUser.id,
        action: dry_run ? 'preview_invoice_reminders' : 'send_invoice_reminders',
        resource_type: 'customer_invoice',
        resource_id: invoice_ids?.[0] || null,
        details: {
          invoice_ids: invoice_ids || 'all',
          days_before_due,
          dry_run,
          processed: result.processed,
          sent: result.sent,
          failed: result.failed
        }
      });

    return NextResponse.json({
      success: true,
      message: dry_run
        ? `Dry run complete: ${result.processed} invoices would receive reminders`
        : `Reminders processed: ${result.sent} sent, ${result.failed} failed`,
      ...result,
      dry_run
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('Send reminders failed:', errorMessage);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/billing/send-reminders
 *
 * Preview invoices that would receive reminders.
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const sessionClient = await createClientWithSession();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const supabase = await createClient();
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const daysBeforeDue = parseInt(searchParams.get('days') || '5', 10);

    // Find invoices needing reminders
    const invoices = await InvoiceReminderService.findInvoicesNeedingReminder(daysBeforeDue);

    // Calculate target due date for reference
    const today = new Date();
    const targetDueDate = new Date(today);
    targetDueDate.setDate(targetDueDate.getDate() + daysBeforeDue);

    return NextResponse.json({
      success: true,
      target_due_date: targetDueDate.toISOString().split('T')[0],
      days_before_due: daysBeforeDue,
      count: invoices.length,
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        due_date: inv.due_date,
        total_amount: inv.total_amount,
        amount_due: inv.total_amount - (inv.amount_paid || 0),
        customer_name: `${inv.customer.first_name} ${inv.customer.last_name}`,
        customer_email: inv.customer.email,
        reminder_count: inv.reminder_count
      }))
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('Get pending reminders failed:', errorMessage);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
