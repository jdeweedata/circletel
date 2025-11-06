/**
 * Test Utilities for Payment Provider Tests
 *
 * Shared mocks, fixtures, and helper functions for payment testing.
 *
 * @module __tests__/lib/payments/test-utils
 */

import type {
  PaymentInitiationParams,
  PaymentInitiationResult,
  WebhookProcessingResult,
  PaymentStatusResult,
  RefundParams,
  RefundResult,
  PaymentProviderCapabilities,
  PaymentStatus
} from '@/lib/types/payment.types';
import { BasePaymentProvider } from '@/lib/payments/providers/payment-provider.interface';

// ============================================================================
// Mock Payment Provider
// ============================================================================

/**
 * Mock payment provider for testing
 *
 * Allows configuring success/failure scenarios for testing.
 */
export class MockPaymentProvider extends BasePaymentProvider {
  readonly name = 'mock' as const;

  // Configuration for controlling mock behavior
  public shouldSucceed = true;
  public shouldVerifySignature = true;
  public mockStatus: PaymentStatus = 'completed';
  public mockTransactionId = 'MOCK-TXN-123';
  public mockAmount = 799.0;

  async initiate(
    params: PaymentInitiationParams
  ): Promise<PaymentInitiationResult> {
    if (!this.shouldSucceed) {
      return {
        success: false,
        error: 'Mock payment initiation failed'
      };
    }

    return {
      success: true,
      paymentUrl: 'https://mock-gateway.test/pay',
      formData: {
        amount: params.amount.toString(),
        reference: params.reference,
        email: params.customerEmail || ''
      },
      transactionId: this.mockTransactionId,
      metadata: params.metadata
    };
  }

  async processWebhook(
    payload: unknown,
    signature: string
  ): Promise<WebhookProcessingResult> {
    if (!this.shouldSucceed) {
      return {
        success: false,
        transactionId: '',
        status: 'failed',
        amount: 0,
        reference: '',
        error: 'Mock webhook processing failed'
      };
    }

    return {
      success: true,
      transactionId: this.mockTransactionId,
      status: this.mockStatus,
      amount: this.mockAmount,
      reference: 'MOCK-REF-123',
      completedAt: new Date(),
      metadata: { mock: true }
    };
  }

  verifySignature(payload: string, signature: string): boolean {
    return this.shouldVerifySignature;
  }

  async getStatus(transactionId: string): Promise<PaymentStatusResult> {
    return {
      transactionId,
      status: this.mockStatus,
      amount: this.mockAmount,
      reference: 'MOCK-REF-123'
    };
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    if (!this.shouldSucceed) {
      return {
        success: false,
        error: 'Mock refund failed'
      };
    }

    return {
      success: true,
      refundId: 'MOCK-REFUND-123',
      refundedAmount: params.amount,
      refundDate: new Date()
    };
  }

  isConfigured(): boolean {
    return this.shouldSucceed;
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      refunds: true,
      partial_refunds: true,
      recurring_payments: true,
      status_queries: true,
      webhooks: true,
      payment_methods: ['mock'],
      supports_3d_secure: true
    };
  }
}

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Standard payment initiation parameters for testing
 */
export const mockPaymentInitiationParams: PaymentInitiationParams = {
  amount: 799.0,
  currency: 'ZAR',
  reference: 'ORDER-001',
  description: 'Test payment',
  customerEmail: 'test@circletel.co.za',
  customerName: 'Test Customer',
  customerPhone: '+27821234567',
  returnUrl: 'https://circletel.co.za/payment/success',
  cancelUrl: 'https://circletel.co.za/payment/cancelled',
  notifyUrl: 'https://circletel.co.za/api/payments/webhook',
  metadata: {
    order_id: 'order-123',
    package_name: 'Fibre 100'
  }
};

/**
 * Mock NetCash webhook payload (payment completed)
 */
export const mockNetCashWebhookPayload = {
  TransactionAccepted: 'true',
  Complete: 'true',
  Amount: '79900', // 799.00 ZAR in cents
  Reference: 'CT-ORDER-001-1234567890',
  Reason: 'Approved',
  TransactionDate: '2025-11-06T10:30:00Z',
  Extra1: 'NETCASH-REF-123',
  PaymentMethod: 'card',
  CardType: 'Visa',
  RequestTrace: 'TRACE-123',
  Result: 'Success'
};

/**
 * Mock NetCash webhook payload (payment failed)
 */
