import { describe, it, expect } from '@jest/globals';
import {
  bankPairsToExceptionRows,
  matchBankLines,
  summarizeBankPairs,
  type BankLineLike,
} from '@/lib/billing/recon-hub/bank-match';

const nc = (overrides: Partial<BankLineLike> = {}): BankLineLike => ({
  id: 'nc-1',
  date: '2026-08-01',
  amount: 1150,
  reference: 'CT-INV-001',
  ...overrides,
});

const zb = (overrides: Partial<BankLineLike> = {}): BankLineLike => ({
  id: 'zb-1',
  date: '2026-08-01',
  amount: 1150,
  reference: 'CT-INV-001',
  ...overrides,
});

describe('matchBankLines', () => {
  it('matches by reference + amount', () => {
    const pairs = matchBankLines([nc()], [zb()]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].status).toBe('matched');
    expect(summarizeBankPairs(pairs).matchedCount).toBe(1);
  });

  it('matches by amount + date window when refs differ', () => {
    const pairs = matchBankLines(
      [nc({ reference: 'PAY-A' })],
      [zb({ id: 'zb-2', reference: 'OTHER', date: '2026-08-02' })]
    );
    expect(pairs.some((p) => p.status === 'matched' || p.status === 'amount_drift')).toBe(
      true
    );
  });

  it('emits netcash_only and books_only exceptions', () => {
    const pairs = matchBankLines(
      [nc({ id: 'nc-x', reference: 'ONLY-NC', amount: 200 })],
      [zb({ id: 'zb-x', reference: 'ONLY-ZB', amount: 300 })]
    );
    const summary = summarizeBankPairs(pairs);
    expect(summary.netcashOnlyCount).toBe(1);
    expect(summary.booksOnlyCount).toBe(1);

    const exceptions = bankPairsToExceptionRows(pairs);
    expect(
      exceptions.some((e) => e.reasonCode === 'bank_netcash_no_books')
    ).toBe(true);
    expect(
      exceptions.some((e) => e.reasonCode === 'bank_books_no_netcash')
    ).toBe(true);
  });
});
