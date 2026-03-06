/**
 * Ruijie Sync Trigger API
 * POST /api/ruijie/sync - Trigger manual sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { inngest } from '@/lib/inngest/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
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

    // Send Inngest event
    await inngest.send({
      name: 'ruijie/sync.requested',
      data: {
        triggered_by: 'manual',
        admin_user_id: adminUser.id,
      },
    });

    // Audit log
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    await supabase.from('ruijie_audit_log').insert({
      admin_user_id: adminUser.id,
      device_sn: null,
      action: 'refresh',
      action_detail: { type: 'manual_sync' },
      ip_address: clientIp,
      status: 'success',
    });

    return NextResponse.json({
      status: 'queued',
      message: 'Sync triggered successfully',
    });

  } catch (error) {
    apiLogger.error('Ruijie sync trigger API error', { error });
    return NextResponse.json({ error: 'Failed to trigger sync' }, { status: 500 });
  }
}
