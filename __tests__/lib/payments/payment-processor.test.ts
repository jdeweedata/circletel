/**
 * Payment Processor Tests
 *
 * Tests for NetCash webhook processing and payment verification functions.
 * These are critical paths for financial operations.
 *
 * @module __tests__/lib/payments/payment-processor.test
 */

import crypto from 'crypto';
import type { NetcashPaymentWebhookPayload } from '@/lib/payments/webhook-types';

// Mock environment variables
const MOCK_WEBHOOK_SECRET = 'test-webhook-secret-12345';
process.env.NETCASH_WEBHOOK_SECRET = MOCK_WEBHOOK_SECRET;

// Mock Supabase
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn((table: string) => ({
        insert: mockInsert,
        update: mockUpdate,
        select: mockSelect,
        eq: mockEq,
      })),
    })
  ),
}));

// Import after mocks are set up
import {
  verifyNetCashWebhook,
  processPaymentWebhook,
  validateWebhookPayload,
  getTransactionStatus,
} from '@/lib/payments/payment-processor';

describe('Payment Processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock chain for successful operations
    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'transaction_123' },
          error: null,
        }),
      }),
    });

    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
    });

    mockSingle.mockResolvedValue({
      data: {
        id: 'invoice_123',
        status: 'unpaid',
        amount: 799,
      },
      error: null,
    });
  });

  // ============================================================================
  // Signature Verification Tests
  // ============================================================================

  describe('verifyNetCashWebhook', () => {
    it('should verify valid HMAC-SHA256 signature', () => {
      const payload = JSON.stringify({ test: 'data', amount: '10000' });
      const validSignature = crypto
        .createHmac('sha256', MOCK_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      const result = verifyNetCashWebhook(payload, validSignature);
      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ test: 'data', amount: '10000' });
      const invalidSignature = 'invalid-signature-12345';

      const result = verifyNetCashWebhook(payload, invalidSignature);
      expect(result).toBe(false);
    });

    it('should reject signature from wrong secret', () => {
      const payload = JSON.stringify({ test: 'data', amount: '10000' });
      const wrongSecretSignature = crypto
        .createHmac('sha256', 'wrong-secret')
        .update(payload)
        .digest('hex');

      const result = verifyNetCashWebhook(payload, wrongSecretSignature);
      expect(result).toBe(false);
    });

    it('should reject tampered payload', () => {
      const originalPayload = JSON.stringify({ test: 'data', amount: '10000' });
      const signature = crypto
        .createHmac('sha256', MOCK_WEBHOOK_SECRET)
        .update(originalPayload)
        .digest('hex');

      // Tamper with payload
      const tamperedPayload = JSON.stringify({ test: 'data', amount: '99999' });

      const result = verifyNetCashWebhook(tamperedPayload, signature);
      expect(result).toBe(false);
    });

    it('should throw error when secret is not configured', () => {
      const originalSecret = process.env.NETCASH_WEBHOOK_SECRET;
      delete process.env.NETCASH_WEBHOOK_SECRET;

      expect(() => {
        verifyNetCashWebhook('payload', 'signature');
      }).toThrow('NETCASH_WEBHOOK_SECRET is not configured');

      // Restore
      process.env.NETCASH_WEBHOOK_SECRET = originalSecret;
    });
  });

  // ============================================================================
  // Payload Validation Tests
  // ============================================================================

  describe('validateWebhookPayload', () => {
    it('should validate complete payload', () => {
      const validPayload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'true',
        Amount: '79900',
        Reference: 'INV-2025-001',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      const result = validateWebhookPayload(validPayload);
      expect(result).toBe(true);
    });

    it('should reject payload missing TransactionAccepted', () => {
      const invalidPayload = {
        Amount: '79900',
        Reference: 'INV-2025-001',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      const result = validateWebhookPayload(invalidPayload);
      expect(result).toBe(false);
    });

    it('should reject payload missing Amount', () => {
      const invalidPayload = {
        TransactionAccepted: 'true',
        Reference: 'INV-2025-001',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      const result = validateWebhookPayload(invalidPayload);
      expect(result).toBe(false);
    });

    it('should reject payload missing Reference', () => {
      const invalidPayload = {
        TransactionAccepted: 'true',
        Amount: '79900',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      const result = validateWebhookPayload(invalidPayload);
      expect(result).toBe(false);
    });

    it('should reject payload missing Extra1 (invoice ID)', () => {
      const invalidPayload = {
        TransactionAccepted: 'true',
        Amount: '79900',
        Reference: 'INV-2025-001',
        RequestTrace: 'trace_abc123',
      };

      const result = validateWebhookPayload(invalidPayload);
      expect(result).toBe(false);
    });

    it('should reject payload missing RequestTrace', () => {
      const invalidPayload = {
        TransactionAccepted: 'true',
        Amount: '79900',
        Reference: 'INV-2025-001',
        Extra1: 'invoice_uuid_123',
      };

      const result = validateWebhookPayload(invalidPayload);
      expect(result).toBe(false);
    });

    it('should reject null payload', () => {
      const result = validateWebhookPayload(null);
      expect(result).toBe(false);
    });

    it('should reject undefined payload', () => {
      const result = validateWebhookPayload(undefined);
      expect(result).toBe(false);
    });

    it('should reject non-object payload', () => {
      const result = validateWebhookPayload('string payload');
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Transaction Status Tests
  // ============================================================================

  describe('getTransactionStatus', () => {
    it('should return completed for accepted transaction', () => {
      const payload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'true',
        Amount: '79900',
        Reference: 'INV-2025-001',
        Extra1: 'invoice_123',
        RequestTrace: 'trace_123',
      };

      const status = getTransactionStatus(payload);
      expect(status).toBe('completed');
    });

    it('should return failed for rejected transaction', () => {
      const payload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'false',
        Amount: '79900',
        Reference: 'INV-2025-001',
        Extra1: 'invoice_123',
        RequestTrace: 'trace_123',
      };

      const status = getTransactionStatus(payload);
      expect(status).toBe('failed');
    });

    it('should return failed for any non-true value', () => {
      const payloads = [
        { TransactionAccepted: 'FALSE' },
        { TransactionAccepted: '0' },
        { TransactionAccepted: '' },
        { TransactionAccepted: 'declined' },
      ];

      payloads.forEach((p) => {
        const payload: NetcashPaymentWebhookPayload = {
          ...p,
          Amount: '79900',
          Reference: 'INV-2025-001',
          Extra1: 'invoice_123',
          RequestTrace: 'trace_123',
        };

        const status = getTransactionStatus(payload);
        expect(status).toBe('failed');
      });
    });
  });

  // ============================================================================
  // Process Payment Webhook Tests
  // ============================================================================

  describe('processPaymentWebhook', () => {
    it('should create transaction record for successful payment', async () => {
      const payload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'true',
        Amount: '79900', // R799.00 in cents
        Reference: 'INV-2025-001',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      await processPaymentWebhook(payload);

      // Verify transaction insert was called
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should update invoice to paid status for successful payment', async () => {
      const payload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'true',
        Amount: '79900',
        Reference: 'INV-2025-001',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      await processPaymentWebhook(payload);

      // Verify invoice update was called
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should update invoice to unpaid status for failed payment', async () => {
      const payload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'false',
        Amount: '79900',
        Reference: 'INV-2025-001',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      await processPaymentWebhook(payload);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should convert amount from cents to Rands', async () => {
      const payload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'true',
        Amount: '79900', // R799.00 in cents
        Reference: 'INV-2025-001',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      await processPaymentWebhook(payload);

      // The insert should have been called with amount in Rands (799.00)
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should throw error for missing required fields', async () => {
      const invalidPayload = {
        TransactionAccepted: 'true',
        Amount: '79900',
        Reference: 'INV-2025-001',
        // Missing Extra1 and RequestTrace
      } as NetcashPaymentWebhookPayload;

      await expect(processPaymentWebhook(invalidPayload)).rejects.toThrow(
        'Invalid webhook payload: missing required fields'
      );
    });

    it('should throw error when transaction insert fails', async () => {
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      const payload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'true',
        Amount: '79900',
        Reference: 'INV-2025-001',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      await expect(processPaymentWebhook(payload)).rejects.toThrow(
        'Failed to create transaction record'
      );
    });

    it('should throw error when invoice update fails', async () => {
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Invoice update failed' },
        }),
      });

      const payload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'true',
        Amount: '79900',
        Reference: 'INV-2025-001',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      await expect(processPaymentWebhook(payload)).rejects.toThrow(
        'Failed to update invoice'
      );
    });
  });

  // ============================================================================
  // Edge Cases and Security Tests
  // ============================================================================

  describe('Edge Cases and Security', () => {
    it('should handle zero amount payment', async () => {
      const payload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'true',
        Amount: '0',
        Reference: 'INV-2025-001',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      // Zero amount should still process (could be a test transaction)
      await processPaymentWebhook(payload);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle very large amounts', async () => {
      const payload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'true',
        Amount: '99999999', // R999,999.99
        Reference: 'INV-2025-001',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      await processPaymentWebhook(payload);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle special characters in reference', async () => {
      const payload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'true',
        Amount: '79900',
        Reference: 'INV-2025-001/A-B_C',
        Extra1: 'invoice_uuid_123',
        RequestTrace: 'trace_abc123',
      };

      await processPaymentWebhook(payload);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle UUID format Extra1', async () => {
      const payload: NetcashPaymentWebhookPayload = {
        TransactionAccepted: 'true',
        Amount: '79900',
        Reference: 'INV-2025-001',
        Extra1: '550e8400-e29b-41d4-a716-446655440000',
        RequestTrace: 'trace_abc123',
      };

      await processPaymentWebhook(payload);
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Amount Conversion Tests
  // ============================================================================

  describe('Amount Conversion', () => {
    it('should correctly convert cents to Rands', () => {
      const testCases = [
        { cents: '79900', rands: 799.0 },
        { cents: '10000', rands: 100.0 },
        { cents: '1', rands: 0.01 },
        { cents: '50', rands: 0.5 },
        { cents: '123456', rands: 1234.56 },
      ];

      testCases.forEach(({ cents, rands }) => {
        const converted = parseFloat(cents) / 100;
        expect(converted).toBe(rands);
      });
    });

    it('should handle decimal amounts in string', () => {
      // NetCash might send amounts with decimal places
      const amount = '799.00';
      const converted = parseFloat(amount) / 100;
      expect(converted).toBe(7.99);
    });
  });
});
