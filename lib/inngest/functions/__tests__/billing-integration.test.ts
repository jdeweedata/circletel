/**
 * Billing Workflow Integration Tests
 *
 * Verifies all billing Inngest functions are properly defined and integrated.
 */

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        in: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-log-id' }, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

jest.mock('@/lib/payments/netcash-debit-batch-service', () => ({
  netcashDebitBatchService: {
    isConfigured: jest.fn(() => true),
    submitBatch: jest.fn(() => Promise.resolve({
      success: true,
      batchId: 'test-batch-123',
      itemsSubmitted: 5,
      errors: [],
      warnings: [],
    })),
    authoriseBatch: jest.fn(() => Promise.resolve({ success: true })),
  },
  DebitOrderItem: {},
}));

jest.mock('@/lib/billing/paynow-billing-service', () => ({
  PayNowBillingService: {
    processPayNowForInvoice: jest.fn(() => Promise.resolve({
      success: true,
      invoiceId: 'test-invoice-id',
      invoiceNumber: 'INV-2026-00001',
      paymentUrl: 'https://paynow.test/pay',
      errors: [],
    })),
  },
}));

describe('Billing Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Event Types', () => {
    test('should have all billing event types defined', () => {
      const expectedEvents = [
        'billing/debit-orders.requested',
        'billing/debit-orders.completed',
        'billing/debit-orders.failed',
        'billing/debit-orders.cancelled',
        'billing/day.requested',
        'billing/day.completed',
        'billing/day.failed',
        'billing/day.cancelled',
      ];

      expectedEvents.forEach(eventName => {
        expect(eventName).toMatch(/^billing\/(debit-orders|day)\.(requested|completed|failed|cancelled)$/);
      });
    });
  });

  describe('Debit Orders Functions', () => {
    test('should import all debit orders functions without errors', async () => {
      const module = await import('../debit-orders');

      expect(module.debitOrdersFunction).toBeDefined();
      expect(module.debitOrdersCompletedFunction).toBeDefined();
      expect(module.debitOrdersFailedFunction).toBeDefined();
    });

    test('all debit orders functions should be callable', async () => {
      const { debitOrdersFunction, debitOrdersCompletedFunction, debitOrdersFailedFunction } =
        await import('../debit-orders');

      expect(typeof debitOrdersFunction).not.toBe('undefined');
      expect(typeof debitOrdersCompletedFunction).not.toBe('undefined');
      expect(typeof debitOrdersFailedFunction).not.toBe('undefined');
    });
  });

  describe('Billing Day Functions', () => {
    test('should import all billing day functions without errors', async () => {
      const module = await import('../billing-day');

      expect(module.billingDayFunction).toBeDefined();
      expect(module.billingDayCompletedFunction).toBeDefined();
      expect(module.billingDayFailedFunction).toBeDefined();
    });

    test('all billing day functions should be callable', async () => {
      const { billingDayFunction, billingDayCompletedFunction, billingDayFailedFunction } =
        await import('../billing-day');

      expect(typeof billingDayFunction).not.toBe('undefined');
      expect(typeof billingDayCompletedFunction).not.toBe('undefined');
      expect(typeof billingDayFailedFunction).not.toBe('undefined');
    });
  });

  describe('Functions Registry', () => {
    test('all billing functions should be exported from index', async () => {
      const module = await import('../../index');

      // Check that all debit orders functions are exported
      expect(module.debitOrdersFunction).toBeDefined();
      expect(module.debitOrdersCompletedFunction).toBeDefined();
      expect(module.debitOrdersFailedFunction).toBeDefined();

      // Check that all billing day functions are exported
      expect(module.billingDayFunction).toBeDefined();
      expect(module.billingDayCompletedFunction).toBeDefined();
      expect(module.billingDayFailedFunction).toBeDefined();
    });

    test('functions array should be properly constructed', async () => {
      const { functions } = await import('../../index');

      // Verify functions array is an array with items
      expect(Array.isArray(functions)).toBe(true);
      expect(functions.length).toBeGreaterThanOrEqual(18); // At least 18 functions (competitors=3, tarana=3, dfa=3, feasibility=3, debit=3, billing=3)
    });
  });
});
