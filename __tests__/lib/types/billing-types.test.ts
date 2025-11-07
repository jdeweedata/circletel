/**
 * Unit Tests for Billing Type Utilities
 *
 * Tests billing utility functions and type guards.
 *
 * @module __tests__/lib/types/billing-types.test
 */

import {
  isBillingCycleDay,
  isBillingFrequency,
  isBillingJobType,
  calculateNextBillingDate,
  calculateProRata,
  getBillingDayName,
  type BillingCycleDay,
  type ProRataParams
} from '@/lib/types/billing.types';

describe('Billing Type Guards', () => {
  // ============================================================================
  // isBillingCycleDay Tests
  // ============================================================================

  describe('isBillingCycleDay', () => {
    it('should return true for valid billing cycle days', () => {
      const validDays = [1, 5, 25, 30];

      validDays.forEach((day) => {
        expect(isBillingCycleDay(day)).toBe(true);
      });
    });

    it('should return false for invalid billing cycle days', () => {
      const invalidDays = [0, 2, 10, 15, 31, -1, 100, '', null, undefined];

      invalidDays.forEach((day) => {
        expect(isBillingCycleDay(day)).toBe(false);
      });
    });
  });

  // ============================================================================
  // isBillingFrequency Tests
  // ============================================================================

  describe('isBillingFrequency', () => {
    it('should return true for valid billing frequencies', () => {
      const validFrequencies = ['monthly', 'quarterly', 'annually', 'one_time'];

      validFrequencies.forEach((freq) => {
        expect(isBillingFrequency(freq)).toBe(true);
      });
    });

    it('should return false for invalid billing frequencies', () => {
      const invalidFrequencies = [
        'weekly',
        'MONTHLY',
        '',
        null,
        undefined,
        123
      ];

      invalidFrequencies.forEach((freq) => {
        expect(isBillingFrequency(freq)).toBe(false);
      });
    });
  });

  // ============================================================================
  // isBillingJobType Tests
  // ============================================================================

  describe('isBillingJobType', () => {
    it('should return true for valid billing job types', () => {
      const validJobTypes = [
        'generate_recurring',
        'send_reminders',
        'mark_overdue',
        'process_debit_orders',
        'sync_to_zoho'
      ];

      validJobTypes.forEach((jobType) => {
        expect(isBillingJobType(jobType)).toBe(true);
      });
    });

    it('should return false for invalid billing job types', () => {
      const invalidJobTypes = ['invalid', 'GENERATE_RECURRING', '', null, undefined];

      invalidJobTypes.forEach((jobType) => {
        expect(isBillingJobType(jobType)).toBe(false);
      });
    });
  });
});

// ============================================================================
// Billing Utility Function Tests
// ============================================================================

