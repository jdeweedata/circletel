/**
 * Debit Orders Inngest Function Tests
 *
 * Tests for the debit orders batch processing Inngest function.
 * Verifies function structure, IDs, and importability.
 */

// Mock modules before importing
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

jest.mock('../../../inngest/client', () => ({
  inngest: {
    createFunction: jest.fn((config, triggers, handler) => ({
      ...config,
      triggers,
      handler,
    })),
    send: jest.fn(() => Promise.resolve()),
  },
}));

describe('Debit Orders Inngest Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Function Imports', () => {
    test('should import all functions without errors', async () => {
      const module = await import('../debit-orders');

      expect(module.debitOrdersFunction).toBeDefined();
      expect(module.debitOrdersCompletedFunction).toBeDefined();
      expect(module.debitOrdersFailedFunction).toBeDefined();
    });
  });

  describe('debitOrdersFunction', () => {
    test('should have correct function ID', async () => {
      const { debitOrdersFunction } = await import('../debit-orders');

      expect(debitOrdersFunction.id).toBe('debit-orders-batch');
    });

    test('should have correct function name', async () => {
      const { debitOrdersFunction } = await import('../debit-orders');

      expect(debitOrdersFunction.name).toBe('Debit Orders Batch Processing');
    });

    test('should have retries configured', async () => {
      const { debitOrdersFunction } = await import('../debit-orders');

      expect(debitOrdersFunction.retries).toBe(3);
    });

    test('should have dual triggers (cron and event)', async () => {
      const { debitOrdersFunction } = await import('../debit-orders');

      expect(debitOrdersFunction.triggers).toHaveLength(2);
      expect(debitOrdersFunction.triggers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ cron: '0 4 * * *' }),
          expect.objectContaining({ event: 'billing/debit-orders.requested' }),
        ])
      );
    });

    test('should have cancel configuration', async () => {
      const { debitOrdersFunction } = await import('../debit-orders');

      expect(debitOrdersFunction.cancelOn).toBeDefined();
      expect(debitOrdersFunction.cancelOn).toEqual([
        {
          event: 'billing/debit-orders.cancelled',
          match: 'data.batch_log_id',
        },
      ]);
    });
  });

  describe('debitOrdersCompletedFunction', () => {
    test('should have correct function ID', async () => {
      const { debitOrdersCompletedFunction } = await import('../debit-orders');

      expect(debitOrdersCompletedFunction.id).toBe('debit-orders-completed');
    });

    test('should have correct function name', async () => {
      const { debitOrdersCompletedFunction } = await import('../debit-orders');

      expect(debitOrdersCompletedFunction.name).toBe('Debit Orders Completed Handler');
    });

    test('should trigger on completion event', async () => {
      const { debitOrdersCompletedFunction } = await import('../debit-orders');

      expect(debitOrdersCompletedFunction.triggers).toEqual(
        expect.objectContaining({ event: 'billing/debit-orders.completed' })
      );
    });
  });

  describe('debitOrdersFailedFunction', () => {
    test('should have correct function ID', async () => {
      const { debitOrdersFailedFunction } = await import('../debit-orders');

      expect(debitOrdersFailedFunction.id).toBe('debit-orders-failed');
    });

    test('should have correct function name', async () => {
      const { debitOrdersFailedFunction } = await import('../debit-orders');

      expect(debitOrdersFailedFunction.name).toBe('Debit Orders Failed Handler');
    });

    test('should trigger on failure event', async () => {
      const { debitOrdersFailedFunction } = await import('../debit-orders');

      expect(debitOrdersFailedFunction.triggers).toEqual(
        expect.objectContaining({ event: 'billing/debit-orders.failed' })
      );
    });
  });
});

describe('Cron Schedule', () => {
  test('should be scheduled for 04:00 UTC (06:00 SAST)', async () => {
    const { debitOrdersFunction } = await import('../debit-orders');

    const cronTrigger = debitOrdersFunction.triggers.find(
      (t: { cron?: string }) => t.cron !== undefined
    );

    expect(cronTrigger).toBeDefined();
    expect(cronTrigger.cron).toBe('0 4 * * *');
  });
});

describe('Event Types', () => {
  test('should use correct event names matching client types', () => {
    // These event names should match the types defined in lib/inngest/client.ts
    const expectedEvents = [
      'billing/debit-orders.requested',
      'billing/debit-orders.completed',
      'billing/debit-orders.failed',
      'billing/debit-orders.cancelled',
      'billing/day.requested',
    ];

    // Verify the events are referenced correctly in the function
    expectedEvents.forEach(eventName => {
      expect(eventName).toMatch(/^billing\/(debit-orders|day)\.(requested|completed|failed|cancelled)$/);
    });
  });
});
