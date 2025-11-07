/**
 * Unit Tests for PaymentProviderFactory
 *
 * Tests provider management, selection, and configuration.
 *
 * @module __tests__/lib/payments/payment-provider-factory.test
 */

import { PaymentProviderFactory, getPaymentProvider } from '@/lib/payments/payment-provider-factory';
import { NetCashProvider } from '@/lib/payments/providers/netcash/netcash-provider';
import { setupMockEnv } from './test-utils';

describe('PaymentProviderFactory', () => {
  let restoreEnv: () => void;

  beforeEach(() => {
    // Setup mock environment
    restoreEnv = setupMockEnv();

    // Clear factory cache before each test
    PaymentProviderFactory.clearCache();
  });

  afterEach(() => {
    // Restore original environment
    restoreEnv();
  });

  // ============================================================================
  // Provider Retrieval Tests
  // ============================================================================

  describe('getProvider', () => {
    it('should return NetCash provider when requested', () => {
      const provider = PaymentProviderFactory.getProvider('netcash');

      expect(provider).toBeInstanceOf(NetCashProvider);
      expect(provider.name).toBe('netcash');
    });

    it('should return the same instance on multiple calls (singleton)', () => {
      const provider1 = PaymentProviderFactory.getProvider('netcash');
      const provider2 = PaymentProviderFactory.getProvider('netcash');

      expect(provider1).toBe(provider2); // Same instance
    });

    it('should throw error if provider is not configured', () => {
      // Remove environment variables
      delete process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY;
      delete process.env.NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY;

      expect(() => {
        PaymentProviderFactory.getProvider('netcash');
      }).toThrow(/not properly configured/);
    });

    it('should throw error for unknown provider type', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid provider type
        PaymentProviderFactory.getProvider('invalid_provider');
      }).toThrow(/Unknown payment provider/);
    });

    it('should throw error for not yet implemented providers', () => {
      expect(() => {
        PaymentProviderFactory.getProvider('zoho_billing');
      }).toThrow(/not yet implemented/);
    });
  });

  // ============================================================================
  // Default Provider Tests
  // ============================================================================

  describe('getDefaultProvider', () => {
    it('should return NetCash provider by default', () => {
      const provider = PaymentProviderFactory.getDefaultProvider();

      expect(provider).toBeInstanceOf(NetCashProvider);
      expect(provider.name).toBe('netcash');
    });

    it('should respect NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER env variable', () => {
      process.env.NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER = 'netcash';

      const provider = PaymentProviderFactory.getDefaultProvider();

      expect(provider.name).toBe('netcash');
    });

    it('should fallback to netcash if env variable is invalid', () => {
      process.env.NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER = 'invalid_provider';

      const provider = PaymentProviderFactory.getDefaultProvider();

      expect(provider.name).toBe('netcash');
    });
  });

  // ============================================================================
  // Provider Availability Tests
  // ============================================================================

  describe('isProviderAvailable', () => {
    it('should return true for configured NetCash provider', () => {
      const isAvailable = PaymentProviderFactory.isProviderAvailable('netcash');

      expect(isAvailable).toBe(true);
    });

    it('should return false for unconfigured provider', () => {
      // Remove environment variables
      delete process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY;

      // Clear cache to force re-check
      PaymentProviderFactory.clearCache();

      const isAvailable = PaymentProviderFactory.isProviderAvailable('netcash');

      expect(isAvailable).toBe(false);
    });

    it('should return false for not yet implemented providers', () => {
      const isAvailable = PaymentProviderFactory.isProviderAvailable('zoho_billing');

      expect(isAvailable).toBe(false);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return array of available provider types', () => {
      const available = PaymentProviderFactory.getAvailableProviders();

      expect(Array.isArray(available)).toBe(true);
      expect(available).toContain('netcash');
    });

    it('should only include configured providers', () => {
      const available = PaymentProviderFactory.getAvailableProviders();

      // ZOHO not yet implemented, should not be in list
      expect(available).not.toContain('zoho_billing');
    });
  });

  // ============================================================================
  // Provider Capabilities Tests
  // ============================================================================

  describe('getProviderCapabilities', () => {
    it('should return capabilities for NetCash provider', () => {
      const capabilities = PaymentProviderFactory.getProviderCapabilities('netcash');

      expect(capabilities).toBeDefined();
      expect(capabilities?.webhooks).toBe(true);
      expect(capabilities?.payment_methods).toContain('card');
      expect(capabilities?.payment_methods).toContain('instant_eft');
    });

    it('should return null for unavailable providers', () => {
      const capabilities = PaymentProviderFactory.getProviderCapabilities('zoho_billing');

      expect(capabilities).toBeNull();
    });

    it('should include all NetCash payment methods', () => {
      const capabilities = PaymentProviderFactory.getProviderCapabilities('netcash');

      const expectedMethods = [
        'card',
        'eft',
        'instant_eft',
        'debit_order',
        'scan_to_pay',
        'cash',
        'payflex'
      ];

      expectedMethods.forEach((method) => {
        expect(capabilities?.payment_methods).toContain(method);
      });
    });
  });

  // ============================================================================
  // Health Check Tests
  // ============================================================================

  describe('healthCheckAll', () => {
    it('should return health status for all available providers', async () => {
      const healthResults = await PaymentProviderFactory.healthCheckAll();

      expect(Array.isArray(healthResults)).toBe(true);
      expect(healthResults.length).toBeGreaterThan(0);

      const netcashHealth = healthResults.find((r) => r.provider === 'netcash');
      expect(netcashHealth).toBeDefined();
      expect(netcashHealth?.checked_at).toBeInstanceOf(Date);
    });

    it('should include health status for each provider', async () => {
      const healthResults = await PaymentProviderFactory.healthCheckAll();

      healthResults.forEach((result) => {
        expect(result).toHaveProperty('provider');
        expect(result).toHaveProperty('healthy');
        expect(result).toHaveProperty('checked_at');
      });
    });
  });

  // ============================================================================
  // Factory Status Tests
  // ============================================================================

  describe('getStatus', () => {
    it('should return factory status information', () => {
      // Initialize by getting a provider
      PaymentProviderFactory.getDefaultProvider();

      const status = PaymentProviderFactory.getStatus();

      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('cached_providers');
      expect(status).toHaveProperty('registered_providers');
      expect(status).toHaveProperty('available_providers');
      expect(status).toHaveProperty('default_provider');

      expect(status.initialized).toBe(true);
      expect(status.default_provider).toBe('netcash');
    });

    it('should show cached providers after retrieval', () => {
      PaymentProviderFactory.getProvider('netcash');

      const status = PaymentProviderFactory.getStatus();

      expect(status.cached_providers).toContain('netcash');
    });

    it('should show empty cached providers after clearCache', () => {
      PaymentProviderFactory.getProvider('netcash');
      PaymentProviderFactory.clearCache();

      const status = PaymentProviderFactory.getStatus();

      expect(status.cached_providers).toHaveLength(0);
    });
  });

  // ============================================================================
  // Cache Management Tests
  // ============================================================================

  describe('clearCache', () => {
    it('should clear all cached provider instances', () => {
      // Get a provider to populate cache
      PaymentProviderFactory.getProvider('netcash');

      // Clear cache
      PaymentProviderFactory.clearCache();

      const status = PaymentProviderFactory.getStatus();
      expect(status.cached_providers).toHaveLength(0);
    });

    it('should allow getting provider again after clearing cache', () => {
      const provider1 = PaymentProviderFactory.getProvider('netcash');
      PaymentProviderFactory.clearCache();
      const provider2 = PaymentProviderFactory.getProvider('netcash');

      // Different instances after cache clear
      expect(provider1).not.toBe(provider2);
      // But same provider type
      expect(provider2.name).toBe('netcash');
    });
  });

  // ============================================================================
  // Convenience Function Tests
  // ============================================================================

  describe('getPaymentProvider (convenience function)', () => {
    it('should return default provider when no type specified', () => {
      const provider = getPaymentProvider();

      expect(provider.name).toBe('netcash');
    });

    it('should return specific provider when type specified', () => {
      const provider = getPaymentProvider('netcash');

      expect(provider).toBeInstanceOf(NetCashProvider);
      expect(provider.name).toBe('netcash');
    });

    it('should be equivalent to factory getProvider', () => {
      const factoryProvider = PaymentProviderFactory.getProvider('netcash');
      const convenienceProvider = getPaymentProvider('netcash');

      expect(convenienceProvider).toBe(factoryProvider);
    });
  });

  // ============================================================================
  // Edge Cases & Error Handling
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle missing environment variables gracefully', () => {
      delete process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY;
      delete process.env.NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY;

      PaymentProviderFactory.clearCache();

      expect(() => {
        PaymentProviderFactory.getProvider('netcash');
      }).toThrow();
    });

    it('should handle rapid provider retrieval (no race conditions)', () => {
      // Simulate rapid concurrent requests
      const providers = Array.from({ length: 10 }, () =>
        PaymentProviderFactory.getProvider('netcash')
      );

      // All should be the same instance
      providers.forEach((provider) => {
        expect(provider).toBe(providers[0]);
      });
    });

    it('should handle provider registration before initialization', () => {
      PaymentProviderFactory.clearCache();

      // Register a custom provider config
      PaymentProviderFactory.registerProvider('netcash', {
        provider: 'netcash',
        enabled: true,
        priority: 1
      });

      const provider = PaymentProviderFactory.getProvider('netcash');
      expect(provider).toBeDefined();
    });
  });

  // ============================================================================
  // Priority-Based Selection Tests
  // ============================================================================

  describe('getProviderByPriority', () => {
    it('should return highest priority available provider', () => {
      const provider = PaymentProviderFactory.getProviderByPriority();

      // NetCash should be priority 1
      expect(provider.name).toBe('netcash');
    });

    it('should throw error if no providers available', () => {
      // Remove all environment variables
      delete process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY;
      delete process.env.NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY;

      PaymentProviderFactory.clearCache();

      expect(() => {
        PaymentProviderFactory.getProviderByPriority();
      }).toThrow(/No payment providers available/);
    });
  });
});
