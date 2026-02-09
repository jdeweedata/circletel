/**
 * API Route: GET /api/admin/integrations
 *
 * List all integrations with health status
 *
 * Query Parameters:
 * - category: Filter by integration type (oauth, api_key, webhook_only)
 * - health_status: Filter by health status (healthy, degraded, down, unknown)
 * - is_active: Filter by active status (true/false)
 *
 * Returns:
 * {
 *   integrations: Array<Integration>,
 *   summary: { healthy: number, degraded: number, down: number, unknown: number }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

export async function GET(request: NextRequest) {
  try {
    // Use session client for authentication
    const supabase = await createClientWithSession();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client to bypass RLS when checking admin_users
    const supabaseAdmin = await createClient();

    // Verify admin user
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const healthStatus = searchParams.get('health_status');
    const isActive = searchParams.get('is_active');

    // Build query using service role client
    let query = supabaseAdmin
      .from('integration_registry')
      .select('*')
      .order('slug');

    if (category) {
      // Filter by integration_type (mapped to category in API)
      query = query.eq('integration_type', category);
    }

    if (healthStatus) {
      query = query.eq('health_status', healthStatus);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: integrations, error } = await query;

    if (error) {
      apiLogger.error('[Integrations API] Failed to fetch integrations:', error);
      return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
    }

    // Calculate summary
    const summary = (integrations || []).reduce(
      (acc, integration) => {
        const status = integration.health_status as 'healthy' | 'degraded' | 'down' | 'unknown';
        acc[status]++;
        return acc;
      },
      { healthy: 0, degraded: 0, down: 0, unknown: 0 }
    );

    return NextResponse.json({
      integrations: integrations || [],
      summary,
    });
  } catch (error) {
    apiLogger.error('[Integrations API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
