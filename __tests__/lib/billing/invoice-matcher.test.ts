// __tests__/lib/billing/invoice-matcher.test.ts
import { matchInvoiceByReference, type InvoiceMatchResult } from '@/lib/billing/invoice-matcher';

// Mock Supabase client
const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

const mockSupabase = {
  from: mockFrom,
} as any;

describe('matchInvoiceByReference', () => {
  beforeEach(() => {
    // Reinitialize chain implementations (resetMocks: true in jest.config.js clears them)
    mockEq.mockImplementation(() => ({ single: mockSingle }));
    mockSelect.mockImplementation(() => ({ eq: mockEq }));
    mockFrom.mockImplementation(() => ({ select: mockSelect }));
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
      });

      expect(mockFrom).toHaveBeenCalledWith('customer_invoices');
      expect(mockEq).toHaveBeenCalledWith('invoice_number', 'INV-2026-00002');
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
      });
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
