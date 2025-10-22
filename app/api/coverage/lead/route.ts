import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, coordinates, coverageType } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Determine customer type from coverageType parameter
    // Database enum has: 'consumer', 'smme', 'enterprise'
    // Map: residential -> consumer, business -> smme (covers both SME and enterprise)
    const customerType = coverageType === 'business' ? 'smme' : 'consumer';

    // Create a minimal lead entry for coverage check
    // Full customer details will be collected in the order form
    const leadData = {
      customer_type: customerType as 'consumer' | 'business',
      first_name: 'Coverage',  // Placeholder - will be updated during order
      last_name: 'Check',      // Placeholder - will be updated during order
      email: `coverage-${Date.now()}@temp.circletel.co.za`, // Temporary email
      phone: '0000000000',     // Placeholder - will be updated during order
      address,
      coordinates: coordinates ? {
        lat: coordinates.lat,
        lng: coordinates.lng
      } : null,
      lead_source: 'coverage_checker' as const,
      status: 'new',
      metadata: {
        session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        is_coverage_check: true,
        checked_at: new Date().toISOString()
      }
    };

    const { data, error } = await supabase
      .from('coverage_leads')
      .insert([leadData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Failed to create coverage lead', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      leadId: data.id,
      status: 'success'
    });

  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('coverage_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Lead retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}