export const mockNetCashWebhookPayloadFailed = {
  TransactionAccepted: 'false',
  Complete: 'true',
  Amount: '79900',
  Reference: 'CT-ORDER-001-1234567890',
  Reason: 'Insufficient funds',
  TransactionDate: '2025-11-06T10:30:00Z',
  Result: 'Failed'
};

/**
 * Mock NetCash form data
 */
export const mockNetCashFormData = {
  m1: 'test-service-key',
  m2: 'test-pci-vault-key',
  p2: 'CT-ORDER-001-1234567890',
  p3: 'Test payment',
  p4: '79900',
  Budget: 'N',
  CustomerEmailAddress: 'test@circletel.co.za',
  CustomerTelephoneNumber: '+27821234567',
  m9: 'https://circletel.co.za/payment/success',
  m10: 'https://circletel.co.za/payment/cancelled',
  m4: 'CT-ORDER-001-1234567890'
};

/**
 * Mock refund parameters
 */
export const mockRefundParams: RefundParams = {
  transactionId: 'CT-ORDER-001-1234567890',
  amount: 799.0,
  reason: 'Customer requested refund',
  requestedBy: 'admin-user-123',
  notes: 'Full refund approved'
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a mock environment variable setup
 */
export function setupMockEnv() {
  const originalEnv = { ...process.env };

  process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY = 'test-service-key';
  process.env.NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY = 'test-pci-vault-key';
  process.env.NETCASH_WEBHOOK_SECRET = 'test-webhook-secret';
  process.env.NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER = 'netcash';
  process.env.NEXT_PUBLIC_BASE_URL = 'https://circletel.co.za';

  return () => {
    process.env = originalEnv;
  };
}

/**
 * Generate a valid HMAC-SHA256 signature for testing
 */
export function generateMockSignature(payload: string, secret: string): string {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabaseClient() {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn()
  };
}

/**
 * Wait for async operations in tests
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert that a value is defined (TypeScript type guard for tests)
 */
export function assertDefined<T>(
  value: T | undefined | null,
  message?: string
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message || 'Expected value to be defined');
  }
}

/**
 * Create a spy on console methods for testing logs
 */
export function createConsoleSpy() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const logs: string[] = [];
  const errors: string[] = [];
  const warns: string[] = [];

  console.log = jest.fn((...args) => {
    logs.push(args.join(' '));
  });

  console.error = jest.fn((...args) => {
    errors.push(args.join(' '));
  });

  console.warn = jest.fn((...args) => {
    warns.push(args.join(' '));
  });

  return {
    logs,
    errors,
    warns,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  };
}

// ============================================================================
// Test Assertions
// ============================================================================

/**
 * Assert payment initiation result is successful
 */
export function assertPaymentInitiationSuccess(
  result: PaymentInitiationResult
): void {
  expect(result.success).toBe(true);
  expect(result.paymentUrl).toBeDefined();
  expect(result.transactionId).toBeDefined();
  expect(result.error).toBeUndefined();
}

/**
 * Assert payment initiation result is a failure
 */
export function assertPaymentInitiationFailure(
  result: PaymentInitiationResult
): void {
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  expect(result.transactionId).toBeUndefined();
}

/**
 * Assert webhook processing result is successful
 */
export function assertWebhookProcessingSuccess(
  result: WebhookProcessingResult,
  expectedStatus: PaymentStatus = 'completed'
): void {
  expect(result.success).toBe(true);
  expect(result.status).toBe(expectedStatus);
  expect(result.transactionId).toBeDefined();
  expect(result.amount).toBeGreaterThan(0);
  expect(result.error).toBeUndefined();
}

/**
 * Assert webhook processing result is a failure
 */
export function assertWebhookProcessingFailure(
  result: WebhookProcessingResult
): void {
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
}

/**
 * Assert refund result is successful
 */
export function assertRefundSuccess(result: RefundResult): void {
  expect(result.success).toBe(true);
  expect(result.refundId).toBeDefined();
  expect(result.refundedAmount).toBeGreaterThan(0);
  expect(result.error).toBeUndefined();
}

/**
 * Assert provider capabilities
 */
export function assertProviderCapabilities(
  capabilities: PaymentProviderCapabilities,
  expected: Partial<PaymentProviderCapabilities>
): void {
  Object.entries(expected).forEach(([key, value]) => {
    expect(capabilities[key as keyof PaymentProviderCapabilities]).toBe(value);
  });
}
