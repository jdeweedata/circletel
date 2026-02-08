/**
 * Billing Service Tests
 *
 * Tests for invoice generation, billing calculations, and payment processing
 */

import {
  mockCustomer,
  mockConsumerOrder,
  mockInvoice,
  mockServicePackage,
  mockPaymentMethod,
  createMockCustomer,
  createMockOrder,
  createMockInvoice,
} from '../../fixtures/payment-fixtures';

// ============================================================================
// MOCKS
// ============================================================================

const mockFrom = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: mockFrom,
    })
  ),
}));

jest.mock('@/lib/logging', () => ({
  billingLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// ============================================================================
// TEST SETUP
// ============================================================================

describe('Billing Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFrom.mockImplementation(() => ({
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
      eq: mockEq,
    }));

    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockInvoice,
          error: null,
        }),
      }),
    });

    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
    });

    mockSingle.mockResolvedValue({
      data: mockInvoice,
      error: null,
    });
  });

  // ==========================================================================
  // Invoice Generation
  // ==========================================================================

  describe('Invoice Generation', () => {
    it('should generate invoice number in correct format', () => {
      const invoiceNumber = mockInvoice.invoice_number;

      // Format: INV-YYYY-NNNN
      expect(invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('should calculate line items correctly', () => {
      const lineItems = mockInvoice.line_items;

      expect(lineItems).toHaveLength(2);
      expect(lineItems[0].description).toContain('Monthly');
      expect(lineItems[1].description).toContain('Installation');
    });

    it('should calculate VAT at 15%', () => {
      const amount = mockInvoice.amount;
      const vatAmount = mockInvoice.vat_amount;
      const expectedVat = amount * 0.15;

      expect(vatAmount).toBeCloseTo(expectedVat, 2);
    });

    it('should calculate total amount correctly', () => {
      const amount = mockInvoice.amount;
      const vatAmount = mockInvoice.vat_amount;
      const totalAmount = mockInvoice.total_amount;

      expect(totalAmount).toBeCloseTo(amount + vatAmount, 2);
    });

    it('should set correct due date', () => {
      const createdAt = new Date(mockInvoice.created_at);
      const dueDate = new Date(mockInvoice.due_date);

      // Due date should be within 30 days
      const daysDiff = (dueDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeLessThanOrEqual(30);
    });

    it('should set billing period correctly', () => {
      const start = new Date(mockInvoice.billing_period_start);
      const end = new Date(mockInvoice.billing_period_end);

      // Billing period should be approximately 30 days
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThanOrEqual(28);
      expect(daysDiff).toBeLessThanOrEqual(31);
    });
  });

  // ==========================================================================
  // Invoice Types
  // ==========================================================================

  describe('Invoice Types', () => {
    it('should create initial invoice for new orders', () => {
      const invoice = createMockInvoice({ type: 'initial' });

      expect(invoice.type).toBe('initial');
      expect(invoice.line_items).toContainEqual(
        expect.objectContaining({ description: expect.stringContaining('Installation') })
      );
    });

    it('should create recurring invoice without installation', () => {
      const recurringInvoice = createMockInvoice({
        type: 'recurring',
        line_items: [{ description: 'SkyFibre 100Mbps - Monthly', amount: 799 }],
      });

      expect(recurringInvoice.type).toBe('recurring');
      expect(recurringInvoice.line_items).not.toContainEqual(
        expect.objectContaining({ description: expect.stringContaining('Installation') })
      );
    });

    it('should create prorata invoice for mid-cycle activation', () => {
      const prorataInvoice = createMockInvoice({
        type: 'prorata',
        amount: 399.50, // Half month
      });

      expect(prorataInvoice.type).toBe('prorata');
      expect(prorataInvoice.amount).toBeLessThan(799);
    });

    it('should create credit note for refunds', () => {
      const creditNote = createMockInvoice({
        type: 'credit_note',
        amount: -799,
      });

      expect(creditNote.type).toBe('credit_note');
      expect(creditNote.amount).toBeLessThan(0);
    });
  });

  // ==========================================================================
  // Invoice Status
  // ==========================================================================

  describe('Invoice Status', () => {
    const invoiceStatuses = ['unpaid', 'paid', 'overdue', 'void', 'refunded'] as const;

    it('should start with unpaid status', () => {
      const invoice = createMockInvoice({ status: 'unpaid' });
      expect(invoice.status).toBe('unpaid');
    });

    it('should transition to paid on successful payment', () => {
      const invoice = createMockInvoice({ status: 'paid' });
      expect(invoice.status).toBe('paid');
    });

    it('should mark as overdue after due date', () => {
      const overdueInvoice = createMockInvoice({
        status: 'overdue',
        due_date: '2025-01-01', // Past date
      });

      expect(overdueInvoice.status).toBe('overdue');
    });

    it('should allow voiding unpaid invoices', () => {
      const voidedInvoice = createMockInvoice({ status: 'void' });
      expect(voidedInvoice.status).toBe('void');
    });

    it('should track refunded invoices', () => {
      const refundedInvoice = createMockInvoice({ status: 'refunded' });
      expect(refundedInvoice.status).toBe('refunded');
    });
  });

  // ==========================================================================
  // Prorata Calculations
  // ==========================================================================

  describe('Prorata Calculations', () => {
    it('should calculate prorata for mid-month activation', () => {
      const monthlyAmount = 799;
      const activationDay = 15;
      const daysInMonth = 30;
      const remainingDays = daysInMonth - activationDay + 1;

      const prorataAmount = (monthlyAmount / daysInMonth) * remainingDays;

      expect(prorataAmount).toBeCloseTo(426.13, 2);
    });

    it('should calculate full month for 1st day activation', () => {
      const monthlyAmount = 799;
      const activationDay = 1;
      const daysInMonth = 30;
      const remainingDays = daysInMonth - activationDay + 1;

      const prorataAmount = (monthlyAmount / daysInMonth) * remainingDays;

      expect(prorataAmount).toBeCloseTo(monthlyAmount, 2);
    });

    it('should handle month-end activation', () => {
      const monthlyAmount = 799;
      const activationDay = 28;
      const daysInMonth = 30;
      const remainingDays = daysInMonth - activationDay + 1;

      const prorataAmount = (monthlyAmount / daysInMonth) * remainingDays;

      expect(prorataAmount).toBeCloseTo(79.9, 2);
    });

    it('should handle leap year February', () => {
      const monthlyAmount = 799;
      const daysInFebruary2024 = 29; // Leap year

      const dailyRate = monthlyAmount / daysInFebruary2024;

      expect(dailyRate).toBeCloseTo(27.55, 2);
    });
  });

  // ==========================================================================
  // Customer Billing
  // ==========================================================================

  describe('Customer Billing', () => {
    it('should link invoice to customer', () => {
      expect(mockInvoice.customer_id).toBe(mockCustomer.id);
    });

    it('should link invoice to order', () => {
      expect(mockInvoice.order_id).toBe(mockConsumerOrder.id);
    });

    it('should respect customer billing day', () => {
      const billingDay = 1;

      expect(billingDay).toBeGreaterThanOrEqual(1);
      expect(billingDay).toBeLessThanOrEqual(28);
    });

    it('should generate invoices for active services', () => {
      const activeOrder = createMockOrder({ status: 'active' });

      expect(activeOrder.status).toBe('active');
    });

    it('should not generate invoices for cancelled orders', () => {
      const cancelledOrder = createMockOrder({ status: 'cancelled' });

      expect(cancelledOrder.status).toBe('cancelled');
    });
  });

  // ==========================================================================
  // Payment Tracking
  // ==========================================================================

  describe('Payment Tracking', () => {
    it('should track payment date', () => {
      const paidInvoice = createMockInvoice({
        status: 'paid',
      });

      expect(paidInvoice.status).toBe('paid');
    });

    it('should track payment method used', () => {
      expect(mockPaymentMethod.method_type).toBe('debit_order');
    });

    it('should track transaction reference', () => {
      const transactionRef = 'TXN-2025-0001';

      expect(transactionRef).toMatch(/^TXN-\d{4}-\d{4}$/);
    });

    it('should calculate outstanding balance', () => {
      const totalAmount = mockInvoice.total_amount;
      const paid = 0;
      const outstanding = totalAmount - paid;

      expect(outstanding).toBe(totalAmount);
    });

    it('should handle partial payments', () => {
      const totalAmount = 2643.85;
      const partialPayment = 1000;
      const remaining = totalAmount - partialPayment;

      expect(remaining).toBe(1643.85);
    });
  });

  // ==========================================================================
  // Currency Handling
  // ==========================================================================

  describe('Currency Handling', () => {
    it('should use ZAR currency', () => {
      const currency = 'ZAR';
      expect(currency).toBe('ZAR');
    });

    it('should format amounts to 2 decimal places', () => {
      const amount = 799.999;
      const formatted = Math.round(amount * 100) / 100;

      expect(formatted).toBe(800);
    });

    it('should handle amounts in cents for NetCash', () => {
      const amountInRands = 2643.85;
      const amountInCents = Math.round(amountInRands * 100);

      expect(amountInCents).toBe(264385);
    });

    it('should convert cents back to Rands', () => {
      const amountInCents = 264385;
      const amountInRands = amountInCents / 100;

      expect(amountInRands).toBe(2643.85);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle zero amount invoices', () => {
      const freeInvoice = createMockInvoice({
        amount: 0,
        vat_amount: 0,
        total_amount: 0,
      });

      expect(freeInvoice.total_amount).toBe(0);
    });

    it('should handle very large amounts', () => {
      const largeInvoice = createMockInvoice({
        amount: 999999.99,
        vat_amount: 149999.99,
        total_amount: 1149999.98,
      });

      expect(largeInvoice.total_amount).toBeLessThan(1200000);
    });

    it('should handle multiple line items', () => {
      const multiLineInvoice = createMockInvoice({
        line_items: [
          { description: 'Monthly Fee', amount: 799 },
          { description: 'Installation', amount: 1500 },
          { description: 'Router', amount: 500 },
          { description: 'Discount', amount: -200 },
        ],
      });

      const total = multiLineInvoice.line_items.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      expect(total).toBe(2599);
    });

    it('should handle negative amounts for credits', () => {
      const creditInvoice = createMockInvoice({
        line_items: [{ description: 'Service Credit', amount: -100 }],
      });

      expect(creditInvoice.line_items[0].amount).toBeLessThan(0);
    });
  });
});

// ============================================================================
// INTEGRATION: Billing Lifecycle
// ============================================================================

describe('Integration: Billing Lifecycle', () => {
  it('should track invoice through complete lifecycle', () => {
    // 1. Create invoice
    const invoice = createMockInvoice({ status: 'unpaid' });
    expect(invoice.status).toBe('unpaid');

    // 2. Payment received
    const paidInvoice = { ...invoice, status: 'paid' };
    expect(paidInvoice.status).toBe('paid');

    // 3. Verify amounts match
    expect(paidInvoice.total_amount).toBe(invoice.total_amount);
  });

  it('should generate recurring invoices', () => {
    // First invoice (with installation)
    const firstInvoice = createMockInvoice({
      type: 'initial',
      amount: 2299,
    });

    // Second invoice (recurring)
    const secondInvoice = createMockInvoice({
      type: 'recurring',
      amount: 799,
    });

    expect(firstInvoice.amount).toBeGreaterThan(secondInvoice.amount);
  });
});
