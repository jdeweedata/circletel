/**
 * Admin Outage Detail API
 * GET /api/admin/network/outages/[id] - Get outage details
 * PATCH /api/admin/network/outages/[id] - Update outage
 * POST /api/admin/network/outages/[id] - Add update to outage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: outage, error } = await supabase
      .from('outage_incidents')
      .select(`
        *,
        outage_updates (
          id,
          status,
          message,
          is_public,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !outage) {
      return NextResponse.json({ error: 'Outage not found' }, { status: 404 });
    }

    return NextResponse.json({ outage });

  } catch (error) {
    adminLogger.error('Get outage error', { error });
    return NextResponse.json(
      { error: 'Failed to fetch outage' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      status,
      title,
      description,
      severity,
      root_cause,
      resolution_notes,
      affected_customer_count
    } = body;

    const updates: Record<string, unknown> = {
      updated_by: adminUser.id,
      updated_at: new Date().toISOString()
    };

    if (status) updates.status = status;
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (severity) updates.severity = severity;
    if (root_cause !== undefined) updates.root_cause = root_cause;
    if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes;
    if (affected_customer_count !== undefined) updates.affected_customer_count = affected_customer_count;

    // Set timestamps based on status
    if (status === 'identified') {
      updates.identified_at = new Date().toISOString();
    } else if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    const { data: outage, error } = await supabase
      .from('outage_incidents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    adminLogger.info('Outage updated', {
      incidentId: id,
      updates: Object.keys(updates),
      updatedBy: user.email
    });

    return NextResponse.json({ outage });

  } catch (error) {
    adminLogger.error('Update outage error', { error });
    return NextResponse.json(
      { error: 'Failed to update outage' },
      { status: 500 }
    );
  }
}

// POST to add an update to the outage timeline
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { status, message, is_public = true } = body;

    if (!status || !message) {
      return NextResponse.json(
        { error: 'Status and message are required' },
        { status: 400 }
      );
    }

    // Add update to timeline
    const { data: update, error: updateError } = await supabase
      .from('outage_updates')
      .insert({
        incident_id: id,
        status,
        message,
        is_public,
        created_by: adminUser.id
      })
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Also update the incident status
    await supabase
      .from('outage_incidents')
      .update({
        status,
        updated_by: adminUser.id,
        updated_at: new Date().toISOString(),
        ...(status === 'identified' && { identified_at: new Date().toISOString() }),
        ...(status === 'resolved' && { resolved_at: new Date().toISOString() })
      })
      .eq('id', id);

    adminLogger.info('Outage update added', {
      incidentId: id,
      status,
      isPublic: is_public,
      createdBy: user.email
    });

    return NextResponse.json({ update }, { status: 201 });

  } catch (error) {
    adminLogger.error('Add outage update error', { error });
    return NextResponse.json(
      { error: 'Failed to add update' },
      { status: 500 }
    );
  }
}
