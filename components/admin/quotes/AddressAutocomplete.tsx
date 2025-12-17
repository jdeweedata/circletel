'use client';

import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

/**
 * Suppress Google Maps Places API deprecation warning.
 * The Autocomplete API still works for existing customers and will continue to work.
 * Migration to PlaceAutocompleteElement is planned for when the new API stabilizes.
 */
function suppressGoogleMapsDeprecationWarning() {
  if (typeof window === 'undefined') return;
  if ((window as { __gmapsWarningSuppressed?: boolean }).__gmapsWarningSuppressed) return;

  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      message.includes('google.maps.places.Autocomplete is not available to new customers')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
  (window as { __gmapsWarningSuppressed?: boolean }).__gmapsWarningSuppressed = true;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Enter address...',
  className = '',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isReady, setIsReady] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(value);

  useEffect(() => {
    // Suppress deprecation warning before loading Google Maps
    suppressGoogleMapsDeprecationWarning();

    // Check if Google Maps API is already loaded
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      initAutocomplete();
      return;
    }

    // Load Google Maps API if not already loaded
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found');
      setIsLoading(false);
      return;
    }

    // Check if script already exists
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
          clearInterval(checkInterval);
          initAutocomplete();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initAutocomplete();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const initAutocomplete = () => {
    if (!inputRef.current) return;

    try {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'za' }, // Restrict to South Africa
        fields: ['formatted_address', 'address_components', 'geometry', 'name'],
        types: ['address'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          onChange(place.formatted_address, place);
        }
      });

      setIsLoading(false);
      setIsReady(true);
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
      setIsLoading(false);
    }
  };

  // Sync external value changes with internal state
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={internalValue}
        onChange={(e) => {
          setInternalValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={className}
        disabled={isLoading}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
      )}
      {isReady && (
        <p className="text-xs text-gray-500 mt-1">
          Start typing to see address suggestions
        </p>
      )}
    </div>
  );
}
