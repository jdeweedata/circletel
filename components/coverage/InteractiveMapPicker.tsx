'use client';

import { useCallback, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: -25.7461,
  lng: 28.1881 // Pretoria, South Africa
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  gestureHandling: 'greedy',
};

// Static libraries array to prevent Google Maps reload warning
const GOOGLE_MAPS_LIBRARIES: ('places' | 'geocoding')[] = ['places', 'geocoding'];

interface InteractiveMapPickerProps {
  onLocationSelect: (data: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  className?: string;
}

export function InteractiveMapPicker({ onLocationSelect, className }: InteractiveMapPickerProps) {
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setMarkerPosition({ lat, lng });
      setIsGeocodingAddress(true);

      // Reverse geocode to get address
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });

        if (response.results[0]) {
          const address = response.results[0].formatted_address;
          toast.success('Location selected');

          onLocationSelect({
            address,
            latitude: lat,
            longitude: lng
          });
        } else {
          toast.error('Could not determine address for this location');
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        toast.error('Failed to determine address. Please try again.');
      } finally {
        setIsGeocodingAddress(false);
      }
    }
  }, [onLocationSelect]);

  const handleUseCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setMarkerPosition({ lat, lng });
          setIsGeocodingAddress(true);

          try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });

            if (response.results[0]) {
              const address = response.results[0].formatted_address;
              toast.success('Current location detected');

              onLocationSelect({
                address,
                latitude: lat,
                longitude: lng
              });
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            toast.error('Failed to determine your address');
          } finally {
            setIsGeocodingAddress(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to access your location. Please enable location services.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  }, [onLocationSelect]);

  if (loadError) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <p className="text-red-500">Failed to load map. Please try refreshing the page.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-500" />
          Select Your Location on Map
        </CardTitle>
        <CardDescription>
          Click anywhere on the map to select your address, or use your current location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleUseCurrentLocation}
          variant="outline"
          className="w-full"
          disabled={isGeocodingAddress}
        >
          {isGeocodingAddress ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Getting address...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Use My Current Location
            </>
          )}
        </Button>

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={markerPosition || defaultCenter}
          zoom={markerPosition ? 15 : 12}
          options={mapOptions}
          onClick={handleMapClick}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>

        <p className="text-xs text-gray-500 text-center">
          Click on the map to pin your exact location
        </p>
      </CardContent>
    </Card>
  );
}
