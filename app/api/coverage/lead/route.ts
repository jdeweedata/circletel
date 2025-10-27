import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
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

    let finalCoordinates: { lat: number; lng: number } | null = coordinates ? { lat: coordinates.lat, lng: coordinates.lng } : null;
    let geocodeMeta: any = null;

    if (!finalCoordinates) {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=za&components=country:ZA&key=${apiKey}`;
          const resp = await fetch(url);
          if (resp.ok) {
            const data = await resp.json();
            if (data.status === 'OK' && data.results && data.results[0]) {
              const res = data.results[0];
              if (res.geometry && res.geometry.location && typeof res.geometry.location.lat === 'number' && typeof res.geometry.location.lng === 'number') {
                finalCoordinates = { lat: res.geometry.location.lat, lng: res.geometry.location.lng };
                geocodeMeta = {
                  geocoded: true,
                  place_id: res.place_id,
                  formatted_address: res.formatted_address,
                  geocode_status: data.status
                };
              }
            }
          }
        } catch {}
      }
    }

    // Create a minimal lead entry for coverage check
    // Full customer details will be collected in the order form
    const leadData = {
      customer_type: customerType,
      first_name: 'Coverage',  // Placeholder - will be updated during order
      last_name: 'Check',      // Placeholder - will be updated during order
      email: `coverage-${Date.now()}@temp.circletel.co.za`, // Temporary email
      phone: '0000000000',     // Placeholder - will be updated during order
      address,
      coordinates: finalCoordinates,
      lead_source: 'coverage_checker',
      status: 'new',
      metadata: {
        session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        is_coverage_check: true,
        checked_at: new Date().toISOString(),
        ...(geocodeMeta || {})
      }
    };

    const { data, error } = await supabase
      .from('coverage_leads')
      .insert([leadData])
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      return NextResponse.json(
        {
          error: 'Failed to create coverage lead',
          details: error.message
        },
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
    const supabase = await createClient();
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