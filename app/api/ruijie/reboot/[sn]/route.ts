/**
 * Ruijie Reboot API
 * POST /api/ruijie/reboot/[sn] - Reboot device
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { rebootDevice } from '@/lib/ruijie';

export const dynamic = 'force-dynamic';

export async function POST(
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

    // Get device info for audit
    const { data: device } = await supabase
      .from('ruijie_device_cache')
      .select('device_name, model')
      .eq('sn', sn)
      .single();

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    try {
      // Reboot via Ruijie API
      const result = await rebootDevice(sn);

      // Audit log - success
      await supabase.from('ruijie_audit_log').insert({
        admin_user_id: adminUser.id,
        device_sn: sn,
        action: 'reboot',
        action_detail: { deviceName: device?.device_name, model: device?.model },
        ip_address: clientIp,
        status: 'success',
      });

      return NextResponse.json({ success: result.success });

    } catch (rebootError) {
      // Audit log - failure
      await supabase.from('ruijie_audit_log').insert({
        admin_user_id: adminUser.id,
        device_sn: sn,
        action: 'reboot',
        action_detail: { deviceName: device?.device_name, model: device?.model },
        ip_address: clientIp,
        status: 'failed',
        error_message: rebootError instanceof Error ? rebootError.message : 'Unknown error',
      });

      throw rebootError;
    }

  } catch (error) {
    apiLogger.error('Ruijie reboot API error', { error });
    return NextResponse.json({ error: 'Failed to reboot device' }, { status: 500 });
  }
}
