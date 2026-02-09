// Multi-source Coverage Aggregation API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { coverageAggregationService } from '@/lib/coverage/aggregation-service';
import { Coordinates, ServiceType, CoverageProvider } from '@/lib/coverage/types';
import { apiLogger } from '@/lib/logging';

interface AggregationRequest {
  address?: string;
  coordinates?: Coordinates;
  providers?: CoverageProvider[];
  serviceTypes?: ServiceType[];
  includeAlternatives?: boolean;
  prioritizeSpeed?: boolean;
  prioritizeReliability?: boolean;
  compareProviders?: boolean;
  specificService?: ServiceType;
}

interface AggregationResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  code?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AggregationResponse>> {
  try {
    const body: AggregationRequest = await request.json();

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
        code: 'INVALID_REQUEST'
      }, { status: 400 });
    }

    let coordinates: Coordinates;

    // Handle address geocoding if coordinates not provided
    if (body.address && !body.coordinates) {
      try {
        coordinates = await geocodeAddress(body.address);
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Failed to geocode address',
          code: 'GEOCODING_FAILED'
        }, { status: 400 });
      }
    } else if (body.coordinates) {
      coordinates = body.coordinates;
    } else {
      return NextResponse.json({
        success: false,
        error: 'Either address or coordinates must be provided',
        code: 'MISSING_LOCATION'
      }, { status: 400 });
    }

    // Validate coordinates are in South Africa
    if (!isInSouthAfrica(coordinates)) {
      return NextResponse.json({
        success: false,
        error: 'Coordinates must be within South Africa',
        code: 'LOCATION_OUT_OF_BOUNDS'
      }, { status: 400 });
    }

    // Handle specific service comparison
    if (body.compareProviders && body.specificService) {
      const comparison = await coverageAggregationService.compareCoverageByService(
        coordinates,
        body.specificService,
        body.providers
      );

      return NextResponse.json({
        success: true,
        data: {
          type: 'service_comparison',
          coordinates,
          address: body.address,
          comparison,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Aggregate coverage from multiple sources
    const aggregatedCoverage = await coverageAggregationService.aggregateCoverage(
      coordinates,
      {
        providers: body.providers,
        serviceTypes: body.serviceTypes,
        includeAlternatives: body.includeAlternatives,
        prioritizeSpeed: body.prioritizeSpeed,
        prioritizeReliability: body.prioritizeReliability
      }
    );

    const response = {
      success: true,
      data: {
        type: 'aggregated_coverage',
        ...aggregatedCoverage,
        address: body.address,
        requestOptions: {
          providers: body.providers || ['mtn'],
          serviceTypes: body.serviceTypes,
          includeAlternatives: body.includeAlternatives ?? true,
          prioritizeSpeed: body.prioritizeSpeed ?? false,
          prioritizeReliability: body.prioritizeReliability ?? true
        }
      }
    };

    // Add caching headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600'); // 5 min cache
    headers.set('Content-Type', 'application/json');

    return NextResponse.json(response, { headers });

  } catch (error) {
    apiLogger.error('Coverage aggregation error:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const providers = searchParams.get('providers')?.split(',') as CoverageProvider[];
  const serviceTypes = searchParams.get('serviceTypes')?.split(',') as ServiceType[];
  const compareProviders = searchParams.get('compareProviders') === 'true';
  const specificService = searchParams.get('specificService') as ServiceType;

  if (!lat || !lng) {
    return NextResponse.json({
      success: false,
      error: 'lat and lng query parameters are required',
      code: 'MISSING_COORDINATES'
    }, { status: 400 });
  }

  const coordinates: Coordinates = {
    lat: parseFloat(lat),
    lng: parseFloat(lng)
  };

  // Validate coordinates
  if (isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
    return NextResponse.json({
      success: false,
      error: 'Invalid coordinates',
      code: 'INVALID_COORDINATES'
    }, { status: 400 });
  }

  // Convert GET to POST request format
  const postBody: AggregationRequest = {
    coordinates,
    providers,
    serviceTypes,
    includeAlternatives: searchParams.get('includeAlternatives') !== 'false',
    prioritizeSpeed: searchParams.get('prioritizeSpeed') === 'true',
    prioritizeReliability: searchParams.get('prioritizeReliability') !== 'false',
    compareProviders,
    specificService
  };

  // Create a new request object for the POST handler
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postBody)
  });

  return POST(postRequest);
}

// Cache management endpoints
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'clear-cache') {
    coverageAggregationService.clearCache();
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  }

  if (action === 'cache-stats') {
    const stats = coverageAggregationService.getCacheStats();
    return NextResponse.json({
      success: true,
      data: stats
    });
  }

  return NextResponse.json({
    success: false,
    error: 'Invalid action. Supported actions: clear-cache, cache-stats'
  }, { status: 400 });
}

function validateRequest(body: AggregationRequest): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  if (!body.address && !body.coordinates) {
    return { valid: false, error: 'Either address or coordinates must be provided' };
  }

  if (body.coordinates) {
    const { lat, lng } = body.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return { valid: false, error: 'Coordinates must be numbers' };
    }

    if (lat < -35 || lat > -22 || lng < 16 || lng > 33) {
      return { valid: false, error: 'Coordinates must be within South Africa bounds' };
    }
  }

  if (body.providers && Array.isArray(body.providers)) {
    const validProviders: CoverageProvider[] = ['mtn', 'vodacom', 'cell_c', 'telkom'];
    for (const provider of body.providers) {
      if (!validProviders.includes(provider)) {
        return { valid: false, error: `Invalid provider: ${provider}` };
      }
    }
  }

  if (body.serviceTypes && Array.isArray(body.serviceTypes)) {
    const validServiceTypes: ServiceType[] = [
      'fibre', 'fixed_lte', 'uncapped_wireless', 'licensed_wireless',
      '5g', 'lte', '3g_900', '3g_2100', '2g'
    ];

    for (const serviceType of body.serviceTypes) {
      if (!validServiceTypes.includes(serviceType)) {
        return { valid: false, error: `Invalid service type: ${serviceType}` };
      }
    }
  }

  if (body.specificService) {
    const validServiceTypes: ServiceType[] = [
      'fibre', 'fixed_lte', 'uncapped_wireless', 'licensed_wireless',
      '5g', 'lte', '3g_900', '3g_2100', '2g'
    ];

    if (!validServiceTypes.includes(body.specificService)) {
      return { valid: false, error: `Invalid specific service type: ${body.specificService}` };
    }
  }

  return { valid: true };
}

async function geocodeAddress(address: string): Promise<Coordinates> {
  // Use Google Maps Geocoding API
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('components', 'country:ZA'); // Restrict to South Africa
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    throw new Error(`Geocoding failed: ${data.status || 'No results'}`);
  }

  const location = data.results[0].geometry.location;
  return {
    lat: location.lat,
    lng: location.lng
  };
}

function isInSouthAfrica(coordinates: Coordinates): boolean {
  // South Africa approximate bounds
  const bounds = {
    north: -22.0,
    south: -35.0,
    east: 33.0,
    west: 16.0
  };

  return (
    coordinates.lat >= bounds.south &&
    coordinates.lat <= bounds.north &&
    coordinates.lng >= bounds.west &&
    coordinates.lng <= bounds.east
  );
}