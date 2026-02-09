/**
 * Simple Coverage Check API for Quote Request Form
 *
 * POST /api/coverage/check
 *
 * Checks if service is available at an address and returns available packages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';

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
      customer_type: 'consumer', // Using 'consumer' as valid enum value
      lead_source: 'coverage_checker', // Using 'coverage_checker' as valid enum value
      status: 'new',
      // Required fields with placeholders (to be filled in Step 2 of form)
      first_name: 'Quote',
      last_name: 'Request',
      email: 'pending@quote.request',
      phone: '0000000000',
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
      apiLogger.error('Error creating coverage lead:', leadError);
      apiLogger.error('Lead data attempted:', leadData);
      return NextResponse.json(
        { success: false, error: 'Failed to check coverage', details: leadError.message },
        { status: 500 }
      );
    }

    if (!lead) {
      apiLogger.error('No lead returned from insert');
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
      .order('price', { ascending: true });

    if (packagesError) {
      apiLogger.error('Error fetching packages:', packagesError);
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
    apiLogger.error('Coverage check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
