/**
 * Admin Outage Management API
 * GET /api/admin/network/outages - List outages
 * POST /api/admin/network/outages - Create outage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'open' | 'resolved' | 'all'
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
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
      .order('started_at', { ascending: false })
      .limit(limit);

    if (status === 'open') {
      query = query.neq('status', 'resolved');
    } else if (status === 'resolved') {
      query = query.eq('status', 'resolved');
    }

    const { data: outages, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ outages: outages || [] });

  } catch (error) {
    adminLogger.error('List outages error', { error });
    return NextResponse.json(
      { error: 'Failed to fetch outages' },
      { status: 500 }
    );
  }
}

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
      .select('id')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      severity = 'minor',
      affected_providers = [],
      affected_regions = [],
      affected_customer_count = 0
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create outage incident
    const { data: outage, error } = await supabase
      .from('outage_incidents')
      .insert({
        title,
        description,
        severity,
        status: 'investigating',
        affected_providers,
        affected_regions,
        affected_customer_count,
        started_at: new Date().toISOString(),
        created_by: adminUser.id
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create initial update
    await supabase
      .from('outage_updates')
      .insert({
        incident_id: outage.id,
        status: 'investigating',
        message: description || `Investigating: ${title}`,
        is_public: true,
        created_by: adminUser.id
      });

    adminLogger.info('Outage created', {
      incidentNumber: outage.incident_number,
      title,
      severity,
      createdBy: user.email
    });

    return NextResponse.json({ outage }, { status: 201 });

  } catch (error) {
    adminLogger.error('Create outage error', { error });
    return NextResponse.json(
      { error: 'Failed to create outage' },
      { status: 500 }
    );
  }
}
