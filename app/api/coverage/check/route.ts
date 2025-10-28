/**
 * Simple Coverage Check API for Quote Request Form
 *
 * POST /api/coverage/check
 *
 * Checks if service is available at an address and returns available packages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { address, coordinates } = await request.json();

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create coverage lead with coordinates if available
    const leadData: any = {
      address,
      customer_type: 'business',
      lead_source: 'quote_request',
      status: 'new',
      // Add coordinates in PostGIS geography format if provided
      ...(coordinates?.lat && coordinates?.lng && {
        coordinates: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat]
        }
      })
    };

    const { data: lead, error: leadError } = await supabase
      .from('coverage_leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      console.error('Error creating coverage lead:', leadError);
      console.error('Lead data attempted:', leadData);
      return NextResponse.json(
        { success: false, error: 'Failed to check coverage', details: leadError.message },
        { status: 500 }
      );
    }

    if (!lead) {
      console.error('No lead returned from insert');
      return NextResponse.json(
        { success: false, error: 'Failed to create coverage lead' },
        { status: 500 }
      );
    }

    // Get available packages (for now, return all active business packages)
    // TODO: Implement actual coverage check logic
    const { data: packages, error: packagesError } = await supabase
      .from('service_packages')
      .select('*')
      .eq('active', true)
      .eq('customer_type', 'business')
      .order('monthly_price', { ascending: true });

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
    }

    return NextResponse.json({
      success: true,
      available: packages && packages.length > 0,
      lead_id: lead.id,
      formatted_address: address,
      coordinates: lead.coordinates,
      packages: packages || []
    });

  } catch (error) {
    console.error('Coverage check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
