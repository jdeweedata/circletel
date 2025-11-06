/**
 * Payment Provider Factory
 *
 * Factory pattern for creating and managing payment provider instances.
 * Ensures singleton pattern and proper configuration validation.
 *
 * @module lib/payments/payment-provider-factory
 */

import type { IPaymentProvider } from './providers/payment-provider.interface';
import type { PaymentProviderType } from '@/lib/types/payment.types';
import { NetCashProvider } from './providers/netcash/netcash-provider';
// Future imports:
// import { ZOHOBillingProvider } from './providers/zoho/zoho-billing-provider';

// ============================================================================
// Factory Configuration
// ============================================================================

/**
 * Payment provider configuration
 */
export interface PaymentProviderConfig {
  /** Provider type */
  provider: PaymentProviderType;

  /** Whether this provider is enabled */
  enabled: boolean;

  /** Priority (lower = higher priority) */
  priority?: number;

  /** Environment-specific config */
  config?: Record<string, unknown>;
}

/**
 * Get default provider from environment
 */
function getDefaultProviderType(): PaymentProviderType {
  const envProvider = process.env.NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER;

  // Validate environment variable
  if (envProvider) {
    const validProviders: PaymentProviderType[] = [
      'netcash',
      'zoho_billing',
      'payfast',
      'paygate'
    ];

    if (validProviders.includes(envProvider as PaymentProviderType)) {
      return envProvider as PaymentProviderType;
    }

    console.warn(
      `Invalid NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER: ${envProvider}. Falling back to 'netcash'.`
    );
  }

  // Default to NetCash
  return 'netcash';
}

// ============================================================================
// Payment Provider Factory
// ============================================================================

/**
 * Payment Provider Factory
 *
 * Singleton factory for creating and managing payment provider instances.
 * Ensures providers are properly configured before use.
 *
 * @example
 * ```typescript
 * // Get default provider
 * const provider = PaymentProviderFactory.getDefaultProvider();
 *
 * // Get specific provider
 * const netcash = PaymentProviderFactory.getProvider('netcash');
 *
 * // Check if provider is available
 * if (PaymentProviderFactory.isProviderAvailable('zoho_billing')) {
 *   const zoho = PaymentProviderFactory.getProvider('zoho_billing');
 * }
 * ```
 */
export class PaymentProviderFactory {
  /**
   * Cache of instantiated providers (singleton pattern)
   */
  private static providers = new Map<PaymentProviderType, IPaymentProvider>();

  /**
   * Provider configuration registry
   */
  private static configs = new Map<PaymentProviderType, PaymentProviderConfig>();

  /**
   * Initialize factory (called automatically on first use)
   */
  private static initialized = false;

  /**
   * Initialize the factory with default configuration
   */
  private static initialize(): void {
    if (this.initialized) return;

    // Register default providers
    this.registerProvider('netcash', {
      provider: 'netcash',
      enabled: true,
      priority: 1
    });

    // Future: Register ZOHO Billing when implemented
    // this.registerProvider('zoho_billing', {
    //   provider: 'zoho_billing',
    //   enabled: false,
    //   priority: 2
    // });

    this.initialized = true;
  }

  /**
   * Register a payment provider configuration
   *
   * @param providerType - Provider type
   * @param config - Provider configuration
   */
  static registerProvider(
    providerType: PaymentProviderType,
    config: PaymentProviderConfig
  ): void {
    this.configs.set(providerType, config);
  }

