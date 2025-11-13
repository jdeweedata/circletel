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
  layout?: 'vertical' | 'horizontal'; // Layout variant: vertical (home page) or horizontal (quote request)
}

export function InteractiveCoverageMapModal({
  isOpen,
  onClose,
  onSearch,
  initialAddress = '',
  initialCoordinates,
  layout = 'vertical' // Default to vertical layout (existing behavior)
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

  // Add keyboard accessibility (Escape to close)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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

  // Render horizontal layout for quote request page
  if (layout === 'horizontal') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl w-full h-[90vh] md:rounded-2xl rounded-t-3xl md:rounded-t-2xl p-0 bg-white overflow-hidden flex flex-col">
          {/* Improved Header with integrated close button */}
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 bg-gradient-to-b from-blue-50 to-white border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                  📍 Select Your Location
                </DialogTitle>
                <DialogDescription className="text-gray-600 text-xs sm:text-sm">
                  Search, click the map, or drag the PIN to your exact location
                </DialogDescription>
              </div>

              {/* Integrated Close Button */}
              <button
                onClick={onClose}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {loadError && (
            <div className="flex-1 flex items-center justify-center text-center py-8 text-red-600">
              Error loading Google Maps. Please try again later.
            </div>
          )}

          {!isLoaded && !loadError && (
            <div className="flex-1 flex items-center justify-center text-center py-8 text-gray-600">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange"></div>
                <p>Loading map...</p>
              </div>
            </div>
          )}

          {isLoaded && !loadError && (
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* LEFT: Map (65% on desktop) */}
              <div className="w-full lg:w-[65%] h-[400px] md:h-[500px] lg:h-full relative bg-gray-100">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={markerPosition}
                  zoom={18}
                  options={{
                    mapTypeId: mapType,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    zoomControl: true
                  }}
                  onClick={handleMapClick}
                  onLoad={(map) => { mapRef.current = map; }}
                >
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
                    {...(typeof google !== 'undefined' && google?.maps?.Animation ? {
                      animation: google.maps.Animation.DROP,
                      icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        scaledSize: new google.maps.Size(40, 40)
                      }
                    } : {})}
                  />
                </GoogleMap>

                {/* Map Type Toggle (Bottom Left) - Mobile Optimized */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden flex border-2 border-gray-200">
                  <button
                    onClick={() => setMapType('roadmap')}
                    className={`px-4 py-2.5 min-h-[44px] text-sm font-semibold transition-all ${
                      mapType === 'roadmap'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label="Map view"
                  >
                    🗺️ Map
                  </button>
                  <button
                    onClick={() => setMapType('satellite')}
                    className={`px-4 py-2.5 min-h-[44px] text-sm font-semibold transition-all border-l-2 border-gray-200 ${
                      mapType === 'satellite'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label="Satellite view"
                  >
                    🛰️ Satellite
                  </button>
                </div>
              </div>

              {/* RIGHT: Address & Instructions (35% on desktop) */}
              <div className="w-full lg:w-[35%] bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 max-h-[50vh] lg:max-h-full overflow-y-auto">
                {/* Address Search Input */}
                <div>
                  <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="text-blue-600">🔍</span> Search Address
                  </label>
                  <Autocomplete
                    onLoad={(autocomplete) => {
                      autocompleteRef.current = autocomplete;
                      autocomplete.setComponentRestrictions({ country: 'za' });
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
                        placeholder="e.g., 10 Main Street, Cape Town"
                        className="w-full px-4 py-3 sm:py-3.5 pr-10 text-sm sm:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                      />
                      {address && (
                        <button
                          onClick={() => setAddress('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          aria-label="Clear address"
                          type="button"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </Autocomplete>
                </div>

                {/* Use My Location Button */}
                <Button
                  onClick={handleUseMyLocation}
                  disabled={isDetectingLocation}
                  variant="outline"
                  size="lg"
                  className="w-full min-h-[48px] border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 disabled:opacity-50 transition-all font-semibold rounded-xl shadow-sm"
                >
                  <Crosshair className={`w-5 h-5 mr-2 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  {isDetectingLocation ? 'Detecting Location...' : 'Use My Current Location'}
                </Button>

                {/* Instructions */}
                <div className="bg-blue-50/50 border-l-4 border-blue-400 rounded-r-lg p-3 sm:p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <span>💡</span> How to use:
                  </p>
                  <ul className="text-xs sm:text-sm text-blue-800 space-y-1.5 pl-4">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Type your address in the search box</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Click anywhere on the map to place the PIN</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Drag the PIN to your exact location</span>
                    </li>
                  </ul>
                </div>

                {/* Selected Address Display - More Prominent */}
                {address && (
                  <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-green-900 flex items-center gap-2">
                        <span className="text-lg">✓</span> Selected Location
                      </p>
                      <button
                        onClick={() => setAddress('')}
                        className="text-green-700 hover:text-green-900 text-xs underline"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-sm text-green-800 break-words font-medium">{address}</p>
                  </div>
                )}

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleSearch}
                    disabled={!address.trim()}
                    size="lg"
                    className="w-full min-h-[48px] sm:min-h-[52px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all rounded-xl"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    Confirm Location
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    size="lg"
                    className="w-full min-h-[44px] sm:min-h-[48px] border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Render vertical layout for home page (improved UI/UX)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-full w-screen h-screen max-h-screen p-0 bg-white overflow-hidden flex flex-col"
      >
        {/* Improved Header with integrated close button */}
        <div className="px-4 md:px-8 pt-4 md:pt-6 pb-3 md:pb-4 bg-gradient-to-b from-blue-50 to-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                📍 Internet Coverage Search
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-xs md:text-sm">
                Search, click the map, or drag the PIN to find your location
              </DialogDescription>
            </div>

            {/* Integrated Close Button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all"
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
              {/* Improved Instructions & Location Button */}
              <div className="mb-3 bg-blue-50/50 border-l-4 border-blue-400 rounded-r-lg p-3 md:p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <span>💡</span> How to use:
                </p>
                <ul className="text-xs md:text-sm text-blue-800 space-y-1.5 mb-3">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Type your address in the search box below</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Click anywhere on the map to place the PIN</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Drag the PIN to your exact location</span>
                  </li>
                </ul>

                {/* Use My Location Button */}
                <Button
                  onClick={handleUseMyLocation}
                  disabled={isDetectingLocation}
                  variant="outline"
                  size="lg"
                  className="w-full min-h-[48px] border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 disabled:opacity-50 transition-all font-semibold rounded-xl shadow-sm"
                >
                  <Crosshair className={`w-5 h-5 mr-2 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  {isDetectingLocation ? 'Detecting Location...' : 'Use My Current Location'}
                </Button>
              </div>

              {/* Enhanced Address Search Input */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="text-blue-600">🔍</span> Search Address
                </label>
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
                      placeholder="e.g., 10 Main Street, Cape Town"
                      className="w-full px-4 md:px-6 py-3 md:py-3.5 pr-12 text-sm md:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                    />
                    {/* Clear Button */}
                    {address && (
                      <button
                        onClick={() => setAddress('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        aria-label="Clear address"
                        type="button"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </Autocomplete>

                {/* Selected Address Display */}
                {address && (
                  <div className="mt-3 bg-green-50 border-2 border-green-400 rounded-xl p-3 md:p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-green-900 flex items-center gap-2">
                        <span className="text-lg">✓</span> Selected Location
                      </p>
                      <button
                        onClick={() => setAddress('')}
                        className="text-green-700 hover:text-green-900 text-xs underline"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-sm text-green-800 break-words font-medium">{address}</p>
                  </div>
                )}
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

                {/* Improved Map Type Toggle (Bottom Left of Map) */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden flex border-2 border-gray-200">
                  <button
                    onClick={() => setMapType('roadmap')}
                    className={`px-4 py-2.5 min-h-[44px] text-sm font-semibold transition-all ${
                      mapType === 'roadmap'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label="Map view"
                  >
                    🗺️ Map
                  </button>
                  <button
                    onClick={() => setMapType('satellite')}
                    className={`px-4 py-2.5 min-h-[44px] text-sm font-semibold transition-all border-l-2 border-gray-200 ${
                      mapType === 'satellite'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-label="Satellite view"
                  >
                    🛰️ Satellite
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Improved Footer with Action Buttons */}
        <div className="px-4 md:px-8 py-4 md:py-6 bg-gray-50 border-t border-gray-200 flex flex-col gap-3 flex-shrink-0">
          <Button
            onClick={handleSearch}
            disabled={!address.trim()}
            size="lg"
            className="w-full min-h-[48px] md:min-h-[52px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all rounded-xl"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Confirm Location
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            size="lg"
            className="w-full min-h-[44px] md:min-h-[48px] border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-semibold rounded-xl transition-all"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
