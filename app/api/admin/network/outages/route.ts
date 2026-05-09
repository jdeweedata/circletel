/**
 * Admin Outage Management API
 * GET /api/admin/network/outages - List outages
 * POST /api/admin/network/outages - Create outage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const supabase = await createClient();

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
    apiLogger.error('List outages error', { error });
    return NextResponse.json(
      { error: 'Failed to fetch outages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const { adminUser } = authResult;
    const supabase = await createClient();

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

    apiLogger.info('Outage created', {
      incidentNumber: outage.incident_number,
      title,
      severity,
      createdBy: authResult.adminUser.email
    });

    return NextResponse.json({ outage }, { status: 201 });

  } catch (error) {
    apiLogger.error('Create outage error', { error });
    return NextResponse.json(
      { error: 'Failed to create outage' },
      { status: 500 }
    );
  }
}
