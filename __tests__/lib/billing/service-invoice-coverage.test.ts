import {
  buildCoverageReport,
  invoiceCoversPeriod,
  isDeferredForPeriod,
  periodBounds,
} from '@/lib/billing/service-invoice-coverage';

describe('periodBounds', () => {
  it('returns July 2026 bounds', () => {
    const b = periodBounds('2026-07');
    expect(b.start).toBe('2026-07-01');
    expect(b.end).toBe('2026-07-31');
  });
});

describe('invoiceCoversPeriod', () => {
  it('matches full-month range overlap', () => {
    const r = invoiceCoversPeriod(
      {
        id: '1',
        invoice_number: 'INV-1',
        service_id: 's1',
        status: 'sent',
        period_start: '2026-07-01',
        period_end: '2026-07-31',
        invoice_date: '2026-07-01',
        total_amount: 450,
      },
      '2026-07'
    );
    expect(r.covers).toBe(true);
    expect(r.how).toBe('range_overlap');
  });

  it('rejects voided', () => {
    const r = invoiceCoversPeriod(
      {
        id: '1',
        invoice_number: 'INV-1',
        service_id: 's1',
        status: 'voided',
        period_start: '2026-07-01',
        period_end: '2026-07-31',
        invoice_date: '2026-07-01',
        total_amount: 450,
      },
      '2026-07'
    );
    expect(r.covers).toBe(false);
  });

  it('matches pro-rata overlapping July', () => {
    const r = invoiceCoversPeriod(
      {
        id: '1',
        invoice_number: 'INV-1',
        service_id: 's1',
        status: 'paid',
        period_start: '2026-06-15',
        period_end: '2026-07-14',
        invoice_date: '2026-06-19',
        total_amount: 276,
      },
      '2026-07'
    );
    expect(r.covers).toBe(true);
  });
});

describe('isDeferredForPeriod', () => {
  it('defers Chloorkop for July 2026', () => {
    expect(isDeferredForPeriod('Unjani Clinic - Chloorkop', '2026-07')).toBe(
      true
    );
  });

  it('does not defer Chloorkop for August 2026', () => {
    expect(isDeferredForPeriod('Unjani Clinic - Chloorkop', '2026-08')).toBe(
      false
    );
  });
});

describe('buildCoverageReport', () => {
  it('classifies covered, deferred, and gap', () => {
    const report = buildCoverageReport(
      [
        {
          id: 's1',
          customer_id: 'c1',
          package_name: 'Unjani Managed Connectivity',
          monthly_price: 450,
          status: 'active',
          active: true,
          billing_day: 1,
          last_invoice_date: '2026-07-01',
          activation_date: '2026-06-01',
          billing_start_date: null,
          product_category: 'corporate',
          customer_business_name: 'Unjani Clinic - Sky City',
        },
        {
          id: 's2',
          customer_id: 'c2',
          package_name: 'Unjani Managed Connectivity',
          monthly_price: 450,
          status: 'active',
          active: true,
          billing_day: 1,
          last_invoice_date: '2026-07-01',
          activation_date: '2026-06-01',
          billing_start_date: null,
          product_category: 'corporate',
          customer_business_name: 'Unjani Clinic - Chloorkop',
        },
        {
          id: 's3',
          customer_id: 'c3',
          package_name: 'Unjani Managed Connectivity',
          monthly_price: 450,
          status: 'active',
          active: true,
          billing_day: 1,
          last_invoice_date: null,
          activation_date: '2026-07-01',
          billing_start_date: null,
          product_category: 'corporate',
          customer_business_name: 'Unjani Clinic - Sweetwaters',
        },
      ],
      [
        {
          id: 'i1',
          invoice_number: 'INV-1',
          service_id: 's1',
          status: 'sent',
          period_start: '2026-07-01',
          period_end: '2026-07-31',
          invoice_date: '2026-07-01',
          total_amount: 450,
        },
      ],
      '2026-07'
    );

    expect(report.summary.covered).toBe(1);
    expect(report.summary.deferred).toBe(1);
    expect(report.summary.gaps).toBe(1);
    expect(report.lines.find((l) => l.serviceId === 's3')?.reason).toBe(
      'no_invoice'
    );
  });
});
