'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PiXBold, PiMapPinBold, PiCrosshairBold } from 'react-icons/pi';
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
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [userHasSelectedAddress, setUserHasSelectedAddress] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastGeocodedAddress = useRef<string>('');

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUserHasSelectedAddress(false);
      setLocationDetected(false);
    }
  }, [isOpen]);

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

  // Auto-detect user location when modal opens (only if no initial coordinates and user hasn't selected an address)
  useEffect(() => {
    if (isOpen && !initialCoordinates && !locationDetected && !userHasSelectedAddress && typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsDetectingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Don't override if user has already selected an address
          if (userHasSelectedAddress) {
            setIsDetectingLocation(false);
            return;
          }
          
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setMarkerPosition(newPosition);
          setLocationDetected(true);
          setIsDetectingLocation(false);

          // Reverse geocode to get address (only if user hasn't selected one)
          if (typeof google !== 'undefined' && !userHasSelectedAddress) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: newPosition }, (results, status) => {
              if (status === 'OK' && results && results[0] && !userHasSelectedAddress) {
                setAddress(results[0].formatted_address);
              }
            });
          }

          // Center map on detected location
          if (mapRef.current && !userHasSelectedAddress) {
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
  }, [isOpen, initialCoordinates, locationDetected, userHasSelectedAddress]);

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

  // Geocode address as fallback for mobile touch selection
  const geocodeAddress = useCallback((addressToGeocode: string) => {
    if (!addressToGeocode || addressToGeocode === lastGeocodedAddress.current) {
      return;
    }
    
    if (typeof google !== 'undefined') {
      console.log('[InteractiveMap] Geocoding address:', addressToGeocode);
      lastGeocodedAddress.current = addressToGeocode;
      
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: addressToGeocode, region: 'ZA' }, (results, status) => {
        if (status === 'OK' && results && results[0] && results[0].geometry?.location) {
          const newPosition = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          };
          
          console.log('[InteractiveMap] Geocoded position:', newPosition);
          
          setUserHasSelectedAddress(true);
          setMarkerPosition(newPosition);
          
          // Center map on new location
          if (mapRef.current) {
            mapRef.current.panTo(newPosition);
            mapRef.current.setZoom(18);
          }
        }
      });
    }
  }, []);

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    
    console.log('[InteractiveMap] handlePlaceChanged called, place:', place);
    
    if (place && place.geometry?.location) {
      const newPosition = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };

      console.log('[InteractiveMap] Setting new position:', newPosition, 'address:', place.formatted_address);
      
      // Mark that user has selected an address - prevents geolocation from overriding
      setUserHasSelectedAddress(true);
      setMarkerPosition(newPosition);
      setAddress(place.formatted_address || '');
      lastGeocodedAddress.current = place.formatted_address || '';

      // Center map on new location
      if (mapRef.current) {
        mapRef.current.panTo(newPosition);
        mapRef.current.setZoom(18);
      }
    } else if (place && place.name) {
      // Fallback: If place has name but no geometry (common on mobile), geocode the name
      console.log('[InteractiveMap] Place has no geometry, attempting geocode for:', place.name);
      geocodeAddress(place.name);
    } else {
      console.log('[InteractiveMap] Place has no geometry, place object:', place);
      // Try to geocode the current input value as last resort
      if (inputRef.current?.value) {
        geocodeAddress(inputRef.current.value);
      }
    }
  }, [geocodeAddress]);

  const handleMapClick = useCallback((event: any) => {
    if (event.latLng && typeof google !== 'undefined') {
      const newPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };

      // Mark that user has interacted with the map
      setUserHasSelectedAddress(true);
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

      // Store address in sessionStorage (clears when browser closes)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('circletel_coverage_address', JSON.stringify({
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

  // Render horizontal layout - Map-first immersive design
  if (layout === 'horizontal') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] md:rounded-2xl rounded-t-3xl p-0 bg-gray-900 overflow-hidden shadow-2xl border-0">
          {/* Hidden accessible title */}
          <DialogTitle className="sr-only">Select Your Location</DialogTitle>
          <DialogDescription className="sr-only">
            Search or click on the map to place your pin
          </DialogDescription>

          {loadError && (
            <div className="flex-1 flex items-center justify-center text-center py-8 text-red-400 bg-gray-900">
              <div className="text-center">
                <PiMapPinBold className="w-12 h-12 mx-auto mb-3 text-red-400/50" />
                <p>Error loading Google Maps</p>
                <p className="text-sm text-gray-500 mt-1">Please try again later</p>
              </div>
            </div>
          )}

          {!isLoaded && !loadError && (
            <div className="flex-1 flex items-center justify-center bg-gray-900">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-circleTel-orange/30 animate-ping absolute" />
                  <div className="w-16 h-16 rounded-full border-2 border-circleTel-orange flex items-center justify-center">
                    <PiMapPinBold className="w-6 h-6 text-circleTel-orange" />
                  </div>
                </div>
                <p className="text-sm text-gray-400">Loading satellite view...</p>
              </div>
            </div>
          )}

          {isLoaded && !loadError && (
            <div className="relative w-full h-full">
              {/* FULL-SCREEN MAP */}
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={markerPosition}
                zoom={19}
                options={{
                  mapTypeId: mapType,
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                  zoomControl: false,
                  scaleControl: false,
                  rotateControl: false,
                  panControl: false,
                  disableDefaultUI: true,
                  gestureHandling: 'greedy',
                  ...(mapType === 'satellite' ? {} : {
                    styles: [
                      { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                      { featureType: 'transit', stylers: [{ visibility: 'off' }] }
                    ]
                  })
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
                      url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
                      scaledSize: new google.maps.Size(48, 48)
                    }
                  } : {})}
                />
              </GoogleMap>

              {/* FLOATING CLOSE BUTTON - Top Right */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/80 transition-all flex items-center justify-center shadow-lg"
                aria-label="Close modal"
              >
                <PiXBold className="w-5 h-5" />
              </button>

              {/* FLOATING SEARCH BAR - Top Center */}
              <div className="absolute top-4 left-4 right-16 z-10">
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
                  <div className="relative max-w-xl">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-circleTel-orange flex items-center justify-center">
                      <PiMapPinBold className="w-3 h-3 text-white" />
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (e.target.value.length > 3) {
                          setUserHasSelectedAddress(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          if (address && address !== lastGeocodedAddress.current && !autocompleteRef.current?.getPlace()?.geometry) {
                            geocodeAddress(address);
                          }
                        }, 300);
                      }}
                      placeholder="Search for your address..."
                      className="w-full pl-12 pr-12 py-3.5 text-sm bg-white/95 backdrop-blur-md border-0 rounded-2xl shadow-xl focus:outline-none focus:ring-2 focus:ring-circleTel-orange/50 transition-all placeholder:text-gray-400"
                    />
                    {address && (
                      <button
                        onClick={() => {
                          setAddress('');
                          setUserHasSelectedAddress(false);
                          lastGeocodedAddress.current = '';
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Clear address"
                        type="button"
                      >
                        <PiXBold className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </Autocomplete>
              </div>

              {/* FLOATING ZOOM CONTROLS - Right Side */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1">
                <button
                  onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 18) + 1)}
                  className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all text-lg font-medium"
                >
                  +
                </button>
                <button
                  onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() || 18) - 1)}
                  className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all text-lg font-medium"
                >
                  −
                </button>
              </div>

              {/* FLOATING CONTROLS - Bottom Left */}
              <div className="absolute bottom-28 sm:bottom-32 left-4 z-10 flex items-center gap-2">
                {/* Map Type Toggle */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex p-1">
                  <button
                    onClick={() => setMapType('roadmap')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      mapType === 'roadmap'
                        ? 'bg-circleTel-navy text-white shadow-md'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>
                      <path d="M8 2v16M16 6v16"/>
                    </svg>
                    Map
                  </button>
                  <button
                    onClick={() => setMapType('satellite')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      mapType === 'satellite'
                        ? 'bg-circleTel-navy text-white shadow-md'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    Satellite
                  </button>
                </div>

                {/* My Location Button */}
                <button
                  onClick={handleUseMyLocation}
                  disabled={isDetectingLocation}
                  className="w-11 h-11 rounded-2xl bg-white shadow-xl flex items-center justify-center text-circleTel-orange hover:bg-circleTel-orange hover:text-white disabled:opacity-50 transition-all"
                  aria-label="Use my location"
                  title="Use my location"
                >
                  <PiCrosshairBold className={`w-5 h-5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Detecting location indicator */}
              {isDetectingLocation && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-black/70 backdrop-blur-md rounded-full px-5 py-2.5 shadow-xl flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-circleTel-orange border-t-transparent"></div>
                  <span className="text-sm text-white">Finding your location...</span>
                </div>
              )}

              {/* FLOATING BOTTOM PANEL - Confirm Location */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-5">
                <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 sm:p-5">
                  {/* Selected Address */}
                  {address ? (
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <PiMapPinBold className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-0.5">Selected Location</p>
                        <p className="text-sm text-gray-800 leading-snug line-clamp-2">{address}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mb-4 text-gray-500">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <PiMapPinBold className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm">Click on the map or search to select a location</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 h-12 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <Button
                      onClick={handleSearch}
                      disabled={!address.trim()}
                      className="flex-[2] h-12 bg-circleTel-orange hover:bg-circleTel-orange-dark text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-circleTel-orange/25 transition-all rounded-xl"
                    >
                      <PiMapPinBold className="w-4 h-4 mr-2" />
                      Confirm Location
                    </Button>
                  </div>
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
              <PiXBold className="w-5 h-5 md:w-6 md:h-6" />
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
                  <PiCrosshairBold className={`w-5 h-5 mr-2 ${isDetectingLocation ? 'animate-spin' : ''}`} />
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
                      ref={inputRef}
                      type="text"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        // Mark user interaction when typing
                        if (e.target.value.length > 3) {
                          setUserHasSelectedAddress(true);
                        }
                      }}
                      onBlur={() => {
                        // On mobile, when user taps a suggestion, the input loses focus
                        // Use a small delay to allow the place_changed event to fire first
                        setTimeout(() => {
                          if (address && address !== lastGeocodedAddress.current && !autocompleteRef.current?.getPlace()?.geometry) {
                            console.log('[InteractiveMap] Input blur - geocoding address:', address);
                            geocodeAddress(address);
                          }
                        }, 300);
                      }}
                      placeholder="e.g., 10 Main Street, Cape Town"
                      className="w-full px-4 md:px-6 py-3 md:py-3.5 pr-12 text-sm md:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
                    />
                    {/* Clear Button */}
                    {address && (
                      <button
                        onClick={() => {
                          setAddress('');
                          setUserHasSelectedAddress(false);
                          lastGeocodedAddress.current = '';
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                        aria-label="Clear address"
                        type="button"
                      >
                        <PiXBold className="w-4 h-4 text-gray-500" />
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
                        onClick={() => {
                          setAddress('');
                          setUserHasSelectedAddress(false);
                          lastGeocodedAddress.current = '';
                        }}
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

                {/* Map Type Toggle (Bottom Left of Map) */}
                <div className="absolute bottom-4 left-4 bg-white rounded-2xl shadow-xl overflow-hidden flex p-1">
                  <button
                    onClick={() => setMapType('roadmap')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl min-h-[44px] text-sm font-semibold transition-all ${
                      mapType === 'roadmap'
                        ? 'bg-circleTel-navy text-white shadow-md'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-label="Map view"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>
                      <path d="M8 2v16M16 6v16"/>
                    </svg>
                    Map
                  </button>
                  <button
                    onClick={() => setMapType('satellite')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl min-h-[44px] text-sm font-semibold transition-all ${
                      mapType === 'satellite'
                        ? 'bg-circleTel-navy text-white shadow-md'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-label="Satellite view"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    Satellite
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
            <PiMapPinBold className="w-5 h-5 mr-2" />
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
