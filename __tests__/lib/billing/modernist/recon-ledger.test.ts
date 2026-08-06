// __tests__/lib/billing/modernist/recon-ledger.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  isBrokenThreeWay,
  toneForCt,
  toneForBooks,
  toneForNetcash,
  filterLedgerRows,
  type LedgerFilter,
} from '@/lib/billing/modernist/recon-ledger';
import type { ThreeWayInvoiceRow } from '@/lib/billing/recon-hub/types';

const row = (over: Partial<ThreeWayInvoiceRow>): ThreeWayInvoiceRow =>
  ({
    id: '1',
    invoiceNumber: 'INV-1',
    invoiceDate: '2026-08-01',
    ctStatus: 'paid',
    ctTotal: 517.5,
    ctDue: 0,
    accountNumber: 'CT-1',
    serviceName: 'Svc',
    monthlyPrice: 517.5,
    booksInvoiceId: 'zb',
    booksSyncStatus: 'synced',
    booksStatus: 'paid',
    booksTotal: 517.5,
    booksBalance: 0,
    netcashState: 'matched',
    netcashRef: 'NC',
    matchFlags: {
      ctPaidBooksOpen: false,
      amountMismatch: false,
      booksUnlinked: false,
      netcashUnmatchedPaid: false,
    },
    href: '/admin/billing/invoices/1',
    ...over,
  }) as ThreeWayInvoiceRow;

describe('isBrokenThreeWay', () => {
  it('false when clean', () => {
    expect(isBrokenThreeWay(row({}))).toBe(false);
  });
  it('true when netcash unmatched paid', () => {
    expect(
      isBrokenThreeWay(
        row({
          matchFlags: {
            ctPaidBooksOpen: false,
            amountMismatch: false,
            booksUnlinked: false,
            netcashUnmatchedPaid: true,
          },
          netcashState: 'unmatched',
        })
      )
    ).toBe(true);
  });
});

describe('filterLedgerRows', () => {
  const rows = [
    row({ id: 'clean' }),
    row({
      id: 'lag',
      matchFlags: {
        ctPaidBooksOpen: true,
        amountMismatch: false,
        booksUnlinked: false,
        netcashUnmatchedPaid: false,
      },
      booksSyncStatus: 'pending',
    }),
  ];
  it('exceptions only', () => {
    expect(filterLedgerRows(rows, 'exceptions').map((r) => r.id)).toEqual(['lag']);
  });
  it('clean only', () => {
    expect(filterLedgerRows(rows, 'clean').map((r) => r.id)).toEqual(['clean']);
  });
});

describe('tones', () => {
  it('maps netcash none', () => {
    expect(toneForNetcash('none')).toBe('none');
  });
  it('maps books pending to warn', () => {
    expect(toneForBooks(row({ booksSyncStatus: 'pending', matchFlags: {
      ctPaidBooksOpen: true, amountMismatch: false, booksUnlinked: false, netcashUnmatchedPaid: false,
    } }))).toBe('warn');
  });
});
