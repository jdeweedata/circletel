/**
 * Ruijie Tunnel Delete API
 * DELETE /api/ruijie/tunnel/[sn] - Close tunnel
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { deleteTunnel } from '@/lib/ruijie';

export const dynamic = 'force-dynamic';

export async function DELETE(
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

    // Close tunnel via Ruijie API
    await deleteTunnel(sn);

    // Update database
    const { error: updateError } = await supabase
      .from('ruijie_tunnels')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by: adminUser.id,
      })
      .eq('device_sn', sn)
      .eq('status', 'active');

    if (updateError) {
      apiLogger.error('Failed to update tunnel status', { error: updateError });
    }

    // Audit log
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    await supabase.from('ruijie_audit_log').insert({
      admin_user_id: adminUser.id,
      device_sn: sn,
      action: 'tunnel_close',
      action_detail: {},
      ip_address: clientIp,
      status: 'success',
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    apiLogger.error('Ruijie tunnel delete API error', { error });
    return NextResponse.json({ error: 'Failed to close tunnel' }, { status: 500 });
  }
}
