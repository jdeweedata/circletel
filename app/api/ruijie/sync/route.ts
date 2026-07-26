/**
 * Ruijie Sync Trigger API
 * POST /api/ruijie/sync - Trigger manual sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';
import { inngest } from '@/lib/inngest/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const adminUser = authResult.adminUser!;
    const supabaseAdmin = await createClient();

    // Send Inngest event
    await inngest.send({
      name: 'ruijie/sync.requested',
      data: {
        triggered_by: 'manual',
        admin_user_id: adminUser.id,
      },
    });

    // Audit log
    const clientIp =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    await supabaseAdmin.from('ruijie_audit_log').insert({
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
