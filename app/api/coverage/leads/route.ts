import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

/**
 * Coverage Leads API
 * Creates a new coverage lead with address and optional coordinates
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, latitude, longitude } = body;

    if (!address || typeof address !== 'string' || !address.trim()) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create coverage lead
    const { data: lead, error } = await supabase
      .from('coverage_leads')
      .insert({
        address: address.trim(),
        latitude: latitude || null,
        longitude: longitude || null,
        source: 'web_form'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create coverage lead:', error);
      return NextResponse.json(
        { error: 'Failed to create coverage lead', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: lead.id,
      address: lead.address,
      latitude: lead.latitude,
      longitude: lead.longitude
    });
  } catch (error) {
    console.error('Coverage lead creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
