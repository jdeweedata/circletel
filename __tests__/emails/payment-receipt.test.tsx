/**
 * Unit Tests for Payment Receipt Email Template
 *
 * Tests the payment receipt email template component structure.
 *
 * @module __tests__/emails/payment-receipt.test
 */

import React from 'react';
import { create, ReactTestRenderer } from 'react-test-renderer';
import PaymentReceiptEmail from '@/emails/templates/consumer/payment-receipt';

describe('PaymentReceiptEmail', () => {
  const defaultProps = {
    customerName: 'John Doe',
    invoiceNumber: 'INV-2025-001',
    paymentAmount: 'R 799.00',
    paymentDate: '2 December 2025',
    paymentMethod: 'Credit Card',
    paymentReference: 'NC-123456789',
    remainingBalance: 'R 0.00',
    invoiceUrl: 'https://www.circletel.co.za/dashboard/invoices/123',
  };

  // ============================================================================
  // Component Rendering Tests
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render without throwing errors', () => {
      expect(() => {
        create(<PaymentReceiptEmail {...defaultProps} />);
      }).not.toThrow();
    });

    it('should render with all required props', () => {
      expect(() => {
        create(<PaymentReceiptEmail {...defaultProps} />);
      }).not.toThrow();
    });

    it('should accept all props without errors', () => {
      const tree = create(<PaymentReceiptEmail {...defaultProps} />);
      expect(tree.toJSON()).not.toBeNull();
    });
  });

  // ============================================================================
  // Props Validation Tests
  // ============================================================================

  describe('Props Handling', () => {
    it('should handle customer name prop', () => {
      const tree = create(
        <PaymentReceiptEmail {...defaultProps} customerName="Jane Smith" />
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Jane Smith');
    });

    it('should handle invoice number prop', () => {
      const tree = create(
        <PaymentReceiptEmail {...defaultProps} invoiceNumber="INV-2025-999" />
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('INV-2025-999');
    });

    it('should handle payment amount prop', () => {
      const tree = create(
        <PaymentReceiptEmail {...defaultProps} paymentAmount="R 1,500.00" />
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('R 1,500.00');
    });

    it('should handle payment method prop', () => {
      const tree = create(
        <PaymentReceiptEmail {...defaultProps} paymentMethod="EFT" />
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('EFT');
    });

    it('should handle payment reference prop', () => {
      const tree = create(
        <PaymentReceiptEmail {...defaultProps} paymentReference="REF-999" />
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('REF-999');
    });
  });

  // ============================================================================
  // Balance Display Logic Tests
  // ============================================================================

  describe('Balance Display Logic', () => {
    it('should show Paid in Full for zero balance', () => {
      const tree = create(
        <PaymentReceiptEmail {...defaultProps} remainingBalance="R 0.00" />
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Paid in Full');
    });

    it('should show Paid in Full for R0.00 balance', () => {
      const tree = create(
        <PaymentReceiptEmail {...defaultProps} remainingBalance="R0.00" />
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Paid in Full');
    });

    it('should show remaining balance for partial payments', () => {
      const tree = create(
        <PaymentReceiptEmail {...defaultProps} remainingBalance="R 500.00" />
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('R 500.00');
    });

    it('should show outstanding balance warning for partial payments', () => {
      const tree = create(
        <PaymentReceiptEmail {...defaultProps} remainingBalance="R 250.00" />
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('outstanding');
    });
  });

  // ============================================================================
  // Payment Method Variations Tests
  // ============================================================================

  describe('Payment Method Variations', () => {
    const paymentMethods = [
      'Credit Card',
      'EFT',
      'Ozow',
      'Capitec Pay',
      'Mobicred',
      'Bank Transfer',
    ];

    paymentMethods.forEach((method) => {
      it(`should render with ${method} payment method`, () => {
        const tree = create(
          <PaymentReceiptEmail {...defaultProps} paymentMethod={method} />
        );
        const json = JSON.stringify(tree.toJSON());
        expect(json).toContain(method);
      });
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle long customer names', () => {
      const longName = 'A Very Long Customer Name That Might Cause Layout Issues';
      const tree = create(
        <PaymentReceiptEmail {...defaultProps} customerName={longName} />
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain(longName);
    });

    it('should handle large payment amounts', () => {
      const largeAmount = 'R 1,234,567.89';
      const tree = create(
        <PaymentReceiptEmail {...defaultProps} paymentAmount={largeAmount} />
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain(largeAmount);
    });

    it('should handle long reference numbers', () => {
      const longRef = 'NC-1234567890123456789012345';
      const tree = create(
        <PaymentReceiptEmail {...defaultProps} paymentReference={longRef} />
      );
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain(longRef);
    });

    it('should handle empty strings gracefully', () => {
      expect(() => {
        create(
          <PaymentReceiptEmail
            customerName=""
            invoiceNumber=""
            paymentAmount=""
            paymentDate=""
            paymentMethod=""
            paymentReference=""
            remainingBalance=""
            invoiceUrl=""
          />
        );
      }).not.toThrow();
    });
  });

  // ============================================================================
  // Component Structure Tests
  // ============================================================================

  describe('Component Structure', () => {
    it('should return a valid React element', () => {
      const element = <PaymentReceiptEmail {...defaultProps} />;
      expect(React.isValidElement(element)).toBe(true);
    });

    it('should have the correct display name or type', () => {
      expect(PaymentReceiptEmail).toBeDefined();
      expect(typeof PaymentReceiptEmail).toBe('function');
    });

    it('should include invoice URL in output', () => {
      const tree = create(<PaymentReceiptEmail {...defaultProps} />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('circletel.co.za');
    });
  });
});
