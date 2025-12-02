/**
 * Unit Tests for Payment Types
 *
 * Tests payment type utilities and ZOHO mapping functions.
 *
 * @module __tests__/lib/payments/payment-types.test
 */

import {
  getZohoPaymentMode,
  formatPaymentMethod,
  NETCASH_TO_ZOHO_PAYMENT_MODE,
  PAYMENT_SYNC_RETRY_CONFIG,
  type PaymentSyncStatus,
  type ZohoPaymentMode,
} from '@/lib/payments/types';

describe('Payment Types', () => {
  // ============================================================================
  // getZohoPaymentMode Tests
  // ============================================================================

  describe('getZohoPaymentMode', () => {
    it('should return correct ZOHO mode for credit_card', () => {
      expect(getZohoPaymentMode('credit_card')).toBe('creditcard');
    });

    it('should return correct ZOHO mode for eft', () => {
      expect(getZohoPaymentMode('eft')).toBe('banktransfer');
    });

    it('should return correct ZOHO mode for ozow', () => {
      expect(getZohoPaymentMode('ozow')).toBe('banktransfer');
    });

    it('should return correct ZOHO mode for mobicred', () => {
      expect(getZohoPaymentMode('mobicred')).toBe('others');
    });

    it('should return correct ZOHO mode for payflex', () => {
      expect(getZohoPaymentMode('payflex')).toBe('others');
    });

    it('should return correct ZOHO mode for capitec_pay', () => {
      expect(getZohoPaymentMode('capitec_pay')).toBe('banktransfer');
    });

    it('should return "others" for unknown payment methods', () => {
      expect(getZohoPaymentMode('unknown_method')).toBe('others');
    });

    it('should handle null gracefully', () => {
      expect(getZohoPaymentMode(null)).toBe('others');
    });

    it('should handle undefined gracefully', () => {
      expect(getZohoPaymentMode(undefined)).toBe('others');
    });

    it('should handle empty string', () => {
      expect(getZohoPaymentMode('')).toBe('others');
    });

    it('should be case-insensitive', () => {
      expect(getZohoPaymentMode('CREDIT_CARD')).toBe('creditcard');
      expect(getZohoPaymentMode('Credit_Card')).toBe('creditcard');
      expect(getZohoPaymentMode('EFT')).toBe('banktransfer');
    });
  });

  // ============================================================================
  // formatPaymentMethod Tests
  // ============================================================================

  describe('formatPaymentMethod', () => {
    it('should format credit_card to "Credit Card"', () => {
      expect(formatPaymentMethod('credit_card')).toBe('Credit Card');
    });

    it('should format eft to "EFT"', () => {
      expect(formatPaymentMethod('eft')).toBe('EFT');
    });

    it('should format capitec_pay to "Capitec Pay"', () => {
      expect(formatPaymentMethod('capitec_pay')).toBe('Capitec Pay');
    });

    it('should format ozow to "Ozow"', () => {
      expect(formatPaymentMethod('ozow')).toBe('Ozow');
    });

    it('should format mobicred to "Mobicred"', () => {
      expect(formatPaymentMethod('mobicred')).toBe('Mobicred');
    });

    it('should format bank_transfer to "Bank Transfer"', () => {
      expect(formatPaymentMethod('bank_transfer')).toBe('Bank Transfer');
    });

    it('should handle null gracefully', () => {
      expect(formatPaymentMethod(null)).toBe('Online Payment');
    });

    it('should handle undefined gracefully', () => {
      expect(formatPaymentMethod(undefined)).toBe('Online Payment');
    });

    it('should handle empty string', () => {
      // Empty string is falsy, returns default
      const result = formatPaymentMethod('');
      expect(typeof result).toBe('string');
    });

    it('should format unknown methods with title case', () => {
      expect(formatPaymentMethod('some_new_method')).toBe('Some New Method');
    });
  });

  // ============================================================================
  // NETCASH_TO_ZOHO_PAYMENT_MODE Mapping Tests
  // ============================================================================

  describe('NETCASH_TO_ZOHO_PAYMENT_MODE', () => {
    it('should have all common payment methods mapped', () => {
      const expectedMethods = [
        'credit_card',
        'eft',
        'ozow',
        'mobicred',
        'payflex',
        'capitec_pay',
        'instant_eft',
        'snapscan',
      ];

      expectedMethods.forEach((method) => {
        expect(NETCASH_TO_ZOHO_PAYMENT_MODE[method]).toBeDefined();
      });
    });

    it('should only map to valid ZOHO payment modes', () => {
      const validZohoModes: ZohoPaymentMode[] = [
        'check',
        'cash',
        'creditcard',
        'banktransfer',
        'bankremittance',
        'autotransaction',
        'others',
      ];

      Object.values(NETCASH_TO_ZOHO_PAYMENT_MODE).forEach((mode) => {
        expect(validZohoModes).toContain(mode);
      });
    });
  });

  // ============================================================================
  // PAYMENT_SYNC_RETRY_CONFIG Tests
  // ============================================================================

  describe('PAYMENT_SYNC_RETRY_CONFIG', () => {
    it('should have reasonable max attempts', () => {
      expect(PAYMENT_SYNC_RETRY_CONFIG.maxAttempts).toBeGreaterThan(0);
      expect(PAYMENT_SYNC_RETRY_CONFIG.maxAttempts).toBeLessThanOrEqual(10);
    });

    it('should have reasonable base delay', () => {
      // At least 1 second between retries
      expect(PAYMENT_SYNC_RETRY_CONFIG.baseDelayMs).toBeGreaterThanOrEqual(1000);
      // At most 1 minute for base delay
      expect(PAYMENT_SYNC_RETRY_CONFIG.baseDelayMs).toBeLessThanOrEqual(60000);
    });

    it('should have retryable statuses defined', () => {
      expect(PAYMENT_SYNC_RETRY_CONFIG.retryableStatuses).toContain('failed');
      expect(Array.isArray(PAYMENT_SYNC_RETRY_CONFIG.retryableStatuses)).toBe(true);
    });
  });

  // ============================================================================
  // Type Safety Tests
  // ============================================================================

  describe('Type Safety', () => {
    it('should accept valid PaymentSyncStatus values', () => {
      const validStatuses: PaymentSyncStatus[] = [
        'pending',
        'syncing',
        'synced',
        'failed',
        'skipped',
      ];

      validStatuses.forEach((status) => {
        // This is a compile-time check - if it compiles, the type is correct
        const testStatus: PaymentSyncStatus = status;
        expect(testStatus).toBe(status);
      });
    });

    it('should accept valid ZohoPaymentMode values', () => {
      const validModes: ZohoPaymentMode[] = [
        'check',
        'cash',
        'creditcard',
        'banktransfer',
        'bankremittance',
        'autotransaction',
        'others',
      ];

      validModes.forEach((mode) => {
        const testMode: ZohoPaymentMode = mode;
        expect(testMode).toBe(mode);
      });
    });
  });
});
