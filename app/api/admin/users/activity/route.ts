import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';
import { createClient as createAdminClient } from '@/lib/supabase/server';

/**
 * Admin User Activity API
 * Returns user activity logs from admin_audit_logs table
 * Only accessible by Super Admins
 */

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabaseSSR = await createSSRClient();
    const { data: { user }, error: authError } = await supabaseSSR.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is admin with proper permissions
    const supabaseAdmin = await createAdminClient();
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, role, role_template_id, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (adminError || !adminUser || !adminUser.is_active) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Only Super Admins can view activity logs
    const isSuperAdmin = adminUser.role === 'super_admin' ||
                        adminUser.role_template_id === 'super_admin' ||
                        adminUser.role_template_id === 'super-admin';

    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Super Admin access required.' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    const actionCategory = searchParams.get('category');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const suspiciousOnly = searchParams.get('suspicious') === 'true';
    const userEmail = searchParams.get('user');
    const searchQuery = searchParams.get('search');

    // Build query
    let query = supabaseAdmin
      .from('admin_audit_logs')
      .select(`
        id,
        user_email,
        action,
        action_category,
        status,
        severity,
        is_suspicious,
        ip_address,
        user_agent,
        request_path,
        metadata,
        created_at,
        admin_user:admin_users!admin_audit_logs_admin_user_id_fkey(
          full_name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (actionCategory) {
      query = query.eq('action_category', actionCategory);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (suspiciousOnly) {
      query = query.eq('is_suspicious', true);
    }
    if (userEmail) {
      query = query.ilike('user_email', `%${userEmail}%`);
    }
    if (searchQuery) {
      query = query.or(`action.ilike.%${searchQuery}%,user_email.ilike.%${searchQuery}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error: logsError, count } = await query;

    if (logsError) {
      console.error('Error fetching activity logs:', logsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch activity logs' },
        { status: 500 }
      );
    }

    // Get activity statistics
    const { data: stats } = await supabaseAdmin
      .from('admin_audit_logs')
      .select('action_category, status, severity, is_suspicious', { count: 'exact', head: false });

    const statistics = {
      total: count || 0,
      byCategory: stats?.reduce((acc: any, log: any) => {
        acc[log.action_category] = (acc[log.action_category] || 0) + 1;
        return acc;
      }, {}),
      byStatus: stats?.reduce((acc: any, log: any) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      }, {}),
      suspicious: stats?.filter((log: any) => log.is_suspicious).length || 0,
      critical: stats?.filter((log: any) => log.severity === 'critical').length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
        statistics,
      },
    });

  } catch (error) {
    console.error('Admin activity API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
