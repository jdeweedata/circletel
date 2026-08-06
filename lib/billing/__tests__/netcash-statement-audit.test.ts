import {
  STATEMENT_AUDIT_MAX_DAYS,
  buildAuditRow,
  classifyFailAgainstInvoice,
  classifyStatementCode,
  classifySuccessAgainstInvoice,
  extractInvoiceNumber,
  flagPossibleDoubleCollects,
  resolveInvoiceFromMaps,
  runStatementAudit,
  summarizeAudit,
  validateStatementAuditRange,
  type InvoiceAuditSnapshot,
  type StatementAuditRow,
} from '@/lib/billing/netcash-statement-audit';
import type { StatementTransaction } from '@/lib/payments/netcash-statement-service';

function inv(partial: Partial<InvoiceAuditSnapshot> & { invoice_number: string }): InvoiceAuditSnapshot {
  return {
    id: partial.id || `id-${partial.invoice_number}`,
    invoice_number: partial.invoice_number,
    status: partial.status || 'sent',
    total_amount: partial.total_amount ?? 517.5,
    amount_paid: partial.amount_paid ?? 0,
    amount_due: partial.amount_due ?? 517.5,
    paid_at: partial.paid_at ?? null,
    paynow_transaction_ref: partial.paynow_transaction_ref ?? null,
    payment_collection_method: partial.payment_collection_method ?? null,
  };
}

function tx(partial: Partial<StatementTransaction> & { transactionCode: string }): StatementTransaction {
  return {
    date: partial.date || '2026-08-01',
    transactionCode: partial.transactionCode,
    description: partial.description || '',
    amount: partial.amount ?? 0,
    effect: partial.effect || '+',
    reference: partial.reference,
    accountReference: partial.accountReference,
  };
}

