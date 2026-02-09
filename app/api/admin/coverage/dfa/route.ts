import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { dfaCoverageClient } from '@/lib/coverage/providers/dfa';

export const dynamic = 'force-dynamic';

interface Coordinates {
  lat: number;
  lng: number;
}

interface AdminCoverageRequest {
  address?: string;
  coordinates?: Coordinates;
}

async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=za&components=country:ZA&key=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    const result = data?.results?.[0];
    if (
      data?.status === 'OK' &&
      result?.geometry?.location &&
      typeof result.geometry.location.lat === 'number' &&
      typeof result.geometry.location.lng === 'number'
    ) {
      return { lat: result.geometry.location.lat, lng: result.geometry.location.lng };
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AdminCoverageRequest;
    const address = body.address?.trim();
    let coords: Coordinates | null = body.coordinates ?? null;

    if (!coords && address) {
      coords = await geocodeAddress(address);
    }

    if (!coords) {
      return NextResponse.json(
        { success: false, error: 'coordinates_required', message: 'Provide coordinates or a valid address to geocode.' },
        { status: 400 }
      );
    }

    const result = await dfaCoverageClient.checkCoverage({
      latitude: coords.lat,
      longitude: coords.lng,
      checkNearNet: true,
      maxNearNetDistance: 200
    });

    const payload: any = {
      provider: 'dfa',
      coordinates: coords,
      coverageType: result.coverageType,
      message: result.message,
      timestamp: new Date().toISOString()
    };

    if (result.coverageType === 'connected') {
      payload.connected = {
        buildingId: result.buildingDetails?.buildingId,
        status: result.buildingDetails?.status ?? 'Connected',
        ftth: result.buildingDetails?.ftth ?? result.buildingDetails?.FTTH,
        broadband: result.buildingDetails?.broadband ?? result.buildingDetails?.Broadband,
        precinct: result.buildingDetails?.precinct ?? result.buildingDetails?.Precinct
      };
    } else if (result.coverageType === 'near-net') {
      const distance = result.nearNetDetails?.distance || 0;
      const rounded = Math.round(distance);
      payload.nearNet = {
        distanceMeters: distance,
        display: `~${rounded}m`,
        timeline: '8–12 weeks',
        note: `Near-net (~${rounded}m): additional network build required. Estimated timeline: 8–12 weeks.`
      };
    }

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    apiLogger.error('[Admin DFA Coverage] Error:', error);
    return NextResponse.json(
      { success: false, error: 'internal_error', message: 'Failed to check DFA coverage' },
      { status: 500 }
    );
  }
}
