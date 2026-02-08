/**
 * Centralized Geocoding Utilities for Coverage Checking
 *
 * Provides address-to-coordinates conversion using Google Maps API.
 * Extracted from duplicate implementations in coverage API routes.
 *
 * @module lib/coverage/utils/geocoding
 */

import { Coordinates } from '../types';

/**
 * Geocode result with address details
 */
export interface GeocodeResult {
  coordinates: Coordinates;
  formattedAddress: string;
  placeId?: string;
  addressComponents?: {
    suburb?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Geocoding error with structured information
 */
export class GeocodingError extends Error {
  constructor(
    message: string,
    public readonly code: GeocodingErrorCode,
    public readonly originalAddress?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GeocodingError';
  }
}

export type GeocodingErrorCode =
  | 'API_KEY_MISSING'
  | 'API_ERROR'
  | 'NO_RESULTS'
  | 'INVALID_ADDRESS'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR';

/**
 * Geocode a South African address to coordinates
 *
 * Uses Google Maps Geocoding API with country restriction to South Africa.
 *
 * @param address - The address string to geocode
 * @returns GeocodeResult with coordinates and address details
 * @throws GeocodingError if geocoding fails
 *
 * @example
 * ```typescript
 * const result = await geocodeAddress('123 Main Street, Sandton, Johannesburg');
 * console.log(result.coordinates); // { lat: -26.1234, lng: 28.0567 }
 * ```
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new GeocodingError(
      'Google Maps API key not configured',
      'API_KEY_MISSING'
    );
  }

  if (!address || address.trim().length === 0) {
    throw new GeocodingError(
      'Address is required',
      'INVALID_ADDRESS',
      address
    );
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('components', 'country:ZA'); // Restrict to South Africa
  url.searchParams.set('key', apiKey);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new GeocodingError(
        `Geocoding API error: ${response.status}`,
        'API_ERROR',
        address,
        { status: response.status, statusText: response.statusText }
      );
    }

    const data = await response.json();

    // Handle API-level errors
    if (data.status === 'OVER_QUERY_LIMIT') {
      throw new GeocodingError(
        'Geocoding rate limit exceeded',
        'RATE_LIMITED',
        address
      );
    }

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new GeocodingError(
        `Geocoding failed: ${data.status || 'No results'}`,
        data.status === 'ZERO_RESULTS' ? 'NO_RESULTS' : 'API_ERROR',
        address,
        { googleStatus: data.status }
      );
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // Extract address components
    const addressComponents = extractAddressComponents(result.address_components);

    return {
      coordinates: {
        lat: location.lat,
        lng: location.lng,
      },
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      addressComponents,
    };
  } catch (error) {
    if (error instanceof GeocodingError) {
      throw error;
    }

    throw new GeocodingError(
      'Network error during geocoding',
      'NETWORK_ERROR',
      address,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Extract structured address components from Google's response
 */
function extractAddressComponents(
  components?: Array<{ types: string[]; long_name: string; short_name: string }>
): GeocodeResult['addressComponents'] {
  if (!components) return undefined;

  const result: GeocodeResult['addressComponents'] = {};

  for (const component of components) {
    const types = component.types;

    if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
      result.suburb = component.long_name;
    } else if (types.includes('locality')) {
      result.city = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      result.province = component.long_name;
    } else if (types.includes('postal_code')) {
      result.postalCode = component.long_name;
    } else if (types.includes('country')) {
      result.country = component.long_name;
    }
  }

  return result;
}

/**
 * Batch geocode multiple addresses
 *
 * @param addresses - Array of address strings
 * @param options - Batch options
 * @returns Array of GeocodeResult or null for failed addresses
 */
export async function batchGeocode(
  addresses: string[],
  options: {
    concurrency?: number;
    delayMs?: number;
  } = {}
): Promise<Array<GeocodeResult | null>> {
  const { concurrency = 5, delayMs = 100 } = options;
  const results: Array<GeocodeResult | null> = [];

  // Process in batches
  for (let i = 0; i < addresses.length; i += concurrency) {
    const batch = addresses.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (address) => {
        try {
          return await geocodeAddress(address);
        } catch (error) {
          console.warn(`Failed to geocode "${address}":`, error);
          return null;
        }
      })
    );

    results.push(...batchResults);

    // Delay between batches to respect rate limits
    if (i + concurrency < addresses.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
