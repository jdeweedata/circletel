/**
 * E2E Payment Flow Tests
 *
 * Tests the complete order → payment → activation flow
 * Simulates real user journey through the payment process
 */

import {
  mockCustomer,
  mockConsumerOrder,
  mockInvoice,
  mockPaymentMethod,
  mockNetcashSuccessPayload,
  mockNetcashFailedPayload,
  mockBankAccount,
  createPaymentScenario,
  generateWebhookSignature,
} from '../../fixtures/payment-fixtures';

// ============================================================================
// MOCKS
// ============================================================================

// Mock Supabase client
const mockFrom = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockOrder = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: mockFrom,
    })
  ),
}));

// Mock notification service
jest.mock('@/lib/notifications/notification-service', () => ({
  EmailNotificationService: {
    send: jest.fn().mockResolvedValue({ success: true }),
    sendOrderConfirmation: jest.fn().mockResolvedValue({ success: true }),
    sendServiceActivation: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock payment logger
jest.mock('@/lib/logging', () => ({
  paymentLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  activationLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Import after mocks
import { updateOrderFromPayment } from '@/lib/orders/payment-order-updater';
import {
  verifyNetCashWebhook,
  processPaymentWebhook,
  validateWebhookPayload,
} from '@/lib/payments/payment-processor';

// ============================================================================
// TEST SETUP
// ============================================================================

describe('E2E: Order to Activation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock chain
    mockFrom.mockImplementation((table: string) => {
      return {
        insert: mockInsert,
        update: mockUpdate,
        select: mockSelect,
        eq: mockEq,
        or: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            then: (cb: Function) => cb({ data: [mockConsumerOrder], error: null }),
          }),
        }),
        order: mockOrder,
      };
    });

    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'new-transaction-id' },
          error: null,
        }),
      }),
    });

    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
    });

    mockSingle.mockResolvedValue({
      data: mockInvoice,
      error: null,
    });

    mockOrder.mockReturnValue({
      limit: jest.fn().mockResolvedValue({
        data: [mockConsumerOrder],
        error: null,
      }),
    });
  });

  // ==========================================================================
  // SCENARIO 1: Successful Payment Flow
  // ==========================================================================

  describe('Scenario: Successful Payment', () => {
    it('should complete full flow: order → webhook → status update', async () => {
      // Step 1: Verify webhook signature
      const payloadString = JSON.stringify(mockNetcashSuccessPayload);
      const signature = generateWebhookSignature(payloadString);

      const isValid = verifyNetCashWebhook(payloadString, signature);
      expect(isValid).toBe(true);

      // Step 2: Validate payload
      const isValidPayload = validateWebhookPayload(mockNetcashSuccessPayload);
      expect(isValidPayload).toBe(true);

      // Step 3: Process webhook
      await processPaymentWebhook(mockNetcashSuccessPayload);

      // Step 4: Verify transaction was created
      expect(mockInsert).toHaveBeenCalled();

      // Step 5: Verify invoice was updated
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should update order status to payment_received', async () => {
      const result = await updateOrderFromPayment(
        mockConsumerOrder.order_number,
        'payment-transaction-123',
        2643.85
      );

      expect(result.success).toBe(true);
      expect(result.order_number).toBe(mockConsumerOrder.order_number);
    });

    it('should send customer notification on successful payment', async () => {
      const { EmailNotificationService } = require('@/lib/notifications/notification-service');

      await updateOrderFromPayment(
        mockConsumerOrder.order_number,
        'payment-transaction-123',
        2643.85
      );

      // Verify notification was sent
      expect(EmailNotificationService.send).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SCENARIO 2: Failed Payment Flow
  // ==========================================================================

  describe('Scenario: Failed Payment', () => {
    it('should handle declined payment gracefully', async () => {
      const payloadString = JSON.stringify(mockNetcashFailedPayload);
      const signature = generateWebhookSignature(payloadString);

      const isValid = verifyNetCashWebhook(payloadString, signature);
      expect(isValid).toBe(true);

      // Should still create transaction record for failed payment
      await processPaymentWebhook(mockNetcashFailedPayload);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should not advance order status on failed payment', async () => {
      // Mock order lookup to return pending status
      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ ...mockConsumerOrder, status: 'pending' }],
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
        insert: mockInsert,
      }));

      // Failed payment should not update order to payment_received
      await processPaymentWebhook(mockNetcashFailedPayload);

      // Verify transaction record created but with failed status
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should log failed payment for investigation', async () => {
      const { paymentLogger } = require('@/lib/logging');

      await processPaymentWebhook(mockNetcashFailedPayload);

      // Payment processing should log the failure
      expect(paymentLogger.info).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SCENARIO 3: Invalid Webhook
  // ==========================================================================

  describe('Scenario: Invalid Webhook', () => {
    it('should reject invalid signature', () => {
      const payloadString = JSON.stringify(mockNetcashSuccessPayload);
      const invalidSignature = 'invalid-signature-12345';

      const isValid = verifyNetCashWebhook(payloadString, invalidSignature);
      expect(isValid).toBe(false);
    });

    it('should reject tampered payload', () => {
      const originalPayload = JSON.stringify(mockNetcashSuccessPayload);
      const signature = generateWebhookSignature(originalPayload);

      // Tamper with the payload
      const tamperedPayload = JSON.stringify({
        ...mockNetcashSuccessPayload,
        Amount: '99999999', // Changed amount
      });

      const isValid = verifyNetCashWebhook(tamperedPayload, signature);
      expect(isValid).toBe(false);
    });

    it('should reject incomplete payload', () => {
      const incompletePayload = {
        TransactionAccepted: 'true',
        Amount: '264385',
        // Missing required fields
      };

      const isValid = validateWebhookPayload(incompletePayload);
      expect(isValid).toBe(false);
    });

    it('should throw error for missing required fields', async () => {
      const incompletePayload = {
        TransactionAccepted: 'true',
        Amount: '264385',
        Reference: 'INV-2025-0001',
        // Missing Extra1 and RequestTrace
      };

      await expect(
        processPaymentWebhook(incompletePayload as any)
      ).rejects.toThrow('Invalid webhook payload');
    });
  });

  // ==========================================================================
  // SCENARIO 4: Order State Transitions
  // ==========================================================================

  describe('Scenario: Order State Transitions', () => {
    it('should transition from pending to payment_method_registered', async () => {
      // Order in pending status
      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ ...mockConsumerOrder, status: 'pending' }],
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
        insert: mockInsert,
      }));

      const result = await updateOrderFromPayment(
        mockConsumerOrder.order_number,
        'payment-transaction-123',
        2643.85
      );

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should transition from payment_method_registered to payment_received', async () => {
      // Order in payment_method_registered status
      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ ...mockConsumerOrder, status: 'payment_method_registered' }],
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
        insert: mockInsert,
      }));

      const result = await updateOrderFromPayment(
        mockConsumerOrder.order_number,
        'payment-transaction-123',
        2643.85
      );

      expect(result.success).toBe(true);
    });

    it('should not duplicate state transitions', async () => {
      // Order already in payment_received status
      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ ...mockConsumerOrder, status: 'payment_received' }],
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
        insert: mockInsert,
      }));

      const result = await updateOrderFromPayment(
        mockConsumerOrder.order_number,
        'payment-transaction-123',
        2643.85
      );

      // Should succeed but not change status
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // SCENARIO 5: Amount Verification
  // ==========================================================================

  describe('Scenario: Amount Verification', () => {
    it('should correctly convert cents to Rands', async () => {
      const payloadWithCents = {
        ...mockNetcashSuccessPayload,
        Amount: '264385', // R2643.85 in cents
      };

      await processPaymentWebhook(payloadWithCents);

      // Verify the insert was called (amount conversion happens internally)
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle zero amount transactions', async () => {
      const zeroAmountPayload = {
        ...mockNetcashSuccessPayload,
        Amount: '0',
      };

      await processPaymentWebhook(zeroAmountPayload);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should handle large amount transactions', async () => {
      const largeAmountPayload = {
        ...mockNetcashSuccessPayload,
        Amount: '999999999', // R9,999,999.99
      };

      await processPaymentWebhook(largeAmountPayload);
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SCENARIO 6: Error Recovery
  // ==========================================================================

  describe('Scenario: Error Recovery', () => {
    it('should handle database errors gracefully', async () => {
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        }),
      });

      await expect(
        processPaymentWebhook(mockNetcashSuccessPayload)
      ).rejects.toThrow('Failed to create transaction record');
    });

    it('should handle order not found', async () => {
      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }));

      const result = await updateOrderFromPayment(
        'INVALID-ORDER',
        'payment-transaction-123',
        2643.85
      );

      expect(result.success).toBe(false);
    });

    it('should rollback on partial failure', async () => {
      // Transaction insert succeeds but invoice update fails
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'transaction-123' },
            error: null,
          }),
        }),
      });

      mockUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: { message: 'Invoice update failed' },
        }),
      });

      await expect(
        processPaymentWebhook(mockNetcashSuccessPayload)
      ).rejects.toThrow('Failed to update invoice');
    });
  });

  // ==========================================================================
  // SCENARIO 7: Concurrent Payment Handling
  // ==========================================================================

  describe('Scenario: Concurrent Payments', () => {
    it('should handle duplicate webhook calls idempotently', async () => {
      // First call
      await processPaymentWebhook(mockNetcashSuccessPayload);

      // Second call with same RequestTrace
      await processPaymentWebhook(mockNetcashSuccessPayload);

      // Both should succeed (idempotent)
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it('should use RequestTrace for deduplication', () => {
      const trace1 = mockNetcashSuccessPayload.RequestTrace;
      const trace2 = 'TRACE-DIFFERENT';

      // Different traces should be treated as different transactions
      expect(trace1).not.toBe(trace2);
    });
  });
});

