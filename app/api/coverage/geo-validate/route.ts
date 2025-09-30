// Geographic Validation API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { geographicValidator } from '@/lib/coverage/mtn/geo-validation';
import { Coordinates } from '@/lib/coverage/types';

interface GeoValidationRequest {
  coordinates?: Coordinates;
  address?: string;
  includeLocationInfo?: boolean;
}

interface GeoValidationResponse {
  success: boolean;
  data?: {
    isValid: boolean;
    confidence: 'high' | 'medium' | 'low';
    province?: string;
    nearestCity?: {
      name: string;
      distance: number;
      coordinates: Coordinates;
    };
    warnings: string[];
    suggestions?: string[];
    locationInfo?: {
      province?: string;
      nearestCity?: string;
      distanceToMajorCity?: number;
      populationDensityArea?: 'urban' | 'suburban' | 'rural';
      coverageLikelihood?: 'high' | 'medium' | 'low';
    };
  };
  error?: string;
  code?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<GeoValidationResponse>> {
  try {
    const body: GeoValidationRequest = await request.json();

    // Validate request
    if (!body.coordinates && !body.address) {
      return NextResponse.json({
        success: false,
        error: 'Either coordinates or address must be provided',
        code: 'MISSING_LOCATION'
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

    // Validate coordinate format
    if (typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number' ||
        isNaN(coordinates.lat) || isNaN(coordinates.lng)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coordinate format',
        code: 'INVALID_COORDINATES'
      }, { status: 400 });
    }

    // Perform validation
    const validation = geographicValidator.validateCoordinates(coordinates);

    const responseData: any = {
      isValid: validation.isValid,
      confidence: validation.confidence,
      warnings: validation.warnings,
      suggestions: validation.suggestions
    };

    // Add province info
    if (validation.province) {
      responseData.province = validation.province.name;
    }

    // Add nearest city info
    if (validation.nearestCity) {
      responseData.nearestCity = validation.nearestCity;
    }

    // Include detailed location info if requested
    if (body.includeLocationInfo) {
      const locationInfo = geographicValidator.getLocationInfo(coordinates);
      responseData.locationInfo = locationInfo.details;
    }

    const response: GeoValidationResponse = {
      success: true,
      data: responseData
    };

    // Add caching headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200'); // 1 hour cache
    headers.set('Content-Type', 'application/json');

    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('Geographic validation error:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal validation error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const includeLocationInfo = searchParams.get('includeLocationInfo') === 'true';

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
  const postBody: GeoValidationRequest = {
    coordinates,
    includeLocationInfo
  };

  // Create a new request object for the POST handler
  const postRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postBody)
  });

  return POST(postRequest);
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