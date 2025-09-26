import React, { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GeocodingResult } from '@/services/googleMaps';

interface LocationButtonProps {
  onLocationSelect: (data: {
    address: string;
    latitude: number;
    longitude: number;
    province?: string;
    suburb?: string;
    town?: string;
  }) => void;
  className?: string;
}

// Real reverse geocoding using Google Maps API
const reverseGeocode = async (lat: number, lng: number): Promise<GeocodingResult | null> => {
  try {
    const { googleMapsService } = await import('@/services/googleMaps');
    const results = await googleMapsService.reverseGeocode(lat, lng);
    return results && results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
};

export const LocationButton: React.FC<LocationButtonProps> = ({
  onLocationSelect,
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000, // Cache for 1 minute
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Get address from coordinates using Google Maps
      const locationInfo = await reverseGeocode(latitude, longitude);

      if (locationInfo) {
        onLocationSelect({
          address: locationInfo.address || locationInfo.formatted_address,
          latitude,
          longitude,
          province: locationInfo.addressComponents?.province || '',
          suburb: locationInfo.addressComponents?.sublocality || locationInfo.addressComponents?.locality || '',
          town: locationInfo.addressComponents?.locality || '',
        });
      } else {
        // Fallback if reverse geocoding fails
        onLocationSelect({
          address: `${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? 'E' : 'W'}`,
          latitude,
          longitude,
          province: '',
          suburb: '',
          town: '',
        });
      }

    } catch (geolocationError) {
      let errorMessage = 'Unable to get your location';

      if (geolocationError instanceof GeolocationPositionError) {
        switch (geolocationError.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case GeolocationPositionError.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
      }

      setError(errorMessage);
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={getCurrentLocation}
        disabled={isLoading}
        className={cn(
          "h-12 w-12 rounded-full bg-circleTel-orange hover:bg-circleTel-orange/80 text-white border-2 border-circleTel-orange hover:border-circleTel-orange/80 transition-all duration-200 shadow-sm",
          isLoading && "cursor-not-allowed",
          className
        )}
        title="Use my current location"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <MapPin className="h-5 w-5" />
        )}
      </Button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full mt-2 right-0 bg-red-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-64 z-50">
          <div className="relative">
            {error}
            <div className="absolute -top-1 right-4 w-2 h-2 bg-red-600 rotate-45 transform -translate-y-1"></div>
          </div>
        </div>
      )}

      {/* Loading indicator text */}
      {isLoading && (
        <div className="absolute top-full mt-2 right-0 bg-black/70 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50">
          <div className="relative">
            Getting your location...
            <div className="absolute -top-1 right-4 w-2 h-2 bg-black/70 rotate-45 transform -translate-y-1"></div>
          </div>
        </div>
      )}
    </div>
  );
};