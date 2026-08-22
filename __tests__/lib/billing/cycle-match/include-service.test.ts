import { describe, expect, it } from '@jest/globals';
import { includeInCycleMatch } from '@/lib/billing/cycle-match/include-service';
import type { CycleMatchInclusionInput } from '@/lib/billing/cycle-match/include-service';

const AUGUST_END = new Date('2026-08-31T12:00:00Z');

function input(overrides: Partial<CycleMatchInclusionInput> = {}): CycleMatchInclusionInput {
  return {
    packageName: 'CircleConnect 5G 35 Mbps',
    productCategory: '5g',
    monthlyPrice: 449,
    status: 'active',
    active: true,
    billingStartDate: null,
    customerName: 'Ashwyn Watkins',
    accountNumber: 'CT-2026-00012',
    hasInvoiceThisMonth: false,
    ...overrides,
  };
}

describe('includeInCycleMatch', () => {
  it('drops Amoeba User on a Test Package', () => {
    expect(
      includeInCycleMatch(
        input({
          packageName: 'Test Package',
          monthlyPrice: 0,
          customerName: 'Amoeba User',
        }),
        AUGUST_END
      )
    ).toBe(false);
  });

  it('drops ECHO Connection enabling services', () => {
    expect(
      includeInCycleMatch(
        input({
          packageName: 'ECHO Service',
          monthlyPrice: 0,
          customerName: 'ECHO Connection',
          productCategory: 'fixed_wireless',
        }),
        AUGUST_END
      )
    ).toBe(false);
  });

  it('drops R0 Subscriber Standard Package rows', () => {
    expect(
      includeInCycleMatch(
        input({
          packageName: 'Standard Package',
          monthlyPrice: 0,
          customerName: 'Subscriber 2645064',
        }),
        AUGUST_END
      )
    ).toBe(false);
  });

  it('keeps a live Unjani clinic with no billing_start_date after 15 June 2026', () => {
    expect(
      includeInCycleMatch(
        input({
          packageName: 'CircleTel ClinicConnect',
          productCategory: 'business_connectivity',
          monthlyPrice: 450,
          customerName: 'Unjani Clinic Delmas',
          billingStartDate: null,
        }),
        AUGUST_END
      )
    ).toBe(true);
  });

  it('keeps a live Unjani clinic for the June 2026 pro-rata month', () => {
    expect(
      includeInCycleMatch(
        input({
          packageName: 'Unjani Managed Connectivity',
          productCategory: 'corporate',
          monthlyPrice: 450,
          customerName: 'Unjani Clinic - Bridge City KwaMashu',
          billingStartDate: null,
        }),
        new Date('2026-06-30T12:00:00Z')
      )
    ).toBe(true);
  });

  it('drops Unjani clinics during the Feb–14 June pilot', () => {
    expect(
      includeInCycleMatch(
        input({
          packageName: 'Unjani Managed Connectivity',
          productCategory: 'corporate',
          monthlyPrice: 450,
          customerName: 'Unjani Clinic - Bridge City KwaMashu',
          billingStartDate: null,
        }),
        new Date('2026-05-31T12:00:00Z')
      )
    ).toBe(false);
  });

  it('drops Unjani clinics whose billing_start_date is after the cycle', () => {
    expect(
      includeInCycleMatch(
        input({
          packageName: 'Unjani Managed Connectivity',
          productCategory: 'corporate',
          monthlyPrice: 450,
          customerName: 'Unjani Clinic - Bridge City KwaMashu',
          billingStartDate: '2026-09-01',
        }),
        AUGUST_END
      )
    ).toBe(false);
  });

  it.each([
    'Unjani Clinic - Alexandra',
    'Unjani Clinic Sicelo',
    'Unjani Clinic - Oukasie',
    'Unjani Phoenix',
    'Unjani Clinic - Chloorkop',
  ])('drops hold-out clinic %s from the June 2026 billing cohort', (customerName) => {
    expect(
      includeInCycleMatch(
        input({
          packageName: 'Unjani Managed Connectivity',
          productCategory: 'corporate',
          monthlyPrice: 450,
          customerName,
          billingStartDate: null,
        }),
        AUGUST_END
      )
    ).toBe(false);
  });

  it('keeps a live consumer when billing_start_date is null', () => {
    expect(includeInCycleMatch(input(), AUGUST_END)).toBe(true);
  });

  it('keeps a cancelled real customer that still has a Zoho invoice this month', () => {
    expect(
      includeInCycleMatch(
        input({
          packageName: 'SkyFibre Home Plus',
          productCategory: 'fibre_consumer',
          monthlyPrice: 899,
          status: 'cancelled',
          active: false,
          customerName: 'Raymund Watson',
          hasInvoiceThisMonth: true,
        }),
        AUGUST_END
      )
    ).toBe(true);
  });

  it('drops a reserved test account even when the package looks real', () => {
    expect(
      includeInCycleMatch(
        input({
          packageName: 'Unjani Managed Connectivity',
          productCategory: 'corporate',
          monthlyPrice: 450,
          customerName: 'Unjani Clinic - Training Demo',
          accountNumber: 'CT-2026-09999',
          billingStartDate: '2026-07-01',
        }),
        AUGUST_END
      )
    ).toBe(false);
  });
});
