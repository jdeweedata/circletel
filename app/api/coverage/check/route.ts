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
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create coverage lead
    const { data: lead, error: leadError } = await supabase
      .from('coverage_leads')
      .insert({
        address,
        customer_type: 'business',
        lead_source: 'quote_request',
        status: 'new'
      })
      .select()
      .single();

    if (leadError || !lead) {
      console.error('Error creating coverage lead:', leadError);
      return NextResponse.json(
        { success: false, error: 'Failed to check coverage' },
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
