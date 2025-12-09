import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { coverageAggregationService } from '@/lib/coverage/aggregation-service';
import { Coordinates } from '@/lib/coverage/types';
import { CoverageLogger } from '@/lib/analytics/coverage-logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const coverageType = searchParams.get('type') || 'residential'; // Get coverage type from URL

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    console.log('Packages API called with:', { leadId, coverageType });

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
    let fibreCoverage: 'connected' | 'near-net' | 'none' | 'unknown' = 'unknown';
    let fibreNearNetDistance: number | null = null;
    let hasLicensedWireless = false;

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
          providers: ['mtn', 'dfa'], // MTN for wireless, DFA for fibre
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
          // Check both MTN and DFA providers for metadata
          const mtnProvider = coverageResult.providers.mtn;
          const dfaProvider = coverageResult.providers.dfa;
          
          // Get aggregation metadata including wholesale debug info
          const aggMeta = (coverageResult as any)?.metadata;

          coverageMetadata = {
            providers: {
              mtn: mtnProvider ? {
                confidence: mtnProvider.confidence,
                servicesFound: mtnProvider.services?.length || 0
              } : null,
              dfa: dfaProvider ? {
                confidence: dfaProvider.confidence,
                servicesFound: dfaProvider.services?.length || 0
              } : null
            },
            lastUpdated: coverageResult.lastUpdated,
            totalServicesFound: availableServices.length,
            // Include wholesale debug info for troubleshooting
            wholesaleDebug: aggMeta?.wholesaleDebug
          };
          if (aggMeta && typeof aggMeta === 'object') {
            if (typeof aggMeta.coverageType === 'string') {
              fibreCoverage = aggMeta.coverageType as any;
            }
            if (typeof aggMeta.distance === 'number') {
              fibreNearNetDistance = aggMeta.distance;
            }
          }

          // Derive fibre coverage from DFA provider services if metadata not present
          if ((fibreCoverage === 'unknown' || fibreCoverage === 'none') && dfaProvider) {
            const dfaServices = Array.isArray(dfaProvider.services) ? dfaProvider.services : [];
            if (dfaServices.length > 0) {
              const ct = dfaServices.map((s: any) => s?.metadata?.coverageType).find((v: any) => typeof v === 'string');
              if (ct === 'connected' || ct === 'near-net') {
                fibreCoverage = ct as any;
              } else {
                // Presence of DFA fibre services implies some availability; default to connected when unknown
                fibreCoverage = 'connected';
              }
            } else if (dfaProvider.available === false) {
              fibreCoverage = 'none';
            }
          }

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
      // Check for licensed_wireless (P2P microwave) - requires quote/lead form
      const hasLicensedWireless = availableServices.includes('licensed_wireless');

      // Filter out licensed_wireless from normal package display
      const packageableServices = availableServices.filter(s => s !== 'licensed_wireless');

      // Map technical service types to product categories using service_type_mapping
      // Note: availableServices may contain either technical types (from MTN API) or product categories (from legacy coverage_areas)
      const { data: mappings, error: mappingError } = await supabase
        .from('service_type_mapping')
        .select('*')
        .in('technical_type', packageableServices)
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
        productCategories = packageableServices;
      }

      // Get available packages for the mapped product categories
      // Note: When no mappings exist, availableServices contains service_type values (e.g., 'SkyFibre', 'HomeFibreConnect')
      // When mappings exist, productCategories contains product_category values (e.g., 'wireless', 'fibre_consumer')
      // Filter by customer_type based on coverage type
      // Note: service_packages.customer_type is VARCHAR with values: 'business', 'consumer'
      // coverage_leads.customer_type is ENUM with values: 'consumer', 'smme', 'enterprise'
      const packageCustomerType = coverageType === 'business' ? 'business' : 'consumer';

      console.log('[Packages API] Querying packages with:', {
        packageCustomerType,
        productCategories,
        usingMappings: !!(mappings && mappings.length > 0),
        query: mappings && mappings.length > 0
          ? `product_category.in.(${productCategories.join(',')})`
          : `service_type.in.(${productCategories.join(',')})`
      });

      const { data: packages, error: packagesError } = await supabase
        .from('service_packages')
        .select('*')
        .or(
          mappings && mappings.length > 0
            ? `product_category.in.(${productCategories.join(',')})`
            : `service_type.in.(${productCategories.join(',')})`
        )
        .eq('customer_type', packageCustomerType)
        .eq('active', true)
        .order('price', { ascending: true });

      console.log('[Packages API] Query result:', {
        packagesFound: packages?.length || 0,
        packageNames: packages?.map((p: any) => p.name).slice(0, 5) || [],
        error: packagesError?.message
      });

      if (!packagesError && packages) {
        // Fetch provider data for packages with compatible_providers
        const { data: providers, error: providersError } = await supabase
          .from('fttb_network_providers')
          .select('provider_code, display_name, logo_url, logo_dark_url, logo_light_url, logo_format, logo_aspect_ratio, priority')
          .eq('active', true);

        // Create provider lookup map
        const providerMap = new Map();
        if (!providersError && providers) {
          providers.forEach((provider: any) => {
            providerMap.set(provider.provider_code, provider);
          });
        }

        availablePackages = packages.map((pkg: any) => {
          // Get provider info from compatible_providers array
          let providerData = null;
          if (pkg.compatible_providers && pkg.compatible_providers.length > 0) {
            // Get the first (highest priority) compatible provider
            const providerCode = pkg.compatible_providers[0];
            const provider = providerMap.get(providerCode);

            if (provider) {
              providerData = {
                code: provider.provider_code,
                name: provider.display_name,
                logo_url: provider.logo_url,
                logo_dark_url: provider.logo_dark_url,
                logo_light_url: provider.logo_light_url,
                logo_format: provider.logo_format,
                logo_aspect_ratio: provider.logo_aspect_ratio
              };
            }
          }

          return {
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
            features: pkg.features || [],
            provider: providerData // Add provider data including logo
          };
        });

        const isBizFibre = (pkg: any) => pkg.service_type === 'BizFibreConnect' || pkg.product_category === 'fibre_business';
        if (!lat || !lng) {
          availablePackages = availablePackages.filter((pkg: any) => !isBizFibre(pkg));
        } else {
          if (fibreCoverage === 'none' || fibreCoverage === 'unknown') {
            availablePackages = availablePackages.filter((pkg: any) => !isBizFibre(pkg));
          } else if (fibreCoverage === 'near-net') {
            // Frontend: hide BizFibre for near-net; near-net details are for admin module only
            availablePackages = availablePackages.filter((pkg: any) => !isBizFibre(pkg));
          } else if (fibreCoverage === 'connected') {
            availablePackages = availablePackages.map((pkg: any) => {
              if (isBizFibre(pkg)) {
                const features = Array.isArray(pkg.features) ? pkg.features.slice() : [];
                const note = 'Connected building: ready for standard installation (5–10 business days).';
                if (!features.includes(note)) features.push(note);
                return { ...pkg, features };
              }
              return pkg;
            });
          }
        }
      }

      // Log for debugging
      console.log('Coverage check:', {
        coverageType,
        packageCustomerType,
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

    // Log analytics
    const responseTime = Date.now() - startTime;
    await CoverageLogger.log({
      endpoint: '/api/coverage/packages',
      method: 'GET',
      address: lead.address,
      latitude: lat,
      longitude: lng,
      province: CoverageLogger.extractProvinceFromAddress(lead.address),
      city: CoverageLogger.extractCityFromAddress(lead.address),
      coverageType,
      providerCode: coverageMetadata?.providers ? Object.keys(coverageMetadata.providers)[0] : undefined,
      statusCode: 200,
      success: true,
      responseTimeMs: responseTime,
      hasCoverage: coverageAvailable,
      coverageStatus: fibreCoverage,
      packagesFound: availablePackages.length,
      leadId,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

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
      metadata: coverageMetadata, // Include coverage metadata for debugging
      hasLicensedWireless: hasLicensedWireless || false, // Flag for P2P microwave availability
      requiresQuote: hasLicensedWireless && availablePackages.length === 0 // Show quote form if only licensed_wireless
    });

  } catch (error) {
    console.error('Coverage check error:', error);
    
    // Log error
    const responseTime = Date.now() - startTime;
    await CoverageLogger.log({
      endpoint: '/api/coverage/packages',
      method: 'GET',
      statusCode: 500,
      success: false,
      responseTimeMs: responseTime,
      errorCode: 'INTERNAL_ERROR',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorType: 'INTERNAL_ERROR',
      userAgent: request.headers.get('user-agent') || undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}