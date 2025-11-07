/**
 * Unit Tests for NetCashProvider
 *
 * Tests NetCash payment provider implementation.
 *
 * @module __tests__/lib/payments/netcash-provider.test
 */

import { NetCashProvider } from '@/lib/payments/providers/netcash/netcash-provider';
import {
  setupMockEnv,
  mockPaymentInitiationParams,
  mockNetCashWebhookPayload,
  mockNetCashWebhookPayloadFailed,
  generateMockSignature,
  assertPaymentInitiationSuccess,
  assertPaymentInitiationFailure,
  assertWebhookProcessingSuccess,
  assertWebhookProcessingFailure,
  assertProviderCapabilities
} from './test-utils';

describe('NetCashProvider', () => {
  let provider: NetCashProvider;
  let restoreEnv: () => void;

  beforeEach(() => {
    // Setup mock environment
    restoreEnv = setupMockEnv();

    // Create provider instance
    provider = new NetCashProvider();
  });

  afterEach(() => {
    // Restore original environment
    restoreEnv();
  });

  // ============================================================================
  // Provider Configuration Tests
  // ============================================================================

  describe('Configuration', () => {
    it('should have correct provider name', () => {
      expect(provider.name).toBe('netcash');
    });

    it('should be configured with valid environment variables', () => {
      expect(provider.isConfigured()).toBe(true);
    });

    it('should not be configured without service key', () => {
      delete process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY;

      const unconfiguredProvider = new NetCashProvider();
      expect(unconfiguredProvider.isConfigured()).toBe(false);
    });

    it('should not be configured without PCI vault key', () => {
      delete process.env.NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY;

      const unconfiguredProvider = new NetCashProvider();
      expect(unconfiguredProvider.isConfigured()).toBe(false);
    });

    it('should load configuration from environment variables', () => {
      expect(provider.isConfigured()).toBe(true);
    });
  });

  // ============================================================================
  // Payment Initiation Tests
  // ============================================================================

  describe('initiate', () => {
    it('should successfully initiate payment with valid params', async () => {
      const result = await provider.initiate(mockPaymentInitiationParams);

      assertPaymentInitiationSuccess(result);
      expect(result.formData).toBeDefined();
      expect(result.formData?.m1).toBe('test-service-key');
      expect(result.formData?.m2).toBe('test-pci-vault-key');
    });

    it('should convert amount from Rands to cents', async () => {
      const result = await provider.initiate({
        ...mockPaymentInitiationParams,
        amount: 799.0 // Rands
      });

      expect(result.formData?.p4).toBe('79900'); // Cents
    });

    it('should generate unique transaction reference', async () => {
      const result1 = await provider.initiate(mockPaymentInitiationParams);
      const result2 = await provider.initiate(mockPaymentInitiationParams);

      expect(result1.transactionId).not.toBe(result2.transactionId);
      expect(result1.transactionId).toMatch(/^CT-ORDER-001-\d+$/);
      expect(result2.transactionId).toMatch(/^CT-ORDER-001-\d+$/);
    });

    it('should include customer email in form data', async () => {
      const result = await provider.initiate(mockPaymentInitiationParams);

      expect(result.formData?.CustomerEmailAddress).toBe('test@circletel.co.za');
    });

    it('should include customer phone in form data', async () => {
      const result = await provider.initiate(mockPaymentInitiationParams);

      expect(result.formData?.CustomerTelephoneNumber).toBe('+27821234567');
    });

    it('should include return URL in form data', async () => {
      const result = await provider.initiate(mockPaymentInitiationParams);

      expect(result.formData?.m9).toBe('https://circletel.co.za/payment/success');
    });

    it('should include cancel URL in form data', async () => {
      const result = await provider.initiate(mockPaymentInitiationParams);

      expect(result.formData?.m10).toBe('https://circletel.co.za/payment/cancelled');
    });

    it('should set Budget to N (no budget payments)', async () => {
      const result = await provider.initiate(mockPaymentInitiationParams);

      expect(result.formData?.Budget).toBe('N');
    });

    it('should return correct payment URL', async () => {
      const result = await provider.initiate(mockPaymentInitiationParams);

      expect(result.paymentUrl).toBe('https://paynow.netcash.co.za/site/paynow.aspx');
    });

    it('should fail if amount is missing', async () => {
      const result = await provider.initiate({
        ...mockPaymentInitiationParams,
        amount: 0
      } as any);

      assertPaymentInitiationFailure(result);
    });

    it('should fail if reference is missing', async () => {
      const result = await provider.initiate({
        ...mockPaymentInitiationParams,
        reference: ''
      });

      assertPaymentInitiationFailure(result);
    });

    it('should fail if customer email is missing', async () => {
      const result = await provider.initiate({
        ...mockPaymentInitiationParams,
        customerEmail: ''
      });

      assertPaymentInitiationFailure(result);
    });

    it('should handle metadata correctly', async () => {
      const metadata = {
        order_id: 'order-123',
        package_name: 'Fibre 100',
        custom_field: 'test'
      };

      const result = await provider.initiate({
        ...mockPaymentInitiationParams,
        metadata
      });

      expect(result.metadata).toEqual(metadata);
    });
  });

  // ============================================================================
  // Webhook Processing Tests
  // ============================================================================

  describe('processWebhook', () => {
    it('should successfully process payment completed webhook', async () => {
      const signature = generateMockSignature(
        JSON.stringify(mockNetCashWebhookPayload),
        'test-webhook-secret'
      );

      const result = await provider.processWebhook(mockNetCashWebhookPayload, signature);

      assertWebhookProcessingSuccess(result, 'completed');
      expect(result.amount).toBe(799.0); // Converted from cents
      expect(result.metadata?.payment_method).toBe('card');
    });

    it('should convert amount from cents to Rands', async () => {
      const signature = generateMockSignature(
        JSON.stringify(mockNetCashWebhookPayload),
        'test-webhook-secret'
      );

      const result = await provider.processWebhook(mockNetCashWebhookPayload, signature);

      expect(result.amount).toBe(799.0); // 79900 cents = 799.00 Rands
    });

    it('should extract payment method from webhook', async () => {
      const signature = generateMockSignature(
        JSON.stringify(mockNetCashWebhookPayload),
        'test-webhook-secret'
      );

      const result = await provider.processWebhook(mockNetCashWebhookPayload, signature);

      expect(result.metadata?.payment_method).toBe('card');
      expect(result.metadata?.card_type).toBe('Visa');
    });

    it('should handle failed payment webhook', async () => {
      const signature = generateMockSignature(
        JSON.stringify(mockNetCashWebhookPayloadFailed),
        'test-webhook-secret'
      );

      const result = await provider.processWebhook(mockNetCashWebhookPayloadFailed, signature);

      expect(result.success).toBe(true); // Webhook processed successfully
      expect(result.status).toBe('failed'); // But payment failed
      expect(result.failureReason).toBe('Insufficient funds');
    });

    it('should fail webhook with invalid signature', async () => {
      const result = await provider.processWebhook(mockNetCashWebhookPayload, 'invalid-signature');

      assertWebhookProcessingFailure(result);
      expect(result.error).toContain('Invalid webhook signature');
    });

    it('should set status to processing if Complete is not true', async () => {
      const incompletePayload = {
        ...mockNetCashWebhookPayload,
        Complete: 'false'
      };

      const signature = generateMockSignature(
        JSON.stringify(incompletePayload),
        'test-webhook-secret'
      );

      const result = await provider.processWebhook(incompletePayload, signature);

      expect(result.status).toBe('processing');
    });

    it('should handle cancelled payment', async () => {
      const cancelledPayload = {
        ...mockNetCashWebhookPayload,
        Result: 'Cancelled'
      };

      const signature = generateMockSignature(
        JSON.stringify(cancelledPayload),
        'test-webhook-secret'
      );

      const result = await provider.processWebhook(cancelledPayload, signature);

      expect(result.status).toBe('cancelled');
      expect(result.failureReason).toBe('Payment cancelled by user');
    });

    it('should include transaction trace in metadata', async () => {
      const signature = generateMockSignature(
        JSON.stringify(mockNetCashWebhookPayload),
        'test-webhook-secret'
      );

      const result = await provider.processWebhook(mockNetCashWebhookPayload, signature);

      expect(result.metadata?.request_trace).toBe('TRACE-123');
    });
  });

  // ============================================================================
  // Signature Verification Tests
  // ============================================================================

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const payload = JSON.stringify(mockNetCashWebhookPayload);
      const signature = generateMockSignature(payload, 'test-webhook-secret');

      const isValid = provider.verifySignature(payload, signature);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify(mockNetCashWebhookPayload);

      const isValid = provider.verifySignature(payload, 'invalid-signature');

      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const payload = JSON.stringify(mockNetCashWebhookPayload);
      const signature = generateMockSignature(payload, 'wrong-secret');

      const isValid = provider.verifySignature(payload, signature);

      expect(isValid).toBe(false);
    });

    it('should handle missing webhook secret gracefully', () => {
      delete process.env.NETCASH_WEBHOOK_SECRET;

      const testProvider = new NetCashProvider();
      const payload = JSON.stringify(mockNetCashWebhookPayload);

      // Should skip verification if secret not configured (development mode)
      const isValid = testProvider.verifySignature(payload, 'any-signature');

      expect(isValid).toBe(true);
    });
  });

  // ============================================================================
  // Status Query Tests
  // ============================================================================

  describe('getStatus', () => {
    it('should return pending status (NetCash does not support real-time queries)', async () => {
      const result = await provider.getStatus('CT-ORDER-001-1234567890');

      expect(result.status).toBe('pending');
      expect(result.transactionId).toBe('CT-ORDER-001-1234567890');
      expect(result.metadata?.note).toBeDefined();
    });

    it('should include informational message about lack of real-time support', async () => {
      const result = await provider.getStatus('CT-ORDER-001-1234567890');

      expect(result.metadata?.note).toContain('does not support real-time status queries');
    });
  });

  // ============================================================================
  // Refund Tests
  // ============================================================================

  describe('refund', () => {
    it('should return error indicating manual refunds required', async () => {
      const result = await provider.refund({
        transactionId: 'CT-ORDER-001-1234567890',
        amount: 799.0,
        reason: 'Customer requested refund',
        requestedBy: 'admin-user-123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('manual');
      expect(result.metadata?.instruction).toBeDefined();
    });

    it('should include refund details in metadata', async () => {
      const result = await provider.refund({
        transactionId: 'CT-ORDER-001-1234567890',
        amount: 799.0,
        reason: 'Customer requested refund',
        requestedBy: 'admin-user-123'
      });

      expect(result.metadata?.transactionId).toBe('CT-ORDER-001-1234567890');
      expect(result.metadata?.amount).toBe(799.0);
      expect(result.metadata?.reason).toBe('Customer requested refund');
    });
  });

  // ============================================================================
  // Capabilities Tests
  // ============================================================================

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();

      assertProviderCapabilities(capabilities, {
        refunds: false, // Manual only
        partial_refunds: false,
        recurring_payments: true, // eMandate support
        status_queries: false, // No real-time API
        webhooks: true,
        supports_3d_secure: true
      });
    });

    it('should include all supported payment methods', () => {
      const capabilities = provider.getCapabilities();

      const expectedMethods = [
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

      expectedMethods.forEach((method) => {
        expect(capabilities.payment_methods).toContain(method);
      });
    });
  });

  // ============================================================================
  // Health Check Tests
  // ============================================================================

  describe('healthCheck', () => {
    it('should return health check result', async () => {
      const result = await provider.healthCheck();

      expect(result.provider).toBe('netcash');
      expect(result).toHaveProperty('healthy');
      expect(result).toHaveProperty('checked_at');
      expect(result.checked_at).toBeInstanceOf(Date);
    });

    it('should include response time', async () => {
      const result = await provider.healthCheck();

      expect(result.response_time_ms).toBeDefined();
      expect(typeof result.response_time_ms).toBe('number');
    });

    it('should handle connection errors gracefully', async () => {
      // This test may fail due to network issues, but should not throw
      const result = await provider.healthCheck();

      expect(result).toHaveProperty('healthy');
    });
  });

  // ============================================================================
  // Helper Method Tests
  // ============================================================================

  describe('Helper Methods', () => {
    it('should generate payment URL with query parameters', () => {
      const formData = {
        m1: 'test-key',
        m2: 'test-vault',
        p2: 'CT-TEST-123',
        p3: 'Test',
        p4: '79900',
        Budget: 'N',
        CustomerEmailAddress: 'test@test.com',
        CustomerTelephoneNumber: '',
        m9: 'https://return.url',
        m10: 'https://cancel.url',
        m4: 'CT-TEST-123'
      };

      const url = provider.generatePaymentUrlWithParams(formData);

      expect(url).toContain('https://paynow.netcash.co.za/site/paynow.aspx?');
      expect(url).toContain('m1=test-key');
      expect(url).toContain('p4=79900');
    });

    it('should return payment gateway URL', () => {
      const gatewayUrl = provider.getPaymentGatewayUrl();

      expect(gatewayUrl).toBe('https://paynow.netcash.co.za/site/paynow.aspx');
    });
  });

  // ============================================================================
  // Edge Cases & Error Handling
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very large amounts', async () => {
      const result = await provider.initiate({
        ...mockPaymentInitiationParams,
        amount: 999999.99
      });

      expect(result.formData?.p4).toBe('99999999'); // Cents
    });

    it('should handle fractional cents correctly', async () => {
      const result = await provider.initiate({
        ...mockPaymentInitiationParams,
        amount: 799.995 // Should round to 800.00
      });

      expect(result.formData?.p4).toBe('80000'); // Rounded
    });

    it('should handle missing optional fields', async () => {
      const minimalParams = {
        amount: 799.0,
        currency: 'ZAR',
        reference: 'ORDER-001',
        customerEmail: 'test@test.com'
      };

      const result = await provider.initiate(minimalParams);

      assertPaymentInitiationSuccess(result);
    });

    it('should sanitize metadata for storage', async () => {
      const metadata = {
        valid_string: 'test',
        valid_number: 123,
        valid_boolean: true,
        // These should be sanitized/removed:
        function_field: () => {},
        undefined_field: undefined
      };

      const result = await provider.initiate({
        ...mockPaymentInitiationParams,
        metadata
      });

      expect(result.metadata?.valid_string).toBe('test');
      expect(result.metadata?.valid_number).toBe(123);
      expect(result.metadata?.function_field).toBeUndefined();
    });
  });
});