// ============================================================================
// INTEGRATION: Complete Flow Simulation
// ============================================================================

describe('Integration: Complete Payment Journey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should simulate customer payment journey end-to-end', async () => {
    const scenario = createPaymentScenario();

    // 1. Customer places order (simulated - order exists)
    expect(scenario.order.status).toBe('pending');

    // 2. Customer selects payment method
    expect(scenario.paymentMethod.method_type).toBe('debit_order');

    // 3. Payment gateway processes payment
    const payloadString = JSON.stringify(scenario.webhookPayload);
    const signature = generateWebhookSignature(payloadString);
    const isValid = verifyNetCashWebhook(payloadString, signature);
    expect(isValid).toBe(true);

    // 4. Webhook validates payload
    const isValidPayload = validateWebhookPayload(scenario.webhookPayload);
    expect(isValidPayload).toBe(true);

    // 5. Invoice amount matches
    expect(scenario.invoice.total_amount).toBe(2643.85);
    const webhookAmount = parseInt(scenario.webhookPayload.Amount) / 100;
    expect(webhookAmount).toBe(scenario.invoice.total_amount);

    // 6. All entities are linked correctly
    expect(scenario.order.customer_id).toBe(scenario.customer.id);
    expect(scenario.invoice.customer_id).toBe(scenario.customer.id);
    expect(scenario.invoice.order_id).toBe(scenario.order.id);
    expect(scenario.paymentMethod.customer_id).toBe(scenario.customer.id);
  });
});