  /**
   * Get a payment provider instance
   *
   * Returns a singleton instance of the requested provider.
   * Throws an error if provider is not configured or unavailable.
   *
   * @param providerType - Type of provider to get
   * @returns Payment provider instance
   * @throws Error if provider is not configured or unavailable
   *
   * @example
   * ```typescript
   * const provider = PaymentProviderFactory.getProvider('netcash');
   * const result = await provider.initiate({ ... });
   * ```
   */
  static getProvider(providerType: PaymentProviderType): IPaymentProvider {
    // Initialize on first use
    if (!this.initialized) {
      this.initialize();
    }

    // Check if provider is already instantiated
    if (this.providers.has(providerType)) {
      return this.providers.get(providerType)!;
    }

    // Create new provider instance
    const provider = this.createProvider(providerType);

    // Verify provider is configured
    if (!provider.isConfigured()) {
      throw new Error(
        `Payment provider '${providerType}' is not properly configured. ` +
        `Please check environment variables.`
      );
    }

    // Check if provider is enabled
    const config = this.configs.get(providerType);
    if (config && !config.enabled) {
      throw new Error(
        `Payment provider '${providerType}' is disabled in configuration.`
      );
    }

    // Cache and return
    this.providers.set(providerType, provider);
    return provider;
  }

  /**
   * Get the default payment provider
   *
   * Reads from NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER environment variable.
   * Falls back to 'netcash' if not set.
   *
   * @returns Default payment provider instance
   *
   * @example
   * ```typescript
   * const provider = PaymentProviderFactory.getDefaultProvider();
   * ```
   */
  static getDefaultProvider(): IPaymentProvider {
    const defaultType = getDefaultProviderType();
    return this.getProvider(defaultType);
  }

  /**
   * Create a new provider instance
   *
   * Factory method that instantiates the appropriate provider class.
   *
   * @param providerType - Type of provider to create
   * @returns New provider instance
   * @throws Error if provider type is unknown
   * @private
   */
  private static createProvider(providerType: PaymentProviderType): IPaymentProvider {
    switch (providerType) {
      case 'netcash':
        return new NetCashProvider();

      case 'zoho_billing':
        // TODO: Implement ZOHO Billing provider
        throw new Error(
          'ZOHO Billing provider not yet implemented. Coming soon!'
        );

      case 'payfast':
        // TODO: Implement PayFast provider (alternative SA gateway)
        throw new Error(
          'PayFast provider not yet implemented.'
        );

      case 'paygate':
        // TODO: Implement PayGate provider (alternative SA gateway)
        throw new Error(
          'PayGate provider not yet implemented.'
        );

      default:
        throw new Error(`Unknown payment provider: ${providerType}`);
    }
  }

  /**
   * Check if a provider is available and configured
   *
   * Useful for conditional feature enablement.
   *
   * @param providerType - Provider type to check
   * @returns True if provider is available and configured
   *
   * @example
   * ```typescript
   * if (PaymentProviderFactory.isProviderAvailable('zoho_billing')) {
   *   // Show ZOHO Billing option in UI
   * }
   * ```
   */
  static isProviderAvailable(providerType: PaymentProviderType): boolean {
    try {
      const provider = this.getProvider(providerType);
      return provider.isConfigured();
    } catch {
      return false;
    }
  }

  /**
   * Get all available providers
   *
   * Returns list of provider types that are configured and available.
   *
   * @returns Array of available provider types
   *
   * @example
   * ```typescript
   * const providers = PaymentProviderFactory.getAvailableProviders();
   * // ['netcash', 'zoho_billing']
   * ```
   */
  static getAvailableProviders(): PaymentProviderType[] {
    const allProviders: PaymentProviderType[] = [
      'netcash',
      'zoho_billing',
      'payfast',
      'paygate'
    ];

    return allProviders.filter((type) => this.isProviderAvailable(type));
  }

