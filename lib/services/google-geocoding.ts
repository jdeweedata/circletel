/**
 * Google Maps Geocoding Service (Server-side)
 *
 * Provides accurate geocoding for MTN feasibility API calls
 * Uses Google Maps Geocoding API to convert addresses to coordinates
 */

export interface GeocodeResult {
  success: boolean;
  latitude?: string;
  longitude?: string;
  formatted_address?: string;
  error?: string;
  place_id?: string;
  address_components?: google.maps.GeocoderAddressComponent[];
}

interface GoogleGeocodingResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
    };
    place_id: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: string;
  error_message?: string;
}

/**
 * Geocode an address using Google Maps Geocoding API
 *
 * @param address - The address to geocode
 * @param apiKey - Google Maps API key (optional, will use env var if not provided)
 * @returns GeocodeResult with coordinates and formatted address
 */
export async function geocodeAddress(
  address: string,
  apiKey?: string
): Promise<GeocodeResult> {
  const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key) {
    return {
      success: false,
      error: 'Google Maps API key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.'
    };
  }

  if (!address || address.trim().length === 0) {
    return {
      success: false,
      error: 'Address is required'
    };
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', address);
    url.searchParams.append('key', key);
    // Bias results to South Africa
    url.searchParams.append('region', 'za');
    url.searchParams.append('components', 'country:ZA');

    console.log('[Geocoding] Geocoding address:', address);

    const response = await fetch(url.toString());

    if (!response.ok) {
      return {
        success: false,
        error: `Google Maps API returned ${response.status}: ${response.statusText}`
      };
    }

    const data: GoogleGeocodingResponse = await response.json();

    if (data.status !== 'OK') {
      console.error('[Geocoding] Geocoding failed:', data.status, data.error_message);
      return {
        success: false,
        error: `Geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}`
      };
    }

    if (!data.results || data.results.length === 0) {
      return {
        success: false,
        error: 'No results found for the provided address'
      };
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;

    console.log('[Geocoding] Successfully geocoded:', {
      address: result.formatted_address,
      coordinates: { lat, lng },
      location_type: result.geometry.location_type
    });

    return {
      success: true,
      latitude: lat.toString(),
      longitude: lng.toString(),
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      address_components: result.address_components as any
    };
  } catch (error) {
    console.error('[Geocoding] Error during geocoding:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during geocoding'
    };
  }
}

/**
 * Geocode multiple addresses in parallel
 *
 * @param addresses - Array of addresses to geocode
 * @param apiKey - Google Maps API key (optional)
 * @returns Array of GeocodeResults
 */
export async function geocodeAddresses(
  addresses: string[],
  apiKey?: string
): Promise<GeocodeResult[]> {
  return Promise.all(
    addresses.map(address => geocodeAddress(address, apiKey))
  );
}

/**
 * Validate if coordinates are within South Africa bounds
 *
 * South Africa approximate bounds:
 * - Latitude: -34.8 (south) to -22.0 (north)
 * - Longitude: 16.0 (west) to 33.0 (east)
 */
export function isCoordinateInSouthAfrica(
  latitude: string | number,
  longitude: string | number
): boolean {
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

  return (
    lat >= -35 && lat <= -22 &&
    lng >= 16 && lng <= 33
  );
}
