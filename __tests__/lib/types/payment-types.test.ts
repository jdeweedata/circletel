/**
 * Unit Tests for Payment Type Guards and Utilities
 *
 * Tests type validation functions and utility helpers.
 *
 * @module __tests__/lib/types/payment-types.test
 */

import {
  isPaymentStatus,
  isPaymentMethod,
  isPaymentProviderType
} from '@/lib/types/payment.types';

describe('Payment Type Guards', () => {
  // ============================================================================
  // isPaymentStatus Tests
  // ============================================================================

  describe('isPaymentStatus', () => {
    it('should return true for valid payment statuses', () => {
      const validStatuses = [
        'pending',
        'processing',
        'completed',
        'failed',
        'refunded',
        'cancelled',
        'expired'
      ];

      validStatuses.forEach((status) => {
        expect(isPaymentStatus(status)).toBe(true);
      });
    });

    it('should return false for invalid payment statuses', () => {
      const invalidStatuses = [
        'invalid',
        'PENDING', // Case sensitive
        'complete', // Wrong form
        '',
        null,
        undefined,
        123,
        {},
        []
      ];

      invalidStatuses.forEach((status) => {
        expect(isPaymentStatus(status)).toBe(false);
      });
    });

    it('should narrow type to PaymentStatus when true', () => {
      const value: unknown = 'completed';

      if (isPaymentStatus(value)) {
        // TypeScript should recognize this as PaymentStatus
        const status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired' = value;
        expect(status).toBe('completed');
      }
    });
  });

  // ============================================================================
  // isPaymentMethod Tests
  // ============================================================================

  describe('isPaymentMethod', () => {
    it('should return true for valid payment methods', () => {
      const validMethods = [
        'card',
        'eft',
        'instant_eft',
        'debit_order',
        'scan_to_pay',
        'cash',
        'payflex',
        'capitec_pay',
        'paymyway',
        'scode_retail'
      ];

      validMethods.forEach((method) => {
        expect(isPaymentMethod(method)).toBe(true);
      });
    });

    it('should return false for invalid payment methods', () => {
      const invalidMethods = [
        'invalid',
        'CARD', // Case sensitive
        'credit_card', // Not exact match
        '',
        null,
        undefined,
        123,
        {},
        []
      ];

      invalidMethods.forEach((method) => {
        expect(isPaymentMethod(method)).toBe(false);
      });
    });
  });

  // ============================================================================
  // isPaymentProviderType Tests
  // ============================================================================

  describe('isPaymentProviderType', () => {
    it('should return true for valid provider types', () => {
      const validProviders = ['netcash', 'zoho_billing', 'payfast', 'paygate'];

      validProviders.forEach((provider) => {
        expect(isPaymentProviderType(provider)).toBe(true);
      });
    });

    it('should return false for invalid provider types', () => {
      const invalidProviders = [
        'invalid',
        'NETCASH', // Case sensitive
        'net_cash', // Wrong format
        '',
        null,
        undefined,
        123,
        {},
        []
      ];

      invalidProviders.forEach((provider) => {
        expect(isPaymentProviderType(provider)).toBe(false);
      });
    });
  });
});
