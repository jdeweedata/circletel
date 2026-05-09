/**
 * API Route: POST /api/admin/integrations/[slug]/health
 *
 * Manually trigger a health check for a specific integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import { checkIntegrationHealth } from '@/lib/integrations/health-check-service';
import { apiLogger } from '@/lib/logging';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Authenticate admin
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { slug } = await context.params;

    // Service role client for database queries (bypasses RLS)
    const supabaseAdmin = await createClient();

    // Perform health check
    const healthCheckResult = await checkIntegrationHealth(slug);

    // Log activity
    await supabaseAdmin.from('integration_activity_log').insert({
      integration_slug: slug,
      action_type: 'health_check_run',
      action_description: `Manual health check performed`,
      performed_by: authResult.user.id,
      performed_by_email: authResult.user.email,
      action_result: 'success',
      after_state: {
        healthStatus: healthCheckResult.healthStatus,
        responseTime: healthCheckResult.responseTime,
        issues: healthCheckResult.issues,
      },
    });

    return NextResponse.json({
      success: true,
      result: healthCheckResult,
    });
  } catch (error) {
    apiLogger.error('[Integration Health Check API] Error', { error: error instanceof Error ? error.message : String(error) });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
