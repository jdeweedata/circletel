import { isBeforeBillingStart, isCustomerServiceBilledNow } from '../billing-eligibility';

describe('Billing Eligibility — isBeforeBillingStart', () => {
  // Semantics: true means "suppress billing" (run is before the deferral date).

  it('returns false when billing_start_date is null (no deferral → bill)', () => {
    expect(isBeforeBillingStart(null, new Date('2026-07-01T04:00:00Z'))).toBe(false);
  });

  it('returns false when billing_start_date is undefined (no deferral → bill)', () => {
    expect(isBeforeBillingStart(undefined, new Date('2026-07-01T04:00:00Z'))).toBe(false);
  });

  it('returns false when billing_start_date is empty string (treated as no deferral)', () => {
    expect(isBeforeBillingStart('', new Date('2026-07-01T04:00:00Z'))).toBe(false);
  });

  it('returns true when the run date is before billing_start_date (suppress)', () => {
    // Extension to 1 Aug; cron runs 1 Jul → must skip.
    expect(isBeforeBillingStart('2026-08-01', new Date('2026-07-01T04:00:00Z'))).toBe(true);
  });

  it('returns false ON the billing_start_date (bills from that date)', () => {
    // Cron runs 1 Aug, start is 1 Aug → not before → bill.
    expect(isBeforeBillingStart('2026-08-01', new Date('2026-08-01T04:00:00Z'))).toBe(false);
  });

  it('returns false when the run date is after billing_start_date (bill)', () => {
    expect(isBeforeBillingStart('2026-08-01', new Date('2026-09-01T04:00:00Z'))).toBe(false);
  });

  it('compares by date only, ignoring time-of-day on the run date', () => {
    // Late-night run on the start date still counts as "on/after" → bill.
    expect(isBeforeBillingStart('2026-08-01', new Date('2026-08-01T23:59:59Z'))).toBe(false);
    // One day before, any time → suppress.
    expect(isBeforeBillingStart('2026-08-01', new Date('2026-07-31T23:59:59Z'))).toBe(true);
  });

  it('tolerates a full ISO timestamp in billing_start_date (uses date part)', () => {
    expect(isBeforeBillingStart('2026-08-01T00:00:00Z', new Date('2026-07-01T04:00:00Z'))).toBe(true);
    expect(isBeforeBillingStart('2026-08-01T00:00:00Z', new Date('2026-08-15T04:00:00Z'))).toBe(false);
  });

  it('handles year boundaries via lexical ISO comparison', () => {
    expect(isBeforeBillingStart('2027-01-01', new Date('2026-12-31T04:00:00Z'))).toBe(true);
    expect(isBeforeBillingStart('2027-01-01', new Date('2027-01-01T04:00:00Z'))).toBe(false);
  });
});

describe('isCustomerServiceBilledNow', () => {
  const august = new Date('2026-08-13T10:00:00Z');

  it('is billed when there is an active service with no deferral', () => {
    expect(
      isCustomerServiceBilledNow(
        { billing_start_date: null, status: 'active', active: true },
        august
      )
    ).toBe(true);
  });

  it('is not billed when billing_start_date is still in the future', () => {
    expect(
      isCustomerServiceBilledNow(
        { billing_start_date: '2026-09-01', status: 'active', active: true },
        august
      )
    ).toBe(false);
  });

  it('is billed on the billing_start_date', () => {
    expect(
      isCustomerServiceBilledNow(
        { billing_start_date: '2026-09-01', status: 'active', active: true },
        new Date('2026-09-01T04:00:00Z')
      )
    ).toBe(true);
  });

  it('is not billed when the service is inactive', () => {
    expect(
      isCustomerServiceBilledNow(
        { billing_start_date: null, status: 'cancelled', active: false },
        august
      )
    ).toBe(false);
  });
});
