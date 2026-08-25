import {
  buildPortalBillingSummary,
  invoiceBucket,
  splitLiveServices,
} from '@/lib/portal/billing-summary';

const august = new Date('2026-08-16T12:00:00Z');

describe('invoiceBucket', () => {
  it('treats sent, overdue and partial as unpaid', () => {
    expect(invoiceBucket('sent')).toBe('unpaid');
    expect(invoiceBucket('overdue')).toBe('unpaid');
    expect(invoiceBucket('partial')).toBe('unpaid');
  });

  it('treats paid as paid', () => {
    expect(invoiceBucket('paid')).toBe('paid');
  });

  it('excludes voided and cancelled invoices from collectable totals', () => {
    expect(invoiceBucket('voided')).toBe('excluded');
    expect(invoiceBucket('cancelled')).toBe('excluded');
    expect(invoiceBucket('refunded')).toBe('excluded');
  });
});

describe('splitLiveServices', () => {
  const five = [
    { name: 'Unjani Clinic - Oukasie', monthlyFee: 450, billingStartDate: '2026-09-01', status: 'active', active: true },
    { name: 'Unjani Clinic - Chloorkop', monthlyFee: 450, billingStartDate: '2026-09-01', status: 'active', active: true },
    { name: 'Unjani Clinic - Phoenix', monthlyFee: 450, billingStartDate: '2026-09-01', status: 'active', active: true },
    { name: 'Unjani Clinic - Alexandra', monthlyFee: 450, billingStartDate: '2026-09-01', status: 'active', active: true },
    { name: 'Unjani Clinic - Sicelo', monthlyFee: 450, billingStartDate: '2026-09-01', status: 'active', active: true },
  ];

  it('excludes the five 1 Sep NPC sites from billed-now in August', () => {
    const split = splitLiveServices(
      [
        { name: 'Unjani Clinic - Barcelona', monthlyFee: 450, billingStartDate: '2026-06-15', status: 'active', active: true },
        ...five,
      ],
      august
    );

    expect(split.billedNow.map((s) => s.name)).toEqual(['Unjani Clinic - Barcelona']);
    expect(split.deferredLive).toHaveLength(5);
    expect(split.monthlySpend).toBe(450);
  });

  it('includes the five sites once billing_start_date arrives', () => {
    const split = splitLiveServices(five, new Date('2026-09-01T04:00:00Z'));
    expect(split.billedNow).toHaveLength(5);
    expect(split.deferredLive).toHaveLength(0);
    expect(split.monthlySpend).toBe(2250);
  });
});

describe('buildPortalBillingSummary', () => {
  it('sums paid and unpaid invoices and ignores voided five-site invoices', () => {
    const summary = buildPortalBillingSummary({
      invoices: [
        { status: 'paid', total_amount: 517.5, amount_due: 0, amount_paid: 517.5 },
        { status: 'sent', total_amount: 517.5, amount_due: 517.5, amount_paid: 0 },
        { status: 'voided', total_amount: 517.5, amount_due: 0, amount_paid: 0 },
        { status: 'voided', total_amount: 450, amount_due: 0, amount_paid: 0 },
      ],
      billedNow: [{ monthlyFee: 450 }, { monthlyFee: 450 }],
    });

    expect(summary.paidCount).toBe(1);
    expect(summary.paidTotal).toBe(517.5);
    expect(summary.unpaidCount).toBe(1);
    expect(summary.unpaidTotal).toBe(517.5);
    expect(summary.billedCount).toBe(2);
    expect(summary.monthlySpend).toBe(900);
  });
});
