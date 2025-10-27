'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Maximize2, MapPin, Crosshair } from 'lucide-react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
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
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
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

  // Auto-detect user location when modal opens (only if no initial coordinates)
  useEffect(() => {
    if (isOpen && !initialCoordinates && !locationDetected && typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsDetectingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setMarkerPosition(newPosition);
          setLocationDetected(true);
          setIsDetectingLocation(false);

          // Reverse geocode to get address
          if (typeof google !== 'undefined') {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: newPosition }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                setAddress(results[0].formatted_address);
              }
            });
          }

          // Center map on detected location
          if (mapRef.current) {
            mapRef.current.panTo(newPosition);
            mapRef.current.setZoom(18);
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
          setIsDetectingLocation(false);
          // Silently fail - user can still search or click on map
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, [isOpen, initialCoordinates, locationDetected]);

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    
    if (place && place.geometry?.location) {
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

  const handleUseMyLocation = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsDetectingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setMarkerPosition(newPosition);
          setLocationDetected(true);
          setIsDetectingLocation(false);

          // Reverse geocode to get address
          if (typeof google !== 'undefined') {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: newPosition }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                setAddress(results[0].formatted_address);
              }
            });
          }

          // Center map on detected location
          if (mapRef.current) {
            mapRef.current.panTo(newPosition);
            mapRef.current.setZoom(18);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsDetectingLocation(false);
          alert('Unable to detect your location. Please enable location services or enter your address manually.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please enter your address manually.');
    }
  }, []);

  const handleSearch = async () => {
    if (onSearch && address) {
      // Extract address components from the current address
      let addressComponents = {};

      if (typeof google !== 'undefined') {
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ location: markerPosition }, (results, status) => {
              if (status === 'OK' && results) {
                resolve(results);
              } else {
                reject(status);
              }
            });
          });

          if (result && result[0]) {
            let suburb = '';
            let city = '';
            let province = '';
            let postalCode = '';

            result[0].address_components?.forEach((component) => {
              const types = component.types;
              if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
                suburb = component.long_name;
              } else if (types.includes('locality')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                province = component.long_name;
              } else if (types.includes('postal_code')) {
                postalCode = component.long_name;
              }
            });

            addressComponents = { suburb, city, province, postalCode };
          }
        } catch (error) {
          console.error('Failed to extract address components:', error);
        }
      }

      // Store address in localStorage for persistence with full components
      if (typeof window !== 'undefined') {
        localStorage.setItem('circletel_coverage_address', JSON.stringify({
          address: address,
          coordinates: markerPosition,
          addressComponents: addressComponents,
          timestamp: new Date().toISOString()
        }));
      }
      onSearch(address, markerPosition);
      onClose();
    }
  };

  const mapContainerStyle = {
    width: '100%',
    height: 'calc(100vh - 280px)', // Full screen minus header and footer
    minHeight: '400px'
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
        className="max-w-full w-screen h-screen max-h-screen p-0 bg-white overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-4 md:px-8 pt-4 md:pt-6 pb-3 md:pb-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1e5a96] mb-1">
                Internet Coverage Search
              </DialogTitle>
              <DialogDescription className="text-[#1e5a96] text-xs md:text-sm">
                Enter your address or use our map to find your location
              </DialogDescription>
            </div>

            {/* Close Button (Top Right) */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#1e5a96] text-white hover:bg-[#164672] transition-colors shadow-md"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative bg-white px-4 md:px-8 py-3 md:py-4 flex-1 overflow-y-auto min-h-0">
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
              {/* Compact Instructions & Location Button */}
              <div className="mb-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 md:gap-3 text-xs text-gray-600 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-circleTel-orange" />
                    <span className="font-medium">Type address</span>
                  </div>
                  <span className="text-gray-300 hidden md:inline">•</span>
                  <span className="hidden md:inline">Click map</span>
                  <span className="text-gray-300 hidden md:inline">•</span>
                  <span className="hidden md:inline">Drag pin</span>
                </div>

                {/* Use My Location Button */}
                <Button
                  onClick={handleUseMyLocation}
                  disabled={isDetectingLocation}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm border-2 border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white transition-all w-full md:w-auto"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  {isDetectingLocation ? 'Detecting...' : 'Use My Location'}
                </Button>
              </div>

              {/* Address Search Input */}
              <div className="mb-4 relative">
                <Autocomplete
                  onLoad={(autocomplete) => { 
                    autocompleteRef.current = autocomplete;
                    // Restrict to South Africa only
                    autocomplete.setComponentRestrictions({ country: 'za' });
                    // Set bounds to South Africa
                    autocomplete.setBounds({
                      north: -22.125,
                      south: -34.833,
                      east: 32.895,
                      west: 16.45
                    });
                  }}
                  onPlaceChanged={handlePlaceChanged}
                  options={{
                    componentRestrictions: { country: 'za' },
                    bounds: {
                      north: -22.125,
                      south: -34.833,
                      east: 32.895,
                      west: 16.45
                    },
                    strictBounds: false,
                    fields: ['formatted_address', 'geometry', 'name']
                  }}
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your South African address"
                      className="w-full px-4 md:px-6 py-2.5 md:py-3 pr-12 text-sm md:text-base text-[#1e5a96] placeholder-gray-400 border-2 border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:border-[#1e5a96] focus:ring-4 focus:ring-[#1e5a96]/10 transition-all shadow-sm"
                    />
                    {/* Clear Button */}
                    {address && (
                      <button
                        onClick={() => setAddress('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-red-50 rounded-lg transition-colors group"
                        aria-label="Clear address"
                        type="button"
                      >
                        <X className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                      </button>
                    )}
                  </div>
                </Autocomplete>
              </div>

              {/* Google Map */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={markerPosition}
                  zoom={18}
                  options={mapOptions}
                  onClick={handleMapClick}
                  onLoad={(map) => { mapRef.current = map; }}
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
        <div className="px-4 md:px-8 py-4 md:py-6 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 flex-shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full md:w-auto px-6 md:px-8 py-4 md:py-6 text-sm md:text-base font-semibold text-[#1e5a96] border-2 border-[#1e5a96] hover:bg-[#1e5a96] hover:text-white rounded-full transition-all shadow-sm"
          >
            Close
          </Button>

          <Button
            onClick={handleSearch}
            className="w-full md:w-auto px-8 md:px-10 py-4 md:py-6 text-sm md:text-base font-semibold bg-[#1e5a96] hover:bg-[#164672] text-white rounded-full transition-all shadow-md hover:shadow-lg"
          >
            Search
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
