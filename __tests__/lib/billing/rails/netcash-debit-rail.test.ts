import { LINE_LIMIT_RANDS, DAILY_LIMIT_RANDS } from '@/lib/payments/netcash-debit-batch-service';

const mockSubmitBatch = jest.fn();
const mockIsConfigured = jest.fn(() => true);

jest.mock('@/lib/payments/netcash-debit-batch-service', () => {
  const actual = jest.requireActual('@/lib/payments/netcash-debit-batch-service');
  return {
    ...actual,
    netcashDebitBatchService: {
      isConfigured: () => mockIsConfigured(),
      submitBatch: (...args: unknown[]) => mockSubmitBatch(...args),
    },
  };
});

import { createNetcashDebitRail } from '@/lib/billing/rails/netcash-debit-rail';
import type { DebitOrderItem } from '@/lib/payments/netcash-debit-batch-service';

function item(amount: number, ref = 'INV-1'): DebitOrderItem {
  return {
    accountReference: ref,
    amount,
    actionDate: new Date('2026-08-01'),
    customerId: 'cust-1',
    invoiceId: 'inv-1',
    accountName: 'Test',
    accountType: 'current',
    branchCode: '250655',
    accountNumber: '1234567890',
  };
}

describe('netcash-debit CollectionRail', () => {
  beforeEach(() => {
    mockSubmitBatch.mockReset();
    mockIsConfigured.mockReturnValue(true);
    mockSubmitBatch.mockResolvedValue({
      success: true,
      fileToken: 'TOKEN',
      itemsSubmitted: 1,
      errors: [],
      warnings: [],
    });
  });

  it('exports shared limit constants', () => {
    expect(LINE_LIMIT_RANDS).toBeGreaterThan(0);
    expect(DAILY_LIMIT_RANDS).toBeGreaterThan(LINE_LIMIT_RANDS);
  });

  it('submits submittable items via NetCashDebitBatchService', async () => {
    const rail = createNetcashDebitRail();
    const result = await rail.submitDebitBatch!([item(500)], 'batch-1');
    expect(result.success).toBe(true);
    expect(result.fileToken).toBe('TOKEN');
    expect(mockSubmitBatch).toHaveBeenCalled();
  });

  it('rejects when daily limit exceeded', async () => {
    const rail = createNetcashDebitRail();
    // Many max-line items to blow daily cap without single-line reject
    const items = Array.from({ length: 20 }, (_, i) =>
      item(LINE_LIMIT_RANDS, `INV-${i}`)
    );
    const result = await rail.submitDebitBatch!(items, 'big');
    expect(result.success).toBe(false);
    expect(result.errors.join(' ')).toMatch(/daily limit/i);
    expect(mockSubmitBatch).not.toHaveBeenCalled();
  });

  it('skips over-line items and still submits the rest', async () => {
    const rail = createNetcashDebitRail();
    const result = await rail.submitDebitBatch!(
      [item(LINE_LIMIT_RANDS + 1, 'BIG'), item(100, 'OK')],
      'mix'
    );
    expect(result.success).toBe(true);
    expect(mockSubmitBatch).toHaveBeenCalledWith(
      [expect.objectContaining({ accountReference: 'OK', amount: 100 })],
      'mix'
    );
  });
});
