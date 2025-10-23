'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Maximize2 } from 'lucide-react';
import { GoogleMap, Marker, StandaloneSearchBox } from '@react-google-maps/api';
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider';

interface InteractiveCoverageMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (address: string, coordinates: { lat: number; lng: number }) => void;
  initialAddress?: string;
  initialCoordinates?: { lat: number; lng: number };
}

export function InteractiveCoverageMapModal({
  isOpen,
  onClose,
  onSearch,
  initialAddress = '',
  initialCoordinates
}: InteractiveCoverageMapModalProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [address, setAddress] = useState(initialAddress);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number }>(
    initialCoordinates || { lat: -26.0535, lng: 28.0583 } // Default to Rivonia, Sandton
  );
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Update address when initialAddress changes
  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
    }
  }, [initialAddress]);

  // Update marker position when initialCoordinates changes
  useEffect(() => {
    if (initialCoordinates) {
      setMarkerPosition(initialCoordinates);
    }
  }, [initialCoordinates]);

  const handlePlacesChanged = useCallback(() => {
    const places = searchBoxRef.current?.getPlaces();
    if (places && places.length > 0) {
      const place = places[0];

      if (place.geometry?.location) {
        const newPosition = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };

        setMarkerPosition(newPosition);
        setAddress(place.formatted_address || '');

        // Center map on new location
        if (mapRef.current) {
          mapRef.current.panTo(newPosition);
          mapRef.current.setZoom(18);
        }
      }
    }
  }, []);

  const handleMapClick = useCallback((event: any) => {
    if (event.latLng && typeof google !== 'undefined') {
      const newPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };

      setMarkerPosition(newPosition);

      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: event.latLng }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setAddress(results[0].formatted_address);
        }
      });
    }
  }, []);

  const handleSearch = () => {
    if (onSearch && address) {
      onSearch(address, markerPosition);
      onClose();
    }
  };

  const mapContainerStyle = {
    width: '100%',
    height: isFullscreen ? 'calc(100vh - 320px)' : '400px'
  };

  const mapOptions = {
    mapTypeId: mapType,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[90vw] w-[1200px] max-h-[90vh] p-0 bg-white rounded-3xl overflow-hidden flex flex-col"
        aria-describedby="interactive-coverage-map-description"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-3xl font-bold text-[#1e5a96] mb-2">
                Internet Coverage Search
              </h2>
              <p id="interactive-coverage-map-description" className="text-[#1e5a96] text-base">
                Enter your address or use our map to find your location
              </p>
            </div>

            {/* Close Button (Top Right) */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1e5a96] text-white hover:bg-[#164672] transition-colors shadow-md"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative bg-white px-8 py-6 flex-1 overflow-y-auto">
          {loadError && (
            <div className="text-center py-8 text-red-600">
              Error loading Google Maps. Please try again later.
            </div>
          )}

          {!isLoaded && !loadError && (
            <div className="text-center py-8 text-gray-600">
              Loading map...
            </div>
          )}

          {isLoaded && !loadError && (
            <>
              {/* Address Search Input */}
              <div className="mb-6 relative">
                <StandaloneSearchBox
                  onLoad={(ref) => (searchBoxRef.current = ref)}
                  onPlacesChanged={handlePlacesChanged}
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your address to get started"
                      className="w-full px-6 py-4 text-base text-[#1e5a96] placeholder-gray-400 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#1e5a96] focus:ring-4 focus:ring-[#1e5a96]/10 transition-all shadow-sm"
                    />
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Toggle fullscreen"
                    >
                      <Maximize2 className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </StandaloneSearchBox>
              </div>

              {/* Google Map */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={markerPosition}
                  zoom={18}
                  options={mapOptions}
                  onClick={handleMapClick}
                  onLoad={(map) => (mapRef.current = map)}
                >
                  {/* Location Marker */}
                  <Marker
                    position={markerPosition}
                    draggable={true}
                    onDragEnd={(event) => {
                      if (event.latLng && typeof google !== 'undefined') {
                        const newPosition = {
                          lat: event.latLng.lat(),
                          lng: event.latLng.lng()
                        };
                        setMarkerPosition(newPosition);

                        // Reverse geocode to get address
                        const geocoder = new google.maps.Geocoder();
                        geocoder.geocode({ location: event.latLng }, (results, status) => {
                          if (status === 'OK' && results && results[0]) {
                            setAddress(results[0].formatted_address);
                          }
                        });
                      }
                    }}
                  />
                </GoogleMap>

                {/* Map Type Toggle (Bottom Left of Map) */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md overflow-hidden flex border border-gray-200">
                  <button
                    onClick={() => setMapType('roadmap')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      mapType === 'roadmap'
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Map
                  </button>
                  <button
                    onClick={() => setMapType('satellite')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                      mapType === 'satellite'
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Satellite
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with Action Buttons */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-8 py-6 text-base font-semibold text-[#1e5a96] border-2 border-[#1e5a96] hover:bg-[#1e5a96] hover:text-white rounded-full transition-all shadow-sm"
          >
            Close
          </Button>

          <Button
            onClick={handleSearch}
            className="px-10 py-6 text-base font-semibold bg-[#1e5a96] hover:bg-[#164672] text-white rounded-full transition-all shadow-md hover:shadow-lg"
          >
            Search
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