describe('Billing Utility Functions', () => {
  // ============================================================================
  // calculateNextBillingDate Tests
  // ============================================================================

  describe('calculateNextBillingDate', () => {
    it('should calculate next monthly billing date correctly', () => {
      const fromDate = new Date('2025-11-01');
      const nextDate = calculateNextBillingDate(1, 'monthly', fromDate);

      expect(nextDate.getDate()).toBe(1);
      expect(nextDate.getMonth()).toBe(11); // December (0-indexed)
    });

    it('should calculate next quarterly billing date correctly', () => {
      const fromDate = new Date('2025-11-01');
      const nextDate = calculateNextBillingDate(1, 'quarterly', fromDate);

      expect(nextDate.getDate()).toBe(1);
      expect(nextDate.getMonth()).toBe(1); // February (0-indexed) - 3 months later
    });

    it('should calculate next annual billing date correctly', () => {
      const fromDate = new Date('2025-11-01');
      const nextDate = calculateNextBillingDate(1, 'annually', fromDate);

      expect(nextDate.getDate()).toBe(1);
      expect(nextDate.getFullYear()).toBe(2026);
    });

    it('should return same date for one_time frequency', () => {
      const fromDate = new Date('2025-11-01');
      const nextDate = calculateNextBillingDate(1, 'one_time', fromDate);

      expect(nextDate.getTime()).toBe(fromDate.getTime());
    });

    it('should handle billing day 30 in February', () => {
      const fromDate = new Date('2025-01-30');
      const nextDate = calculateNextBillingDate(30, 'monthly', fromDate);

      // February only has 28 days in 2025
      const lastDayOfFeb = new Date(2025, 2, 0).getDate();
      expect(nextDate.getDate()).toBe(lastDayOfFeb);
    });

    it('should handle billing day 5', () => {
      const fromDate = new Date('2025-11-01');
      const nextDate = calculateNextBillingDate(5, 'monthly', fromDate);

      expect(nextDate.getDate()).toBe(5);
      expect(nextDate.getMonth()).toBe(11); // December
    });

    it('should handle billing day 25', () => {
      const fromDate = new Date('2025-11-01');
      const nextDate = calculateNextBillingDate(25, 'monthly', fromDate);

      expect(nextDate.getDate()).toBe(25);
      expect(nextDate.getMonth()).toBe(11); // December
    });
  });

  // ============================================================================
  // calculateProRata Tests
  // ============================================================================

  describe('calculateProRata', () => {
    it('should calculate pro-rata amount for partial month (daily method)', () => {
      const params: ProRataParams = {
        monthly_amount: 799.0,
        start_date: new Date('2025-11-15'), // Mid-month
        end_date: new Date('2025-11-30'), // End of month
        method: 'daily'
      };

      const result = calculateProRata(params);

      expect(result.days).toBe(16); // 15-30 inclusive
      expect(result.total_days).toBe(30); // November has 30 days
      expect(result.daily_rate).toBeCloseTo(26.63, 2); // 799 / 30
      expect(result.amount).toBeCloseTo(426.13, 2); // 26.63 * 16
    });

    it('should calculate pro-rata for full month', () => {
      const params: ProRataParams = {
        monthly_amount: 799.0,
        start_date: new Date('2025-11-01'),
        end_date: new Date('2025-11-30'),
        method: 'daily'
      };

      const result = calculateProRata(params);

      expect(result.days).toBe(30);
      expect(result.amount).toBe(799.0); // Full month
    });

    it('should calculate pro-rata using fixed_30 method', () => {
      const params: ProRataParams = {
        monthly_amount: 799.0,
        start_date: new Date('2025-02-15'), // February
        end_date: new Date('2025-02-28'), // End of February
        method: 'fixed_30'
      };

      const result = calculateProRata(params);

      expect(result.total_days).toBe(30); // Fixed 30 days regardless of month
      expect(result.daily_rate).toBeCloseTo(26.63, 2);
    });

    it('should calculate pro-rata using fixed_365 method', () => {
      const params: ProRataParams = {
        monthly_amount: 799.0,
        start_date: new Date('2025-11-15'),
        end_date: new Date('2025-11-30'),
        method: 'fixed_365'
      };

      const result = calculateProRata(params);

      expect(result.total_days).toBe(365);
      expect(result.daily_rate).toBeCloseTo(2.19, 2); // 799 / 365
    });

    it('should handle single day period', () => {
      const params: ProRataParams = {
        monthly_amount: 799.0,
        start_date: new Date('2025-11-15'),
        end_date: new Date('2025-11-15'), // Same day
        method: 'daily'
      };

      const result = calculateProRata(params);

      expect(result.days).toBe(1);
      expect(result.amount).toBeCloseTo(26.63, 2);
    });

    it('should include breakdown message', () => {
      const params: ProRataParams = {
        monthly_amount: 799.0,
        start_date: new Date('2025-11-15'),
        end_date: new Date('2025-11-30'),
        method: 'daily'
      };

      const result = calculateProRata(params);

      expect(result.breakdown).toContain('16 days');
      expect(result.breakdown).toContain('30 days');
      expect(result.breakdown).toContain('R799.00');
    });

    it('should round amounts to 2 decimal places', () => {
      const params: ProRataParams = {
        monthly_amount: 799.99,
        start_date: new Date('2025-11-01'),
        end_date: new Date('2025-11-15'),
        method: 'daily'
      };

      const result = calculateProRata(params);

      expect(result.amount.toString()).toMatch(/^\d+\.\d{2}$/); // 2 decimal places
      expect(result.daily_rate.toString()).toMatch(/^\d+\.\d{2}$/);
    });
  });

  // ============================================================================
  // getBillingDayName Tests
  // ============================================================================

  describe('getBillingDayName', () => {
    it('should return correct name for billing day 1', () => {
      expect(getBillingDayName(1)).toBe('1st');
    });

    it('should return correct name for billing day 5', () => {
      expect(getBillingDayName(5)).toBe('5th');
    });

    it('should return correct name for billing day 25', () => {
      expect(getBillingDayName(25)).toBe('25th');
    });

    it('should return correct name for billing day 30', () => {
      expect(getBillingDayName(30)).toBe('30th (or last day)');
    });
  });
});

// ============================================================================
// Edge Cases and Integration Tests
// ============================================================================

describe('Billing Edge Cases', () => {
  it('should handle leap year correctly in pro-rata calculation', () => {
    const params: ProRataParams = {
      monthly_amount: 799.0,
      start_date: new Date('2024-02-15'), // 2024 is a leap year
      end_date: new Date('2024-02-29'), // 29 days in February
      method: 'daily'
    };

    const result = calculateProRata(params);

    expect(result.total_days).toBe(29); // Leap year February
    expect(result.days).toBe(15);
  });

  it('should handle year boundary in next billing date', () => {
    const fromDate = new Date('2025-12-01');
    const nextDate = calculateNextBillingDate(1, 'monthly', fromDate);

    expect(nextDate.getFullYear()).toBe(2026);
    expect(nextDate.getMonth()).toBe(0); // January
  });

  it('should handle multiple month advance for quarterly', () => {
    const fromDate = new Date('2025-11-01');
    const nextDate = calculateNextBillingDate(1, 'quarterly', fromDate);

    expect(nextDate.getMonth()).toBe(1); // February (3 months later)
  });
});
