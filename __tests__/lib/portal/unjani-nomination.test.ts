import {
  nurseFirstName,
  unjaniNominationDeskDepartmentId,
  withNominationFlags,
} from '@/lib/portal/unjani-nomination';

describe('unjani nomination helpers', () => {
  it('takes the first name for Sr greeting', () => {
    expect(nurseFirstName('Lesedi Mmoneng')).toBe('Lesedi');
    expect(nurseFirstName('  Thandi  ')).toBe('Thandi');
    expect(nurseFirstName('')).toBe('');
  });

  it('marks coverage results as nominated without dropping prior findings', () => {
    const next = withNominationFlags(
      { summary: { tarana: 'feasible' }, tarana: { feasible: true } },
      { nominatedAt: '2026-09-06T20:00:00.000Z', nominatedBy: 'user-1' }
    );
    expect(next).toEqual({
      summary: { tarana: 'feasible' },
      tarana: { feasible: true },
      nominated: true,
      nominated_at: '2026-09-06T20:00:00.000Z',
      nominated_by: 'user-1',
    });
  });

  it('prefers Sales Desk department when configured', () => {
    const prevSales = process.env.ZOHO_DESK_SALES_DEPARTMENT_ID;
    const prevDefault = process.env.ZOHO_DESK_DEPARTMENT_ID;
    process.env.ZOHO_DESK_SALES_DEPARTMENT_ID = 'sales-dept';
    process.env.ZOHO_DESK_DEPARTMENT_ID = 'support-dept';
    try {
      expect(unjaniNominationDeskDepartmentId()).toBe('sales-dept');
    } finally {
      if (prevSales === undefined) delete process.env.ZOHO_DESK_SALES_DEPARTMENT_ID;
      else process.env.ZOHO_DESK_SALES_DEPARTMENT_ID = prevSales;
      if (prevDefault === undefined) delete process.env.ZOHO_DESK_DEPARTMENT_ID;
      else process.env.ZOHO_DESK_DEPARTMENT_ID = prevDefault;
    }
  });
});
