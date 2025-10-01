/**
 * Google Maps Loader Utility
 * Handles dynamic loading of Google Maps service with proper error handling
 * and retry mechanisms to prevent chunk load errors
 */

import type { GoogleMapsService as GoogleMapsServiceType } from '@/services/googleMaps';

let googleMapsServiceInstance: GoogleMapsServiceType | null = null;
let loadingPromise: Promise<GoogleMapsServiceType> | null = null;

/**
 * Loads the Google Maps service with retry mechanism
 * @param retries Number of retry attempts
 * @param delay Delay between retries in milliseconds
 */
export async function loadGoogleMapsService(
  retries: number = 3,
  delay: number = 1000
): Promise<GoogleMapsServiceType> {
  // Return cached instance if available
  if (googleMapsServiceInstance) {
    return googleMapsServiceInstance;
  }

  // Return existing loading promise to prevent multiple parallel loads
  if (loadingPromise) {
    return loadingPromise;
  }

  // Create new loading promise
  loadingPromise = attemptLoad(retries, delay);
  
  try {
    googleMapsServiceInstance = await loadingPromise;
    return googleMapsServiceInstance;
  } finally {
    loadingPromise = null;
  }
}

/**
 * Attempts to load the Google Maps service with retries
 */
async function attemptLoad(
  retries: number,
  delay: number
): Promise<GoogleMapsServiceType> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Use webpack's require.ensure for more reliable chunking
      const googleMapsModule = await new Promise<typeof import('@/services/googleMaps')>((resolve, reject) => {
        if (typeof window === 'undefined') {
          // Server-side: direct import
          import('@/services/googleMaps').then(resolve).catch(reject);
        } else {
          // Client-side: use webpack's chunk loading with prefetch hint
          import(
            /* webpackChunkName: "google-maps-service" */
            /* webpackPrefetch: true */
            '@/services/googleMaps'
          ).then(resolve).catch(reject);
        }
      });

      return googleMapsModule.googleMapsService;
    } catch (error) {
      console.warn(`Failed to load Google Maps service (attempt ${attempt + 1}/${retries + 1}):`, error);
      
      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw new Error(
          `Failed to load Google Maps service after ${retries + 1} attempts. ` +
          `This may be due to network issues or ad blockers. ` +
          `Original error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }

  throw new Error('Unexpected error in Google Maps service loader');
}

/**
 * Preloads the Google Maps service in the background
 * Call this early in the app lifecycle to prevent chunk load errors
 */
export function preloadGoogleMapsService(): void {
  if (typeof window !== 'undefined' && !googleMapsServiceInstance && !loadingPromise) {
    // Preload in the background without blocking
    loadGoogleMapsService().catch(error => {
      console.warn('Failed to preload Google Maps service:', error);
    });
  }
}

/**
 * Checks if Google Maps service is loaded
 */
export function isGoogleMapsServiceLoaded(): boolean {
  return googleMapsServiceInstance !== null;
}

/**
 * Clears the cached Google Maps service instance
 * Useful for testing or forcing a reload
 */
export function clearGoogleMapsServiceCache(): void {
  googleMapsServiceInstance = null;
  loadingPromise = null;
}
