/**
 * Base Coverage Provider Interface
 *
 * Defines the contract for all coverage provider implementations.
 * Enables plugin-style architecture where providers can be added/removed
 * without modifying the aggregation service.
 *
 * @module lib/coverage/providers/base-provider
 */

import { Coordinates, ServiceType, CoverageCheckResult, CoverageProvider, SignalStrength } from '../types';

// =============================================================================
// PROVIDER CONFIGURATION
// =============================================================================

export interface ProviderConfig {
  /** Provider identifier */
  name: CoverageProvider;
  /** Human-readable display name */
  displayName: string;
  /** Whether provider is enabled */
  enabled: boolean;
  /** Service types this provider supports */
  supportedServices: ServiceType[];
  /** API endpoint (if applicable) */
  endpoint?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Rate limit (requests per minute) */
  rateLimit?: number;
  /** Additional provider-specific config */
  options?: Record<string, unknown>;
}

export interface ProviderStatus {
  name: CoverageProvider;
  healthy: boolean;
  lastChecked: string;
  latency?: number;
  errorCount: number;
  lastError?: string;
}

// =============================================================================
// COVERAGE RESULT TYPES
// =============================================================================

export interface ProviderCoverageResult {
  /** Whether coverage is available */
  available: boolean;
  /** Confidence level of the result */
  confidence: 'high' | 'medium' | 'low';
  /** List of available services */
  services: ProviderServiceResult[];
  /** Metadata about the check */
  metadata?: {
    source: string;
    endpoint?: string;
    responseTime?: number;
    fallbackUsed?: boolean;
    [key: string]: unknown;
  };
}

export interface ProviderServiceResult {
  type: ServiceType;
  available: boolean;
  signal: SignalStrength;
  technology?: string;
  estimatedSpeed?: {
    download: number;
    upload: number;
    unit: 'Mbps' | 'Gbps';
  };
  metadata?: Record<string, unknown>;
}

// =============================================================================
// BASE PROVIDER INTERFACE
// =============================================================================

/**
 * Abstract base class for coverage providers
 *
 * All provider implementations must extend this class and implement
 * the abstract methods.
 *
 * @example
 * ```typescript
 * class MTNProvider extends BaseCoverageProvider {
 *   name: CoverageProvider = 'mtn';
 *   displayName = 'MTN';
 *
 *   getSupportedServices(): ServiceType[] {
 *     return ['5g', 'fixed_lte', 'uncapped_wireless', 'fibre', 'licensed_wireless'];
 *   }
 *
 *   async checkCoverage(coordinates: Coordinates): Promise<ProviderCoverageResult> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export abstract class BaseCoverageProvider {
  /** Provider identifier */
  abstract readonly name: CoverageProvider;

  /** Human-readable display name */
  abstract readonly displayName: string;

  /** Provider configuration */
  protected config: ProviderConfig;

  /** Error counter for health monitoring */
  protected errorCount = 0;

  /** Last error message */
  protected lastError?: string;

  /** Last health check timestamp */
  protected lastHealthCheck?: Date;

  constructor(config?: Partial<ProviderConfig>) {
    this.config = {
      name: this.name,
      displayName: this.displayName,
      enabled: true,
      supportedServices: this.getSupportedServices(),
      timeout: 10000,
      ...config,
    };
  }

  // ===========================================================================
  // ABSTRACT METHODS (Must be implemented by subclasses)
  // ===========================================================================

  /**
   * Get the list of service types this provider supports
   */
  abstract getSupportedServices(): ServiceType[];

  /**
   * Check coverage at the given coordinates
   *
   * @param coordinates - Location to check
   * @param serviceTypes - Optional filter for specific service types
   * @returns Coverage result from this provider
   */
  abstract checkCoverage(
    coordinates: Coordinates,
    serviceTypes?: ServiceType[]
  ): Promise<ProviderCoverageResult>;

  // ===========================================================================
  // OPTIONAL METHODS (Can be overridden by subclasses)
  // ===========================================================================

  /**
   * Check provider health/availability
   *
   * Default implementation returns healthy status.
   * Override to implement actual health checks.
   */
  async checkHealth(): Promise<ProviderStatus> {
    this.lastHealthCheck = new Date();

    return {
      name: this.name,
      healthy: this.config.enabled && this.errorCount < 5,
      lastChecked: this.lastHealthCheck.toISOString(),
      errorCount: this.errorCount,
      lastError: this.lastError,
    };
  }

  /**
   * Get map tile URL for visualization (if supported)
   *
   * @param coordinates - Center coordinates
   * @param serviceType - Service type to visualize
   * @param zoom - Map zoom level
   * @returns Tile URL or null if not supported
   */
  getMapTileUrl(
    _coordinates: Coordinates,
    _serviceType: ServiceType,
    _zoom?: number
  ): string | null {
    return null;
  }

  /**
   * Get available coverage layers for mapping (if supported)
   */
  getCoverageLayers(): Array<{
    id: string;
    name: string;
    serviceType: ServiceType;
    color: string;
  }> {
    return [];
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Check if provider is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if provider supports a specific service type
   */
  supportsService(serviceType: ServiceType): boolean {
    return this.config.supportedServices.includes(serviceType);
  }

  /**
   * Get provider configuration
   */
  getConfig(): ProviderConfig {
    return { ...this.config };
  }

  /**
   * Record an error (for health monitoring)
   */
  protected recordError(error: Error | string): void {
    this.errorCount++;
    this.lastError = error instanceof Error ? error.message : error;
  }

  /**
   * Reset error counter (call after successful request)
   */
  protected resetErrors(): void {
    this.errorCount = 0;
    this.lastError = undefined;
  }

  /**
   * Wrap an async operation with timeout
   */
  protected async withTimeout<T>(
    operation: Promise<T>,
    timeout?: number
  ): Promise<T> {
    const timeoutMs = timeout ?? this.config.timeout ?? 10000;

    return Promise.race([
      operation,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Provider ${this.name} timed out`)), timeoutMs)
      ),
    ]);
  }
}

// =============================================================================
// PROVIDER REGISTRY
// =============================================================================

/**
 * Registry for managing coverage providers
 *
 * Allows dynamic registration and lookup of providers.
 */
export class ProviderRegistry {
  private providers = new Map<CoverageProvider, BaseCoverageProvider>();

  /**
   * Register a provider
   */
  register(provider: BaseCoverageProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get a provider by name
   */
  get(name: CoverageProvider): BaseCoverageProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered providers
   */
  getAll(): BaseCoverageProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all enabled providers
   */
  getEnabled(): BaseCoverageProvider[] {
    return this.getAll().filter((p) => p.isEnabled());
  }

  /**
   * Get providers that support a specific service type
   */
  getByService(serviceType: ServiceType): BaseCoverageProvider[] {
    return this.getEnabled().filter((p) => p.supportsService(serviceType));
  }

  /**
   * Check health of all providers
   */
  async checkAllHealth(): Promise<ProviderStatus[]> {
    const healthChecks = this.getAll().map((p) => p.checkHealth());
    return Promise.all(healthChecks);
  }

  /**
   * Unregister a provider
   */
  unregister(name: CoverageProvider): boolean {
    return this.providers.delete(name);
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
  }
}

/**
 * Global provider registry instance
 */
export const providerRegistry = new ProviderRegistry();
