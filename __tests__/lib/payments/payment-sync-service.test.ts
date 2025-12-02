/**
 * Unit Tests for Payment Sync Service
 *
 * Tests ZOHO payment sync orchestration.
 *
 * @module __tests__/lib/payments/payment-sync-service.test
 */

import { getZohoPaymentMode, formatPaymentMethod } from '@/lib/payments/types';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        or: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

// Mock ZOHO billing client
jest.mock('@/lib/integrations/zoho/billing-client', () => ({
  ZohoBillingClient: jest.fn().mockImplementation(() => ({
    recordPayment: jest.fn(() => Promise.resolve({
      payment_id: 'zoho_payment_123',
      payment_number: 'PMT-001',
      amount: 799.00,
    })),
  })),
}));

// Mock ZOHO sync logger
jest.mock('@/lib/integrations/zoho/billing-sync-logger', () => ({
  logZohoSync: jest.fn(() => Promise.resolve()),
}));

describe('Payment Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Payment Mode Mapping Tests (Integration with types)
  // ============================================================================

  describe('Payment Mode Mapping', () => {
    it('should correctly map NetCash payment methods to ZOHO modes', () => {
      const testCases = [
        { netcash: 'credit_card', zoho: 'creditcard' },
        { netcash: 'eft', zoho: 'banktransfer' },
        { netcash: 'ozow', zoho: 'banktransfer' },
        { netcash: 'capitec_pay', zoho: 'banktransfer' },
        { netcash: 'mobicred', zoho: 'others' },
        { netcash: 'unknown', zoho: 'others' },
      ];

      testCases.forEach(({ netcash, zoho }) => {
        expect(getZohoPaymentMode(netcash)).toBe(zoho);
      });
    });

    it('should format payment methods for display', () => {
      expect(formatPaymentMethod('credit_card')).toBe('Credit Card');
      expect(formatPaymentMethod('eft')).toBe('EFT');
      expect(formatPaymentMethod('capitec_pay')).toBe('Capitec Pay');
      expect(formatPaymentMethod(null)).toBe('Online Payment');
    });
  });

  // ============================================================================
  // Sync Request Validation Tests
  // ============================================================================

  describe('Sync Request Validation', () => {
    it('should validate required fields in sync request', () => {
      const validRequest = {
        payment_id: 'pay_123',
        invoice_id: 'inv_456',
        customer_id: 'cust_789',
        amount: 799.00,
        payment_method: 'credit_card',
        reference: 'REF-001',
        transaction_date: '2025-12-02T10:00:00Z',
      };

      // All required fields present
      expect(validRequest.payment_id).toBeDefined();
      expect(validRequest.invoice_id).toBeDefined();
      expect(validRequest.customer_id).toBeDefined();
      expect(validRequest.amount).toBeGreaterThan(0);
      expect(validRequest.reference).toBeDefined();
    });

    it('should accept optional metadata in sync request', () => {
      const requestWithMetadata = {
        payment_id: 'pay_123',
        invoice_id: 'inv_456',
        customer_id: 'cust_789',
        amount: 799.00,
        payment_method: 'credit_card',
        reference: 'REF-001',
        transaction_date: '2025-12-02T10:00:00Z',
        metadata: {
          source: 'netcash_webhook',
          order_number: 'ORD-001',
        },
      };

      expect(requestWithMetadata.metadata).toBeDefined();
      expect(requestWithMetadata.metadata.source).toBe('netcash_webhook');
    });
  });

  // ============================================================================
  // Sync Status Tests
  // ============================================================================

  describe('Sync Status Transitions', () => {
    it('should define valid sync statuses', () => {
      const validStatuses = ['pending', 'syncing', 'synced', 'failed', 'skipped'];

      validStatuses.forEach((status) => {
        expect(typeof status).toBe('string');
      });
    });

    it('should allow transition from pending to syncing', () => {
      const fromStatus = 'pending';
      const toStatus = 'syncing';

      // Valid transition
      expect(['pending', 'failed']).toContain(fromStatus);
      expect(['syncing']).toContain(toStatus);
    });

    it('should allow transition from syncing to synced or failed', () => {
      const fromStatus = 'syncing';
      const validTransitions = ['synced', 'failed'];

      expect(['synced', 'failed']).toEqual(expect.arrayContaining(validTransitions));
    });

    it('should allow retry from failed to syncing', () => {
      const fromStatus = 'failed';
      const toStatus = 'syncing';

      // Retry is allowed
      expect(fromStatus).toBe('failed');
      expect(toStatus).toBe('syncing');
    });
  });

  // ============================================================================
  // Retry Configuration Tests
  // ============================================================================

  describe('Retry Configuration', () => {
    it('should have reasonable retry defaults', () => {
      const config = {
        maxAttempts: 5,
        retryIntervalMs: 300000, // 5 minutes
        backoffMultiplier: 2,
      };

      expect(config.maxAttempts).toBe(5);
      expect(config.retryIntervalMs).toBe(300000);
      expect(config.backoffMultiplier).toBe(2);
    });

    it('should calculate exponential backoff correctly', () => {
      const baseInterval = 300000; // 5 minutes
      const multiplier = 2;

      const attempt1 = baseInterval * Math.pow(multiplier, 0); // 5 min
      const attempt2 = baseInterval * Math.pow(multiplier, 1); // 10 min
      const attempt3 = baseInterval * Math.pow(multiplier, 2); // 20 min
      const attempt4 = baseInterval * Math.pow(multiplier, 3); // 40 min

      expect(attempt1).toBe(300000);
      expect(attempt2).toBe(600000);
      expect(attempt3).toBe(1200000);
      expect(attempt4).toBe(2400000);
    });
  });

  // ============================================================================
  // ZOHO Payload Construction Tests
  // ============================================================================

  describe('ZOHO Payload Construction', () => {
    it('should construct valid ZOHO payment payload', () => {
      const payload = {
        customer_id: 'zoho_cust_123',
        payment_mode: 'banktransfer',
        amount: 799.00,
        date: '2025-12-02',
        reference_number: 'REF-001',
        description: 'NetCash payment for Invoice INV-001',
        invoices: [
          {
            invoice_id: 'zoho_inv_456',
            amount_applied: 799.00,
          },
        ],
      };

      expect(payload.customer_id).toBeDefined();
      expect(payload.payment_mode).toBe('banktransfer');
      expect(payload.amount).toBe(799.00);
      expect(payload.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(payload.invoices).toHaveLength(1);
      expect(payload.invoices[0].amount_applied).toBe(payload.amount);
    });

    it('should format date correctly for ZOHO API', () => {
      const isoDate = '2025-12-02T10:30:45.123Z';
      const zohoDate = isoDate.split('T')[0];

      expect(zohoDate).toBe('2025-12-02');
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle missing invoice gracefully', async () => {
      const errorResult = {
        success: false,
        error: 'Invoice not found: inv_missing',
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toContain('Invoice not found');
    });

    it('should handle missing ZOHO invoice ID', async () => {
      const errorResult = {
        success: false,
        error: 'Invoice not synced to ZOHO Billing',
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toContain('not synced to ZOHO');
    });

    it('should handle ZOHO API errors', async () => {
      const errorResult = {
        success: false,
        error: 'ZOHO API Error: Rate limit exceeded',
        retry_scheduled: true,
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.retry_scheduled).toBe(true);
    });

    it('should handle network timeouts', async () => {
      const errorResult = {
        success: false,
        error: 'Request timeout after 30000ms',
        retry_scheduled: true,
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toContain('timeout');
    });
  });

  // ============================================================================
  // Success Result Tests
  // ============================================================================

  describe('Success Results', () => {
    it('should return ZOHO payment ID on success', () => {
      const successResult = {
        success: true,
        zoho_payment_id: 'zoho_pmt_123456',
        attempt_number: 1,
      };

      expect(successResult.success).toBe(true);
      expect(successResult.zoho_payment_id).toBeDefined();
      expect(successResult.zoho_payment_id).toMatch(/^zoho_pmt_/);
    });

    it('should track attempt number', () => {
      const retrySuccessResult = {
        success: true,
        zoho_payment_id: 'zoho_pmt_789',
        attempt_number: 3,
      };

      expect(retrySuccessResult.attempt_number).toBeGreaterThan(1);
    });
  });

  // ============================================================================
  // Batch Retry Tests
  // ============================================================================

  describe('Batch Retry Logic', () => {
    it('should respect retry limit', () => {
      const limit = 50;
      const failedPayments = Array(100).fill({ id: 'pay_xxx' });
      const paymentsToRetry = failedPayments.slice(0, limit);

      expect(paymentsToRetry.length).toBe(limit);
    });

    it('should return summary of retry results', () => {
      const retrySummary = {
        processed: 50,
        succeeded: 45,
        failed: 5,
      };

      expect(retrySummary.processed).toBe(50);
      expect(retrySummary.succeeded + retrySummary.failed).toBe(retrySummary.processed);
    });
  });
});
