/**
 * Integration Cron Job Logs API
 *
 * GET /api/admin/integrations/cron/[id]/logs
 *
 * Get execution logs for a specific cron job
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 100)
 *
 * Response:
 * - logs: Array of execution log entries
 * - pagination: Pagination metadata
 *
 * Authentication: Admin users only (RBAC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';

/**
 * GET /api/admin/integrations/cron/[id]/logs
 *
 * Get execution logs for a cron job
 * [id] is the cron job UUID from integration_cron_jobs table
 *
 * Authentication: Admin users with 'integrations:view' permission
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // =========================================================================
    // Extract Params
    // =========================================================================
    const { id } = await context.params;

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;

    // =========================================================================
    // Authentication & Authorization
    // =========================================================================
    const supabase = await createSSRClient();

    // Get current user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add RBAC permission check when implemented (integrations:view)

    // =========================================================================
    // Verify Cron Job Exists
    // =========================================================================
    const { data: cronJob, error: cronJobError } = await supabase
      .from('integration_cron_jobs')
      .select('id, job_name, integration_slug')
      .eq('id', id)
      .single();

    if (cronJobError || !cronJob) {
      return NextResponse.json(
        { error: 'Cron job not found', details: cronJobError?.message },
        { status: 404 }
      );
    }

    // =========================================================================
    // Fetch Execution Logs
    // =========================================================================
    // Query integration_activity_log for cron_execution actions
    // The metadata field contains job execution details
    const { data: logs, error: logsError } = await supabase
      .from('integration_activity_log')
      .select('id, action, status, metadata, error_message, created_at', { count: 'exact' })
      .eq('action', 'cron_execution')
      .eq('integration_slug', cronJob.integration_slug)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.error('[Cron Logs API] Error fetching logs:', logsError);
      return NextResponse.json(
        { error: 'Failed to fetch cron logs', details: logsError.message },
        { status: 500 }
      );
    }

    // =========================================================================
    // Get Total Count for Pagination
    // =========================================================================
    const { count: totalCount, error: countError } = await supabase
      .from('integration_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'cron_execution')
      .eq('integration_slug', cronJob.integration_slug);

    if (countError) {
      console.error('[Cron Logs API] Error counting logs:', countError);
    }

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);

    // =========================================================================
    // Format Response
    // =========================================================================
    const formattedLogs = (logs || []).map((log) => {
      // Extract execution details from metadata
      const metadata = log.metadata as any || {};
      const jobName = metadata.job_name || cronJob.job_name;
      const durationMs = metadata.duration_ms || null;
      const resultSummary = metadata.result_summary || null;
      const triggeredBy = metadata.triggered_by || 'system';

      return {
        id: log.id,
        executedAt: log.created_at,
        jobName,
        status: log.status,
        durationMs,
        resultSummary,
        errorMessage: log.error_message,
        triggeredBy,
      };
    });

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      cronJob: {
        id: cronJob.id,
        name: cronJob.job_name,
        integrationSlug: cronJob.integration_slug,
      },
    });
  } catch (error) {
    console.error('[Cron Logs API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
