import { allocateNextInvoiceNumber } from '@/lib/billing/allocate-invoice-number';

function mockSupabaseWithYearNumbers(numbers: string[]) {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        like: jest.fn().mockResolvedValue({
          data: numbers.map((invoice_number) => ({ invoice_number })),
          error: null,
        }),
      })),
    })),
  };
}

describe('allocateNextInvoiceNumber', () => {
  it('uses max+1, not row count — a gap must not reuse a number', async () => {
    // 2 rows remain after a deletion, but the highest number is still 78.
    const supabase = mockSupabaseWithYearNumbers(['INV-2026-00001', 'INV-2026-00078']);

    await expect(allocateNextInvoiceNumber(supabase as never, 2026)).resolves.toBe(
      'INV-2026-00079'
    );
  });
});
