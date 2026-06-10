/**
 * Business Days Utility Tests
 */

import { describe, it, expect } from '@jest/globals';
import { addBusinessDays, isBusinessDay, countBusinessDays, getBusinessDaysUntil } from '@/lib/dates/business-days';

describe('Business Days Utilities', () => {
  describe('isBusinessDay', () => {
    it('should identify weekdays as business days', () => {
      // Monday, 2026-06-08
      const monday = new Date('2026-06-08');
      expect(isBusinessDay(monday)).toBe(true);

      // Wednesday, 2026-06-10
      const wednesday = new Date('2026-06-10');
      expect(isBusinessDay(wednesday)).toBe(true);

      // Friday, 2026-06-12
      const friday = new Date('2026-06-12');
      expect(isBusinessDay(friday)).toBe(true);
    });

    it('should exclude weekends', () => {
      // Saturday, 2026-06-13
      const saturday = new Date('2026-06-13');
      expect(isBusinessDay(saturday)).toBe(false);

      // Sunday, 2026-06-14
      const sunday = new Date('2026-06-14');
      expect(isBusinessDay(sunday)).toBe(false);
    });

    it('should exclude public holidays', () => {
      // New Year's Day, 2026-01-01
      const newYear = new Date('2026-01-01');
      expect(isBusinessDay(newYear)).toBe(false);

      // Workers' Day, 2026-05-01
      const workersDay = new Date('2026-05-01');
      expect(isBusinessDay(workersDay)).toBe(false);
    });

    it('should reject invalid dates', () => {
      const invalid = new Date('invalid');
      expect(isBusinessDay(invalid)).toBe(false);
    });
  });

  describe('addBusinessDays', () => {
    it('should add 2 business days from a Friday', () => {
      // Friday, 2026-06-12
      const friday = new Date('2026-06-12');
      const result = addBusinessDays(friday, 2);

      // Sat/Sun skip, Mon 6/15=1, Tue 6/16=HOLIDAY, Wed 6/17=HOLIDAY, Thu 6/18=2
      expect(result.toISOString().slice(0, 10)).toBe('2026-06-18');
    });

    it('should add 1 business day from a Monday', () => {
      // Monday, 2026-06-08
      const monday = new Date('2026-06-08');
      const result = addBusinessDays(monday, 1);

      // Should land on Tuesday 2026-06-09
      expect(result.toISOString().slice(0, 10)).toBe('2026-06-09');
    });

    it('should add 3 business days across a weekend', () => {
      // Thursday, 2026-06-11
      const thursday = new Date('2026-06-11');
      const result = addBusinessDays(thursday, 3);

      // From Thu 6/11: Fri 12=1, Sat/Sun skip, Mon 15=2, Tue 16=HOLIDAY, Wed 17=HOLIDAY, Thu 18=3
      expect(result.toISOString().slice(0, 10)).toBe('2026-06-18');
    });

    it('should add 0 business days (returns same day)', () => {
      const monday = new Date('2026-06-08');
      const result = addBusinessDays(monday, 0);

      expect(result.toISOString().slice(0, 10)).toBe('2026-06-08');
    });

    it('should reject invalid dates', () => {
      const invalid = new Date('invalid');
      expect(addBusinessDays(invalid, 2)).toEqual(invalid);
    });
  });

  describe('countBusinessDays', () => {
    it('should count business days between two dates', () => {
      // Monday 2026-06-08 to Friday 2026-06-12
      const start = new Date('2026-06-08');
      const end = new Date('2026-06-12');

      const count = countBusinessDays(start, end);
      // Mon, Tue, Wed, Thu, Fri = 5 days (Fri inclusive of start, exclusive of end = 4 days)
      expect(count).toBe(4);
    });

    it('should skip weekends in count', () => {
      // Thursday 2026-06-11 to Friday 2026-06-12 (exclusive end)
      const start = new Date('2026-06-11');
      const end = new Date('2026-06-12');

      const count = countBusinessDays(start, end);
      // Thu 11 = 1 business day (exclusive of end date)
      expect(count).toBe(1);
    });

    it('should return 0 for same day', () => {
      const date = new Date('2026-06-08');
      const count = countBusinessDays(date, date);

      expect(count).toBe(0);
    });

    it('should return 0 for invalid dates', () => {
      const invalid = new Date('invalid');
      const valid = new Date('2026-06-08');

      expect(countBusinessDays(invalid, valid)).toBe(0);
      expect(countBusinessDays(valid, invalid)).toBe(0);
    });
  });

  describe('getBusinessDaysUntil', () => {
    it('should calculate business days from now to future date', () => {
      // Monday 2026-06-08 to Friday 2026-06-12
      const from = new Date('2026-06-08');
      const until = new Date('2026-06-12');

      const days = getBusinessDaysUntil(from, until);
      expect(days).toBe(4);
    });

    it('should return negative for dates in the past', () => {
      // Friday 2026-06-12 to Monday 2026-06-08 (backwards)
      const from = new Date('2026-06-12');
      const until = new Date('2026-06-08');

      const days = getBusinessDaysUntil(from, until);
      expect(days).toBeLessThan(0);
    });

    it('should return 0 for same date', () => {
      const date = new Date('2026-06-08');
      const days = getBusinessDaysUntil(date, date);

      expect(days).toBe(0);
    });
  });
});
