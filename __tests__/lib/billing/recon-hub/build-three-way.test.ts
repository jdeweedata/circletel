import { describe, it, expect } from '@jest/globals';
import {
  buildThreeWayInvoiceRow,
  countCtPaidBooksOpen,
  filterThreeWayInvoices,
} from '@/lib/billing/recon-hub/build-three-way';
import type { ThreeWayInvoiceLike } from '@/lib/billing/recon-hub/types';

const base = (overrides: Partial<ThreeWayInvoiceLike> = {}): ThreeWayInvoiceLike => ({
  id: 'inv-1',
  invoice_number: 'CT-INV-001',
  status: 'sent',
  invoice_date: '2026-08-01',
  due_date: '2026-08-15',
  total_amount: 1150,
  amount_due: 1150,
  amount_paid: 0,
  zoho_books_invoice_id: null,
  zoho_sync_status: 'pending',
  paynow_transaction_ref: null,
  customer_id: 'cust-1',
  ...overrides,
});

describe('buildThreeWayInvoiceRow', () => {
  it('flags issued invoice without Books link as unlinked', () => {
    const row = buildThreeWayInvoiceRow(base());
    expect(row.matchFlags.booksUnlinked).toBe(true);
    expect(row.matchFlags.ctPaidBooksOpen).toBe(false);
    expect(row.matchFlags.nameMismatch).toBe(false);
    expect(row.href).toBe('/admin/billing/invoices/inv-1');
  });

  it('flags exact name mismatch between CircleTel and Books', () => {
    const row = buildThreeWayInvoiceRow(
      base({
        customer_display_name: 'Prins Mhlanga',
        books_customer_name: 'Shaun Robertson',
      })
    );
    expect(row.matchFlags.nameMismatch).toBe(true);
    expect(filterThreeWayInvoices([row], 'name_mismatch')).toHaveLength(1);
  });

  it('flags CT paid with Books balance open', () => {
    const row = buildThreeWayInvoiceRow(
      base({
        status: 'paid',
        amount_due: 0,
        amount_paid: 1150,
        zoho_books_invoice_id: 'zb-1',
        zoho_sync_status: 'synced',
        books_status: 'overdue',
        books_balance: 1150,
        books_total: 1150,
        netcash_matched: true,
        netcash_ref: 'NC-1',
      })
    );
    expect(row.matchFlags.ctPaidBooksOpen).toBe(true);
    expect(row.netcashState).toBe('matched');
  });

  it('flags amount mismatch when Books total differs', () => {
    const row = buildThreeWayInvoiceRow(
      base({
        zoho_books_invoice_id: 'zb-2',
        books_total: 1322.5,
        books_status: 'sent',
        books_balance: 1322.5,
      })
    );
    expect(row.matchFlags.amountMismatch).toBe(true);
  });

  it('marks paid invoice without netcash as unmatched', () => {
    const row = buildThreeWayInvoiceRow(
      base({
        status: 'paid',
        amount_due: 0,
        amount_paid: 1150,
      })
    );
    expect(row.netcashState).toBe('unmatched');
    expect(row.matchFlags.netcashUnmatchedPaid).toBe(true);
  });
});

describe('filterThreeWayInvoices', () => {
  const rows = [
    buildThreeWayInvoiceRow(base({ id: 'a', status: 'sent' })),
    buildThreeWayInvoiceRow(
      base({
        id: 'b',
        status: 'paid',
        amount_due: 0,
        amount_paid: 1150,
        zoho_books_invoice_id: 'zb',
        books_balance: 100,
        books_status: 'sent',
      })
    ),
    buildThreeWayInvoiceRow(
      base({ id: 'c', status: 'voided', zoho_books_invoice_id: 'zb-v' })
    ),
  ];

  it('filters issued / paid / voided / ct_paid_books_open', () => {
    expect(filterThreeWayInvoices(rows, 'issued').map((r) => r.id)).toEqual([
      'a',
    ]);
    expect(filterThreeWayInvoices(rows, 'paid').map((r) => r.id)).toEqual([
      'b',
    ]);
    expect(filterThreeWayInvoices(rows, 'voided').map((r) => r.id)).toEqual([
      'c',
    ]);
    expect(
      filterThreeWayInvoices(rows, 'ct_paid_books_open').map((r) => r.id)
    ).toEqual(['b']);
  });
});

describe('countCtPaidBooksOpen', () => {
  it('counts flagged rows', () => {
    const rows = [
      buildThreeWayInvoiceRow(
        base({
          status: 'paid',
          zoho_books_invoice_id: null,
        })
      ),
      buildThreeWayInvoiceRow(base({ status: 'sent' })),
    ];
    expect(countCtPaidBooksOpen(rows)).toBe(1);
  });
});
