import {
  aggregateOperationsPreview,
  buildJohannesburgMonthWindows,
  moneyToCents,
  type AggregateInput,
} from '@/lib/admin/operations-preview/aggregate';

const NOW = new Date('2026-07-15T10:00:00.000Z');

function validInput(overrides: Partial<AggregateInput> = {}): AggregateInput {
  return {
    activeServices: [],
    unresolvedIncidents: [],
    invoices: [],
    customerCounts: Array(12).fill(0),
    openTickets: 0,
    needsAttention: 0,
    scheduledInstalls: 0,
    ordersInProgress: 0,
    availableTechnicians: 0,
    ...overrides,
  };
}

describe('aggregateOperationsPreview', () => {
  it('deduplicates active customers while summing every active service', () => {
    const result = aggregateOperationsPreview(
      validInput({
        activeServices: [
          { customer_id: 'c1', monthly_price: 499.0 },
          { customer_id: 'c1', monthly_price: '250' },
          { customer_id: 'c2', monthly_price: 799.99 },
        ],
      }),
      NOW
    );

    expect(result.kpis.activeCustomers).toBe(2);
    expect(result.kpis.activeMrrCents).toBe(154_899);
  });

  it('counts unresolved incidents and sums known affected services', () => {
    const result = aggregateOperationsPreview(
      validInput({
        unresolvedIncidents: [
          { affected_customer_count: 3 },
          { affected_customer_count: null },
        ],
      }),
      NOW
    );

    expect(result.kpis.networkIncidents).toBe(2);
    expect(result.kpis.servicesImpacted).toBe(3);
  });

  it('reports ticket counts and mirrors needsAttention as priorityTickets', () => {
    const result = aggregateOperationsPreview(
      validInput({ openTickets: 8, needsAttention: 4 }),
      NOW
    );

    expect(result.kpis.openTickets).toBe(8);
    expect(result.kpis.needsAttention).toBe(4);
    expect(result.operations.priorityTickets).toBe(4);
  });

  it('aggregates current-month finance and excludes voided or cancelled invoices', () => {
    const result = aggregateOperationsPreview(
      validInput({
        invoices: [
          {
            invoice_date: '2026-07-02',
            total_amount: 100,
            amount_paid: 60,
            amount_due: 40,
            status: 'partial',
          },
          {
            invoice_date: '2026-07-03',
            total_amount: 500,
            amount_paid: 500,
            amount_due: 0,
            status: 'voided',
          },
          {
            invoice_date: '2026-07-04',
            total_amount: 75,
            amount_paid: 75,
            amount_due: 0,
            status: 'paid',
          },
          {
            invoice_date: '2026-07-05',
            total_amount: 900,
            amount_paid: 0,
            amount_due: 900,
            status: 'CANCELLED',
          },
        ],
      }),
      NOW
    );

    expect(result.finance).toEqual({
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      billedCents: 17_500,
      collectedCents: 13_500,
      outstandingCents: 4_000,
      paidInvoices: 1,
    });
    expect(result.growth.at(-1)?.billedCents).toBe(17_500);
  });

  it('uses the Johannesburg rollover for month windows and invoice buckets', () => {
    const julyEnd = new Date('2026-07-31T21:59:59.000Z');
    const augustStart = new Date('2026-07-31T22:00:00.000Z');

    expect(buildJohannesburgMonthWindows(julyEnd).at(-1)?.key).toBe('2026-07');
    expect(buildJohannesburgMonthWindows(augustStart).at(-1)?.key).toBe('2026-08');

    const result = aggregateOperationsPreview(
      validInput({
        invoices: [
          {
            invoice_date: julyEnd.toISOString(),
            total_amount: 10,
            amount_paid: 10,
            amount_due: 0,
            status: 'paid',
          },
          {
            invoice_date: augustStart.toISOString(),
            total_amount: 20,
            amount_paid: 20,
            amount_due: 0,
            status: 'paid',
          },
        ],
      }),
      augustStart
    );

    expect(result.growth.slice(-2).map(({ month, billedCents }) => ({ month, billedCents }))).toEqual([
      { month: '2026-07', billedCents: 1_000 },
      { month: '2026-08', billedCents: 2_000 },
    ]);
    expect(result.finance.billedCents).toBe(2_000);
  });

  it('throws rather than converting invalid money to zero', () => {
    expect(() => moneyToCents('not-money')).toThrow('Invalid monetary value');
    expect(() => moneyToCents(Number.POSITIVE_INFINITY)).toThrow('Invalid monetary value');
    expect(() =>
      aggregateOperationsPreview(
        validInput({
          activeServices: [{ customer_id: 'c1', monthly_price: 'not-money' }],
        }),
        NOW
      )
    ).toThrow('Invalid monetary value');
  });

  it.each([
    Array(11).fill(0),
    [...Array(11).fill(0), -1],
    [...Array(11).fill(0), 1.5],
    [...Array(11).fill(0), Number.POSITIVE_INFINITY],
  ])('rejects an invalid customerCounts shape or value', (customerCounts) => {
    expect(() =>
      aggregateOperationsPreview(validInput({ customerCounts }), NOW)
    ).toThrow('customerCounts');
  });

  it('returns 12 ordered calendar buckets and an inclusive current finance period', () => {
    const result = aggregateOperationsPreview(
      validInput({ customerCounts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }),
      new Date('2026-08-15T12:00:00.000Z')
    );

    expect(result).toMatchObject({
      generatedAt: '2026-08-15T12:00:00.000Z',
      source: 'production',
      timeZone: 'Africa/Johannesburg',
      finance: {
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
      },
    });
    expect(result.growth).toHaveLength(12);
    expect(result.growth.map(({ month }) => month)).toEqual([
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
    ]);
    expect(result.growth.map(({ label }) => label)).toEqual([
      'Sept',
      'Oct',
      'Nov',
      'Dec',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
    ]);
    expect(result.growth.map(({ totalCustomers }) => totalCustomers)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });
});
