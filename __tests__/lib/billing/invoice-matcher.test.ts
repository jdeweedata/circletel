// __tests__/lib/billing/invoice-matcher.test.ts
import { matchInvoiceByReference, type InvoiceMatchResult } from '@/lib/billing/invoice-matcher';

const mockSingle = jest.fn();
const mockFrom = jest.fn();

function queryChain() {
  const chain: Record<string, unknown> = {};
  chain.eq = jest.fn(() => chain);
  chain.in = jest.fn(() => chain);
  chain.order = jest.fn(() => chain);
  chain.limit = jest.fn(() => chain);
  chain.select = jest.fn(() => chain);
  chain.single = mockSingle;
  return chain;
}

const mockSupabase = {
  from: mockFrom,
} as any;

describe('matchInvoiceByReference', () => {
  beforeEach(() => {
    mockFrom.mockImplementation(() => queryChain());
  });

  describe('matching by invoice number', () => {
    it('matches invoice when CT-INV reference contains valid invoice number', async () => {
      const mockInvoice = {
        id: 'inv-uuid-123',
        invoice_number: 'INV-2026-00002',
        status: 'sent',
        total_amount: 899.00,
      };

      mockSingle.mockResolvedValueOnce({ data: mockInvoice, error: null });

      const result = await matchInvoiceByReference(
        'CT-INV2026-00002-1771356357084',
        mockSupabase
      );

      expect(result).toEqual<InvoiceMatchResult>({
        matched: true,
        invoice: mockInvoice,
        matchMethod: 'invoice_number',
        matchConfidence: 'high',
      });

      expect(mockFrom).toHaveBeenCalledWith('customer_invoices');
    });

    it('returns not matched when invoice number not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });
      mockSingle.mockResolvedValueOnce({ data: null, error: null }); // fallback also fails

      const result = await matchInvoiceByReference(
        'CT-INV2026-99999-1771356357084',
        mockSupabase
      );

      expect(result.matched).toBe(false);
      expect(result.invoice).toBeUndefined();
    });
  });

  describe('fallback to paynow_transaction_ref', () => {
    it('falls back to paynow_transaction_ref when invoice number not found', async () => {
      const mockInvoice = {
        id: 'inv-uuid-456',
        invoice_number: 'INV-2026-00003',
        status: 'sent',
        paynow_transaction_ref: 'CT-20260227-52bd7f62',
      };

      // First call (by invoice_number) returns nothing
      mockSingle.mockResolvedValueOnce({ data: null, error: null });
      // Second call (by paynow_transaction_ref) returns invoice
      mockSingle.mockResolvedValueOnce({ data: mockInvoice, error: null });

      const result = await matchInvoiceByReference(
        'CT-20260227-52bd7f62',
        mockSupabase
      );

      expect(result).toEqual<InvoiceMatchResult>({
        matched: true,
        invoice: mockInvoice,
        matchMethod: 'paynow_transaction_ref',
        matchConfidence: 'high',
      });
    });
  });

  describe('account number as primary key', () => {
    it('matches a sent invoice by embedded account number and exact name', async () => {
      const customer = {
        id: 'cust-prins',
        first_name: 'Prins',
        last_name: 'Mhlanga',
        business_name: null,
        account_number: 'CT-2025-00030',
      };
      const invoice = {
        id: 'inv-81',
        invoice_number: 'INV-2026-00081',
        status: 'sent',
        customer_id: 'cust-prins',
      };

      mockSingle
        .mockResolvedValueOnce({ data: customer, error: null })
        .mockResolvedValueOnce({ data: invoice, error: null });

      const result = await matchInvoiceByReference(
        'EFT Prins Mhlanga CT-2025-00030',
        mockSupabase,
        { payerName: 'Prins Mhlanga' }
      );

      expect(result.matched).toBe(true);
      expect(result.matchMethod).toBe('account_number');
      expect(result.matchConfidence).toBe('high');
      expect(result.invoice?.invoice_number).toBe('INV-2026-00081');
    });

    it('rejects account match when payer name does not match exactly', async () => {
      const customer = {
        id: 'cust-prins',
        first_name: 'Prins',
        last_name: 'Mhlanga',
        business_name: null,
        account_number: 'CT-2025-00030',
      };
      mockSingle.mockResolvedValueOnce({ data: customer, error: null });

      const result = await matchInvoiceByReference(
        'CT-2025-00030',
        mockSupabase,
        { payerName: 'Shaun Robertson' }
      );

      expect(result.matched).toBe(false);
      expect(result.error).toBe('name_mismatch');
    });

    it('returns low confidence when account matches but payer name is missing', async () => {
      const customer = {
        id: 'cust-prins',
        first_name: 'Prins',
        last_name: 'Mhlanga',
        business_name: null,
        account_number: 'CT-2025-00030',
      };
      const invoice = {
        id: 'inv-81',
        invoice_number: 'INV-2026-00081',
        status: 'sent',
        customer_id: 'cust-prins',
      };
      mockSingle
        .mockResolvedValueOnce({ data: customer, error: null })
        .mockResolvedValueOnce({ data: invoice, error: null });

      const result = await matchInvoiceByReference('CT-2025-00030', mockSupabase);

      expect(result.matched).toBe(true);
      expect(result.matchConfidence).toBe('low');
    });
  });

  describe('error handling', () => {
    it('returns not matched with error on database error', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const result = await matchInvoiceByReference('CT-INV2026-00002-123', mockSupabase);

      expect(result.matched).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });
  });
});
