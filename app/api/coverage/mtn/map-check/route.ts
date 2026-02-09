import { NextRequest, NextResponse } from 'next/server';
import { MTNMapClient, MTNMapType } from '@/lib/coverage/mtn/map-client';
import { MTNMapScraper } from '@/lib/coverage/mtn/map-scraper';
import { Coordinates } from '@/lib/coverage/types';
import { apiLogger } from '@/lib/logging';

/**
 * MTN Map Coverage Check API
 * Uses Playwright to interact with MTN's coverage maps and extract real coverage data
 *
 * This endpoint provides TWO modes:
 * 1. Playwright Mode (when Playwright MCP is available) - Returns REAL coverage data
 * 2. Mock Mode (fallback) - Returns sample structure for development
 *
 * Usage:
 * POST /api/coverage/mtn/map-check
 * Body: { coordinates: { lat: -25.9, lng: 28.18 }, mapType: 'consumer' }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coordinates, mapType = 'consumer', useMock = true } = body as {
      coordinates: Coordinates;
      mapType?: MTNMapType;
      useMock?: boolean;
    };

    if (!coordinates?.lat || !coordinates?.lng) {
      return NextResponse.json(
        { error: 'Valid coordinates are required', code: 'INVALID_COORDINATES' },
        { status: 400 }
      );
    }

    // Validate South African coordinates
    if (
      coordinates.lat < -35 ||
      coordinates.lat > -22 ||
      coordinates.lng < 16 ||
      coordinates.lng > 33
    ) {
      return NextResponse.json(
        {
          error: 'Coordinates must be within South Africa',
          code: 'OUT_OF_BOUNDS',
        },
        { status: 400 }
      );
    }

    const config = MTNMapClient.getMapConfig(mapType);

    // MOCK MODE for development/testing
    // In production, this should use Playwright to scrape the actual map
    if (useMock) {
      // Mock data based on known coverage areas
      const isCenturion =
        coordinates.lat >= -26.0 && coordinates.lat <= -25.8 &&
        coordinates.lng >= 28.0 && coordinates.lng <= 28.3;

      const isJohannesburg =
        coordinates.lat >= -26.3 && coordinates.lat <= -26.1 &&
        coordinates.lng >= 27.9 && coordinates.lng <= 28.1;

      const mockServices = [];

      if (isCenturion || isJohannesburg) {
        // These areas have good MTN coverage
        mockServices.push(
          { type: '5g', available: true, signal: 'good', technology: '5G' },
          { type: 'lte', available: true, signal: 'excellent', technology: 'LTE' },
          { type: 'fixed_lte', available: true, signal: 'good', technology: 'Fixed LTE' },
          { type: '3g_2100', available: true, signal: 'good', technology: '3G 2100MHz' },
          { type: '3g_900', available: true, signal: 'fair', technology: '3G 900MHz' },
          { type: '2g', available: true, signal: 'good', technology: '2G GSM' }
        );
      } else {
        // Limited coverage in other areas
        mockServices.push(
          { type: 'lte', available: true, signal: 'fair', technology: 'LTE' },
          { type: '3g_2100', available: true, signal: 'good', technology: '3G 2100MHz' },
          { type: '2g', available: true, signal: 'good', technology: '2G GSM' }
        );
      }

      const mapCoverageData = {
        coordinates,
        mapType,
        services: mockServices,
        metadata: {
          capturedAt: new Date().toISOString(),
          mapVersion: 'v3',
          mapUrl: config.url,
          mode: 'mock',
        },
      };

      return NextResponse.json({
        success: true,
        data: mapCoverageData,
        config,
      });
    }

    // PLAYWRIGHT MODE (real scraping)
    // NOTE: This requires Playwright to be running
    // Example implementation (commented out until Playwright is set up):
    /*
    const page = await getPlaywrightPage(); // Your Playwright setup

    // Navigate to MTN map
    await page.goto(config.url);
    await page.waitForTimeout(5000); // Wait for map to load

    // Execute extraction script
    const result = await page.evaluate(
      MTNMapScraper.getBrowserExtractionScript(coordinates)
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
    */

    return NextResponse.json(
      {
        error: 'Playwright mode not yet implemented. Use useMock: true',
        code: 'PLAYWRIGHT_NOT_CONFIGURED',
      },
      { status: 501 }
    );
  } catch (error) {
    apiLogger.error('MTN map coverage check error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'MAP_CHECK_FAILED',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const mapType = (searchParams.get('mapType') || 'consumer') as MTNMapType;
  const useMock = searchParams.get('mock') !== 'false';

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: 'Valid lat and lng query parameters are required' },
      { status: 400 }
    );
  }

  return POST(
    new Request(request.url, {
      method: 'POST',
      body: JSON.stringify({ coordinates: { lat, lng }, mapType, useMock }),
      headers: { 'Content-Type': 'application/json' },
    }) as any
  );
}
