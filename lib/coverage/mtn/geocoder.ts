import { Coordinates } from '../types';

const GEOCODE_URL = 'https://mtnsi.mtn.co.za/utils/geocode/gc';
const GEOCODE_TIMEOUT_MS = 3000;
const RATE_LIMIT_MS = 200;

let lastRequestTime = 0;

export interface GeocoderResult {
  lat: number;
  lng: number;
  address?: string;
  suburb?: string;
  town?: string;
  province?: string;
  confidence: 'high' | 'low';
}

interface MTNGeocodeResponse {
  Y: string;
  X: string;
  STREET?: string;
  SUBURB?: string;
  TOWN?: string;
  PROVINCE?: string;
  STR_NUM_MATCH?: string;
}

export async function mtnGeocode(address: string): Promise<GeocoderResult | null> {
  await enforceRateLimit();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);

  try {
    const body = new URLSearchParams({
      pSearch: address,
      pMaxRows: '10',
      pCORS: '*'
    });

    const response = await fetch(GEOCODE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://mtnsi.mtn.co.za/coverage/',
        'Origin': 'https://mtnsi.mtn.co.za'
      },
      body: body.toString(),
      signal: controller.signal
    });

    if (!response.ok) return null;

    const data = await response.json();
    const results: MTNGeocodeResponse[] = Array.isArray(data) ? data : data?.results ?? [];

    if (results.length === 0) return null;

    const best = results[0];
    const lat = parseFloat(best.Y);
    const lng = parseFloat(best.X);
    if (isNaN(lat) || isNaN(lng)) return null;

    return {
      lat,
      lng,
      address: best.STREET,
      suburb: best.SUBURB,
      town: best.TOWN,
      province: best.PROVINCE,
      confidence: best.STR_NUM_MATCH === '1' ? 'high' : 'low'
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function correctCoordinates(
  googleCoords: Coordinates,
  address: string
): Promise<{ coordinates: Coordinates; corrected: boolean; distance?: number }> {
  const nadResult = await mtnGeocode(address);

  if (!nadResult) {
    return { coordinates: googleCoords, corrected: false };
  }

  const distance = haversineDistance(googleCoords, { lat: nadResult.lat, lng: nadResult.lng });

  if (distance <= 1000) {
    return {
      coordinates: { lat: nadResult.lat, lng: nadResult.lng },
      corrected: true,
      distance
    };
  }

  console.warn(`[MTN Geocoder] NAD correction rejected: ${distance.toFixed(0)}m drift exceeds 1km threshold`);
  return { coordinates: googleCoords, corrected: false, distance };
}

function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
}
