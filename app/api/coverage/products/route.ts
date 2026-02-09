import { NextRequest, NextResponse } from 'next/server';
import { coverageAggregationService } from '@/lib/coverage/aggregation-service';
import { ProductRecommendationService } from '@/lib/coverage/product-recommendations';
import { apiLogger } from '@/lib/logging';

/**
 * GET /api/coverage/products
 * Get product recommendations based on coverage at a location
 *
 * Query parameters:
 * - lat: Latitude
 * - lng: Longitude
 * - customerType: consumer | sme | enterprise (optional)
 * - minSpeed: Minimum speed requirement in Mbps (optional)
 * - maxBudget: Maximum monthly budget in ZAR (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const customerType = searchParams.get('customerType') as 'consumer' | 'sme' | 'enterprise' | null;
    const minSpeed = searchParams.get('minSpeed');
    const maxBudget = searchParams.get('maxBudget');

    // Validate coordinates
    if (!lat || !lng) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: lat and lng',
          code: 'MISSING_COORDINATES'
        },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid coordinates format',
          code: 'INVALID_COORDINATES'
        },
        { status: 400 }
      );
    }

    // Check if coordinates are in valid range
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coordinates out of valid range',
          code: 'INVALID_COORDINATES'
        },
        { status: 400 }
      );
    }

    // Get coverage data
    const coverageData = await coverageAggregationService.aggregateCoverage(
      { lat: latitude, lng: longitude },
      {
        providers: ['mtn'],
        serviceTypes: ['uncapped_wireless'], // Check specifically for SkyFibre availability
        includeAlternatives: false
      }
    );

    // Get product recommendations
    const recommendations = await ProductRecommendationService.getRecommendations(
      coverageData,
      {
        customerType: customerType || undefined,
        minSpeed: minSpeed ? parseInt(minSpeed) : undefined,
        budget: maxBudget ? { max: parseInt(maxBudget) } : undefined,
        preferUnlimited: true
      }
    );

    // Check if SkyFibre is available
    const skyFibreAvailable = ProductRecommendationService.isSkyFibreAvailable(coverageData);

    return NextResponse.json(
      {
        success: true,
        data: {
          location: {
            lat: latitude,
            lng: longitude
          },
          skyFibreAvailable,
          coverageSummary: {
            available: coverageData.overallCoverage,
            services: coverageData.bestServices.map(service => ({
              type: service.serviceType,
              available: service.available,
              provider: service.recommendedProvider
            }))
          },
          recommendations,
          totalRecommendations: recommendations.length
        }
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=900' // Cache for 15 minutes
        }
      }
    );
  } catch (error) {
    apiLogger.error('[Coverage Products API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coverage/products
 * Get product recommendations with detailed options
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, customerType, budget, minSpeed, preferUnlimited } = body;

    // Validate coordinates
    if (!lat || !lng) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: lat and lng',
          code: 'MISSING_COORDINATES'
        },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid coordinates format',
          code: 'INVALID_COORDINATES'
        },
        { status: 400 }
      );
    }

    // Get coverage data
    const coverageData = await coverageAggregationService.aggregateCoverage(
      { lat: latitude, lng: longitude },
      {
        providers: ['mtn'],
        serviceTypes: ['uncapped_wireless'],
        includeAlternatives: false
      }
    );

    // Get product recommendations
    const recommendations = await ProductRecommendationService.getRecommendations(
      coverageData,
      {
        customerType,
        minSpeed,
        budget,
        preferUnlimited
      }
    );

    // Check if SkyFibre is available
    const skyFibreAvailable = ProductRecommendationService.isSkyFibreAvailable(coverageData);

    return NextResponse.json(
      {
        success: true,
        data: {
          location: {
            lat: latitude,
            lng: longitude
          },
          skyFibreAvailable,
          coverageDetails: coverageData,
          recommendations,
          totalRecommendations: recommendations.length
        }
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=900' // Cache for 15 minutes
        }
      }
    );
  } catch (error) {
    apiLogger.error('[Coverage Products API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}