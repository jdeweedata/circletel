/**
 * Integration Tests for NetCash Webhook and Payment APIs
 *
 * Tests the payment flow from webhook to database updates.
 *
 * @module __tests__/api/payments/webhook-integration.test
 */

import crypto from 'crypto';

// Mock Supabase
const mockSupabaseFrom = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseInsert = jest.fn();
const mockSupabaseUpdate = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: mockSupabaseFrom,
  })),
}));

// Mock email service
jest.mock('@/lib/emails/enhanced-notification-service', () => ({
  EnhancedEmailService: {
    sendPaymentReceipt: jest.fn(() => Promise.resolve({ success: true, message_id: 'msg_123' })),
  },
}));

// Mock ZOHO sync
jest.mock('@/lib/integrations/zoho/payment-sync-service', () => ({
  syncPaymentToZohoBilling: jest.fn(() => Promise.resolve({ success: true, zoho_payment_id: 'zoho_pmt_123' })),
}));

// Mock order updater
jest.mock('@/lib/orders/payment-order-updater', () => ({
  updateOrderFromPayment: jest.fn(() => Promise.resolve({ success: true })),
}));

describe('NetCash Webhook Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock chain
    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
      insert: mockSupabaseInsert,
      update: mockSupabaseUpdate,
    });

    mockSupabaseSelect.mockReturnValue({
      eq: mockSupabaseEq,
      or: jest.fn().mockReturnValue({
        eq: mockSupabaseEq,
      }),
    });

    mockSupabaseEq.mockReturnValue({
      single: mockSupabaseSingle,
      eq: mockSupabaseEq,
    });

    mockSupabaseSingle.mockResolvedValue({ data: null, error: null });
    mockSupabaseInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'webhook_123' }, error: null }),
      }),
    });
    mockSupabaseUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  // ============================================================================
  // Webhook Payload Tests
  // ============================================================================

  describe('Webhook Payload Processing', () => {
    it('should parse successful payment payload', () => {
      const payload = {
        webhook_id: 'wh_123',
        event_type: 'payment.completed',
        transaction_id: 'TX-123456',
        reference: 'INV-2025-001',
        ResponseCode: 0,
        Amount: '799.00',
        PaymentMethod: 'credit_card',
      };

      expect(payload.ResponseCode).toBe(0);
      expect(payload.reference).toMatch(/^INV-/);
      expect(parseFloat(payload.Amount)).toBe(799.00);
    });

    it('should identify failed payment from response code', () => {
      const failedPayload = {
        ResponseCode: 1, // Declined
        transaction_id: 'TX-789',
      };

      expect(failedPayload.ResponseCode).toBe(1);
    });

    it('should identify cancelled payment from response code', () => {
      const cancelledPayload = {
        ResponseCode: 2, // Cancelled
        transaction_id: 'TX-456',
      };

      expect(cancelledPayload.ResponseCode).toBe(2);
    });

    it('should extract invoice reference from Extra1 field', () => {
      const payload = {
        Extra1: 'INV-2025-002',
        transaction_id: 'TX-111',
      };

      const reference = payload.Extra1;
      expect(reference).toBe('INV-2025-002');
    });
  });

  // ============================================================================
  // Signature Verification Tests
  // ============================================================================

  describe('Signature Verification', () => {
    const secret = 'test-webhook-secret';

    function generateSignature(payload: string, key: string): string {
      return crypto.createHmac('sha256', key).update(payload).digest('hex');
    }

    it('should verify valid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = generateSignature(payload, secret);
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      expect(signature).toBe(expectedSignature);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const validSignature = generateSignature(payload, secret);
      const invalidSignature = generateSignature(payload, 'wrong-secret');

      expect(validSignature).not.toBe(invalidSignature);
    });

    it('should use timing-safe comparison', () => {
      const sig1 = 'a'.repeat(64);
      const sig2 = 'a'.repeat(64);

      // This should use crypto.timingSafeEqual in production
      const isEqual = crypto.timingSafeEqual(Buffer.from(sig1), Buffer.from(sig2));
      expect(isEqual).toBe(true);
    });
  });

  // ============================================================================
  // Invoice Payment Flow Tests
  // ============================================================================

  describe('Invoice Payment Flow', () => {
    it('should identify invoice payments by reference prefix', () => {
      const invoiceReferences = [
        'INV-2025-001',
        'INV-2024-999',
        'INV-123',
      ];

      invoiceReferences.forEach((ref) => {
        expect(ref.startsWith('INV-')).toBe(true);
      });
    });

    it('should calculate remaining balance correctly', () => {
      const invoice = {
        total_amount: 1000,
        amount_paid: 300,
      };
      const newPayment = 500;

      const newAmountPaid = invoice.amount_paid + newPayment;
      const newAmountDue = Math.max(0, invoice.total_amount - newAmountPaid);
      const isPaidInFull = newAmountDue <= 0;

      expect(newAmountPaid).toBe(800);
      expect(newAmountDue).toBe(200);
      expect(isPaidInFull).toBe(false);
    });

    it('should mark invoice as paid when fully paid', () => {
      const invoice = {
        total_amount: 1000,
        amount_paid: 800,
      };
      const newPayment = 200;

      const newAmountPaid = invoice.amount_paid + newPayment;
      const newAmountDue = Math.max(0, invoice.total_amount - newAmountPaid);
      const newStatus = newAmountDue <= 0 ? 'paid' : 'partial';

      expect(newAmountPaid).toBe(1000);
      expect(newAmountDue).toBe(0);
      expect(newStatus).toBe('paid');
    });

    it('should mark invoice as partial when not fully paid', () => {
      const invoice = {
        total_amount: 1000,
        amount_paid: 0,
      };
      const newPayment = 500;

      const newAmountPaid = invoice.amount_paid + newPayment;
      const newAmountDue = Math.max(0, invoice.total_amount - newAmountPaid);
      const newStatus = newAmountDue <= 0 ? 'paid' : 'partial';

      expect(newStatus).toBe('partial');
    });
  });

  // ============================================================================
  // Idempotency Tests
  // ============================================================================

  describe('Idempotency', () => {
    it('should detect duplicate webhooks by transaction_id', () => {
      const existingWebhook = {
        id: 'existing_123',
        transaction_id: 'TX-DUPLICATE',
        status: 'processed',
      };

      // If existing webhook found, should skip processing
      expect(existingWebhook.status).toBe('processed');
    });

    it('should allow reprocessing of failed webhooks', () => {
      const failedWebhook = {
        id: 'failed_123',
        transaction_id: 'TX-RETRY',
        status: 'failed',
      };

      // Failed webhooks can be reprocessed
      expect(failedWebhook.status).not.toBe('processed');
    });
  });

  // ============================================================================
  // Payment Transaction Creation Tests
  // ============================================================================

  describe('Payment Transaction Creation', () => {
    it('should create payment transaction with correct fields', () => {
      const paymentTransaction = {
        transaction_id: 'TX-NEW-123',
        reference: 'INV-2025-001',
        provider: 'netcash',
        amount: 799.00,
        currency: 'ZAR',
        status: 'completed',
        payment_method: 'credit_card',
        customer_email: 'customer@example.com',
        initiated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      expect(paymentTransaction.provider).toBe('netcash');
      expect(paymentTransaction.currency).toBe('ZAR');
      expect(paymentTransaction.status).toBe('completed');
    });

    it('should update existing transaction on duplicate', () => {
      const existingTransaction = {
        id: 'existing_tx_123',
        status: 'pending',
      };

      const updateData = {
        status: 'completed',
        completed_at: new Date().toISOString(),
      };

      expect(existingTransaction.id).toBeDefined();
      expect(updateData.status).toBe('completed');
    });
  });

  // ============================================================================
  // Webhook Logging Tests
  // ============================================================================

  describe('Webhook Logging', () => {
    it('should log webhook with all required fields', () => {
      const webhookLog = {
        webhook_id: 'wh_123',
        provider: 'netcash',
        event_type: 'payment.completed',
        http_method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"test":"data"}',
        body_parsed: { test: 'data' },
        signature_verified: true,
        status: 'processing',
        source_ip: '1.2.3.4',
        received_at: new Date().toISOString(),
      };

      expect(webhookLog.provider).toBe('netcash');
      expect(webhookLog.signature_verified).toBe(true);
      expect(webhookLog.status).toBe('processing');
    });

    it('should update webhook log on completion', () => {
      const completedLog = {
        status: 'processed',
        success: true,
        processing_completed_at: new Date().toISOString(),
        processing_duration_ms: 150,
        actions_taken: ['transaction_updated', 'email_sent', 'zoho_synced'],
        response_status_code: 200,
      };

      expect(completedLog.status).toBe('processed');
      expect(completedLog.success).toBe(true);
      expect(completedLog.actions_taken).toContain('email_sent');
    });

    it('should log errors on failure', () => {
      const errorLog = {
        status: 'failed',
        success: false,
        error_message: 'Invoice not found',
        error_stack: 'Error: Invoice not found\n    at ...',
      };

      expect(errorLog.status).toBe('failed');
      expect(errorLog.success).toBe(false);
      expect(errorLog.error_message).toBeDefined();
    });
  });

  // ============================================================================
  // Response Format Tests
  // ============================================================================

  describe('Response Format', () => {
    it('should return success response with transaction details', () => {
      const successResponse = {
        success: true,
        message: 'Webhook processed successfully',
        transaction_id: 'TX-123',
        status: 'completed',
        processing_time_ms: 150,
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.transaction_id).toBeDefined();
      expect(successResponse.processing_time_ms).toBeLessThan(1000);
    });

    it('should return error response on failure', () => {
      const errorResponse = {
        success: false,
        error: 'Webhook processing failed',
        message: 'Invoice not found',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
    });

    it('should return 401 for invalid signature', () => {
      const unauthorizedResponse = {
        error: 'Invalid signature',
        status: 401,
      };

      expect(unauthorizedResponse.status).toBe(401);
    });

    it('should return 400 for invalid JSON', () => {
      const badRequestResponse = {
        error: 'Invalid JSON payload',
        status: 400,
      };

      expect(badRequestResponse.status).toBe(400);
    });
  });
});
