/**
 * Provider Scrapers - Index
 *
 * Exports all provider scrapers and the registry for managing them.
 */

// =============================================================================
// BASE CLASS
// =============================================================================

export { BaseProvider } from './base-provider';
export type { ProviderScrapeContext, NormalizationConfig } from './base-provider';

// =============================================================================
// PROVIDER IMPLEMENTATIONS
// =============================================================================

export { MTNProvider } from './mtn-provider';
export { VodacomProvider } from './vodacom-provider';
export { TelkomProvider } from './telkom-provider';
export { RainProvider } from './rain-provider';
export { AfrihostProvider } from './afrihost-provider';

// =============================================================================
// REGISTRY
// =============================================================================

export {
  ProviderRegistry,
  createProvider,
  isProviderSupported,
  getSupportedProviders,
} from './registry';

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export { ProviderRegistry as default } from './registry';
