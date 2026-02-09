import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CreateCoverageLeadInput } from '@/lib/types/customer-journey';
import { apiLogger } from '@/lib/logging/logger';

/**
 * GET /api/admin/coverage-leads
 * Get all coverage leads with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const customer_type = searchParams.get('customer_type');
    const lead_source = searchParams.get('lead_source');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('coverage_leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (customer_type) {
      query = query.eq('customer_type', customer_type);
    }

    if (lead_source) {
      query = query.eq('lead_source', lead_source);
    }

    const { data: leads, error, count } = await query;

    if (error) {
      apiLogger.error('Error fetching coverage leads', { error });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leads,
      total_count: count,
      limit,
      offset,
    });
  } catch (error: any) {
    apiLogger.error('Error in GET /api/admin/coverage-leads', { error });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/coverage-leads
 * Create a new coverage lead
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: CreateCoverageLeadInput = await request.json();

    // Insert coverage lead
    const { data: lead, error } = await supabase
      .from('coverage_leads')
      .insert({
        customer_type: body.customer_type,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        company_name: body.company_name,
        address: body.address,
        suburb: body.suburb,
        city: body.city,
        province: body.province,
        postal_code: body.postal_code,
        coordinates: body.coordinates,
        lead_source: body.lead_source,
        source_campaign: body.source_campaign,
        referral_code: body.referral_code,
        coverage_check_id: body.coverage_check_id,
        requested_service_type: body.requested_service_type,
        requested_speed: body.requested_speed,
        budget_range: body.budget_range,
        contact_preference: body.contact_preference,
        best_contact_time: body.best_contact_time,
        metadata: body.metadata,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      apiLogger.error('Error creating coverage lead', { error });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lead,
    }, { status: 201 });
  } catch (error: any) {
    apiLogger.error('Error in POST /api/admin/coverage-leads', { error });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
