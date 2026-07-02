import { shouldEmitRecurringInvoice, isClinicBillingCategory } from '../new-clinic-billing-helper';

// Clinic/corporate product categories carry the new-clinic delay. Consumer
// services (residential/null/etc.) always bill monthly. These existing
// delay-logic tests therefore run against a clinic category.
const CLINIC = 'corporate';

describe('New Clinic Billing Rules', () => {
  describe('shouldEmitRecurringInvoice — clinic/corporate services', () => {
    // Cohort boundary: original = activation_date <= 2026-06-01
    // New = activation_date > 2026-06-01

    it('returns true for original-cohort clinic (activation <= 2026-06-01) on any billing_day', () => {
      const activation = '2026-06-01';
      const billingDay = new Date('2026-07-15'); // 44 days after activation
      expect(shouldEmitRecurringInvoice(activation, billingDay, CLINIC)).toBe(true);
    });

    it('returns true for original-cohort clinic on first billing_day after activation', () => {
      const activation = '2026-05-20';
      const billingDay = new Date('2026-06-01'); // first day of next month
      expect(shouldEmitRecurringInvoice(activation, billingDay, CLINIC)).toBe(true);
    });

    it('returns false for new-clinic (activation > 2026-06-01) before activation + 1 month', () => {
      const activation = '2026-06-15'; // new clinic
      const billingDay = new Date('2026-07-10'); // 25 days after activation, before activation + 1 month
      expect(shouldEmitRecurringInvoice(activation, billingDay, CLINIC)).toBe(false);
    });

    it('returns true for new-clinic on exactly activation + 1 month', () => {
      const activation = '2026-06-15'; // new clinic
      const billingDay = new Date('2026-07-15'); // exactly 1 month after activation
      expect(shouldEmitRecurringInvoice(activation, billingDay, CLINIC)).toBe(true);
    });

    it('returns true for new-clinic on billing_day after activation + 1 month', () => {
      const activation = '2026-06-15'; // new clinic
      const billingDay = new Date('2026-08-01'); // well after activation + 1 month
      expect(shouldEmitRecurringInvoice(activation, billingDay, CLINIC)).toBe(true);
    });

    it('returns false for new-clinic on first day of next month after mid-month activation', () => {
      const activation = '2026-06-20'; // mid-month activation
      const billingDay = new Date('2026-07-01'); // first day of next month, but < 12 days from activation
      expect(shouldEmitRecurringInvoice(activation, billingDay, CLINIC)).toBe(false);
    });

    it('returns true for new-clinic on first day of month after activation + 1 month', () => {
      const activation = '2026-06-20'; // mid-month activation
      const billingDay = new Date('2026-07-20'); // same day next month
      expect(shouldEmitRecurringInvoice(activation, billingDay, CLINIC)).toBe(true);
    });

    it('correctly handles edge case: new clinic activation on last day of month (June)', () => {
      const activation = '2026-06-30'; // last day of June (new clinic)
      // Adding 1 month to June 30 gives July 30
      const billingDay = new Date('2026-07-30T00:00:00Z'); // exactly 1 month later
      expect(shouldEmitRecurringInvoice(activation, billingDay, CLINIC)).toBe(true);

      const billingDayBefore = new Date('2026-07-29T00:00:00Z'); // 1 day before 1 month
      expect(shouldEmitRecurringInvoice(activation, billingDayBefore, CLINIC)).toBe(false);
    });

    it('correctly handles edge case: new clinic activation on last day of month', () => {
      // New clinic (after 2026-06-01): activated July 31, 2026
      const activation = '2026-07-31'; // last day of July
      // Adding 1 month to July 31 gives August 31
      const billingDay = new Date('2026-08-31T00:00:00Z'); // exactly 1 month later
      expect(shouldEmitRecurringInvoice(activation, billingDay, CLINIC)).toBe(true);

      const billingDayBefore = new Date('2026-08-30T00:00:00Z'); // 1 day before 1 month
      expect(shouldEmitRecurringInvoice(activation, billingDayBefore, CLINIC)).toBe(false);
    });

    it('correctly handles month-clamp edge case: Aug 31 → Sept 30 (month overflow)', () => {
      // New clinic (after 2026-06-01): activated August 31, 2026
      const activation = '2026-08-31'; // last day of August
      // Adding 1 month should clamp to September 30 (Sept has only 30 days)
      const billingDay = new Date('2026-09-30T00:00:00Z'); // clamped 1 month later
      expect(shouldEmitRecurringInvoice(activation, billingDay, CLINIC)).toBe(true);

      const billingDayBefore = new Date('2026-09-29T00:00:00Z'); // 1 day before clamped 1 month
      expect(shouldEmitRecurringInvoice(activation, billingDayBefore, CLINIC)).toBe(false);
    });

    it('applies the delay for the business_connectivity clinic category too', () => {
      const activation = '2026-06-15';
      const billingDay = new Date('2026-07-01'); // before activation + 1 month
      expect(shouldEmitRecurringInvoice(activation, billingDay, 'business_connectivity')).toBe(false);
    });
  });

  describe('shouldEmitRecurringInvoice — consumer services always bill monthly', () => {
    // The regression this fixes: Ashwyn (5g/null) and Raymund (5g/residential)
    // activated after 2026-06-01 and were wrongly suppressed for July.

    it('bills a residential service activated after the cohort boundary, before activation + 1 month', () => {
      const activation = '2026-06-04'; // Raymund
      const billingDay = new Date('2026-07-01'); // would be suppressed if treated as a clinic
      expect(shouldEmitRecurringInvoice(activation, billingDay, 'residential')).toBe(true);
    });

    it('bills a service with null product_category (Ashwyn) regardless of activation date', () => {
      const activation = '2026-06-03'; // Ashwyn, 5g, product_category null
      const billingDay = new Date('2026-07-01');
      expect(shouldEmitRecurringInvoice(activation, billingDay, null)).toBe(true);
    });

    it('treats a missing product_category argument as consumer (bills normally)', () => {
      const activation = '2026-06-20';
      const billingDay = new Date('2026-07-01');
      expect(shouldEmitRecurringInvoice(activation, billingDay)).toBe(true);
    });
  });

  describe('isClinicBillingCategory', () => {
    it('is true only for clinic/corporate categories', () => {
      expect(isClinicBillingCategory('corporate')).toBe(true);
      expect(isClinicBillingCategory('business_connectivity')).toBe(true);
    });

    it('is false for consumer categories and empty values', () => {
      expect(isClinicBillingCategory('residential')).toBe(false);
      expect(isClinicBillingCategory(null)).toBe(false);
      expect(isClinicBillingCategory(undefined)).toBe(false);
      expect(isClinicBillingCategory('')).toBe(false);
    });
  });
});
