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
  amount: 999,
  reference: 'CT-2025-00030',
  payerName: 'Prins Mhlanga',
  ...overrides,
});

const zb = (overrides: Partial<BankLineLike> = {}): BankLineLike => ({
  id: 'zb-1',
  date: '2026-08-01',
  amount: 999,
  reference: 'CT-2025-00030',
  payerName: 'Prins Mhlanga',
  ...overrides,
});

describe('matchBankLines', () => {
  it('matches when account, exact name, amount, and date agree', () => {
    const pairs = matchBankLines([nc()], [zb()]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].status).toBe('matched');
    expect(summarizeBankPairs(pairs).matchedCount).toBe(1);
  });

  it('queues name_mismatch when account hits but names differ', () => {
    const pairs = matchBankLines(
      [nc()],
      [zb({ payerName: 'Shaun Robertson' })]
    );
    expect(pairs.some((p) => p.status === 'name_mismatch')).toBe(true);
    expect(summarizeBankPairs(pairs).nameMismatchCount).toBe(1);
    expect(
      bankPairsToExceptionRows(pairs).some((e) => e.reasonCode === 'name_mismatch')
    ).toBe(true);
  });

  it('does not auto-match on amount and date alone', () => {
    const pairs = matchBankLines(
      [nc({ reference: 'PAY-A', payerName: 'A' })],
      [zb({ id: 'zb-2', reference: 'OTHER', payerName: 'B', date: '2026-08-02' })]
    );
    expect(pairs.some((p) => p.status === 'matched')).toBe(false);
    expect(summarizeBankPairs(pairs).netcashOnlyCount).toBe(1);
    expect(summarizeBankPairs(pairs).booksOnlyCount).toBe(1);
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
