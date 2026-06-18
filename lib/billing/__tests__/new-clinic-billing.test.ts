import { shouldEmitRecurringInvoice } from '../new-clinic-billing-helper';

describe('New Clinic Billing Rules', () => {
  describe('shouldEmitRecurringInvoice', () => {
    // Cohort boundary: original = activation_date <= 2026-06-01
    // New = activation_date > 2026-06-01

    it('returns true for original-cohort clinic (activation <= 2026-06-01) on any billing_day', () => {
      const activation = '2026-06-01';
      const billingDay = new Date('2026-07-15'); // 44 days after activation
      expect(shouldEmitRecurringInvoice(activation, billingDay)).toBe(true);
    });

    it('returns true for original-cohort clinic on first billing_day after activation', () => {
      const activation = '2026-05-20';
      const billingDay = new Date('2026-06-01'); // first day of next month
      expect(shouldEmitRecurringInvoice(activation, billingDay)).toBe(true);
    });

    it('returns false for new-clinic (activation > 2026-06-01) before activation + 1 month', () => {
      const activation = '2026-06-15'; // new clinic
      const billingDay = new Date('2026-07-10'); // 25 days after activation, before activation + 1 month
      expect(shouldEmitRecurringInvoice(activation, billingDay)).toBe(false);
    });

    it('returns true for new-clinic on exactly activation + 1 month', () => {
      const activation = '2026-06-15'; // new clinic
      const billingDay = new Date('2026-07-15'); // exactly 1 month after activation
      expect(shouldEmitRecurringInvoice(activation, billingDay)).toBe(true);
    });

    it('returns true for new-clinic on billing_day after activation + 1 month', () => {
      const activation = '2026-06-15'; // new clinic
      const billingDay = new Date('2026-08-01'); // well after activation + 1 month
      expect(shouldEmitRecurringInvoice(activation, billingDay)).toBe(true);
    });

    it('returns false for new-clinic on first day of next month after mid-month activation', () => {
      const activation = '2026-06-20'; // mid-month activation
      const billingDay = new Date('2026-07-01'); // first day of next month, but < 12 days from activation
      expect(shouldEmitRecurringInvoice(activation, billingDay)).toBe(false);
    });

    it('returns true for new-clinic on first day of month after activation + 1 month', () => {
      const activation = '2026-06-20'; // mid-month activation
      const billingDay = new Date('2026-07-20'); // same day next month
      expect(shouldEmitRecurringInvoice(activation, billingDay)).toBe(true);
    });

    it('correctly handles edge case: new clinic activation on last day of month (June)', () => {
      const activation = '2026-06-30'; // last day of June (new clinic)
      // Adding 1 month to June 30 gives July 30
      const billingDay = new Date('2026-07-30T00:00:00Z'); // exactly 1 month later
      expect(shouldEmitRecurringInvoice(activation, billingDay)).toBe(true);

      const billingDayBefore = new Date('2026-07-29T00:00:00Z'); // 1 day before 1 month
      expect(shouldEmitRecurringInvoice(activation, billingDayBefore)).toBe(false);
    });

    it('correctly handles edge case: new clinic activation on last day of month', () => {
      // New clinic (after 2026-06-01): activated July 31, 2026
      const activation = '2026-07-31'; // last day of July
      // Adding 1 month to July 31 gives August 31
      const billingDay = new Date('2026-08-31T00:00:00Z'); // exactly 1 month later
      expect(shouldEmitRecurringInvoice(activation, billingDay)).toBe(true);

      const billingDayBefore = new Date('2026-08-30T00:00:00Z'); // 1 day before 1 month
      expect(shouldEmitRecurringInvoice(activation, billingDayBefore)).toBe(false);
    });

    it('correctly handles month-clamp edge case: Aug 31 → Sept 30 (month overflow)', () => {
      // New clinic (after 2026-06-01): activated August 31, 2026
      const activation = '2026-08-31'; // last day of August
      // Adding 1 month should clamp to September 30 (Sept has only 30 days)
      const billingDay = new Date('2026-09-30T00:00:00Z'); // clamped 1 month later
      expect(shouldEmitRecurringInvoice(activation, billingDay)).toBe(true);

      const billingDayBefore = new Date('2026-09-29T00:00:00Z'); // 1 day before clamped 1 month
      expect(shouldEmitRecurringInvoice(activation, billingDayBefore)).toBe(false);
    });
  });
});
