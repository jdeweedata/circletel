import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, Building2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import clsx from 'clsx';

interface AddressResult {
  address: string;
  latitude: number;
  longitude: number;
  addressComponents: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    sublocality?: string;
    administrativeAreaLevel1?: string;
    postalCode?: string;
    country?: string;
  };
}

interface EnhancedAddressInputProps {
  onAddressSelect: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  value?: string;
  showLocationButton?: boolean;
  showQuickLocations?: boolean;
  variant?: 'default' | 'pill' | 'hero';
}

const QUICK_LOCATIONS = [
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
  { name: 'Durban', lat: -29.8587, lng: 31.0218 },
  { name: 'Pretoria', lat: -25.7479, lng: 28.2293 },
  { name: 'Port Elizabeth', lat: -33.9608, lng: 25.6022 },
];

// Google Places service
class GooglePlacesService {
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private geocoder: google.maps.Geocoder | null = null;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    if (typeof window !== 'undefined' && window.google?.maps) {
      this.autocompleteService = new google.maps.places.AutocompleteService();
      this.geocoder = new google.maps.Geocoder();

      // Create a dummy div for PlacesService
      const dummyDiv = document.createElement('div');
      this.placesService = new google.maps.places.PlacesService(dummyDiv);
    }
  }

  async searchPlaces(query: string): Promise<google.maps.places.AutocompletePrediction[]> {
    if (!this.autocompleteService) {
      throw new Error('Google Places service not initialized');
    }

    return new Promise((resolve, reject) => {
      this.autocompleteService!.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'za' }, // Restrict to South Africa
          types: ['address', 'establishment'],
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else {
            resolve([]);
          }
        }
      );
    });
  }

  async getPlaceDetails(placeId: string): Promise<google.maps.places.PlaceResult> {
    if (!this.placesService) {
      throw new Error('Google Places service not initialized');
    }

    return new Promise((resolve, reject) => {
      this.placesService!.getDetails(
        {
          placeId,
          fields: ['geometry', 'formatted_address', 'address_components', 'name', 'types'],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            reject(new Error(`Place details error: ${status}`));
          }
        }
      );
    });
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!this.geocoder) {
      throw new Error('Google Geocoder not initialized');
    }

    return new Promise((resolve, reject) => {
      this.geocoder!.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === 'OK' && results?.[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      );
    });
  }
}

const placesService = new GooglePlacesService();

export const EnhancedAddressInput: React.FC<EnhancedAddressInputProps> = ({
  onAddressSelect,
  placeholder = 'Enter your business address or location...',
  className,
  disabled = false,
  value = '',
  showLocationButton = true,
  showQuickLocations = false,
  variant = 'default',
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchDebounced = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parseAddressComponents = (components: google.maps.GeocoderAddressComponent[]) => {
    const parsed: AddressResult['addressComponents'] = {};

    components.forEach(component => {
      const types = component.types;

      if (types.includes('street_number')) {
        parsed.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        parsed.route = component.long_name;
      } else if (types.includes('locality')) {
        parsed.locality = component.long_name;
      } else if (types.includes('sublocality')) {
        parsed.sublocality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        parsed.administrativeAreaLevel1 = component.long_name;
      } else if (types.includes('postal_code')) {
        parsed.postalCode = component.long_name;
      } else if (types.includes('country')) {
        parsed.country = component.long_name;
      }
    });

    return parsed;
  };

  const handleInputChange = (newValue: string) => {
    setQuery(newValue);
    setSelectedIndex(-1);

    if (searchDebounced.current) {
      clearTimeout(searchDebounced.current);
    }

    if (newValue.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    searchDebounced.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await placesService.searchPlaces(newValue);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error('Places search error:', err);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSuggestionClick = async (prediction: google.maps.places.AutocompletePrediction) => {
    setIsLoading(true);
    try {
      const details = await placesService.getPlaceDetails(prediction.place_id);
      if (details.geometry?.location) {
        const lat = details.geometry.location.lat();
        const lng = details.geometry.location.lng();
        const address = details.name && details.types?.includes('establishment')
          ? `${details.name}, ${details.formatted_address}`
          : details.formatted_address || prediction.description;

        const addressComponents = parseAddressComponents(details.address_components || []);

        setQuery(address);
        onAddressSelect({
          address,
          latitude: lat,
          longitude: lng,
          addressComponents,
        });
        setIsOpen(false);
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Place details error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsGeolocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const address = await placesService.reverseGeocode(latitude, longitude);

          setQuery(address);
          onAddressSelect({
            address,
            latitude,
            longitude,
            addressComponents: {}, // Will be populated by reverse geocoding if needed
          });
        } catch (error) {
          console.error('Geolocation error:', error);
          alert('Unable to get your current location. Please enter your address manually.');
        } finally {
          setIsGeolocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGeolocating(false);
        alert('Unable to access your location. Please enter your address manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleQuickLocationClick = (location: typeof QUICK_LOCATIONS[0]) => {
    const address = `${location.name}, South Africa`;
    setQuery(address);
    onAddressSelect({
      address,
      latitude: location.lat,
      longitude: location.lng,
      addressComponents: {
        locality: location.name,
        country: 'South Africa',
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const inputClasses = clsx(
    'w-full pl-12 pr-4 py-3 border border-input bg-background rounded-lg',
    'focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:border-transparent',
    'placeholder:text-muted-foreground',
    {
      'h-12 text-base': variant === 'default',
      'h-14 text-lg rounded-full px-6 pl-14': variant === 'pill',
      'h-16 text-xl rounded-2xl': variant === 'hero',
    },
    className
  );

  const containerClasses = clsx('relative w-full', {
    'max-w-3xl': variant === 'hero',
    'max-w-2xl': variant === 'pill',
  });

  return (
    <div className={containerClasses} ref={containerRef}>
      {/* Main input */}
      <div className="relative">
        <Search className={clsx(
          'absolute text-muted-foreground',
          {
            'left-3 top-1/2 transform -translate-y-1/2 h-5 w-5': variant === 'default',
            'left-5 top-1/2 transform -translate-y-1/2 h-6 w-6': variant === 'pill' || variant === 'hero',
          }
        )} />

        <Input
          ref={inputRef}
          type="text"
          className={inputClasses}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
        />

        {(isLoading || isGeolocating) && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Location button */}
      {showLocationButton && (
        <div className="mt-3 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCurrentLocation}
            disabled={disabled || isGeolocating}
            className="text-circleTel-orange hover:text-circleTel-orange/80 p-0 h-auto font-semibold"
          >
            <Navigation className="w-4 h-4 mr-2" />
            {isGeolocating ? 'Getting location...' : 'Use current location'}
          </Button>
        </div>
      )}

      {/* Quick locations */}
      {showQuickLocations && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Quick select:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_LOCATIONS.map((location) => (
              <Button
                key={location.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickLocationClick(location)}
                disabled={disabled}
                className="h-8 px-3 text-xs"
              >
                {location.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              className={clsx(
                'w-full px-4 py-3 text-left hover:bg-muted transition-colors',
                'border-b border-border last:border-b-0',
                {
                  'bg-muted': index === selectedIndex,
                }
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {suggestion.types?.includes('establishment') ? (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </div>
                  {suggestion.structured_formatting?.secondary_text && (
                    <div className="text-xs text-muted-foreground truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};