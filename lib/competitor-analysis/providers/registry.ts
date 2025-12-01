/**
 * Provider Registry
 *
 * Factory pattern for creating and managing provider scraper instances.
 * Allows lookup by slug and centralized provider management.
 */

import type { CompetitorProvider } from '../types';
import { BaseProvider } from './base-provider';

// Import provider implementations
import { MTNProvider } from './mtn-provider';
import { VodacomProvider } from './vodacom-provider';
import { TelkomProvider } from './telkom-provider';
import { RainProvider } from './rain-provider';
import { AfrihostProvider } from './afrihost-provider';

// =============================================================================
// TYPES
// =============================================================================

type ProviderConstructor = new (provider: CompetitorProvider) => BaseProvider;

interface RegisteredProvider {
  slug: string;
  name: string;
  constructor: ProviderConstructor;
  supportedTypes: string[];
}

// =============================================================================
// REGISTRY
// =============================================================================

/**
 * Map of provider slugs to their constructor functions.
 */
const PROVIDER_CONSTRUCTORS = new Map<string, ProviderConstructor>();
PROVIDER_CONSTRUCTORS.set('mtn', MTNProvider);
PROVIDER_CONSTRUCTORS.set('vodacom', VodacomProvider);
PROVIDER_CONSTRUCTORS.set('telkom', TelkomProvider);
PROVIDER_CONSTRUCTORS.set('rain', RainProvider);
PROVIDER_CONSTRUCTORS.set('afrihost', AfrihostProvider);

/**
 * Provider metadata for discovery.
 */
const PROVIDER_METADATA: RegisteredProvider[] = [
  {
    slug: 'mtn',
    name: 'MTN',
    constructor: MTNProvider,
    supportedTypes: ['mobile_contract', 'data_only', 'device'],
  },
  {
    slug: 'vodacom',
    name: 'Vodacom',
    constructor: VodacomProvider,
    supportedTypes: ['mobile_contract', 'data_only', 'device'],
  },
  {
    slug: 'telkom',
    name: 'Telkom',
    constructor: TelkomProvider,
    supportedTypes: ['mobile_contract', 'fibre', 'lte'],
  },
  {
    slug: 'rain',
    name: 'Rain',
    constructor: RainProvider,
    supportedTypes: ['lte', 'data_only'],
  },
  {
    slug: 'afrihost',
    name: 'Afrihost',
    constructor: AfrihostProvider,
    supportedTypes: ['fibre', 'lte'],
  },
];

// =============================================================================
// PROVIDER REGISTRY CLASS
// =============================================================================

export class ProviderRegistry {
  private static instances: Map<string, BaseProvider> = new Map();

  /**
   * Get a provider instance by slug.
   * Creates a new instance if one doesn't exist.
   *
   * @param provider - Provider entity from database
   * @returns Provider scraper instance, or null if not supported
   */
  static getProvider(provider: CompetitorProvider): BaseProvider | null {
    const Constructor = PROVIDER_CONSTRUCTORS.get(provider.slug);

    if (!Constructor) {
      console.warn(
        `[ProviderRegistry] No scraper implementation for provider: ${provider.slug}`
      );
      return null;
    }

    // Check cache first
    const cacheKey = `${provider.slug}:${provider.id}`;
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!;
    }

    // Create new instance
    const instance = new Constructor(provider);
    this.instances.set(cacheKey, instance);

    return instance;
  }

  /**
   * Check if a provider slug has a scraper implementation.
   */
  static hasProvider(slug: string): boolean {
    return PROVIDER_CONSTRUCTORS.has(slug);
  }

  /**
   * Get list of all registered provider slugs.
   */
  static getRegisteredSlugs(): string[] {
    return Array.from(PROVIDER_CONSTRUCTORS.keys());
  }

  /**
   * Get metadata for all registered providers.
   */
  static getProviderMetadata(): RegisteredProvider[] {
    return [...PROVIDER_METADATA];
  }

  /**
   * Get metadata for a specific provider.
   */
  static getProviderInfo(slug: string): RegisteredProvider | undefined {
    return PROVIDER_METADATA.find((p) => p.slug === slug);
  }

  /**
   * Clear the instance cache (useful for testing).
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Register a custom provider (for extensions).
   *
   * @param slug - Provider slug
   * @param constructor - Provider constructor
   * @param metadata - Optional metadata
   */
  static registerProvider(
    slug: string,
    constructor: ProviderConstructor,
    metadata?: Partial<RegisteredProvider>
  ): void {
    PROVIDER_CONSTRUCTORS.set(slug, constructor);

    // Add to metadata if not exists
    const existingIndex = PROVIDER_METADATA.findIndex((p) => p.slug === slug);
    const newMetadata: RegisteredProvider = {
      slug,
      name: metadata?.name || slug,
      constructor,
      supportedTypes: metadata?.supportedTypes || [],
    };

    if (existingIndex >= 0) {
      PROVIDER_METADATA[existingIndex] = newMetadata;
    } else {
      PROVIDER_METADATA.push(newMetadata);
    }
  }

  /**
   * Unregister a provider (for testing).
   */
  static unregisterProvider(slug: string): void {
    PROVIDER_CONSTRUCTORS.delete(slug);
    const index = PROVIDER_METADATA.findIndex((p) => p.slug === slug);
    if (index >= 0) {
      PROVIDER_METADATA.splice(index, 1);
    }
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create a provider scraper instance.
 * Convenience wrapper around ProviderRegistry.getProvider().
 */
export function createProvider(provider: CompetitorProvider): BaseProvider | null {
  return ProviderRegistry.getProvider(provider);
}

/**
 * Check if a provider has scraper support.
 */
export function isProviderSupported(slug: string): boolean {
  return ProviderRegistry.hasProvider(slug);
}

/**
 * Get all supported provider slugs.
 */
export function getSupportedProviders(): string[] {
  return ProviderRegistry.getRegisteredSlugs();
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ProviderRegistry;
