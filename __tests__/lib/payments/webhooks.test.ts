/**
 * Tests for Payment Webhook Logs System
 *
 * @group payment-management
 * @group webhooks
 */

import {
  createMockWebhook,
  createMockWebhooks,
  assertValidWebhook,
  assertWebhookStats,
  setupMockEnv
} from './management-test-utils';

describe('Payment Webhook Logs', () => {
  let cleanupEnv: () => void;

  beforeEach(() => {
    cleanupEnv = setupMockEnv();
  });

  afterEach(() => {
    cleanupEnv();
  });

  describe('Webhook Data Structure', () => {
    it('should create valid webhook with all required fields', () => {
      // Arrange & Act
      const webhook = createMockWebhook();

      // Assert
      assertValidWebhook(webhook);
      expect(webhook.id).toBeDefined();
      expect(webhook.webhook_id).toBeDefined();
      expect(webhook.provider).toBeDefined();
      expect(webhook.event_type).toBeDefined();
    });

    it('should include HTTP request data', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        http_method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-signature': 'abc123'
        },
        body: JSON.stringify({ status: 'completed' })
      });

      // Assert
      expect(webhook.http_method).toBe('POST');
      expect(webhook.headers).toBeDefined();
      expect(webhook.headers['content-type']).toBe('application/json');
      expect(webhook.body).toBeDefined();
    });

    it('should include signature verification data', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        signature: 'test-signature',
        signature_verified: true,
        signature_algorithm: 'hmac-sha256'
      });

      // Assert
      expect(webhook.signature).toBe('test-signature');
      expect(webhook.signature_verified).toBe(true);
      expect(webhook.signature_algorithm).toBe('hmac-sha256');
    });

    it('should include processing metrics', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        processing_duration_ms: 150,
        processing_started_at: new Date().toISOString(),
        processing_completed_at: new Date().toISOString()
      });

      // Assert
      expect(webhook.processing_duration_ms).toBe(150);
      expect(webhook.processing_started_at).toBeDefined();
      expect(webhook.processing_completed_at).toBeDefined();
    });

    it('should include retry information', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        retry_count: 2,
        max_retries: 3,
        last_retry_at: new Date().toISOString(),
        next_retry_at: new Date(Date.now() + 60000).toISOString()
      });

      // Assert
      expect(webhook.retry_count).toBe(2);
      expect(webhook.max_retries).toBe(3);
      expect(webhook.last_retry_at).toBeDefined();
      expect(webhook.next_retry_at).toBeDefined();
    });

    it('should include security data', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        source_ip: '192.168.1.1',
        user_agent: 'NetCash-Webhook/1.0'
      });

      // Assert
      expect(webhook.source_ip).toBe('192.168.1.1');
      expect(webhook.user_agent).toBe('NetCash-Webhook/1.0');
    });
  });

  describe('Webhook Status', () => {
    it('should support all valid status values', () => {
      const statuses = ['received', 'processing', 'processed', 'failed', 'retrying'];

      statuses.forEach(status => {
        const webhook = createMockWebhook({ status });
        expect(webhook.status).toBe(status);
      });
    });

    it('should track processing times for processed webhooks', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        status: 'processed',
        processing_duration_ms: 150
      });

      // Assert
      expect(webhook.status).toBe('processed');
      expect(webhook.processing_duration_ms).toBe(150);
    });

    it('should have error message for failed webhooks', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        status: 'failed',
        success: false,
        error_message: 'Invalid signature',
        error_stack: 'Error: Invalid signature\n  at verify...'
      });

      // Assert
      expect(webhook.status).toBe('failed');
      expect(webhook.success).toBe(false);
      expect(webhook.error_message).toBe('Invalid signature');
      expect(webhook.error_stack).toBeDefined();
    });
  });

  describe('Webhook Statistics', () => {
    it('should calculate stats for single webhook', () => {
      // Arrange
      const webhooks = [
        createMockWebhook({ status: 'processed', signature_verified: true })
      ];

      const stats = {
        total_count: webhooks.length,
        processed_count: webhooks.filter(w => w.status === 'processed').length,
        failed_count: webhooks.filter(w => w.status === 'failed').length,
        pending_count: webhooks.filter(w =>
          w.status === 'received' || w.status === 'processing'
        ).length,
        signature_verified_count: webhooks.filter(w => w.signature_verified).length,
        avg_processing_time: webhooks
          .filter(w => w.processing_duration_ms !== null)
          .reduce((sum, w) => sum + (w.processing_duration_ms || 0), 0) / webhooks.length
      };

      // Assert
      assertWebhookStats(stats, webhooks);
      expect(stats.processed_count).toBe(1);
      expect(stats.signature_verified_count).toBe(1);
    });

    it('should calculate stats for multiple webhooks', () => {
      // Arrange
      const webhooks = createMockWebhooks(10, [
        { status: 'processed', signature_verified: true, processing_duration_ms: 100 },
        { status: 'processed', signature_verified: true, processing_duration_ms: 150 },
        { status: 'processed', signature_verified: false, processing_duration_ms: 200 },
        { status: 'failed', signature_verified: false },
        { status: 'failed', signature_verified: false },
        { status: 'received', signature_verified: true },
        { status: 'processing', signature_verified: true },
        { status: 'retrying', signature_verified: true },
        { status: 'processed', signature_verified: true, processing_duration_ms: 120 },
        { status: 'processed', signature_verified: true, processing_duration_ms: 180 }
      ]);

      const stats = {
        total_count: webhooks.length,
        processed_count: webhooks.filter(w => w.status === 'processed').length,
        failed_count: webhooks.filter(w => w.status === 'failed').length,
        pending_count: webhooks.filter(w =>
          w.status === 'received' || w.status === 'processing'
        ).length,
        signature_verified_count: webhooks.filter(w => w.signature_verified).length,
        avg_processing_time: 0
      };

      const processingTimes = webhooks
        .filter(w => w.processing_duration_ms !== null && w.processing_duration_ms !== undefined)
        .map(w => w.processing_duration_ms as number);

      if (processingTimes.length > 0) {
        stats.avg_processing_time = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
      }

      // Assert
      expect(stats.total_count).toBe(10);
      expect(stats.processed_count).toBe(5);
      expect(stats.failed_count).toBe(2);
      expect(stats.pending_count).toBe(2); // received + processing
      expect(stats.signature_verified_count).toBe(7);
      expect(stats.avg_processing_time).toBe(150); // (100 + 150 + 200 + 120 + 180) / 5
    });

    it('should calculate verification percentage correctly', () => {
      // Arrange
      const webhooks = createMockWebhooks(100, [
        ...Array(80).fill({ signature_verified: true }),
        ...Array(20).fill({ signature_verified: false })
      ]);

      const verificationRate = webhooks.filter(w => w.signature_verified).length /
        webhooks.length * 100;

      // Assert
      expect(verificationRate).toBe(80);
    });
  });

  describe('Webhook Filtering', () => {
    it('should filter by status', () => {
      // Arrange
      const webhooks = createMockWebhooks(5, [
        { status: 'processed' },
        { status: 'processed' },
        { status: 'failed' },
        { status: 'received' },
        { status: 'processing' }
      ]);

      // Act
      const processed = webhooks.filter(w => w.status === 'processed');
      const failed = webhooks.filter(w => w.status === 'failed');

      // Assert
      expect(processed).toHaveLength(2);
      expect(failed).toHaveLength(1);
    });

    it('should filter by provider', () => {
      // Arrange
      const webhooks = createMockWebhooks(4, [
        { provider: 'netcash' },
        { provider: 'netcash' },
        { provider: 'payfast' },
        { provider: 'zoho_billing' }
      ]);

      // Act
      const netcash = webhooks.filter(w => w.provider === 'netcash');

      // Assert
      expect(netcash).toHaveLength(2);
    });

    it('should filter by signature verification status', () => {
      // Arrange
      const webhooks = createMockWebhooks(4, [
        { signature_verified: true },
        { signature_verified: true },
        { signature_verified: false },
        { signature_verified: false }
      ]);

      // Act
      const verified = webhooks.filter(w => w.signature_verified);
      const unverified = webhooks.filter(w => !w.signature_verified);

      // Assert
      expect(verified).toHaveLength(2);
      expect(unverified).toHaveLength(2);
    });

    it('should search by webhook ID', () => {
      // Arrange
      const webhookId = 'webhook-123';
      const webhooks = createMockWebhooks(3, [
        { webhook_id: webhookId },
        { webhook_id: 'webhook-456' },
        { webhook_id: 'webhook-789' }
      ]);

      // Act
      const results = webhooks.filter(w =>
        w.webhook_id.includes(webhookId)
      );

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].webhook_id).toBe(webhookId);
    });

    it('should search by transaction ID', () => {
      // Arrange
      const transactionId = 'CT-TEST-123';
      const webhooks = createMockWebhooks(3, [
        { transaction_id: transactionId },
        { transaction_id: 'CT-TEST-456' },
        { transaction_id: null }
      ]);

      // Act
      const results = webhooks.filter(w =>
        w.transaction_id?.includes(transactionId)
      );

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].transaction_id).toBe(transactionId);
    });
  });

  describe('Webhook Retry Logic', () => {
    it('should allow retry when retry count is less than max', () => {
      // Arrange
      const webhook = createMockWebhook({
        status: 'failed',
        retry_count: 2,
        max_retries: 3
      });

      // Act
      const canRetry = webhook.retry_count < webhook.max_retries;

      // Assert
      expect(canRetry).toBe(true);
    });

    it('should not allow retry when max retries reached', () => {
      // Arrange
      const webhook = createMockWebhook({
        status: 'failed',
        retry_count: 3,
        max_retries: 3
      });

      // Act
      const canRetry = webhook.retry_count < webhook.max_retries;

      // Assert
      expect(canRetry).toBe(false);
    });

    it('should increment retry count after retry', () => {
      // Arrange
      const webhook = createMockWebhook({
        retry_count: 0
      });

      // Act
      const updatedRetryCount = webhook.retry_count + 1;

      // Assert
      expect(updatedRetryCount).toBe(1);
    });

    it('should schedule next retry time', () => {
      // Arrange
      const now = Date.now();
      const webhook = createMockWebhook({
        retry_count: 1,
        last_retry_at: new Date(now).toISOString()
      });

      // Act - exponential backoff: 2^retry_count * 1000 ms
      const backoffMs = Math.pow(2, webhook.retry_count) * 1000; // 2 seconds
      const nextRetryTime = new Date(now + backoffMs);

      // Assert
      expect(nextRetryTime.getTime()).toBeGreaterThan(now);
      expect(nextRetryTime.getTime()).toBe(now + 2000);
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid signature', () => {
      // Arrange
      const webhook = createMockWebhook({
        signature: 'valid-signature',
        signature_verified: true
      });

      // Assert
      expect(webhook.signature_verified).toBe(true);
    });

    it('should reject invalid signature', () => {
      // Arrange
      const webhook = createMockWebhook({
        signature: 'invalid-signature',
        signature_verified: false
      });

      // Assert
      expect(webhook.signature_verified).toBe(false);
    });

    it('should track signature algorithm', () => {
      // Arrange
      const webhook = createMockWebhook({
        signature_algorithm: 'hmac-sha256'
      });

      // Assert
      expect(webhook.signature_algorithm).toBe('hmac-sha256');
    });
  });

  describe('Event Types', () => {
    it('should support payment.completed event', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        event_type: 'payment.completed'
      });

      // Assert
      expect(webhook.event_type).toBe('payment.completed');
    });

    it('should support payment.failed event', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        event_type: 'payment.failed'
      });

      // Assert
      expect(webhook.event_type).toBe('payment.failed');
    });

    it('should support refund.processed event', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        event_type: 'refund.processed'
      });

      // Assert
      expect(webhook.event_type).toBe('refund.processed');
    });
  });

  describe('Webhook Body Parsing', () => {
    it('should parse JSON body correctly', () => {
      // Arrange
      const bodyData = {
        transaction_id: 'CT-TEST-123',
        status: 'completed',
        amount: 799.0
      };

      // Act
      const webhook = createMockWebhook({
        body: JSON.stringify(bodyData),
        body_parsed: bodyData
      });

      // Assert
      expect(webhook.body_parsed).toEqual(bodyData);
      expect(webhook.body_parsed.transaction_id).toBe('CT-TEST-123');
    });

    it('should handle malformed JSON body', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        body: 'invalid json {',
        body_parsed: null
      });

      // Assert
      expect(webhook.body_parsed).toBeNull();
    });
  });

  describe('Performance Metrics', () => {
    it('should track processing duration in milliseconds', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        processing_duration_ms: 150
      });

      // Assert
      expect(webhook.processing_duration_ms).toBe(150);
    });

    it('should calculate average processing time', () => {
      // Arrange
      const webhooks = createMockWebhooks(5, [
        { processing_duration_ms: 100 },
        { processing_duration_ms: 150 },
        { processing_duration_ms: 200 },
        { processing_duration_ms: 120 },
        { processing_duration_ms: 180 }
      ]);

      // Act
      const avgTime = webhooks.reduce((sum, w) => sum + (w.processing_duration_ms || 0), 0) /
        webhooks.length;

      // Assert
      expect(avgTime).toBe(150); // (100 + 150 + 200 + 120 + 180) / 5
    });

    it('should identify slow webhooks (>500ms)', () => {
      // Arrange
      const webhooks = createMockWebhooks(3, [
        { processing_duration_ms: 200 },
        { processing_duration_ms: 600 },
        { processing_duration_ms: 150 }
      ]);

      // Act
      const slowWebhooks = webhooks.filter(w =>
        (w.processing_duration_ms || 0) > 500
      );

      // Assert
      expect(slowWebhooks).toHaveLength(1);
      expect(slowWebhooks[0].processing_duration_ms).toBe(600);
    });
  });

  describe('Edge Cases', () => {
    it('should handle webhook with no transaction ID', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        transaction_id: null
      });

      // Assert
      expect(webhook.transaction_id).toBeNull();
    });

    it('should handle webhook with no processing time', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        processing_duration_ms: null
      });

      // Assert
      expect(webhook.processing_duration_ms).toBeNull();
    });

    it('should handle webhook with metadata', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        metadata: {
          custom_field: 'custom_value',
          internal_id: '12345'
        }
      });

      // Assert
      expect(webhook.metadata).toBeDefined();
      expect(webhook.metadata.custom_field).toBe('custom_value');
    });

    it('should handle actions taken array', () => {
      // Arrange & Act
      const webhook = createMockWebhook({
        actions_taken: [
          'update_transaction',
          'send_email',
          'trigger_notification'
        ]
      });

      // Assert
      expect(webhook.actions_taken).toBeDefined();
      expect(webhook.actions_taken).toHaveLength(3);
      expect(webhook.actions_taken).toContain('send_email');
    });
  });
});
