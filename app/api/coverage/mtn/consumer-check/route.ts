import { NextRequest, NextResponse } from 'next/server';
import { Coordinates, ServiceType, CoverageError } from '@/lib/coverage/types';
import { MTNConsumerClient } from '@/lib/coverage/mtn/consumer-client';

interface ConsumerCheckRequest {
  coordinates: Coordinates;
  serviceTypes?: ServiceType[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ConsumerCheckRequest = await request.json();

    if (!body.coordinates?.lat || !body.coordinates?.lng) {
      return NextResponse.json({
        success: false,
        error: 'coordinates.lat and coordinates.lng are required',
        code: 'INVALID_REQUEST'
      }, { status: 400 });
    }

    const { lat, lng } = body.coordinates;

    if (lat < -35 || lat > -22 || lng < 16 || lng > 33) {
      return NextResponse.json({
        success: false,
        error: 'Coordinates are outside South Africa bounds',
        code: 'INVALID_COORDINATES'
      }, { status: 400 });
    }

    const result = await MTNConsumerClient.checkMobileCoverage(
      body.coordinates,
      body.serviceTypes
    );

    return NextResponse.json({
      success: true,
      data: {
        available: result.available,
        services: result.services,
        checkedAt: result.checkedAt
      }
    });
  } catch (error) {
    if (error instanceof CoverageError) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code
      }, { status: 502 });
    }

    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}
