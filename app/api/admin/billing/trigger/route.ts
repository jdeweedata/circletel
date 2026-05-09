import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest';
import { apiLogger } from '@/lib/logging';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import type {
  DebitOrdersRequestedEvent,
  BillingDayRequestedEvent,
} from '@/lib/inngest/client';

export const runtime = 'nodejs';
export const maxDuration = 15;

interface TriggerRequest {
  workflow: 'debit-orders' | 'billing-day';
  options?: {
    dryRun?: boolean;
    date?: string;
  };
}

/**
 * POST /api/admin/billing/trigger
 * Manually trigger billing workflows (debit-orders or billing-day)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  apiLogger.info('[Billing Trigger API] POST request started');

  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      apiLogger.info('[Billing Trigger API] Auth verification failed');
      return authResult.response;
    }

    if (!authResult.adminUser.is_active) {
      apiLogger.info('[Billing Trigger API] Admin user is inactive');
      return NextResponse.json(
        { success: false, error: 'Admin account is inactive' },
        { status: 403 }
      );
    }

    let body: TriggerRequest;
    try {
      body = await request.json();
    } catch {
      apiLogger.error('[Billing Trigger API] Invalid JSON in request body');
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { workflow, options } = body;

    if (!workflow || !['debit-orders', 'billing-day'].includes(workflow)) {
      apiLogger.error('[Billing Trigger API] Invalid workflow type', {
        workflow,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid workflow. Must be "debit-orders" or "billing-day"',
        },
        { status: 400 }
      );
    }

    let billingDate: string;
    if (options?.date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
        apiLogger.error('[Billing Trigger API] Invalid date format', {
          date: options.date,
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid date format. Use YYYY-MM-DD',
          },
          { status: 400 }
        );
      }
      billingDate = options.date;
    } else {
      const now = new Date();
      const sastDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      billingDate = sastDate.toISOString().split('T')[0];
    }

    const dryRun = options?.dryRun === true;

    const logId = crypto.getRandomValues(new Uint8Array(16));
    const logUuid = Array.from(logId)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$4-$5');

    const jobName =
      workflow === 'debit-orders'
        ? 'process_debit_orders_manual'
        : 'billing_day_manual';

    const supabase = await createAdminClient();
    const { error: logError } = await supabase
      .from('cron_execution_log')
      .insert({
        id: logUuid,
        job_name: jobName,
        status: 'running',
        trigger_source: 'manual',
        triggered_by: authResult.adminUser.id,
        environment: process.env.VERCEL_ENV || 'production',
        execution_details: {
          workflow,
          dryRun,
          billingDate,
          adminEmail: authResult.adminUser.email,
        },
      });

    if (logError) {
      apiLogger.error('[Billing Trigger API] Failed to create execution log', {
        error: logError.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create execution log',
          details: logError.message,
        },
        { status: 500 }
      );
    }

    try {
      if (workflow === 'debit-orders') {
        const event: DebitOrdersRequestedEvent = {
          name: 'billing/debit-orders.requested',
          data: {
            triggered_by: 'manual',
            billing_date: billingDate,
            admin_user_id: authResult.adminUser.id,
            batch_log_id: logUuid,
            options: {
              dryRun,
            },
          },
        };

        await inngest.send(event);
        apiLogger.info('[Billing Trigger API] Debit orders event sent', {
          logId: logUuid,
          billingDate,
          dryRun,
        });
      } else if (workflow === 'billing-day') {
        const event: BillingDayRequestedEvent = {
          name: 'billing/day.requested',
          data: {
            triggered_by: 'manual',
            billing_date: billingDate,
            admin_user_id: authResult.adminUser.id,
            process_log_id: logUuid,
            options: {
              dryRun,
            },
          },
        };

        await inngest.send(event);
        apiLogger.info('[Billing Trigger API] Billing day event sent', {
          logId: logUuid,
          billingDate,
          dryRun,
        });
      }
    } catch (inngestError) {
      apiLogger.error('[Billing Trigger API] Failed to send Inngest event', {
        error: inngestError instanceof Error ? inngestError.message : String(inngestError),
      });

      await supabase
        .from('cron_execution_log')
        .update({
          status: 'failed',
          execution_end: new Date().toISOString(),
          error_message: 'Failed to send Inngest event',
        })
        .eq('id', logUuid);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to trigger workflow',
          details:
            inngestError instanceof Error
              ? inngestError.message
              : String(inngestError),
        },
        { status: 500 }
      );
    }

    apiLogger.info('[Billing Trigger API] POST completed successfully', {
      duration: Date.now() - startTime,
      logId: logUuid,
      workflow,
      dryRun,
      billingDate,
    });

    return NextResponse.json({
      success: true,
      logId: logUuid,
      billingDate,
      dryRun,
      workflow,
    });
  } catch (error) {
    apiLogger.error('[Billing Trigger API] Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/billing/trigger?logId=xxx
 * Get billing execution log status
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  apiLogger.info('[Billing Trigger API] GET request started');

  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    if (!authResult.adminUser.is_active) {
      apiLogger.info('[Billing Trigger API] GET: Admin user invalid');
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    const supabase = await createAdminClient();
    const url = new URL(request.url);
    const logId = url.searchParams.get('logId');

    if (logId) {
      const { data, error } = await supabase
        .from('cron_execution_log')
        .select('*')
        .eq('id', logId)
        .maybeSingle();

      if (error) {
        apiLogger.error('[Billing Trigger API] GET: Log fetch failed', {
          error: error.message,
        });
        return NextResponse.json(
          { success: false, error: 'Failed to fetch log' },
          { status: 500 }
        );
      }

      if (!data) {
        apiLogger.info('[Billing Trigger API] GET: Log not found', { logId });
        return NextResponse.json(
          { success: false, error: 'Log not found' },
          { status: 404 }
        );
      }

      apiLogger.info('[Billing Trigger API] GET single log completed', {
        duration: Date.now() - startTime,
        logId,
      });

      return NextResponse.json({
        success: true,
        data,
        count: 1,
      });
    } else {
      const { data, error, count } = await supabase
        .from('cron_execution_log')
        .select('*', { count: 'exact' })
        .in('job_name', [
          'process_debit_orders_manual',
          'billing_day_manual',
          'process_debit_orders',
          'billing_day_process',
        ])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        apiLogger.error('[Billing Trigger API] GET: Logs fetch failed', {
          error: error.message,
        });
        return NextResponse.json(
          { success: false, error: 'Failed to fetch logs' },
          { status: 500 }
        );
      }

      apiLogger.info('[Billing Trigger API] GET recent logs completed', {
        duration: Date.now() - startTime,
        count: count || 0,
      });

      return NextResponse.json({
        success: true,
        data: data || [],
        count: count || 0,
      });
    }
  } catch (error) {
    apiLogger.error('[Billing Trigger API] GET: Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