  /**
   * Get provider by priority
   *
   * Returns the highest priority provider that is available.
   * Useful for fallback scenarios.
   *
   * @returns Highest priority available provider
   * @throws Error if no providers are available
   *
   * @example
   * ```typescript
   * const provider = PaymentProviderFactory.getProviderByPriority();
   * // Returns netcash (priority 1) if available, else next priority
   * ```
   */
  static getProviderByPriority(): IPaymentProvider {
    if (!this.initialized) {
      this.initialize();
    }

    // Get all configs sorted by priority
    const sortedConfigs = Array.from(this.configs.values())
      .filter((config) => config.enabled)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999));

    // Find first available provider
    for (const config of sortedConfigs) {
      try {
        return this.getProvider(config.provider);
      } catch {
        // Try next provider
        continue;
      }
    }

    throw new Error('No payment providers available. Please configure at least one provider.');
  }

  /**
   * Clear provider cache
   *
   * Removes all cached provider instances. Useful for:
   * - Testing (reset between tests)
   * - Configuration changes (force re-initialization)
   *
   * @example
   * ```typescript
   * // In tests
   * afterEach(() => {
   *   PaymentProviderFactory.clearCache();
   * });
   * ```
   */
  static clearCache(): void {
    this.providers.clear();
  }

  /**
   * Get provider capabilities
   *
   * Returns capabilities for a specific provider without instantiating it.
   *
   * @param providerType - Provider type
   * @returns Provider capabilities or null if unavailable
   *
   * @example
   * ```typescript
   * const caps = PaymentProviderFactory.getProviderCapabilities('netcash');
   * if (caps?.refunds) {
   *   // Show refund button
   * }
   * ```
   */
  static getProviderCapabilities(
    providerType: PaymentProviderType
  ): ReturnType<IPaymentProvider['getCapabilities']> | null {
    try {
      const provider = this.getProvider(providerType);
      return provider.getCapabilities ? provider.getCapabilities() : null;
    } catch {
      return null;
    }
  }

  /**
   * Run health checks on all providers
   *
   * Useful for monitoring dashboards and system health checks.
   *
   * @returns Health check results for all providers
   *
   * @example
   * ```typescript
   * const healthStatus = await PaymentProviderFactory.healthCheckAll();
   * healthStatus.forEach(result => {
   *   console.log(`${result.provider}: ${result.healthy ? 'OK' : 'FAILED'}`);
   * });
   * ```
   */
  static async healthCheckAll(): Promise<
    Array<{
      provider: PaymentProviderType;
      healthy: boolean;
      response_time_ms?: number;
      error?: string;
      checked_at: Date;
    }>
  > {
    const results: Array<{
      provider: PaymentProviderType;
      healthy: boolean;
      response_time_ms?: number;
      error?: string;
      checked_at: Date;
    }> = [];

    for (const providerType of this.getAvailableProviders()) {
      try {
        const provider = this.getProvider(providerType);
        if (provider.healthCheck) {
          const result = await provider.healthCheck();
          results.push(result);
        } else {
          results.push({
            provider: providerType,
            healthy: provider.isConfigured(),
            checked_at: new Date()
          });
        }
      } catch (error) {
        results.push({
          provider: providerType,
          healthy: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          checked_at: new Date()
        });
      }
    }

    return results;
  }

  /**
   * Get factory status
   *
   * Returns information about the factory state.
   * Useful for debugging and admin dashboards.
   *
   * @returns Factory status information
   */
  static getStatus(): {
    initialized: boolean;
    cached_providers: PaymentProviderType[];
    registered_providers: PaymentProviderType[];
    available_providers: PaymentProviderType[];
    default_provider: PaymentProviderType;
  } {
    return {
      initialized: this.initialized,
      cached_providers: Array.from(this.providers.keys()),
      registered_providers: Array.from(this.configs.keys()),
      available_providers: this.getAvailableProviders(),
      default_provider: getDefaultProviderType()
    };
  }
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Get default payment provider (convenience function)
 *
 * @example
 * ```typescript
 * import { getPaymentProvider } from '@/lib/payments/payment-provider-factory';
 *
 * const provider = getPaymentProvider();
 * const result = await provider.initiate({ ... });
 * ```
 */
export function getPaymentProvider(
  providerType?: PaymentProviderType
): IPaymentProvider {
  if (providerType) {
    return PaymentProviderFactory.getProvider(providerType);
  }
  return PaymentProviderFactory.getDefaultProvider();
}

/**
 * Get NetCash provider specifically (convenience function)
 *
 * @example
 * ```typescript
 * import { getNetCashProvider } from '@/lib/payments/payment-provider-factory';
 *
 * const netcash = getNetCashProvider();
 * ```
 */
export function getNetCashProvider(): NetCashProvider {
  return PaymentProviderFactory.getProvider('netcash') as NetCashProvider;
}
