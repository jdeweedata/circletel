/**
 * Ruijie Tunnel API
 * POST /api/ruijie/tunnel - Create tunnel with limit guard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { createTunnel, getActiveTunnelCount } from '@/lib/ruijie';

export const dynamic = 'force-dynamic';

const TUNNEL_LIMIT = 10;
const TUNNEL_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

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
      .select('id, role, full_name')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { sn, tunnelType = 'eweb' } = body;

    if (!sn) {
      return NextResponse.json({ error: 'Device SN required' }, { status: 400 });
    }

    // Guard 1: Check tunnel limit
    const activeCount = await getActiveTunnelCount();
    if (activeCount >= TUNNEL_LIMIT) {
      return NextResponse.json(
        { error: 'Tunnel limit reached', active: activeCount, max: TUNNEL_LIMIT },
        { status: 429 }
      );
    }

    // Guard 2: Check for existing active tunnel for this device (reuse)
    const { data: existingTunnel } = await supabase
      .from('ruijie_tunnels')
      .select('*')
      .eq('device_sn', sn)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingTunnel) {
      return NextResponse.json({
        tunnel: {
          tunnelId: existingTunnel.id,
          deviceSn: existingTunnel.device_sn,
          openDomainUrl: existingTunnel.open_domain_url,
          openIpUrl: existingTunnel.open_ip_url,
          expiresAt: existingTunnel.expires_at,
        },
        reused: true,
        active: activeCount,
        max: TUNNEL_LIMIT,
      });
    }

    // Create new tunnel via Ruijie API
    const tunnel = await createTunnel(sn, tunnelType as 'eweb' | 'ssh' | 'webcli');

    // Store in database
    const expiresAt = new Date(Date.now() + TUNNEL_DURATION_MS).toISOString();
    const { data: dbTunnel, error: insertError } = await supabase
      .from('ruijie_tunnels')
      .insert({
        device_sn: sn,
        tunnel_type: tunnelType,
        tunnel_url: tunnel.openDomainUrl,
        open_domain_url: tunnel.openDomainUrl,
        open_ip_url: tunnel.openIpUrl,
        status: 'active',
        expires_at: tunnel.expiresAt || expiresAt,
        created_by: adminUser.id,
      })
      .select()
      .single();

    if (insertError) {
      apiLogger.error('Failed to store tunnel', { error: insertError });
    }

    // Audit log
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    await supabase.from('ruijie_audit_log').insert({
      admin_user_id: adminUser.id,
      device_sn: sn,
      action: 'tunnel_create',
      action_detail: { tunnelType, tunnelId: dbTunnel?.id },
      ip_address: clientIp,
      status: 'success',
    });

    return NextResponse.json({
      tunnel: {
        tunnelId: dbTunnel?.id || tunnel.tunnelId,
        deviceSn: sn,
        openDomainUrl: tunnel.openDomainUrl,
        openIpUrl: tunnel.openIpUrl,
        expiresAt: tunnel.expiresAt || expiresAt,
      },
      reused: false,
      active: activeCount + 1,
      max: TUNNEL_LIMIT,
    });

  } catch (error) {
    apiLogger.error('Ruijie tunnel create API error', { error });
    return NextResponse.json({ error: 'Failed to create tunnel' }, { status: 500 });
  }
}
