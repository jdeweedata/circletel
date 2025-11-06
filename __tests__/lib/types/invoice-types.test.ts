/**
 * Unit Tests for Invoice Type Utilities
 *
 * Tests invoice utility functions and type guards.
 *
 * @module __tests__/lib/types/invoice-types.test
 */

import {
  isInvoiceStatus,
  isInvoiceType,
  calculateInvoiceTotals,
  isInvoiceOverdue,
  getDaysOverdue,
  type InvoiceLineItem,
  type Invoice,
  type InvoiceSummary
} from '@/lib/types/invoice.types';

describe('Invoice Type Guards', () => {
  // ============================================================================
  // isInvoiceStatus Tests
  // ============================================================================

  describe('isInvoiceStatus', () => {
    it('should return true for valid invoice statuses', () => {
      const validStatuses = [
        'draft',
        'sent',
        'unpaid',
        'partial',
        'paid',
        'overdue',
        'cancelled',
        'refunded'
      ];

      validStatuses.forEach((status) => {
        expect(isInvoiceStatus(status)).toBe(true);
      });
    });

    it('should return false for invalid invoice statuses', () => {
      const invalidStatuses = ['invalid', 'PAID', '', null, undefined, 123];

      invalidStatuses.forEach((status) => {
        expect(isInvoiceStatus(status)).toBe(false);
      });
    });
  });

  // ============================================================================
  // isInvoiceType Tests
  // ============================================================================

  describe('isInvoiceType', () => {
    it('should return true for valid invoice types', () => {
      const validTypes = [
        'recurring',
        'installation',
        'pro_rata',
        'equipment',
        'adjustment',
        'b2b_contract'
      ];

      validTypes.forEach((type) => {
        expect(isInvoiceType(type)).toBe(true);
      });
    });

    it('should return false for invalid invoice types', () => {
      const invalidTypes = ['invalid', 'RECURRING', '', null, undefined];

      invalidTypes.forEach((type) => {
        expect(isInvoiceType(type)).toBe(false);
      });
    });
  });
});

// ============================================================================
// Invoice Utility Function Tests
// ============================================================================

