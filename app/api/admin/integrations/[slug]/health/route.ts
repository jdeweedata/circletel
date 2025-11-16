/**
 * API Route: POST /api/admin/integrations/[slug]/health
 *
 * Manually trigger a health check for a specific integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { checkIntegrationHealth } from '@/lib/integrations/health-check-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    // Create TWO clients:
    // 1. SSR client for authentication (reads cookies)
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op for POST requests
          },
        },
      }
    );

    // 2. Service role client for database queries (bypasses RLS)
    const supabaseAdmin = await createClient();

    // Check authentication using SSR client
    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin user using service role client (bypasses RLS)
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active, email')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Perform health check
    const healthCheckResult = await checkIntegrationHealth(slug);

    // Log activity
    await supabaseAdmin.from('integration_activity_log').insert({
      integration_slug: slug,
      action_type: 'health_check_run',
      action_description: `Manual health check performed`,
      performed_by: user.id,
      performed_by_email: adminUser.email,
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
    console.error('[Integration Health Check API] Error:', error);

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
