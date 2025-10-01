// MTN Coverage Check API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { mtnWMSClient } from '@/lib/coverage/mtn/wms-client';
import { MTNWMSParser } from '@/lib/coverage/mtn/wms-parser';
import { Coordinates, ServiceType, CoverageError } from '@/lib/coverage/types';
import { geographicValidator } from '@/lib/coverage/mtn/geo-validation';

interface CoverageCheckRequest {
  address?: string;
  coordinates?: Coordinates;
  serviceTypes?: ServiceType[];
  includeSignalStrength?: boolean;
  sources?: ('business' | 'consumer')[];
}

interface CoverageCheckResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  code?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CoverageCheckResponse>> {
  try {
    const body: CoverageCheckRequest = await request.json();

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

    // Enhanced geographic validation
    const geoValidation = geographicValidator.validateCoordinates(coordinates);
    if (!geoValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coordinates for South Africa',
        code: 'LOCATION_OUT_OF_BOUNDS',
        details: {
          warnings: geoValidation.warnings,
          suggestions: geoValidation.suggestions
        }
      }, { status: 400 });
    }

    // Add geographic context to response metadata
    const locationInfo = geographicValidator.getLocationInfo(coordinates);

    // Check MTN coverage using dual-source approach
    const coverageResults = await mtnWMSClient.checkCoverage(
      coordinates,
      body.serviceTypes
    );

    // Parse and combine results
    const parsedCoverage = MTNWMSParser.parseDualSourceCoverage(
      coverageResults.business,
      coverageResults.consumer,
      coordinates
    );

    // Filter services if signal strength threshold specified
    let services = parsedCoverage.services;
    if (!body.includeSignalStrength) {
      // Only return available services when signal strength not requested
      services = services.filter(service => service.available);
    }

    // Sort services by priority
    services = MTNWMSParser.sortServicesByPriority(services);

    const response = {
      success: true,
      data: {
        ...parsedCoverage,
        services,
        address: body.address,
        requestId: generateRequestId(),
        provider: 'MTN',
        location: {
          province: locationInfo.details.province,
          nearestCity: locationInfo.details.nearestCity,
          distanceToMajorCity: locationInfo.details.distanceToMajorCity,
          populationDensityArea: locationInfo.details.populationDensityArea,
          coverageLikelihood: locationInfo.details.coverageLikelihood,
          confidence: geoValidation.confidence,
          warnings: geoValidation.warnings
        }
      }
    };

    // Add caching headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600'); // 5 min cache
    headers.set('Content-Type', 'application/json');

    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('MTN coverage check error:', error);

    if (error instanceof CoverageError) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code
      }, { status: 500 });
    }

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
  const serviceTypes = searchParams.get('serviceTypes')?.split(',') as ServiceType[];

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
  const postBody: CoverageCheckRequest = {
    coordinates,
    serviceTypes,
    includeSignalStrength: searchParams.get('includeSignalStrength') === 'true'
  };

  // Create a new request object for the POST handler
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postBody)
  });

  return POST(postRequest);
}

function validateRequest(body: CoverageCheckRequest): { valid: boolean; error?: string } {
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

// Geographic validation is now handled by geographicValidator

function generateRequestId(): string {
  return `mtn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}