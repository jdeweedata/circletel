/**
 * NetCash Webhook Validator Tests
 *
 * Tests for webhook validation, signature verification, and payload parsing.
 *
 * @module __tests__/lib/payment/netcash-webhook-validator.test
 */

import crypto from 'crypto';
import {
  isNetcashIP,
  validateWebhookSignature,
  validateURLEncodedSignature,
  parseWebhookPayload,
  generateIdempotencyKey,
  mapNetcashStatus,
  determineWebhookType,
  extractOrderIdFromReference,
  sanitizePayloadForLogging,
  type NetcashWebhookPayload,
} from '@/lib/payment/netcash-webhook-validator';

describe('NetCash Webhook Validator', () => {
  // ============================================================================
  // IP Whitelist Tests
  // ============================================================================

  describe('isNetcashIP', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should allow localhost in any environment', () => {
      process.env.NODE_ENV = 'production';
      expect(isNetcashIP('127.0.0.1')).toBe(true);
    });

    it('should allow IPv6 localhost', () => {
      process.env.NODE_ENV = 'production';
      expect(isNetcashIP('::1')).toBe(true);
    });

    it('should allow all IPs in development mode', () => {
      process.env.NODE_ENV = 'development';
      expect(isNetcashIP('1.2.3.4')).toBe(true);
      expect(isNetcashIP('192.168.1.1')).toBe(true);
    });

    it('should allow NetCash primary range', () => {
      process.env.NODE_ENV = 'production';
      expect(isNetcashIP('196.33.252.100')).toBe(true);
    });

    it('should allow NetCash secondary range', () => {
      process.env.NODE_ENV = 'production';
      expect(isNetcashIP('41.203.154.50')).toBe(true);
    });

    it('should reject unknown IPs in production', () => {
      process.env.NODE_ENV = 'production';
      expect(isNetcashIP('1.2.3.4')).toBe(false);
    });
  });

  // ============================================================================
  // Signature Verification Tests
  // ============================================================================

  describe('validateWebhookSignature', () => {
    const secret = 'test-webhook-secret';

    it('should verify valid JSON payload signature', () => {
      const payload = { test: 'data', amount: '10000' };
      const payloadString = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex');

      expect(validateWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it('should verify valid string payload signature', () => {
      const payload = 'test-payload-string';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(validateWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = { test: 'data' };
      const invalidSignature = 'invalid-signature';

      expect(validateWebhookSignature(payload, invalidSignature, secret)).toBe(
        false
      );
    });

    it('should reject signature from wrong secret', () => {
      const payload = { test: 'data' };
      const payloadString = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', 'wrong-secret')
        .update(payloadString)
        .digest('hex');

      expect(validateWebhookSignature(payload, signature, secret)).toBe(false);
    });

    it('should reject tampered payload', () => {
      const originalPayload = { test: 'data', amount: '10000' };
      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(originalPayload))
        .digest('hex');

      const tamperedPayload = { test: 'data', amount: '99999' };

      expect(validateWebhookSignature(tamperedPayload, signature, secret)).toBe(
        false
      );
    });
  });

  describe('validateURLEncodedSignature', () => {
    const secret = 'test-webhook-secret';

    it('should verify URL-encoded parameters signature', () => {
      const params = { amount: '10000', reference: 'INV-001', status: 'approved' };

      // Build signature string (sorted keys)
      const signatureString = 'amount=10000&reference=INV-001&status=approved';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(signatureString)
        .digest('hex');

      expect(validateURLEncodedSignature(params, signature, secret)).toBe(true);
    });

    it('should sort parameters alphabetically', () => {
      const params = { z: '3', a: '1', m: '2' };
      const signatureString = 'a=1&m=2&z=3';
      const signature = crypto
        .createHmac('sha256', secret)
        .update(signatureString)
        .digest('hex');

      expect(validateURLEncodedSignature(params, signature, secret)).toBe(true);
    });
  });

  // ============================================================================
  // Payload Parsing Tests
  // ============================================================================

  describe('parseWebhookPayload', () => {
    it('should parse valid JSON string payload', () => {
      const jsonString = JSON.stringify({
        Reference: 'INV-001',
        Status: 'Approved',
        Amount: '10000',
      });

      const result = parseWebhookPayload(jsonString);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.payload?.Reference).toBe('INV-001');
    });

    it('should parse valid object payload', () => {
      const payload = {
        Reference: 'INV-001',
        Status: 'Approved',
        Amount: '10000',
      };

      const result = parseWebhookPayload(payload);

      expect(result.valid).toBe(true);
      expect(result.payload?.Status).toBe('Approved');
    });

    it('should reject invalid JSON string', () => {
      const result = parseWebhookPayload('not valid json');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid JSON payload');
    });

    it('should reject missing Reference field', () => {
      const payload = {
        Status: 'Approved',
        Amount: '10000',
      };

      const result = parseWebhookPayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: Reference');
    });

    it('should reject missing Status field', () => {
      const payload = {
        Reference: 'INV-001',
        Amount: '10000',
      };

      const result = parseWebhookPayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: Status');
    });

    it('should reject missing Amount field', () => {
      const payload = {
        Reference: 'INV-001',
        Status: 'Approved',
      };

      const result = parseWebhookPayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: Amount');
    });

    it('should reject invalid amount format', () => {
      const payload = {
        Reference: 'INV-001',
        Status: 'Approved',
        Amount: 'not-a-number',
      };

      const result = parseWebhookPayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid amount format');
    });

    it('should reject negative amount', () => {
      const payload = {
        Reference: 'INV-001',
        Status: 'Approved',
        Amount: '-100',
      };

      const result = parseWebhookPayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid amount format');
    });

    it('should reject invalid status', () => {
      const payload = {
        Reference: 'INV-001',
        Status: 'InvalidStatus',
        Amount: '10000',
      };

      const result = parseWebhookPayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid status'))).toBe(true);
    });

    it('should accept all valid statuses', () => {
      const validStatuses = [
        'Approved',
        'Declined',
        'Cancelled',
        'Pending',
        'Failed',
        'Refunded',
        'Chargeback',
      ];

      validStatuses.forEach((status) => {
        const payload = {
          Reference: 'INV-001',
          Status: status,
          Amount: '10000',
        };

        const result = parseWebhookPayload(payload);
        expect(result.valid).toBe(true);
      });
    });
  });

  // ============================================================================
  // Idempotency Key Tests
  // ============================================================================

  describe('generateIdempotencyKey', () => {
    it('should generate consistent key for same payload', () => {
      const payload: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Approved',
        Amount: '10000',
      };

      const key1 = generateIdempotencyKey(payload);
      const key2 = generateIdempotencyKey(payload);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different payloads', () => {
      const payload1: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Approved',
        Amount: '10000',
      };

      const payload2: NetcashWebhookPayload = {
        Reference: 'INV-002',
        Status: 'Approved',
        Amount: '10000',
      };

      const key1 = generateIdempotencyKey(payload1);
      const key2 = generateIdempotencyKey(payload2);

      expect(key1).not.toBe(key2);
    });

    it('should generate 64-character hex string', () => {
      const payload: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Approved',
        Amount: '10000',
      };

      const key = generateIdempotencyKey(payload);

      expect(key).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(key)).toBe(true);
    });

    it('should include transaction ID in key when present', () => {
      const payloadWithTxId: NetcashWebhookPayload = {
        Reference: 'INV-001',
        TransactionID: 'TX-123',
        Status: 'Approved',
        Amount: '10000',
      };

      const payloadWithoutTxId: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Approved',
        Amount: '10000',
      };

      const key1 = generateIdempotencyKey(payloadWithTxId);
      const key2 = generateIdempotencyKey(payloadWithoutTxId);

      expect(key1).not.toBe(key2);
    });
  });

  // ============================================================================
  // Status Mapping Tests
  // ============================================================================

  describe('mapNetcashStatus', () => {
    it('should map Approved to completed', () => {
      expect(mapNetcashStatus('Approved')).toBe('completed');
    });

    it('should map Declined to failed', () => {
      expect(mapNetcashStatus('Declined')).toBe('failed');
    });

    it('should map Cancelled to cancelled', () => {
      expect(mapNetcashStatus('Cancelled')).toBe('cancelled');
    });

    it('should map Pending to pending', () => {
      expect(mapNetcashStatus('Pending')).toBe('pending');
    });

    it('should map Failed to failed', () => {
      expect(mapNetcashStatus('Failed')).toBe('failed');
    });

    it('should map Refunded to refunded', () => {
      expect(mapNetcashStatus('Refunded')).toBe('refunded');
    });

    it('should map Chargeback to chargeback', () => {
      expect(mapNetcashStatus('Chargeback')).toBe('chargeback');
    });

    it('should return unknown for unrecognized status', () => {
      expect(mapNetcashStatus('SomeRandomStatus')).toBe('unknown');
    });
  });

  // ============================================================================
  // Webhook Type Detection Tests
  // ============================================================================

  describe('determineWebhookType', () => {
    it('should detect payment success', () => {
      const payload: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Approved',
        Amount: '10000',
      };

      expect(determineWebhookType(payload)).toBe('payment_success');
    });

    it('should detect payment failure for declined', () => {
      const payload: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Declined',
        Amount: '10000',
      };

      expect(determineWebhookType(payload)).toBe('payment_failure');
    });

    it('should detect payment pending', () => {
      const payload: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Pending',
        Amount: '10000',
      };

      expect(determineWebhookType(payload)).toBe('payment_pending');
    });

    it('should detect refund', () => {
      const payload: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Refunded',
        Amount: '10000',
      };

      expect(determineWebhookType(payload)).toBe('refund');
    });

    it('should detect chargeback', () => {
      const payload: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Chargeback',
        Amount: '10000',
      };

      expect(determineWebhookType(payload)).toBe('chargeback');
    });

    it('should return notify for unknown status', () => {
      const payload: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Unknown',
        Amount: '10000',
      };

      expect(determineWebhookType(payload)).toBe('notify');
    });
  });

  // ============================================================================
  // Order ID Extraction Tests
  // ============================================================================

  describe('extractOrderIdFromReference', () => {
    it('should extract UUID from reference', () => {
      const reference = 'ORD-550e8400-e29b-41d4-a716-446655440000';
      const orderId = extractOrderIdFromReference(reference);

      expect(orderId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should extract UUID from complex reference', () => {
      const reference = 'CT-2025-550e8400-e29b-41d4-a716-446655440000-001';
      const orderId = extractOrderIdFromReference(reference);

      expect(orderId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return null for reference without UUID', () => {
      const reference = 'INV-2025-001';
      const orderId = extractOrderIdFromReference(reference);

      expect(orderId).toBeNull();
    });

    it('should handle lowercase UUID', () => {
      const reference = 'ORD-550e8400-e29b-41d4-a716-446655440000';
      const orderId = extractOrderIdFromReference(reference);

      expect(orderId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  // ============================================================================
  // Payload Sanitization Tests
  // ============================================================================

  describe('sanitizePayloadForLogging', () => {
    it('should mask card number', () => {
      const payload: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Approved',
        Amount: '10000',
        CardNumber: '4111111111111111',
      };

      const sanitized = sanitizePayloadForLogging(payload);

      expect(sanitized.CardNumber).toBe('************1111');
      expect(sanitized.CardNumber).not.toBe('4111111111111111');
    });

    it('should not modify reference', () => {
      const payload: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Approved',
        Amount: '10000',
      };

      const sanitized = sanitizePayloadForLogging(payload);

      expect(sanitized.Reference).toBe('INV-001');
    });

    it('should return copy of payload', () => {
      const payload: NetcashWebhookPayload = {
        Reference: 'INV-001',
        Status: 'Approved',
        Amount: '10000',
      };

      const sanitized = sanitizePayloadForLogging(payload);

      expect(sanitized).not.toBe(payload);
    });
  });
});
