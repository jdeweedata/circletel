import { describe, it, expect } from '@jest/globals';
import {
  buildExceptionRows,
  countUnmatchedCash,
  filterExceptions,
} from '@/lib/billing/recon-hub/build-exceptions';
import type {
  OpenArLike,
  PaymentLike,
  PaynowUnmatchedLike,
} from '@/lib/billing/recon-hub/types';

const basePayment = (overrides: Partial<PaymentLike> = {}): PaymentLike => ({
  id: 'pay-1',
  status: 'completed',
  amount: 1499,
  reference: 'NC-REF-001',
  completed_at: '2026-07-30T10:00:00.000Z',
  customer_invoice_id: null,
  invoice_number: null,
  invoice_status: null,
  zoho_sync_status: null,
  ...overrides,
});

describe('buildExceptionRows', () => {
  it('marks completed payment without CT invoice as red unmatched cash', () => {
    const rows = buildExceptionRows({
      payments: [basePayment()],
      paynowUnmatched: [],
      openArInvoices: [],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].severity).toBe('red');
    expect(rows[0].reasonCode).toBe('no_ct_invoice');
    expect(rows[0].kind).toBe('payment');
    expect(rows[0].netcashRef).toBe('NC-REF-001');
    expect(rows[0].href).toBe('/admin/finance/reconciliation');
    expect(countUnmatchedCash(rows)).toBe(1);
  });

  it('marks linked payment with zoho failed as amber and not unmatched cash', () => {
    const rows = buildExceptionRows({
      payments: [
        basePayment({
          id: 'pay-2',
          customer_invoice_id: 'inv-uuid-1',
          invoice_number: 'CT-INV-001',
          invoice_status: 'paid',
          zoho_sync_status: 'failed',
        }),
      ],
      paynowUnmatched: [],
      openArInvoices: [],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].severity).toBe('amber');
    expect(rows[0].reasonCode).toBe('zoho_payment_failed');
    expect(rows[0].zohoStatus).toBe('failed');
    expect(rows[0].invoiceId).toBe('inv-uuid-1');
    expect(rows[0].href).toBe('/admin/billing/invoices/inv-uuid-1');
    expect(countUnmatchedCash(rows)).toBe(0);
  });

  it('marks linked payment with zoho pending as amber zoho lag', () => {
    const rows = buildExceptionRows({
      payments: [
        basePayment({
          id: 'pay-3',
          customer_invoice_id: 'inv-uuid-2',
          invoice_number: 'CT-INV-002',
          zoho_sync_status: 'pending',
        }),
      ],
      paynowUnmatched: [],
      openArInvoices: [],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].severity).toBe('amber');
    expect(rows[0].reasonCode).toBe('zoho_payment_pending');
    expect(countUnmatchedCash(rows)).toBe(0);
  });

  it('includes paynow unmatched details as red', () => {
    const unmatched: PaynowUnmatchedLike[] = [
      {
        id: 'pn-1',
        amount: 899,
        date: '2026-07-30T08:00:00.000Z',
        netcashRef: 'PN-REF-99',
      },
    ];

    const rows = buildExceptionRows({
      payments: [],
      paynowUnmatched: unmatched,
      openArInvoices: [],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('paynow_unmatched');
    expect(rows[0].severity).toBe('red');
    expect(rows[0].reasonCode).toBe('paynow_unmatched');
    expect(rows[0].href).toBe('/admin/finance/reconciliation');
    expect(countUnmatchedCash(rows)).toBe(1);
  });

  it('includes open AR invoices as neutral', () => {
    const openAr: OpenArLike[] = [
      {
        id: 'inv-ar-1',
        invoice_number: 'CT-AR-001',
        amount: 2500,
        status: 'overdue',
        date: '2026-07-01T00:00:00.000Z',
      },
    ];

    const rows = buildExceptionRows({
      payments: [],
      paynowUnmatched: [],
      openArInvoices: openAr,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('invoice_ar');
    expect(rows[0].severity).toBe('neutral');
    expect(rows[0].reasonCode).toBe('open_ar');
    expect(rows[0].href).toBe('/admin/billing/invoices/inv-ar-1');
  });

  it('skips completed payments that are fully linked and zoho-synced', () => {
    const rows = buildExceptionRows({
      payments: [
        basePayment({
          customer_invoice_id: 'inv-ok',
          invoice_number: 'CT-OK',
          zoho_sync_status: 'synced',
        }),
      ],
      paynowUnmatched: [],
      openArInvoices: [],
    });

    expect(rows).toHaveLength(0);
  });

  it('skips non-completed payments', () => {
    const rows = buildExceptionRows({
      payments: [basePayment({ status: 'pending' })],
      paynowUnmatched: [],
      openArInvoices: [],
    });

    expect(rows).toHaveLength(0);
  });
});

describe('filterExceptions', () => {
  const rows = buildExceptionRows({
    payments: [
      basePayment({ id: 'red-1' }),
      basePayment({
        id: 'amber-1',
        customer_invoice_id: 'inv-1',
        zoho_sync_status: 'failed',
      }),
    ],
    paynowUnmatched: [],
    openArInvoices: [
      {
        id: 'ar-1',
        invoice_number: 'CT-AR',
        amount: 100,
        status: 'unpaid',
        date: '2026-07-01T00:00:00.000Z',
      },
    ],
  });

  it('filters unmatched_cash to red rows only', () => {
    const filtered = filterExceptions(rows, 'unmatched_cash');
    expect(filtered.every((r) => r.severity === 'red')).toBe(true);
    expect(filtered).toHaveLength(1);
  });

  it('filters zoho_lag to amber rows only', () => {
    const filtered = filterExceptions(rows, 'zoho_lag');
    expect(filtered.every((r) => r.severity === 'amber')).toBe(true);
    expect(filtered).toHaveLength(1);
  });

  it('filters open_ar to open_ar reason only', () => {
    const filtered = filterExceptions(rows, 'open_ar');
    expect(filtered.every((r) => r.reasonCode === 'open_ar')).toBe(true);
    expect(filtered).toHaveLength(1);
  });

  it('returns all rows for all filter', () => {
    expect(filterExceptions(rows, 'all')).toHaveLength(3);
  });
});

describe('countUnmatchedCash', () => {
  it('counts only red severity rows', () => {
    expect(
      countUnmatchedCash([
        { severity: 'red' } as never,
        { severity: 'red' } as never,
        { severity: 'amber' } as never,
        { severity: 'neutral' } as never,
      ])
    ).toBe(2);
  });
});
