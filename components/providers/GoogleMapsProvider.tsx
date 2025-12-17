'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadGoogleMapsService } from '@/lib/googleMapsLoader';

interface GoogleMapsContextValue {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextValue>({
  isLoaded: false,
  loadError: undefined
});

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within GoogleMapsProvider');
  }
  return context;
}

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

/**
 * Suppress Google Maps Places API deprecation warning.
 *
 * As of March 1st, 2025, Google deprecated google.maps.places.Autocomplete for NEW customers.
 * However, existing customers (like CircleTel) can continue using it.
 * The old API is NOT scheduled to be discontinued, and at least 12 months notice will be given.
 *
 * Migration to PlaceAutocompleteElement is planned for when the new API stabilizes.
 * See: https://developers.google.com/maps/documentation/javascript/places-migration-overview
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
      // Suppress this specific deprecation warning
      // We acknowledge it and will migrate when the new API is stable
      return;
    }
    originalWarn.apply(console, args);
  };
  (window as { __gmapsWarningSuppressed?: boolean }).__gmapsWarningSuppressed = true;
}

// Run suppression immediately on module load (before Google Maps loads)
suppressGoogleMapsDeprecationWarning();

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    loadGoogleMapsService()
      .then(() => {
        setIsLoaded(true);
      })
      .catch((error) => {
        setLoadError(error);
      });
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
