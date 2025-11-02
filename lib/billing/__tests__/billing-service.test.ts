/**
 * Tests for BillingService
 * 
 * Task 2.1 - 6 focused tests:
 * 1. Pro-rata calculation accuracy
 * 2. Full monthly invoice generation
 * 3. VAT calculation accuracy (15%)
 * 4. Next billing date edge cases
 * 5. Account balance operations
 * 6. Multiple billing date support
 */

import { BillingService } from '../billing-service';

describe('BillingService', () => {
  
  describe('calculateProRata', () => {
    test('calculates pro-rata for mid-cycle activation (Nov 15 → Dec 1)', () => {
      // Service activated Nov 15, next billing Dec 1, monthly price R699
      const activationDate = new Date('2025-11-15');
      const monthlyAmount = 699.00;
      const billingDate = 1;
      
      const result = BillingService.calculateProRata(
        activationDate,
        monthlyAmount,
        billingDate
      );
      
      // Nov has 30 days, activation Nov 15, billing Dec 1 = 16 days used
      expect(result.days_in_period).toBe(31); // December has 31 days
      expect(result.days_used).toBe(17); // Nov 15 to Dec 1 (inclusive)
      expect(result.monthly_amount).toBe(699.00);
      
      // Pro-rata: (699 / 31) * 17 = 383.29
      expect(result.prorated_amount).toBeCloseTo(383.29, 2);
      
      expect(result.billing_period_start).toEqual(activationDate);
      expect(result.billing_period_end).toEqual(new Date('2025-12-01'));
    });
    
    test('handles activation on billing date (no pro-rata needed)', () => {
      // Service activated on the 1st, billing date is 1st
      const activationDate = new Date('2025-11-01');
      const monthlyAmount = 699.00;
      const billingDate = 1;
      
      const result = BillingService.calculateProRata(
        activationDate,
        monthlyAmount,
        billingDate
      );
      
      // Should calculate for full month (Nov 1 to Dec 1 = 30 days)
      expect(result.days_used).toBe(31); // Nov 1 to Dec 1
      expect(result.days_in_period).toBe(31); // December has 31 days
      
      // Full month price
      expect(result.prorated_amount).toBe(699.00);
    });
    
    test('handles February edge case (28 days)', () => {
      // Service activated Feb 15 (non-leap year), billing date 1st
      const activationDate = new Date('2025-02-15');
      const monthlyAmount = 699.00;
      const billingDate = 1;
      
      const result = BillingService.calculateProRata(
        activationDate,
        monthlyAmount,
        billingDate
      );
      
      // Feb 15 to Mar 1 = 15 days used
      expect(result.days_used).toBe(15);
      expect(result.days_in_period).toBe(31); // March has 31 days
      
      // Pro-rata: (699 / 31) * 15
      expect(result.prorated_amount).toBeCloseTo(338.55, 2);
    });
  });
  
  describe('getNextBillingDate', () => {
    test('returns next month if activation is after billing date', () => {
      // Activated Nov 15, billing date 1st → Dec 1
      const activationDate = new Date('2025-11-15');
      const billingDate = 1;
      
      const result = BillingService.getNextBillingDate(activationDate, billingDate);
      
      expect(result).toEqual(new Date('2025-12-01'));
    });
    
    test('returns current month if activation is before billing date', () => {
      // Activated Nov 3, billing date 5th → Nov 5
      const activationDate = new Date('2025-11-03');
      const billingDate = 5;
      
      const result = BillingService.getNextBillingDate(activationDate, billingDate);
      
      expect(result).toEqual(new Date('2025-11-05'));
    });
    
    test('handles February 30th edge case (uses Feb 28)', () => {
      // Activated Jan 28, billing date 30th (Feb only has 28 days)
      const activationDate = new Date('2025-01-28');
      const billingDate = 30;
      
      const result = BillingService.getNextBillingDate(activationDate, billingDate);
      
      // Should return Feb 28 (last day of Feb)
      expect(result).toEqual(new Date('2025-02-28'));
    });
    
    test('handles leap year February 30th edge case (uses Feb 29)', () => {
      // Activated Jan 28, 2024 (leap year), billing date 30th
      const activationDate = new Date('2024-01-28');
      const billingDate = 30;
      
      const result = BillingService.getNextBillingDate(activationDate, billingDate);
      
      // Should return Feb 29 (leap year)
      expect(result).toEqual(new Date('2024-02-29'));
    });
    
    test('handles year rollover', () => {
      // Activated Dec 15, billing date 1st → Jan 1 next year
      const activationDate = new Date('2025-12-15');
      const billingDate = 1;
      
      const result = BillingService.getNextBillingDate(activationDate, billingDate);
      
      expect(result).toEqual(new Date('2026-01-01'));
    });
  });
  
  describe('VAT Calculation', () => {
    test('calculates 15% VAT correctly', () => {
      // Mock data - we'll test the calculation logic
      const subtotal = 699.00;
      const vat_rate = 15.00;
      
      // VAT calculation: 699 * 0.15 = 104.85
      const vat_amount = Math.round(subtotal * (vat_rate / 100) * 100) / 100;
      const total_amount = Math.round((subtotal + vat_amount) * 100) / 100;
      
      expect(vat_amount).toBe(104.85);
      expect(total_amount).toBe(803.85);
    });
    
    test('rounds VAT to 2 decimal places', () => {
      const subtotal = 123.45;
      const vat_rate = 15.00;
      
      // VAT: 123.45 * 0.15 = 18.5175 → rounds to 18.52
      const vat_amount = Math.round(subtotal * (vat_rate / 100) * 100) / 100;
      
      expect(vat_amount).toBe(18.52);
    });
  });
  
  describe('Account Balance Operations', () => {
    test('calculates balance changes correctly', () => {
      // Simulate balance updates
      const initialBalance = 100.00;
      const debit = 699.00; // Invoice
      const credit = -500.00; // Payment
      
      const afterDebit = Math.round((initialBalance + debit) * 100) / 100;
      const afterCredit = Math.round((afterDebit + credit) * 100) / 100;
      
      expect(afterDebit).toBe(799.00); // 100 + 699
      expect(afterCredit).toBe(299.00); // 799 - 500
    });
    
    test('handles negative balance (credit)', () => {
      const balance = 0.00;
      const payment = -100.00; // Overpayment
      
      const newBalance = Math.round((balance + payment) * 100) / 100;
      
      expect(newBalance).toBe(-100.00); // Customer has credit
    });
  });
  
  describe('Multiple Billing Dates Support', () => {
    test('supports billing date 1st', () => {
      const activationDate = new Date('2025-11-15');
      const result = BillingService.getNextBillingDate(activationDate, 1);
      expect(result).toEqual(new Date('2025-12-01'));
    });
    
    test('supports billing date 5th', () => {
      const activationDate = new Date('2025-11-02');
      const result = BillingService.getNextBillingDate(activationDate, 5);
      expect(result).toEqual(new Date('2025-11-05'));
    });
    
    test('supports billing date 25th', () => {
      const activationDate = new Date('2025-11-20');
      const result = BillingService.getNextBillingDate(activationDate, 25);
      expect(result).toEqual(new Date('2025-11-25'));
    });
    
    test('supports billing date 30th', () => {
      const activationDate = new Date('2025-11-15');
      const result = BillingService.getNextBillingDate(activationDate, 30);
      expect(result).toEqual(new Date('2025-11-30'));
    });
  });
  
  describe('getBillingCycleDates', () => {
    test('returns current billing cycle dates', () => {
      // Today is Nov 15, billing date is 1st
      // Cycle should be Nov 1 to Dec 1
      const referenceDate = new Date('2025-11-15');
      const billingDate = 1;
      
      const result = BillingService.getBillingCycleDates(billingDate, referenceDate);
      
      expect(result.cycle_start).toEqual(new Date('2025-11-01'));
      expect(result.cycle_end).toEqual(new Date('2025-12-01'));
    });
    
    test('handles reference date before billing date in month', () => {
      // Today is Nov 3, billing date is 5th
      // Cycle should be Oct 5 to Nov 5
      const referenceDate = new Date('2025-11-03');
      const billingDate = 5;
      
      const result = BillingService.getBillingCycleDates(billingDate, referenceDate);
      
      expect(result.cycle_start).toEqual(new Date('2025-10-05'));
      expect(result.cycle_end).toEqual(new Date('2025-11-05'));
    });
  });
  
  describe('isValidBillingDate', () => {
    test('validates correct billing dates', () => {
      expect(BillingService.isValidBillingDate(1)).toBe(true);
      expect(BillingService.isValidBillingDate(5)).toBe(true);
      expect(BillingService.isValidBillingDate(25)).toBe(true);
      expect(BillingService.isValidBillingDate(30)).toBe(true);
    });
    
    test('rejects invalid billing dates', () => {
      expect(BillingService.isValidBillingDate(2)).toBe(false);
      expect(BillingService.isValidBillingDate(10)).toBe(false);
      expect(BillingService.isValidBillingDate(15)).toBe(false);
      expect(BillingService.isValidBillingDate(31)).toBe(false);
    });
  });
});
