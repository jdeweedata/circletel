import { Loader } from '@googlemaps/js-api-loader';

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface PlaceResult {
  place_id: string;
  formatted_address: string;
  name?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: AddressComponent[];
  types: string[];
}

interface GeocodingResult {
  address: string;
  latitude: number;
  longitude: number;
  addressComponents: {
    streetNumber?: string;
    route?: string;
    sublocality?: string;
    locality?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
}

class GoogleMapsService {
  private loader: Loader;
  private isLoaded = false;
  private googleMaps: typeof google | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not found in environment variables');
    }

    this.loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geocoding'],
      region: 'ZA', // South Africa
      language: 'en',
    });
  }

  private async ensureLoaded(): Promise<typeof google> {
    if (!this.isLoaded || !this.googleMaps) {
      this.googleMaps = await this.loader.load();
      this.isLoaded = true;
    }
    return this.googleMaps;
  }

  /**
   * Initialize Places Autocomplete for business addresses in South Africa
   */
  async initializeAutocomplete(
    inputElement: HTMLInputElement,
    onPlaceChanged: (place: PlaceResult) => void
  ): Promise<google.maps.places.Autocomplete> {
    const google = await this.ensureLoaded();

    const autocomplete = new google.maps.places.Autocomplete(inputElement, {
      componentRestrictions: { country: 'za' }, // South Africa only
      types: ['address'], // Use 'address' type for business and street addresses
      fields: [
        'place_id',
        'formatted_address',
        'name',
        'geometry',
        'address_components',
        'types',
      ],
    });

    // Bias towards business areas in major South African cities
    const southAfricaBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-34.8, 16.3), // Southwest corner
      new google.maps.LatLng(-22.1, 32.9)  // Northeast corner
    );
    autocomplete.setBounds(southAfricaBounds);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        console.error('No geometry data for selected place');
        return;
      }

      const placeResult: PlaceResult = {
        place_id: place.place_id || '',
        formatted_address: place.formatted_address || '',
        name: place.name,
        geometry: {
          location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
        },
        address_components: place.address_components || [],
        types: place.types || [],
      };

      onPlaceChanged(placeResult);
    });

    return autocomplete;
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    const google = await this.ensureLoaded();
    const geocoder = new google.maps.Geocoder();

    try {
      const response = await geocoder.geocode({
        address: address,
        componentRestrictions: { country: 'ZA' }, // South Africa only
      });

      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        const location = result.geometry.location;

        return this.parseGeocodingResult(result, location.lat(), location.lng());
      }

      return null;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const google = await this.ensureLoaded();
    const geocoder = new google.maps.Geocoder();

    try {
      const response = await geocoder.geocode({
        location: { lat: latitude, lng: longitude },
      });

      if (response.results && response.results.length > 0) {
        // Find the most specific business address
        const businessResult = response.results.find(result =>
          result.types.includes('establishment') ||
          result.types.includes('premise') ||
          result.types.includes('street_address')
        ) || response.results[0];

        return this.parseGeocodingResult(businessResult, latitude, longitude);
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }

  /**
   * Parse geocoding result into standardized format
   */
  private parseGeocodingResult(
    result: google.maps.GeocoderResult,
    latitude: number,
    longitude: number
  ): GeocodingResult {
    const addressComponents: GeocodingResult['addressComponents'] = {};

    result.address_components.forEach((component) => {
      const types = component.types;

      if (types.includes('street_number')) {
        addressComponents.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        addressComponents.route = component.long_name;
      } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        addressComponents.sublocality = component.long_name;
      } else if (types.includes('locality')) {
        addressComponents.locality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressComponents.province = component.long_name;
      } else if (types.includes('postal_code')) {
        addressComponents.postalCode = component.long_name;
      } else if (types.includes('country')) {
        addressComponents.country = component.long_name;
      }
    });

    return {
      address: result.formatted_address,
      latitude,
      longitude,
      addressComponents,
    };
  }

  /**
   * Check if a place is a business location
   */
  isBusinessLocation(place: PlaceResult): boolean {
    const businessTypes = [
      'establishment',
      'premise',
      'point_of_interest',
      'store',
      'shopping_mall',
      'office_building',
      'business_park',
    ];

    return place.types.some(type => businessTypes.includes(type));
  }

  /**
   * Get nearby places for a given location
   */
  async getNearbyBusinesses(
    latitude: number,
    longitude: number,
    radius: number = 1000
  ): Promise<PlaceResult[]> {
    const google = await this.ensureLoaded();

    return new Promise((resolve, reject) => {
      const map = new google.maps.Map(document.createElement('div'));
      const service = new google.maps.places.PlacesService(map);

      const request = {
        location: new google.maps.LatLng(latitude, longitude),
        radius,
        type: 'establishment' as google.maps.places.PlaceType,
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const placeResults: PlaceResult[] = results.map(place => ({
            place_id: place.place_id || '',
            formatted_address: place.vicinity || '',
            name: place.name,
            geometry: {
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              },
            },
            address_components: [],
            types: place.types || [],
          }));
          resolve(placeResults);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }
}

// Export singleton instance
export const googleMapsService = new GoogleMapsService();
export type { PlaceResult, GeocodingResult };