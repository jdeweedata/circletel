import {
  buildPaidInvoiceUpdate,
  buildUnpaidInvoiceUpdate,
  buildPaymentTxnRow,
} from '@/app/api/cron/payment-reconciliation/route';

// Real columns (from information_schema, profile agyjovdugmtopasyvlng).
const REAL_INVOICE_COLS = new Set(['status', 'amount_paid', 'paid_at', 'updated_at', 'notes']);
const REAL_PT_COLS = new Set([
  'id', 'transaction_id', 'customer_invoice_id', 'invoice_id', 'order_id', 'customer_id',
  'customer_email', 'customer_name', 'amount', 'currency', 'status', 'payment_method',
  'provider', 'provider_reference', 'provider_response', 'reference', 'reconciliation_source',
  'reconciliation_queue_id', 'error_code', 'error_message', 'failure_reason', 'initiated_at',
  'completed_at', 'created_at', 'updated_at', 'created_by', 'expires_at', 'metadata', 'payment_method_details',
]);

// The phantom columns the old code wrote to — Postgres rejected every write,
// and the error was never checked, so reconciliation silently persisted nothing.
const FORBIDDEN = [
  'payment_reference', 'payment_type', 'netcash_reference', 'netcash_response',
  'processed_at', 'transaction_date', 'failed_at',
];

describe('customer_invoices update payloads', () => {
  it('paid update uses only real columns and sets status=paid', () => {
    const p = buildPaidInvoiceUpdate(276, '2026-06-26T08:00:00+02:00');
    for (const k of Object.keys(p)) expect(REAL_INVOICE_COLS.has(k)).toBe(true);
    expect(p.status).toBe('paid');
    expect(p.amount_paid).toBe(276);
    expect(p.paid_at).toBe('2026-06-26T08:00:00+02:00');
  });

  it('unpaid update uses only real columns and records the reason', () => {
    const p = buildUnpaidInvoiceUpdate('Insufficient funds', '2', '2026-06-26T00:00:00Z');
    for (const k of Object.keys(p)) expect(REAL_INVOICE_COLS.has(k)).toBe(true);
    expect(p.status).toBe('overdue');
    expect(p.notes).toContain('Insufficient funds');
    expect(p.notes).toContain('Code: 2');
  });

  it('neither update reintroduces the phantom columns', () => {
    const merged = { ...buildPaidInvoiceUpdate(1, 'x'), ...buildUnpaidInvoiceUpdate('r', 'c', 'x') };
    for (const bad of FORBIDDEN) expect(Object.keys(merged)).not.toContain(bad);
  });
});

describe('payment_transactions row payloads', () => {
  it('completed invoice txn uses only real columns and links the invoice', () => {
    const row = buildPaymentTxnRow({
      invoiceId: 'inv-1', amount: 276, reference: 'INV-2026-00014',
      nowISO: '2026-06-26T08:00:00Z', outcome: 'completed', response: { transactionCode: 'TDD' },
    });
    for (const k of Object.keys(row)) expect(REAL_PT_COLS.has(k)).toBe(true);
    expect(row.status).toBe('completed');
    expect(row.customer_invoice_id).toBe('inv-1');
    expect(row.order_id).toBeUndefined();
    expect(row.payment_method).toBe('debit_order');
    expect(row.provider).toBe('netcash');
    expect(row.provider_reference).toBe('INV-2026-00014');
    expect(row.completed_at).toBe('2026-06-26T08:00:00Z');
  });

  it('failed invoice txn uses only real columns and records the unpaid reason', () => {
    const row = buildPaymentTxnRow({
      invoiceId: 'inv-1', amount: 276, reference: 'INV-2026-00014',
      nowISO: 'x', outcome: 'failed', unpaidCode: '2', unpaidReason: 'Insufficient funds',
    });
    for (const k of Object.keys(row)) expect(REAL_PT_COLS.has(k)).toBe(true);
    expect(row.status).toBe('failed');
    expect(row.failure_reason).toContain('Insufficient funds');
    expect(row.error_code).toBe('2');
    expect(row.completed_at).toBeUndefined();
  });

  it('order txn links order_id (not customer_invoice_id)', () => {
    const row = buildPaymentTxnRow({
      orderId: 'ord-1', amount: 899, reference: 'PAY-ORD-9841', nowISO: 'x', outcome: 'completed',
    });
    for (const k of Object.keys(row)) expect(REAL_PT_COLS.has(k)).toBe(true);
    expect(row.order_id).toBe('ord-1');
    expect(row.customer_invoice_id).toBeUndefined();
  });

  it('never emits the phantom columns that silently failed before', () => {
    const rows = [
      buildPaymentTxnRow({ invoiceId: 'i', amount: 1, reference: 'r', nowISO: 'x', outcome: 'completed' }),
      buildPaymentTxnRow({ invoiceId: 'i', amount: 1, reference: 'r', nowISO: 'x', outcome: 'failed' }),
      buildPaymentTxnRow({ orderId: 'o', amount: 1, reference: 'r', nowISO: 'x', outcome: 'completed' }),
    ];
    for (const row of rows) for (const bad of FORBIDDEN) expect(Object.keys(row)).not.toContain(bad);
  });
});
