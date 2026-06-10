'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PiMagnifyingGlassBold, PiXBold } from 'react-icons/pi';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PlacesAddressInputProps {
  value: string;
  onSelect: (data: {
    address: string;
    province?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  onTextChange?: (text: string) => void;
  placeholder?: string;
  className?: string;
}

interface AutocompleteSuggestion {
  placeId: string;
  displayText: string;
}

/**
 * PlacesAddressInput - New Google Places API autocomplete for clinic search
 * Uses the modern google.maps.importLibrary approach to find clinics by name or address
 */
export const PlacesAddressInput: React.FC<PlacesAddressInputProps> = ({
  value,
  onSelect,
  onTextChange,
  placeholder = 'Start typing your clinic name or address…',
  className,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<any>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load the Google Maps script and Places API on mount
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadPlacesAPI = async () => {
      try {
        // loadGoogleMapsService() only imports the service module — it does NOT inject
        // the Maps <script>. We must call svc.loadGoogleMaps() to actually load the
        // script (with loading=async, which exposes google.maps.importLibrary).
        const { loadGoogleMapsService } = await import('@/lib/googleMapsLoader');
        const svc = await loadGoogleMapsService();
        await svc.loadGoogleMaps();

        // importLibrary may attach a tick after the script's onload — poll briefly.
        let tries = 0;
        while (typeof (window as any).google?.maps?.importLibrary !== 'function' && tries < 50) {
          await new Promise((r) => setTimeout(r, 100));
          tries++;
        }

        if (typeof (window as any).google?.maps?.importLibrary === 'function') {
          setMapsLoaded(true);
        } else {
          console.error('[PlacesAddressInput] google.maps.importLibrary not available after load');
        }
      } catch (error) {
        console.error('[PlacesAddressInput] Failed to load Google Maps:', error);
      }
    };

    loadPlacesAPI();
  }, []);

  /**
   * Sync external value changes
   */
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  /**
   * Fetch autocomplete suggestions using the new Places API
   */
  const fetchAutocompleteSuggestions = useCallback(
    async (input: string) => {
      const importLibrary = (window as any).google?.maps?.importLibrary;
      if (typeof importLibrary !== 'function') {
        console.warn('[PlacesAddressInput] Places API not ready');
        return;
      }

      if (input.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } =
          (await window.google.maps.importLibrary('places')) as any;

        // Create a new session token if we don't have one
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          includedRegionCodes: ['za'],
          sessionToken: sessionTokenRef.current,
        });

        const suggestions = response.suggestions
          .slice(0, 8) // Limit to 8 suggestions
          .map((suggestion: any) => ({
            placeId: suggestion.placePrediction.placeId,
            displayText: suggestion.placePrediction.text.text,
          }));

        setSuggestions(suggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('[PlacesAddressInput] Failed to fetch suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Handle input changes with debouncing
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);

    // Call onTextChange callback if provided
    if (onTextChange) {
      onTextChange(newValue);
    }

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the API call
    debounceTimeoutRef.current = setTimeout(() => {
      fetchAutocompleteSuggestions(newValue);
    }, 300);
  };

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = async (suggestion: AutocompleteSuggestion) => {
    const importLibrary = (window as any).google?.maps?.importLibrary;
    if (typeof importLibrary !== 'function') {
      console.warn('[PlacesAddressInput] Places API not ready');
      return;
    }

    setInputValue(suggestion.displayText);
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      const { Place } = (await window.google.maps.importLibrary('places')) as any;

      // Fetch detailed place information
      const place = new Place({
        id: suggestion.placeId,
        requestId: sessionTokenRef.current?.requestId,
      });

      await place.fetchFields({
        fields: ['formattedAddress', 'location', 'addressComponents', 'displayName'],
      });

      // Extract province from address components
      let province: string | undefined;
      if (place.addressComponents) {
        const adminArea = place.addressComponents.find((comp: any) =>
          comp.types.includes('administrative_area_level_1')
        );
        province = adminArea?.longText;
      }

      // Call the onSelect callback with the place data
      onSelect({
        address: place.formattedAddress || suggestion.displayText,
        province,
        latitude: place.location?.lat?.(),
        longitude: place.location?.lng?.(),
      });

      // Create a fresh session token for the next search
      const { AutocompleteSessionToken } =
        (await window.google.maps.importLibrary('places')) as any;
      sessionTokenRef.current = new AutocompleteSessionToken();
    } catch (error) {
      console.error('[PlacesAddressInput] Failed to fetch place details:', error);
      // Fallback: use the display text as the address
      onSelect({
        address: suggestion.displayText,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
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

  /**
   * Clear the input
   */
  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);

    if (onTextChange) {
      onTextChange('');
    }

    inputRef.current?.focus();
  };

  /**
   * Handle blur with delay to allow click to register
   */
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  /**
   * Handle focus to show suggestions if there are any
   */
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative">
        {isLoading ? (
          <div className="absolute top-1/2 left-3 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-circleTel-orange"></div>
          </div>
        ) : (
          <PiMagnifyingGlassBold className="absolute top-1/2 left-3 transform -translate-y-1/2 h-4 w-4 text-circleTel-secondaryNeutral" />
        )}

        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={!mapsLoaded}
          className={cn(
            'h-10 pl-9 text-sm rounded-xl border border-gray-200 bg-white text-gray-800',
            'placeholder:text-gray-400 placeholder:text-sm',
            'focus-visible:ring-2 focus-visible:ring-circleTel-orange focus-visible:ring-offset-0',
            inputValue ? 'pr-8' : 'pr-3',
            !mapsLoaded && 'opacity-50 cursor-not-allowed'
          )}
          autoComplete="off"
        />

        {inputValue && (
          <button
            onClick={clearInput}
            className="absolute top-1/2 right-2.5 transform -translate-y-1/2 text-circleTel-secondaryNeutral hover:text-circleTel-navy transition-colors z-10"
            type="button"
            tabIndex={-1}
          >
            <PiXBold className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={cn(
            'absolute z-50 w-full mt-2 bg-white shadow-lg border border-gray-200',
            'max-h-60 overflow-y-auto rounded-xl'
          )}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              type="button"
              onClick={() => handleSuggestionSelect(suggestion)}
              className={cn(
                'w-full text-left px-3 py-2.5 hover:bg-circleTel-lightNeutral transition-colors',
                'border-b border-gray-100 last:border-b-0',
                'first:rounded-t-xl last:rounded-b-xl',
                selectedIndex === index && 'bg-circleTel-lightNeutral'
              )}
            >
              <div className="flex items-start gap-2">
                <PiMagnifyingGlassBold className="h-4 w-4 text-circleTel-secondaryNeutral mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-circleTel-navy truncate">
                    {suggestion.displayText}
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
