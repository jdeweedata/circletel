import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest';
import { apiLogger } from '@/lib/logging';
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

interface SuccessResponse {
  success: true;
  logId: string;
  billingDate: string;
  dryRun: boolean;
  workflow: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

/**
 * POST /api/admin/billing/trigger
 * Manually trigger billing workflows (debit-orders or billing-day)
 *
 * Request body:
 * {
 *   workflow: 'debit-orders' | 'billing-day',
 *   options?: {
 *     dryRun?: boolean,
 *     date?: string (YYYY-MM-DD format)
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   logId: string,
 *   billingDate: string,
 *   dryRun: boolean,
 *   workflow: string
 * }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  const startTime = Date.now();
  apiLogger.info('[Billing Trigger API] POST request started');

  try {
    // 1. Verify admin authentication
    const supabaseSSR = await createSSRClient();
    const { data: authData, error: authError } = await supabaseSSR.auth.getUser();

    if (authError || !authData.user) {
      apiLogger.info('[Billing Trigger API] Auth verification failed');
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // Verify user is an admin
    const supabaseAdmin = await createAdminClient();
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (adminError || !adminUser) {
      apiLogger.error('[Billing Trigger API] Admin user not found', {
        error: adminError?.message || 'User not found in admin_users table',
      });
      return NextResponse.json(
        { success: false, error: 'User is not an admin' },
        { status: 403 }
      );
    }

    if (!adminUser.is_active) {
      apiLogger.info('[Billing Trigger API] Admin user is inactive');
      return NextResponse.json(
        { success: false, error: 'Admin account is inactive' },
        { status: 403 }
      );
    }

    // 2. Parse and validate request body
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

    // Validate workflow type
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

    // 3. Determine billing date
    let billingDate: string;
    if (options?.date) {
      // Validate date format (YYYY-MM-DD)
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
      // Use today's date in SAST (UTC+2)
      const now = new Date();
      const sastDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      billingDate = sastDate.toISOString().split('T')[0];
    }

    const dryRun = options?.dryRun === true;

    // 4. Create cron_execution_log entry
    const logId = crypto.getRandomValues(new Uint8Array(16));
    const logUuid = Array.from(logId)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$4-$5');

    const jobName =
      workflow === 'debit-orders'
        ? 'process_debit_orders_manual'
        : 'billing_day_manual';

    const { error: logError } = await supabaseAdmin
      .from('cron_execution_log')
      .insert({
        id: logUuid,
        job_name: jobName,
        status: 'running',
        trigger_source: 'manual',
        triggered_by: userId,
        environment: process.env.VERCEL_ENV || 'production',
        execution_details: {
          workflow,
          dryRun,
          billingDate,
          adminEmail: adminUser.email,
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

    // 5. Send Inngest event based on workflow type
    try {
      if (workflow === 'debit-orders') {
        const event: DebitOrdersRequestedEvent = {
          name: 'billing/debit-orders.requested',
          data: {
            triggered_by: 'manual',
            billing_date: billingDate,
            admin_user_id: userId,
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
            admin_user_id: userId,
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

      // Update log status to failed
      await supabaseAdmin
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
 *
 * Query params:
 * - logId: specific log ID to retrieve
 *
 * Response:
 * - With logId: single log entry
 * - Without logId: 10 most recent billing logs
 */
export async function GET(
  request: NextRequest
): Promise<
  NextResponse<
    | { success: true; data: any; count: number }
    | { success: false; error: string }
  >
> {
  const startTime = Date.now();
  apiLogger.info('[Billing Trigger API] GET request started');

  try {
    // Verify admin authentication
    const supabaseSSR = await createSSRClient();
    const { data: authData, error: authError } = await supabaseSSR.auth.getUser();

    if (authError || !authData.user) {
      apiLogger.info('[Billing Trigger API] GET: Auth verification failed');
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // Verify user is an admin
    const supabaseAdmin = await createAdminClient();
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (adminError || !adminUser || !adminUser.is_active) {
      apiLogger.info('[Billing Trigger API] GET: Admin user invalid');
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Get logId from query params
    const url = new URL(request.url);
    const logId = url.searchParams.get('logId');

    if (logId) {
      // Fetch specific log entry
      const { data, error } = await supabaseAdmin
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
      // Fetch 10 most recent billing logs
      const { data, error, count } = await supabaseAdmin
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
