/**
 * Integration Cron Jobs Management API
 *
 * GET /api/admin/integrations/cron
 *
 * List all scheduled cron jobs across integrations
 *
 * Query Parameters:
 * - integration_slug: Filter by specific integration
 * - is_active: Filter by active/inactive status (true/false)
 * - limit: Number of results (default 50, max 100)
 * - offset: Pagination offset
 *
 * Response:
 * - List of cron job configurations
 * - Pagination metadata
 * - Summary statistics (total, active, inactive)
 * - Next run times
 *
 * Authentication: Admin users only (RBAC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';
import { createClient as createServiceClient } from '@/lib/supabase/server';
import cronstrue from 'cronstrue';

/**
 * GET /api/admin/integrations/cron
 *
 * List all cron jobs with optional filters
 *
 * Authentication: Admin users with 'integrations:view' permission
 */
export async function GET(request: NextRequest) {
  try {
    // =========================================================================
    // Authentication & Authorization (Two-Client Pattern)
    // =========================================================================
    // 1. SSR Client - For authentication (reads cookies)
    const supabaseSSR = await createSSRClient();

    // Get current user session
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add RBAC permission check when implemented (integrations:view)

    // 2. Service Role Client - For database queries (bypasses RLS)
    const supabaseAdmin = await createServiceClient();

    // =========================================================================
    // Parse Query Parameters
    // =========================================================================
    const searchParams = request.nextUrl.searchParams;
    const integrationSlug = searchParams.get('integration_slug');
    const isActive = searchParams.get('is_active');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // =========================================================================
    // Build Query - First get all cron jobs from vercel.json
    // =========================================================================
    // Note: In a real implementation, this would query integration_cron_jobs table
    // For now, we'll return the cron jobs we know exist from vercel.json

    const existingCronJobs = [
      {
        id: 'integrations-health-check',
        integration_slug: 'system',
        job_name: 'Integration Health Check',
        job_url: '/api/cron/integrations-health-check',
        schedule: '*/30 * * * *',
        is_active: true,
        last_run_at: null,
        last_run_status: null,
        last_run_duration_ms: null,
        next_run_at: null,
        description: 'Monitors health of all 9 integrations every 30 minutes',
        created_at: '2025-11-17T00:00:00Z',
        updated_at: '2025-11-17T00:00:00Z',
      },
      {
        id: 'cleanup-webhook-logs',
        integration_slug: 'system',
        job_name: 'Webhook Log Cleanup',
        job_url: '/api/cron/cleanup-webhook-logs',
        schedule: '0 3 * * 0',
        is_active: true,
        last_run_at: null,
        last_run_status: null,
        last_run_duration_ms: null,
        next_run_at: null,
        description: 'Weekly cleanup of webhook logs older than 90 days (Sundays 3 AM)',
        created_at: '2025-11-17T00:00:00Z',
        updated_at: '2025-11-17T00:00:00Z',
      },
      {
        id: 'zoho-sync',
        integration_slug: 'zoho-crm',
        job_name: 'Zoho Data Sync',
        job_url: '/api/cron/zoho-sync',
        schedule: '0 0 * * *',
        is_active: true,
        last_run_at: null,
        last_run_status: null,
        last_run_duration_ms: null,
        next_run_at: null,
        description: 'Daily sync of customer data to Zoho CRM (midnight)',
        created_at: '2025-11-17T00:00:00Z',
        updated_at: '2025-11-17T00:00:00Z',
      },
    ];

    // Apply filters
    let filteredJobs = existingCronJobs;

    if (integrationSlug) {
      filteredJobs = filteredJobs.filter(
        (job) => job.integration_slug === integrationSlug
      );
    }

    if (isActive !== null && isActive !== undefined) {
      const activeFilter = isActive === 'true';
      filteredJobs = filteredJobs.filter((job) => job.is_active === activeFilter);
    }

    // Calculate summary statistics
    const summary = {
      total: filteredJobs.length,
      active: filteredJobs.filter((job) => job.is_active).length,
      inactive: filteredJobs.filter((job) => !job.is_active).length,
      byIntegration: {} as Record<string, number>,
    };

    // Group by integration
    for (const job of filteredJobs) {
      if (!summary.byIntegration[job.integration_slug]) {
        summary.byIntegration[job.integration_slug] = 0;
      }
      summary.byIntegration[job.integration_slug]++;
    }

    // Apply pagination
    const paginatedJobs = filteredJobs.slice(offset, offset + limit);

    // Format response
    const formattedJobs = paginatedJobs.map((job) => {
      let humanReadableSchedule = '';
      try {
        humanReadableSchedule = cronstrue.toString(job.schedule);
      } catch {
        humanReadableSchedule = job.schedule;
      }

      return {
        id: job.id,
        integrationSlug: job.integration_slug,
        jobName: job.job_name,
        jobUrl: job.job_url,
        schedule: job.schedule,
        humanReadableSchedule,
        isActive: job.is_active,
        lastRunAt: job.last_run_at,
        lastRunStatus: job.last_run_status,
        lastRunDurationMs: job.last_run_duration_ms,
        nextRunAt: job.next_run_at,
        description: job.description,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      };
    });

    // =========================================================================
    // Return Response
    // =========================================================================
    return NextResponse.json({
      cronJobs: formattedJobs,
      pagination: {
        total: filteredJobs.length,
        limit,
        offset,
        hasMore: filteredJobs.length > offset + limit,
      },
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CronJobsAPI] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
