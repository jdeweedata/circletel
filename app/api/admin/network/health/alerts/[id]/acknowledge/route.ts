/**
 * Acknowledge Health Alert API
 *
 * POST /api/admin/network/health/alerts/[id]/acknowledge
 * Marks a health alert as acknowledged
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { id: alertId } = await context.params;
    const { adminUser } = authResult;
    const supabase = await createClient();

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