describe('netcash-statement-audit', () => {
  describe('validateStatementAuditRange', () => {
    it('accepts a valid range and enumerates days', () => {
      const r = validateStatementAuditRange('2026-08-01', '2026-08-03');
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.days).toEqual(['2026-08-01', '2026-08-02', '2026-08-03']);
      }
    });

    it('rejects inverted ranges and oversize windows', () => {
      expect(validateStatementAuditRange('2026-08-03', '2026-08-01').ok).toBe(false);
      expect(validateStatementAuditRange('bad', '2026-08-01').ok).toBe(false);
      const from = '2026-01-01';
      const to = '2026-04-01'; // > 62 days
      const r = validateStatementAuditRange(from, to);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain(String(STATEMENT_AUDIT_MAX_DAYS));
      }
    });
  });

  describe('extractInvoiceNumber', () => {
    it('normalizes full and short invoice forms', () => {
      expect(extractInvoiceNumber('INV-2026-00061 - FOO')).toBe('INV-2026-00061');
      expect(extractInvoiceNumber('CircleTel - INV-00061')).toBe('INV-2026-00061');
      expect(extractInvoiceNumber('INV2026-00002')).toBe('INV-2026-00002');
      expect(extractInvoiceNumber('no invoice here')).toBeNull();
    });
  });

  describe('classifyStatementCode', () => {
    it('classifies debit and paynow rails', () => {
      expect(classifyStatementCode('TDD')).toEqual({
        kind: 'debit_success',
        rail: 'debit',
      });
      expect(classifyStatementCode('DRU')).toEqual({
        kind: 'debit_fail',
        rail: 'debit',
      });
      expect(classifyStatementCode('PIS')).toEqual({
        kind: 'paynow_success',
        rail: 'paynow',
      });
      expect(classifyStatementCode('PIF')).toEqual({
        kind: 'paynow_fail',
        rail: 'paynow',
      });
      expect(classifyStatementCode('PNA').kind).toBe('ignore');
    });
  });

  describe('classifySuccessAgainstInvoice', () => {
    it('returns match codes from invoice snapshot', () => {
      expect(classifySuccessAgainstInvoice(null)).toBe('SUCCESS_NO_INVOICE');
      expect(
        classifySuccessAgainstInvoice(
          inv({ invoice_number: 'INV-2026-00001', status: 'paid', amount_paid: 100, amount_due: 0 })
        )
      ).toBe('MATCHED_PAID_OK');
      expect(
        classifySuccessAgainstInvoice(
          inv({ invoice_number: 'INV-2026-00002', status: 'paid', amount_paid: 100, amount_due: 100 })
        )
      ).toBe('MATCHED_PAID_DUE_DRIFT');
      expect(
        classifySuccessAgainstInvoice(
          inv({ invoice_number: 'INV-2026-00003', status: 'sent', amount_paid: 0, amount_due: 100 })
        )
      ).toBe('MATCHED_INVOICE_NOT_PAID');
      expect(
        classifySuccessAgainstInvoice(
          inv({ invoice_number: 'INV-2026-00004', status: 'partial', amount_paid: 50, amount_due: 50 })
        )
      ).toBe('MATCHED_PARTIAL_OR_UNPAID_STATUS');
    });
  });

  describe('classifyFailAgainstInvoice', () => {
    it('distinguishes paid vs unpaid invoices on fail lines', () => {
      expect(classifyFailAgainstInvoice(null)).toBe('FAIL_NO_INVOICE');
      expect(
        classifyFailAgainstInvoice(inv({ invoice_number: 'INV-2026-00001', status: 'paid' }))
      ).toBe('FAIL_BUT_INVOICE_PAID');
      expect(
        classifyFailAgainstInvoice(inv({ invoice_number: 'INV-2026-00001', status: 'sent' }))
      ).toBe('FAIL_INVOICE_UNPAID_OK');
    });
  });

  describe('resolveInvoiceFromMaps', () => {
    it('resolves by number and paynow ref / uuid', () => {
      const a = inv({
        invoice_number: 'INV-2026-00061',
        paynow_transaction_ref: 'cc82fe40-39ee-48b0-b199-f8edea31ded9',
      });
      const byNum = new Map([[a.invoice_number, a]]);
      const byRef = new Map([[a.paynow_transaction_ref!, a]]);

      expect(resolveInvoiceFromMaps('INV-2026-00061', '', byNum, byRef)?.invoice_number).toBe(
        'INV-2026-00061'
      );
      expect(
        resolveInvoiceFromMaps(
          null,
          'CT-cc82fe40-39ee-48b0-b199-f8edea31ded9-1785553207191',
          byNum,
          byRef
        )?.invoice_number
      ).toBe('INV-2026-00061');
    });
  });

  describe('flagPossibleDoubleCollects', () => {
    it('flags invoices with both paynow and debit successes', () => {
      const rows: StatementAuditRow[] = [
        buildAuditRow({
          date: '2026-08-01',
          tx: tx({ transactionCode: 'PIS', amount: 517.5, description: 'INV-2026-00061' }),
          rail: 'paynow',
          match: 'MATCHED_PAID_OK',
          inv: inv({
            invoice_number: 'INV-2026-00061',
            status: 'paid',
            amount_paid: 517.5,
            amount_due: 0,
          }),
          invoiceNumber: 'INV-2026-00061',
        }),
        buildAuditRow({
          date: '2026-08-05',
          tx: tx({ transactionCode: 'TDD', amount: 517.5, description: 'INV-2026-00061 - X' }),
          rail: 'debit',
          match: 'MATCHED_PAID_OK',
          inv: inv({
            invoice_number: 'INV-2026-00061',
            status: 'paid',
            amount_paid: 517.5,
            amount_due: 0,
          }),
          invoiceNumber: 'INV-2026-00061',
        }),
        buildAuditRow({
          date: '2026-08-05',
          tx: tx({ transactionCode: 'TDD', amount: 517.5, description: 'INV-2026-00057' }),
          rail: 'debit',
          match: 'MATCHED_PAID_OK',
          inv: inv({
            invoice_number: 'INV-2026-00057',
            status: 'paid',
            amount_paid: 517.5,
            amount_due: 0,
          }),
          invoiceNumber: 'INV-2026-00057',
        }),
      ];

      flagPossibleDoubleCollects(rows);
      expect(rows[0].possibleDoubleCollect).toBe(true);
      expect(rows[1].possibleDoubleCollect).toBe(true);
      expect(rows[2].possibleDoubleCollect).toBe(false);

      const summary = summarizeAudit({
        successes: rows,
        failures: [],
        dayErrors: [],
        daysScanned: 2,
        daysOk: 2,
      });
      expect(summary.possibleDoubleCollect).toBe(1);
      expect(summary.matchedPaidOk).toBe(3);
    });
  });

  describe('runStatementAudit', () => {
    it('sweeps fixture statements and classifies rows', async () => {
      const paid = inv({
        invoice_number: 'INV-2026-00044',
        status: 'paid',
        amount_paid: 517.5,
        amount_due: 0,
        paynow_transaction_ref: 'CT-20260730-kqic0ucb',
      });
      const drift = inv({
        invoice_number: 'INV-2026-00002',
        status: 'paid',
        amount_paid: 899,
        amount_due: 899,
        paynow_transaction_ref: 'CT-INV2026-00002',
      });

      const report = await runStatementAudit(
        { from: '2026-08-05', to: '2026-08-05', rails: 'all' },
        {
          loadInvoices: async () => [paid, drift],
          fetchStatement: async () => ({
            success: true,
            transactions: [
              tx({
                transactionCode: 'PNC',
                amount: 517.5,
                description: 'CircleTel - INV-2026-00044',
                reference: 'CT-20260730-kqic0ucb',
              }),
              tx({
                transactionCode: 'TDD',
                amount: 517.5,
                description: 'INV-2026-00066 - CLINIC',
              }),
              tx({
                transactionCode: 'PNU',
                amount: 0,
                description: 'CircleTel - INV-2026-00044',
                reference: 'CT-20260730-kqic0ucb',
              }),
              tx({ transactionCode: 'PNA', amount: 0, description: 'ignore me' }),
            ],
          }),
        }
      );

      expect(report.summary.successLines).toBe(2);
      expect(report.summary.failLines).toBe(1);
      expect(report.successes.find((s) => s.invoiceNumber === 'INV-2026-00044')?.match).toBe(
        'MATCHED_PAID_OK'
      );
      expect(report.successes.find((s) => s.invoiceNumber === 'INV-2026-00066')?.match).toBe(
        'SUCCESS_NO_INVOICE'
      );
      expect(report.failures[0].match).toBe('FAIL_BUT_INVOICE_PAID');
    });

    it('filters by rails=paynow', async () => {
      const report = await runStatementAudit(
        { from: '2026-08-05', to: '2026-08-05', rails: 'paynow' },
        {
          loadInvoices: async () => [],
          fetchStatement: async () => ({
            success: true,
            transactions: [
              tx({ transactionCode: 'TDD', amount: 100, description: 'INV-2026-00001' }),
              tx({ transactionCode: 'PIS', amount: 100, description: 'INV-2026-00002' }),
            ],
          }),
        }
      );
      expect(report.successes).toHaveLength(1);
      expect(report.successes[0].rail).toBe('paynow');
    });
  });
});
