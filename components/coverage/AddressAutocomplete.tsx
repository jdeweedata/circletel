import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LocationButton } from './LocationButton';
import { InteractiveCoverageMapModal } from './InteractiveCoverageMapModal';
import type { PlaceResult, GeocodingResult } from '@/services/googleMaps';

interface AddressAutocompleteProps {
  value: string;
  onLocationSelect: (data: {
    address: string;
    province?: string;
    suburb?: string;
    street?: string;
    streetNumber?: string;
    town?: string;
    buildingComplex?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  placeholder?: string;
  className?: string;
  showLocationButton?: boolean;
  showMapButton?: boolean; // NEW: Control visibility of "Can't find your address? Select on map" button
}

interface AddressSuggestion {
  id: string;
  address: string;
  name?: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onLocationSelect,
  placeholder = "Enter your business address",
  className,
  showLocationButton = true,
  showMapButton = true // Default to true for backward compatibility
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapInitialLocation, setMapInitialLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const initializeAutocomplete = async () => {
      if (!inputRef.current) {
        console.warn('[AddressAutocomplete] Input ref not available');
        return;
      }

      console.log('[AddressAutocomplete] Starting autocomplete initialization...');

      try {
        // Use the new loader with retry mechanism
        const { loadGoogleMapsService } = await import('@/lib/googleMapsLoader');
        console.log('[AddressAutocomplete] Google Maps loader imported successfully');

        const googleMapsService = await loadGoogleMapsService();
        console.log('[AddressAutocomplete] Google Maps service loaded successfully');

        const autocomplete = await googleMapsService.initializeAutocomplete(
          inputRef.current,
          (place: PlaceResult) => {
            handlePlaceSelect(place);
          }
        );
        autocompleteRef.current = autocomplete;
        console.log('[AddressAutocomplete] Autocomplete initialized successfully');
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('[AddressAutocomplete] Failed to initialize autocomplete:', error);

        // Determine error type for better user messaging
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('API key')) {
          setError('Address autocomplete temporarily unavailable - you can still type your address manually');
          console.error('[AddressAutocomplete] API key issue detected. Please check Google Cloud Console configuration.');
        } else if (errorMessage.includes('domain restrictions')) {
          setError('Address suggestions unavailable - manual entry enabled');
          console.error('[AddressAutocomplete] Domain restriction detected. Add this domain to Google Cloud Console API key restrictions.');
        } else if (errorMessage.includes('chunk')) {
          setError('Loading address suggestions - please wait or type manually');
          console.error('[AddressAutocomplete] Chunk loading error. Check network connection and build configuration.');
        } else {
          setError('Address suggestions unavailable - manual entry enabled');
        }

        // Don't prevent the component from working - fallback to manual search
        console.log('[AddressAutocomplete] Falling back to manual geocoding search');
      }
    };

    initializeAutocomplete();

    return () => {
      // Cleanup autocomplete listeners
      if (autocompleteRef.current && typeof google !== 'undefined') {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlaceSelect = (place: PlaceResult) => {
    setInputValue(place.formatted_address);
    setShowSuggestions(false);
    setError(null);

    // Parse address components
    const addressComponents = place.address_components;
    let streetNumber = '';
    let route = '';
    let suburb = '';
    let locality = '';
    let province = '';
    let postalCode = '';

    addressComponents?.forEach((component) => {
      const types = component.types;
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        suburb = component.long_name;
      } else if (types.includes('locality')) {
        locality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        province = component.long_name;
      } else if (types.includes('postal_code')) {
        postalCode = component.long_name;
      }
    });

    onLocationSelect({
      address: place.formatted_address,
      province,
      suburb: suburb || locality,
      street: route,
      streetNumber,
      town: locality,
      buildingComplex: place.name || '',
      postalCode,
      latitude: typeof (place as any).geometry?.location?.lat === 'function'
        ? (place as any).geometry.location.lat()
        : (place as any).geometry?.location?.lat,
      longitude: typeof (place as any).geometry?.location?.lng === 'function'
        ? (place as any).geometry.location.lng()
        : (place as any).geometry?.location?.lng,
    });
  };

  // Fallback manual search using geocoding
  const searchAddressesManually = async (query: string): Promise<AddressSuggestion[]> => {
    if (query.length < 3) return [];

    setIsLoading(true);
    setError(null);

    try {
      const { googleMapsService } = await import('@/services/googleMaps');
      const result = await googleMapsService.geocodeAddress(query);
      if (result) {
        return [{
          id: 'geocoded-1',
          address: result.address || result.formatted_address,
          name: '',
          suburb: result.addressComponents?.sublocality || result.addressComponents?.locality || '',
          city: result.addressComponents?.locality || '',
          province: result.addressComponents?.province || '',
          postalCode: result.addressComponents?.postalCode || '',
          latitude: result.latitude || result.geometry.location.lat,
          longitude: result.longitude || result.geometry.location.lng,
        }];
      }
      return [];
    } catch (error) {
      console.error('Geocoding failed:', error);
      setError('Failed to search addresses');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Manual search fallback (if autocomplete is not working)
  useEffect(() => {
    if (autocompleteRef.current) return; // Skip if autocomplete is available

    const timeoutId = setTimeout(async () => {
      if (inputValue.length >= 3) {
        const results = await searchAddressesManually(inputValue);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    setError(null);

    // Always update the address in the parent component, even when using Google autocomplete
    onLocationSelect({
      address: newValue,
      province: '',
      suburb: '',
      street: '',
      streetNumber: '',
      town: '',
      buildingComplex: '',
      postalCode: '',
      latitude: undefined,
      longitude: undefined
    });
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.address);
    setShowSuggestions(false);

    // Parse the address into components (simplified for demo)
    const addressParts = suggestion.address.split(', ');
    const streetPart = addressParts[0] || '';
    const streetMatch = streetPart.match(/^(\d+)\s+(.+)$/);

    onLocationSelect({
      address: suggestion.address,
      province: suggestion.province,
      suburb: suggestion.suburb,
      street: streetMatch ? streetMatch[2] : streetPart,
      streetNumber: streetMatch ? streetMatch[1] : '',
      town: suggestion.city,
      postalCode: suggestion.postalCode,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const clearInput = () => {
    setInputValue('');
    setShowSuggestions(false);
    onLocationSelect({
      address: '',
      province: '',
      suburb: '',
      street: '',
      streetNumber: '',
      town: '',
      postalCode: '',
      latitude: undefined,
      longitude: undefined
    });
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Open map modal
  const handleOpenMapModal = () => {
    console.log('[AddressAutocomplete] Opening map modal');
    setShowMapModal(true);
  };

  // Handle location selection from map modal
  const handleMapLocationSelect = (data: {
    address: string;
    latitude: number;
    longitude: number;
    province?: string;
    suburb?: string;
    town?: string;
    postalCode?: string;
  }) => {
    console.log('[AddressAutocomplete] Location selected from map:', data);
    setInputValue(data.address);
    setShowSuggestions(false);

    onLocationSelect({
      address: data.address,
      province: data.province,
      suburb: data.suburb,
      street: '',
      streetNumber: '',
      town: data.town,
      buildingComplex: '',
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude
    });
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        {isLoading ? (
          <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-circleTel-orange"></div>
          </div>
        ) : (
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-circleTel-secondaryNeutral h-4 w-4 sm:h-5 sm:w-5" />
        )}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={cn(
            "h-12 sm:h-14 md:h-16 pl-10 sm:pl-12 pr-16 sm:pr-20 text-base sm:text-xl md:text-2xl lg:text-3xl font-medium rounded-full bg-white/90 backdrop-blur-sm border-2 border-white/30 focus:border-white focus:bg-white text-circleTel-darkNeutral placeholder:text-circleTel-secondaryNeutral/70 placeholder:text-sm sm:placeholder:text-base md:placeholder:text-xl",
            "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          )}
          autoComplete="off"
        />
        {inputValue && (
          <button
            onClick={clearInput}
            className="absolute right-14 sm:right-16 md:right-20 top-1/2 transform -translate-y-1/2 text-circleTel-secondaryNeutral hover:text-circleTel-darkNeutral transition-colors z-10"
            type="button"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
        {showLocationButton && (
          <div className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 z-10">
            <LocationButton
              onLocationSelect={onLocationSelect}
              className=""
            />
          </div>
        )}
      </div>

      {/* Map Selection Button */}
      {showMapButton && (
        <div className="mt-3">
          <Button
            onClick={handleOpenMapModal}
            variant="outline"
            className="w-full border-2 border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white transition-all"
            type="button"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Can't find your address? Select on map
          </Button>
        </div>
      )}

      {/* Interactive Map Modal */}
      <InteractiveCoverageMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSearch={(address, coords) => {
          handleMapLocationSelect({
            address,
            latitude: coords.lat,
            longitude: coords.lng
          });
        }}
        initialAddress={inputValue}
        initialCoordinates={mapInitialLocation}
        layout="horizontal"
      />

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className={cn(
                "w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-circleTel-lightNeutral transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-xl first:sm:rounded-t-2xl last:rounded-b-xl last:sm:rounded-b-2xl",
                selectedIndex === index && "bg-circleTel-lightNeutral"
              )}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-circleTel-secondaryNeutral mt-0.5 sm:mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm sm:text-base text-circleTel-darkNeutral">
                    {suggestion.address}
                  </div>
                  <div className="text-xs sm:text-sm text-circleTel-secondaryNeutral">
                    {suggestion.suburb}, {suggestion.city}, {suggestion.province} {suggestion.postalCode}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};