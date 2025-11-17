/**
 * Integration Cron Job Trigger API
 *
 * POST /api/admin/integrations/cron/[id]/trigger
 *
 * Manually trigger a scheduled cron job for immediate execution
 *
 * Use Cases:
 * - Test cron job functionality without waiting for schedule
 * - Debug cron job issues
 * - Force immediate execution for urgent tasks
 * - Recover from missed scheduled runs
 *
 * Response:
 * - Trigger result (success/failure)
 * - Execution duration
 * - Cron job output
 *
 * Authentication: Admin users only (RBAC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/integrations/cron/[id]/trigger
 *
 * Manually trigger a cron job
 * [id] is the cron job ID (e.g., 'integrations-health-check', 'zoho-sync')
 *
 * Authentication: Admin users with 'integrations:manage' permission
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // =========================================================================
    // Extract Params
    // =========================================================================
    const { id } = await context.params;

    // =========================================================================
    // Authentication & Authorization
    // =========================================================================
    const supabase = await createClient();

    // Get current user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add RBAC permission check when implemented (integrations:manage)

    // =========================================================================
    // Get Cron Job Configuration
    // =========================================================================
    const cronJobs: Record<
      string,
      {
        name: string;
        url: string;
        integration_slug: string;
        description: string;
      }
    > = {
      'integrations-health-check': {
        name: 'Integration Health Check',
        url: '/api/cron/integrations-health-check',
        integration_slug: 'system',
        description: 'Monitors health of all 9 integrations',
      },
      'cleanup-webhook-logs': {
        name: 'Webhook Log Cleanup',
        url: '/api/cron/cleanup-webhook-logs',
        integration_slug: 'system',
        description: 'Cleans up webhook logs older than 90 days',
      },
      'zoho-sync': {
        name: 'Zoho Data Sync',
        url: '/api/cron/zoho-sync',
        integration_slug: 'zoho-crm',
        description: 'Syncs customer data to Zoho CRM',
      },
    };

    const cronJob = cronJobs[id];
    if (!cronJob) {
      return NextResponse.json(
        { error: 'Cron job not found', cronJobId: id },
        { status: 404 }
      );
    }

    // =========================================================================
    // Get CRON_SECRET for Authentication
    // =========================================================================
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('[CronTriggerAPI] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured - cannot trigger cron job' },
        { status: 500 }
      );
    }

    // =========================================================================
    // Trigger Cron Job
    // =========================================================================
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const cronUrl = `${baseUrl}${cronJob.url}`;

    console.log(`[CronTriggerAPI] Manually triggering cron job: ${cronJob.name}`);
    console.log(`[CronTriggerAPI] URL: ${cronUrl}`);
    console.log(`[CronTriggerAPI] Triggered by admin: ${user.id}`);

    const startTime = Date.now();
    let triggerResult: {
      success: boolean;
      statusCode: number;
      errorMessage?: string;
      output?: any;
    };

    try {
      const response = await fetch(cronUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          'X-Cron-Manual-Trigger': 'true',
          'X-Triggered-By-Admin': user.id,
        },
      });

      const responseBody = await response.text();
      let parsedOutput;
      try {
        parsedOutput = JSON.parse(responseBody);
      } catch {
        parsedOutput = responseBody;
      }

      triggerResult = {
        success: response.ok,
        statusCode: response.status,
        output: parsedOutput,
        errorMessage: response.ok
          ? undefined
          : `HTTP ${response.status}: ${responseBody}`,
      };
    } catch (error) {
      triggerResult = {
        success: false,
        statusCode: 500,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Failed to trigger cron job - network error',
      };
    }

    const executionDuration = Date.now() - startTime;

    console.log(
      `[CronTriggerAPI] Cron job ${id} execution ${triggerResult.success ? 'succeeded' : 'failed'} in ${executionDuration}ms`
    );

    // =========================================================================
    // Log Trigger Activity
    // =========================================================================
    await supabase.from('integration_activity_log').insert({
      integration_slug: cronJob.integration_slug,
      action_type: 'cron_manual_trigger',
      action_description: `Cron job manually triggered: ${cronJob.name}`,
      action_result: triggerResult.success ? 'success' : 'failed',
      metadata: {
        cron_job_id: id,
        cron_job_name: cronJob.name,
        cron_job_url: cronJob.url,
        trigger_status_code: triggerResult.statusCode,
        trigger_error: triggerResult.errorMessage,
        execution_duration_ms: executionDuration,
        triggered_by_admin_id: user.id,
      },
    });

    // =========================================================================
    // Return Response
    // =========================================================================
    return NextResponse.json({
      success: triggerResult.success,
      cronJobId: id,
      cronJobName: cronJob.name,
      cronJobUrl: cronJob.url,
      integrationSlug: cronJob.integration_slug,
      execution: {
        statusCode: triggerResult.statusCode,
        errorMessage: triggerResult.errorMessage,
        durationMs: executionDuration,
        output: triggerResult.output,
      },
      message: triggerResult.success
        ? `Cron job "${cronJob.name}" executed successfully`
        : `Cron job "${cronJob.name}" execution failed`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CronTriggerAPI] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
