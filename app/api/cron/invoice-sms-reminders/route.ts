/**
 * Daily Invoice SMS Reminders Cron Job
 *
 * Runs daily at 10:00 SAST to send SMS reminders for overdue invoices
 * via Clickatell API.
 *
 * Vercel Cron: 0 8 * * * (08:00 UTC = 10:00 SAST)
 *
 * Reminder Schedule:
 * - 1st SMS: 1-3 days overdue (friendly reminder)
 * - 2nd SMS: 4-7 days overdue (urgent notice)
 * - 3rd SMS: 8+ days overdue (final notice)
 *
 * Rate Limiting:
 * - Max 3 SMS per invoice
 * - Minimum 24 hours between SMS to same customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { InvoiceSmsReminderService } from '@/lib/billing/invoice-sms-reminder-service';

// Vercel cron configuration
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

interface CronResult {
  date: string;
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  duration_ms: number;
  errors: string[];
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runSmsReminders();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Invoice SMS reminders cron error:', error);
    return NextResponse.json(
      {
        error: 'SMS reminders failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggers from admin panel
export async function POST(request: NextRequest) {
  try {
    // Optional: specify custom parameters
    const body = await request.json().catch(() => ({}));
    const minDaysOverdue = body.min_days_overdue || 1;
    const maxDaysOverdue = body.max_days_overdue || 30;

    const result = await runSmsReminders(minDaysOverdue, maxDaysOverdue);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Invoice SMS reminders error:', error);
    return NextResponse.json(
      {
        error: 'SMS reminders failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function runSmsReminders(
  minDaysOverdue: number = 1,
  maxDaysOverdue: number = 30
): Promise<CronResult> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  console.log(`Starting invoice SMS reminders for ${today}`);

  const errors: string[] = [];

  try {
    // Check if Clickatell is configured
    if (!process.env.CLICKATELL_API_KEY) {
      throw new Error('CLICKATELL_API_KEY not configured');
    }

    // Process SMS reminders
    const result = await InvoiceSmsReminderService.processReminders({
      minDaysOverdue,
      maxDaysOverdue,
      dryRun: false,
    });

    // Collect any errors from individual sends
    for (const r of result.results) {
      if (!r.success && r.error && !r.error.includes('DRY RUN')) {
        errors.push(`${r.invoice_number}: ${r.error}`);
      }
    }

    const cronResult: CronResult = {
      date: today,
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      duration_ms: result.duration_ms,
      errors: errors.slice(0, 10), // Limit to first 10 errors
    };

    // Log the cron execution
    await logCronExecution(supabase, cronResult);

    console.log(
      `SMS reminders complete: ${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped`
    );

    return cronResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    const cronResult: CronResult = {
      date: today,
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      duration_ms: 0,
      errors,
    };

    await logCronExecution(supabase, cronResult, 'failed');

    throw error;
  }
}

async function logCronExecution(
  supabase: Awaited<ReturnType<typeof createClient>>,
  result: CronResult,
  status: 'completed' | 'completed_with_errors' | 'failed' = result.errors.length > 0
    ? 'completed_with_errors'
    : 'completed'
) {
  try {
    await supabase.from('cron_execution_log').insert({
      job_name: 'invoice-sms-reminders',
      status,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error('Failed to log cron execution:', error);
  }
}