describe('Invoice Utility Functions', () => {
  describe('calculateInvoiceTotals', () => {
    const mockLineItems: InvoiceLineItem[] = [
      {
        description: 'Fibre 100 - Monthly',
        quantity: 1,
        unit_price: 799.0,
        amount: 799.0,
        type: 'service'
      },
      {
        description: 'Installation Fee',
        quantity: 1,
        unit_price: 500.0,
        amount: 500.0,
        type: 'installation'
      }
    ];

    it('should calculate correct subtotal', () => {
      const totals = calculateInvoiceTotals(mockLineItems);

      expect(totals.subtotal).toBe(1299.0);
    });

    it('should calculate correct VAT (15%)', () => {
      const totals = calculateInvoiceTotals(mockLineItems);

      expect(totals.vat_amount).toBe(194.85); // 1299 * 0.15
    });

    it('should calculate correct total', () => {
      const totals = calculateInvoiceTotals(mockLineItems);

      expect(totals.total_amount).toBe(1493.85); // 1299 + 194.85
    });

    it('should handle custom VAT rate', () => {
      const totals = calculateInvoiceTotals(mockLineItems, 0.2); // 20% VAT

      expect(totals.vat_amount).toBe(259.8); // 1299 * 0.2
      expect(totals.total_amount).toBe(1558.8); // 1299 + 259.8
    });

    it('should handle empty line items', () => {
      const totals = calculateInvoiceTotals([]);

      expect(totals.subtotal).toBe(0);
      expect(totals.vat_amount).toBe(0);
      expect(totals.total_amount).toBe(0);
    });

    it('should handle zero VAT rate', () => {
      const totals = calculateInvoiceTotals(mockLineItems, 0);

      expect(totals.vat_amount).toBe(0);
      expect(totals.total_amount).toBe(1299.0);
    });

    it('should round to 2 decimal places', () => {
      const lineItems: InvoiceLineItem[] = [
        {
          description: 'Test',
          quantity: 1,
          unit_price: 99.999,
          amount: 99.999,
          type: 'service'
        }
      ];

      const totals = calculateInvoiceTotals(lineItems);

      expect(totals.subtotal).toBe(100.0); // Rounded
      expect(totals.vat_amount).toBe(15.0); // 100 * 0.15
    });
  });

  // ============================================================================
  // isInvoiceOverdue Tests
  // ============================================================================

  describe('isInvoiceOverdue', () => {
    it('should return true for unpaid invoice past due date', () => {
      const invoice: InvoiceSummary = {
        id: '123',
        invoice_number: 'INV-001',
        customer_id: 'cust-1',
        invoice_type: 'recurring',
        status: 'unpaid',
        total_amount: 799.0,
        amount_paid: 0,
        amount_due: 799.0,
        invoice_date: new Date('2025-10-01'),
        due_date: new Date('2025-10-07'), // Past due
        is_overdue: false
      };

      expect(isInvoiceOverdue(invoice)).toBe(true);
    });

    it('should return false for paid invoice', () => {
      const invoice: InvoiceSummary = {
        id: '123',
        invoice_number: 'INV-001',
        customer_id: 'cust-1',
        invoice_type: 'recurring',
        status: 'paid',
        total_amount: 799.0,
        amount_paid: 799.0,
        amount_due: 0,
        invoice_date: new Date('2025-10-01'),
        due_date: new Date('2025-10-07'),
        is_overdue: false
      };

      expect(isInvoiceOverdue(invoice)).toBe(false);
    });

    it('should return false for cancelled invoice', () => {
      const invoice: InvoiceSummary = {
        id: '123',
        invoice_number: 'INV-001',
        customer_id: 'cust-1',
        invoice_type: 'recurring',
        status: 'cancelled',
        total_amount: 799.0,
        amount_paid: 0,
        amount_due: 799.0,
        invoice_date: new Date('2025-10-01'),
        due_date: new Date('2025-10-07'),
        is_overdue: false
      };

      expect(isInvoiceOverdue(invoice)).toBe(false);
    });

    it('should return false for invoice not yet due', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const invoice: InvoiceSummary = {
        id: '123',
        invoice_number: 'INV-001',
        customer_id: 'cust-1',
        invoice_type: 'recurring',
        status: 'unpaid',
        total_amount: 799.0,
        amount_paid: 0,
        amount_due: 799.0,
        invoice_date: new Date(),
        due_date: futureDate,
        is_overdue: false
      };

      expect(isInvoiceOverdue(invoice)).toBe(false);
    });
  });

  // ============================================================================
  // getDaysOverdue Tests
  // ============================================================================

  describe('getDaysOverdue', () => {
    it('should return 0 for paid invoice', () => {
      const invoice: InvoiceSummary = {
        id: '123',
        invoice_number: 'INV-001',
        customer_id: 'cust-1',
        invoice_type: 'recurring',
        status: 'paid',
        total_amount: 799.0,
        amount_paid: 799.0,
        amount_due: 0,
        invoice_date: new Date('2025-10-01'),
        due_date: new Date('2025-10-07'),
        is_overdue: false
      };

      expect(getDaysOverdue(invoice)).toBe(0);
    });

    it('should return 0 for invoice not yet due', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const invoice: InvoiceSummary = {
        id: '123',
        invoice_number: 'INV-001',
        customer_id: 'cust-1',
        invoice_type: 'recurring',
        status: 'unpaid',
        total_amount: 799.0,
        amount_paid: 0,
        amount_due: 799.0,
        invoice_date: new Date(),
        due_date: futureDate,
        is_overdue: false
      };

      expect(getDaysOverdue(invoice)).toBe(0);
    });

    it('should calculate days overdue correctly', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 days ago

      const invoice: InvoiceSummary = {
        id: '123',
        invoice_number: 'INV-001',
        customer_id: 'cust-1',
        invoice_type: 'recurring',
        status: 'overdue',
        total_amount: 799.0,
        amount_paid: 0,
        amount_due: 799.0,
        invoice_date: pastDate,
        due_date: pastDate,
        is_overdue: true
      };

      const daysOverdue = getDaysOverdue(invoice);
      expect(daysOverdue).toBeGreaterThanOrEqual(7);
      expect(daysOverdue).toBeLessThanOrEqual(8); // Account for timing
    });
  });
});
