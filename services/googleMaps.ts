export interface PlaceResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
  address_components?: google.maps.GeocoderAddressComponent[];
}

export interface GeocodingResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  addressComponents?: {
    sublocality?: string;
    locality?: string;
    province?: string;
    postalCode?: string;
    route?: string;
    streetNumber?: string;
  };
}

export class GoogleMapsService {
  private isLoaded = false;

  async loadGoogleMaps(): Promise<typeof google> {
    if (this.isLoaded && window.google) {
      return window.google;
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.');
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;

    return new Promise((resolve, reject) => {
      script.onload = () => {
        this.isLoaded = true;
        resolve(window.google);
      };
      script.onerror = (error) => {
        console.error('Failed to load Google Maps script:', error);
        reject(new Error('Failed to load Google Maps. Please check your API key and internet connection.'));
      };
      document.head.appendChild(script);
    });
  }

  async searchPlaces(query: string): Promise<PlaceResult[]> {
    // This is a placeholder implementation
    // In a real application, this would use the Google Places API
    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        place_id: '1',
        formatted_address: `${query}, South Africa`,
        geometry: {
          location: {
            lat: -26.2041,
            lng: 28.0473
          }
        },
        name: query
      }
    ];
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult[]> {
    // This is a placeholder implementation
    // In a real application, this would use the Google Geocoding API
    await new Promise(resolve => setTimeout(resolve, 300));

    return [
      {
        formatted_address: 'Johannesburg, South Africa',
        geometry: {
          location: { lat, lng }
        },
        place_id: 'placeholder'
      }
    ];
  }

  async geocodeAddress(address: string): Promise<GeocodingResult> {
    await this.loadGoogleMaps();

    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode(
        {
          address,
          componentRestrictions: { country: 'ZA' },
          region: 'za'
        },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const result = results[0];

            // Parse address components
            const addressComponents: any = {};
            result.address_components?.forEach((component) => {
              const types = component.types;
              if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
                addressComponents.sublocality = component.long_name;
              } else if (types.includes('locality')) {
                addressComponents.locality = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                addressComponents.province = component.long_name;
              } else if (types.includes('postal_code')) {
                addressComponents.postalCode = component.long_name;
              } else if (types.includes('route')) {
                addressComponents.route = component.long_name;
              } else if (types.includes('street_number')) {
                addressComponents.streetNumber = component.long_name;
              }
            });

            resolve({
              formatted_address: result.formatted_address,
              address: result.formatted_address,
              latitude: result.geometry.location.lat(),
              longitude: result.geometry.location.lng(),
              geometry: {
                location: {
                  lat: result.geometry.location.lat(),
                  lng: result.geometry.location.lng()
                }
              },
              place_id: result.place_id,
              addressComponents
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      );
    });
  }

  async initializeAutocomplete(
    input: HTMLInputElement | null,
    onPlaceSelect: (place: PlaceResult) => void
  ): Promise<google.maps.places.Autocomplete | null> {
    if (!input) return null;

    await this.loadGoogleMaps();

    // South Africa bounds for better results
    const southAfricaBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-34.8, 16.5),
      new google.maps.LatLng(-22.1, 32.9)
    );

    const autocomplete = new google.maps.places.Autocomplete(input, {
      bounds: southAfricaBounds,
      componentRestrictions: { country: 'za' },
      fields: ['address_components', 'geometry', 'formatted_address', 'place_id', 'name'],
      types: ['address']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (place.geometry && place.geometry.location) {
        const placeResult: PlaceResult = {
          place_id: place.place_id || '',
          formatted_address: place.formatted_address || '',
          geometry: {
            location: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
          },
          name: place.name || '',
          address_components: place.address_components
        };

        onPlaceSelect(placeResult);
      }
    });

    return autocomplete;
  }
}

export const googleMapsService = new GoogleMapsService();

declare global {
  interface Window {
    google: typeof google;
  }
}