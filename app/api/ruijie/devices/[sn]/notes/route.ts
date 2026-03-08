/**
 * Device Support Notes API
 * GET /api/ruijie/devices/[sn]/notes - Get notes
 * PUT /api/ruijie/devices/[sn]/notes - Update notes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  const { sn } = await context.params;

  try {
    // Use session client for authentication (reads cookies)
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for DB queries (bypasses RLS)
    const supabaseAdmin = await createClient();

    // Get device notes with updater info
    const { data: device, error } = await supabaseAdmin
      .from('ruijie_device_cache')
      .select(`
        support_notes,
        support_notes_updated_at,
        support_notes_updated_by,
        admin_users!support_notes_updated_by(first_name, last_name)
      `)
      .eq('sn', sn)
      .single();

    if (error || !device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Type the admin_users join result (FK join returns object or null, not array)
    // Cast through unknown to handle Supabase's type inference
    const adminUser = device.admin_users as unknown as { first_name: string; last_name: string } | null;

    let updatedByName: string | null = null;
    if (adminUser && typeof adminUser === 'object' && !Array.isArray(adminUser)) {
      updatedByName = `${adminUser.first_name} ${adminUser.last_name}`;
    }

    return NextResponse.json({
      notes: device.support_notes,
      updated_at: device.support_notes_updated_at,
      updated_by: updatedByName,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Ruijie] Get notes error', { error: message, sn });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  const { sn } = await context.params;

  try {
    // Use session client for authentication (reads cookies)
    const supabase = await createClientWithSession();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for admin check and DB queries (bypasses RLS)
    const supabaseAdmin = await createClient();

    // Verify active admin
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { notes } = await request.json();

    // Verify device exists
    const { data: device, error: deviceError } = await supabaseAdmin
      .from('ruijie_device_cache')
      .select('sn')
      .eq('sn', sn)
      .single();

    if (deviceError || !device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Update notes
    const { error: updateError } = await supabaseAdmin
      .from('ruijie_device_cache')
      .update({
        support_notes: notes,
        support_notes_updated_at: new Date().toISOString(),
        support_notes_updated_by: user.id,
      })
      .eq('sn', sn);

    if (updateError) {
      apiLogger.error('[Ruijie] Failed to update notes', { error: updateError.message, sn });
      return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
    }

    apiLogger.info('[Ruijie] Device notes updated', {
      sn,
      updatedBy: user.id,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Ruijie] Update notes error', { error: message, sn });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
