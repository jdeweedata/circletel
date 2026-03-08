/**
 * Acknowledge Health Alert API
 *
 * POST /api/admin/network/health/alerts/[id]/acknowledge
 * Marks a health alert as acknowledged
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: alertId } = await context.params;

    const supabase = await createClientWithSession();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin user ID
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 403 });
    }

    // Update alert
    const { error } = await supabase
      .from('network_health_alerts')
      .update({
        acknowledged: true,
        acknowledged_by: adminUser.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      console.error('[AcknowledgeAPI] Failed to acknowledge alert:', error);
      return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AcknowledgeAPI] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
