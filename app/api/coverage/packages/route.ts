import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Get lead information
    const { data: lead, error: leadError } = await supabase
      .from('coverage_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Check coverage based on coordinates or address
    let coverageAvailable = false;
    let availableServices: string[] = [];
    let availablePackages: any[] = [];

    if (lead.latitude && lead.longitude) {
      // Check coverage using coordinates (PostGIS query)
      const { data: coverageData, error: coverageError } = await supabase
        .rpc('check_coverage_at_point', {
          lat: lead.latitude,
          lng: lead.longitude
        });

      if (!coverageError && coverageData && coverageData.length > 0) {
        coverageAvailable = true;
        availableServices = [...new Set(coverageData.map((item: any) => item.service_type).filter((type: any): type is string => typeof type === 'string'))] as string[];
      }
    }

    if (!coverageAvailable) {
      // Fallback: Check coverage by area name/address matching
      const { data: areas, error: areasError } = await supabase
        .from('coverage_areas')
        .select('*')
        .eq('status', 'active');

      if (!areasError && areas) {
        const addressLower = lead.address.toLowerCase();
        const matchingAreas = areas.filter((area: any) => {
          const areaName = area.area_name.toLowerCase();
          const cityName = area.city?.toLowerCase() || '';
          return addressLower.includes(areaName) ||
                 addressLower.includes(cityName) ||
                 areaName.includes(addressLower.split(',')[0]?.trim()) ||
                 cityName.includes(addressLower.split(',')[0]?.trim());
        });

        if (matchingAreas.length > 0) {
          coverageAvailable = true;
          availableServices = [...new Set(matchingAreas.map((area: any) => area.service_type))];
        }
      }
    }

    if (coverageAvailable && availableServices.length > 0) {
      // Get available packages for the services
      const { data: packages, error: packagesError } = await supabase
        .from('service_packages')
        .select('*')
        .in('service_type', availableServices)
        .eq('active', true)
        .order('price', { ascending: true });

      if (!packagesError && packages) {
        availablePackages = packages.map((pkg: any) => ({
          id: pkg.id,
          name: pkg.name,
          service_type: pkg.service_type,
          speed_down: pkg.speed_down,
          speed_up: pkg.speed_up,
          price: pkg.price,
          promotion_price: pkg.promotion_price,
          promotion_months: pkg.promotion_months,
          description: pkg.description,
          features: pkg.features || []
        }));
      }
    }

    // Update lead with coverage check result
    await supabase
      .from('coverage_leads')
      .update({
        coverage_available: coverageAvailable,
        available_services: availableServices,
        checked_at: new Date().toISOString()
      })
      .eq('id', leadId);

    return NextResponse.json({
      available: coverageAvailable,
      services: availableServices,
      packages: availablePackages,
      leadId: leadId,
      address: lead.address,
      coordinates: lead.latitude && lead.longitude ? {
        lat: lead.latitude,
        lng: lead.longitude
      } : null
    });

  } catch (error) {
    console.error('Coverage check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}