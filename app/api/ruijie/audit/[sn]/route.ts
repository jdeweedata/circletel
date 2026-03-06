/**
 * Ruijie Audit Log API
 * GET /api/ruijie/audit/[sn] - Get device action history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  try {
    const { sn } = await context.params;
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get audit log entries with admin name
    const { data: actions, error } = await supabase
      .from('ruijie_audit_log')
      .select(`
        id,
        admin_user_id,
        device_sn,
        action,
        action_detail,
        ip_address,
        status,
        error_message,
        created_at,
        admin_users (full_name)
      `)
      .eq('device_sn', sn)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      apiLogger.error('Failed to fetch audit log', { error });
      return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
    }

    // Format response
    const formattedActions = (actions || []).map(a => ({
      id: a.id,
      adminUserId: a.admin_user_id,
      adminName: Array.isArray(a.admin_users)
        ? a.admin_users[0]?.full_name
        : (a.admin_users as { full_name?: string } | null)?.full_name || 'Unknown',
      deviceSn: a.device_sn,
      action: a.action,
      actionDetail: a.action_detail,
      ipAddress: a.ip_address,
      status: a.status,
      errorMessage: a.error_message,
      createdAt: a.created_at,
    }));

    return NextResponse.json({ actions: formattedActions });

  } catch (error) {
    apiLogger.error('Ruijie audit log API error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
