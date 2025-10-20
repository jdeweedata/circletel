import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { coverageAggregationService } from '@/lib/coverage/aggregation-service';
import { Coordinates } from '@/lib/coverage/types';

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

    // Check coverage using real-time MTN coverage validation
    let coverageAvailable = false;
    let availableServices: string[] = [];
    let availablePackages: any[] = [];
    let coverageMetadata: any = null;

    // Extract coordinates from JSONB structure
    const lat = lead.coordinates?.lat;
    const lng = lead.coordinates?.lng;

    if (lat && lng) {
      try {
        // Use real-time MTN coverage aggregation service
        const coordinates: Coordinates = {
          lat: lat,
          lng: lng
        };

        const coverageResult = await coverageAggregationService.aggregateCoverage(coordinates, {
          providers: ['mtn'], // Can expand to other providers in the future
          includeAlternatives: true,
          prioritizeReliability: true,
          prioritizeSpeed: false
        });

        // ✅ Phase 2: MTN Consumer API enabled
        // The aggregation service now uses the verified Consumer API endpoint
        // Fallback to PostGIS only if the Consumer API fails or returns no coverage

        if (coverageResult.overallCoverage && coverageResult.bestServices.length > 0) {
          coverageAvailable = true;

          // Extract available service types from the coverage result
          availableServices = coverageResult.bestServices
            .filter(service => service.available)
            .map(service => service.serviceType);

          // Store metadata for debugging
          coverageMetadata = {
            provider: 'mtn',
            confidence: coverageResult.providers.mtn?.confidence || 'unknown',
            lastUpdated: coverageResult.lastUpdated,
            servicesFound: availableServices.length,
            source: coverageResult.providers.mtn?.metadata?.source || 'mtn_consumer_api',
            phase: coverageResult.providers.mtn?.metadata?.phase || 'phase_3_infrastructure_ready',
            infrastructureEstimatorAvailable: coverageResult.providers.mtn?.metadata?.infrastructureEstimatorAvailable || true
          };

          console.log('Real-time MTN coverage check:', {
            coordinates,
            availableServices,
            metadata: coverageMetadata
          });
        }
      } catch (error) {
        console.error('Real-time coverage check failed (using PostGIS fallback):', error);

        // Fallback to legacy PostGIS query if real-time check fails
        const { data: coverageData, error: coverageError } = await supabase
          .rpc('check_coverage_at_point', {
            lat: lat,
            lng: lng
          });

        if (!coverageError && coverageData && coverageData.length > 0) {
          coverageAvailable = true;
          availableServices = [...new Set(coverageData.map((item: any) => item.service_type).filter((type: any): type is string => typeof type === 'string'))] as string[];

          console.log('Fallback to PostGIS coverage check:', {
            availableServices
          });
        }
      }
    }

    if (!coverageAvailable) {
      // Final fallback: Check coverage by area name/address matching (legacy)
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

          console.log('Fallback to area name matching:', {
            availableServices
          });
        }
      }
    }

    if (coverageAvailable && availableServices.length > 0) {
      // Map technical service types to product categories using service_type_mapping
      // Note: availableServices may contain either technical types (from MTN API) or product categories (from legacy coverage_areas)
      const { data: mappings, error: mappingError } = await supabase
        .from('service_type_mapping')
        .select('*')
        .in('technical_type', availableServices)
        .eq('active', true)
        .order('priority', { ascending: true });

      if (mappingError) {
        console.error('Mapping error:', mappingError);
      }

      // Get unique product categories from mappings, or use services directly if they're already product categories
      let productCategories: string[];
      if (mappings && mappings.length > 0) {
        // Services were technical types, successfully mapped to product categories
        productCategories = [...new Set(mappings.map((m: any) => m.product_category))];
      } else {
        // No mappings found - services are already product categories (from legacy coverage_areas table)
        productCategories = availableServices;
      }

      // Get available packages for the mapped product categories
      const { data: packages, error: packagesError } = await supabase
        .from('service_packages')
        .select('*')
        .in('product_category', productCategories)
        .eq('active', true)
        .order('price', { ascending: true });

      if (!packagesError && packages) {
        availablePackages = packages.map((pkg: any) => ({
          id: pkg.id,
          name: pkg.name,
          service_type: pkg.service_type,
          product_category: pkg.product_category,
          speed_down: pkg.speed_down,
          speed_up: pkg.speed_up,
          price: pkg.price,
          promotion_price: pkg.promotion_price,
          promotion_months: pkg.promotion_months,
          description: pkg.description,
          features: pkg.features || []
        }));
      }

      // Log for debugging
      console.log('Coverage check:', {
        availableServices,
        productCategories,
        packagesFound: availablePackages.length
      });
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
      coordinates: lat && lng ? {
        lat: lat,
        lng: lng
      } : null,
      metadata: coverageMetadata // Include coverage metadata for debugging
    });

  } catch (error) {
    console.error('Coverage check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}