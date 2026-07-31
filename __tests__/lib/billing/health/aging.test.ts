import {
  agingBucketForDays,
  buildAgingBuckets,
  buildOverdueRegister,
  buildWatchlist,
  countUnpaidCustomers,
  daysPastDue,
  type UnpaidInvoiceInput,
} from '@/lib/billing/health/aging';

const TODAY = '2026-07-30';

function inv(partial: Partial<UnpaidInvoiceInput>): UnpaidInvoiceInput {
  return {
    id: 'i1',
    customerId: 'c1',
    customerName: 'TechHub Solutions',
    invoiceNumber: 'INV-1',
    packageName: 'Home 100/50 Mbps',
    dueDate: '2026-07-30',
    amountDue: 100,
    ...partial,
  };
}

describe('daysPastDue', () => {
  it('is 0 when due today', () => {
    expect(daysPastDue('2026-07-30', TODAY)).toBe(0);
  });

  it('is positive after the due date', () => {
    expect(daysPastDue('2026-07-22', TODAY)).toBe(8);
  });

  it('is negative before the due date', () => {
    expect(daysPastDue('2026-08-05', TODAY)).toBe(-6);
  });

  it('handles full ISO timestamps by truncating to the day', () => {
    expect(daysPastDue('2026-07-25T23:59:59.000Z', TODAY)).toBe(5);
  });
});

describe('agingBucketForDays', () => {
  it.each([
    [-3, 'current'],
    [0, 'current'],
    [1, '1-7d'],
    [7, '1-7d'],
    [8, '8-30d'],
    [30, '8-30d'],
    [31, '31-60d'],
    [60, '31-60d'],
    [61, '61d+'],
    [400, '61d+'],
  ] as const)('%i days -> %s', (days, bucket) => {
    expect(agingBucketForDays(days)).toBe(bucket);
  });
});

describe('buildAgingBuckets', () => {
  it('sums amounts into the right buckets', () => {
    const buckets = buildAgingBuckets(
      [
        inv({ id: 'a', amountDue: 2120, dueDate: '2026-08-01' }), // current
        inv({ id: 'b', amountDue: 890, dueDate: '2026-07-25' }), // 5d
        inv({ id: 'c', amountDue: 1450, dueDate: '2026-07-09' }), // 21d
        inv({ id: 'd', amountDue: 1240, dueDate: '2026-06-26' }), // 34d
        inv({ id: 'e', amountDue: 800, dueDate: '2026-04-30' }), // 91d
      ],
      TODAY
    );
    expect(buckets).toEqual({
      current: 2120,
      '1-7d': 890,
      '8-30d': 1450,
      '31-60d': 1240,
      '61d+': 800,
    });
  });
});

describe('buildWatchlist', () => {
  it('groups by customer, keeps max days, sorts desc, excludes current bucket', () => {
    const services = new Map<string, string[]>([
      ['c1', ['s1']],
      ['c2', ['s2', 's3']],
    ]);
    const rows = buildWatchlist(
      [
        inv({ id: 'a', customerId: 'c1', customerName: 'Cafe Roasters', dueDate: '2026-06-26', amountDue: 1240 }), // 34d
        inv({ id: 'b', customerId: 'c1', customerName: 'Cafe Roasters', dueDate: '2026-07-20', amountDue: 300 }), // 10d
        inv({ id: 'c', customerId: 'c2', customerName: 'FitZone Gym', dueDate: '2026-07-12', amountDue: 1450 }), // 18d
        inv({ id: 'd', customerId: 'c3', customerName: 'Not Yet Due Co', dueDate: '2026-08-02', amountDue: 500 }), // current
      ],
      TODAY,
      services
    );

    expect(rows.map((r) => r.customerName)).toEqual(['Cafe Roasters', 'FitZone Gym']);
    expect(rows[0].daysPastDue).toBe(34);
    expect(rows[0].agingBucket).toBe('31-60d');
    expect(rows[0].overdueInvoiceCount).toBe(2);
    expect(rows[0].overdueAmount).toBe(1540);
    expect(rows[0].activeServiceIds).toEqual(['s1']);
    expect(rows[1].activeServiceIds).toEqual(['s2', 's3']);
  });
});

describe('buildOverdueRegister', () => {
  it('excludes not-yet-due invoices and sorts by days overdue desc', () => {
    const rows = buildOverdueRegister(
      [
        inv({ id: 'a', invoiceNumber: 'INV-2042', dueDate: '2026-07-25', amountDue: 890 }), // 5d
        inv({ id: 'b', invoiceNumber: 'INV-2038', dueDate: '2026-06-26', amountDue: 1240 }), // 34d
        inv({ id: 'c', invoiceNumber: 'INV-2099', dueDate: '2026-08-10', amountDue: 100 }), // current
      ],
      TODAY
    );

    expect(rows.map((r) => r.invoiceNumber)).toEqual(['INV-2038', 'INV-2042']);
    expect(rows[0].daysOverdue).toBe(34);
    expect(rows[0].agingBucket).toBe('31-60d');
    expect(rows[0].href).toBe('/admin/billing/invoices/b');
  });
});

describe('countUnpaidCustomers', () => {
  it('counts distinct customers', () => {
    expect(
      countUnpaidCustomers([
        inv({ id: 'a', customerId: 'c1' }),
        inv({ id: 'b', customerId: 'c1' }),
        inv({ id: 'c', customerId: 'c2' }),
      ])
    ).toBe(2);
  });
});
