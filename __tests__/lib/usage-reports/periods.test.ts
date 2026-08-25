import {
  resolveReportPeriod,
  type ReportPeriodPreset,
} from '@/lib/usage-reports/periods';

describe('resolveReportPeriod', () => {
  // Freeze "now" as Wednesday 2026-08-05 15:00 SAST
  const now = new Date('2026-08-05T13:00:00.000Z'); // 15:00 SAST

  it('weekly = last complete Mon–Sun week', () => {
    const p = resolveReportPeriod('weekly', now);
    expect(p.startIso).toBe('2026-07-27T00:00:00.000+02:00'); // Mon
    expect(p.endIso).toBe('2026-08-02T23:59:59.999+02:00'); // Sun
    expect(p.label).toMatch(/week/i);
  });

  it('monthly = last complete calendar month', () => {
    const p = resolveReportPeriod('monthly', now);
    expect(p.startIso).toBe('2026-07-01T00:00:00.000+02:00');
    expect(p.endIso).toBe('2026-07-31T23:59:59.999+02:00');
  });

  it('sixty_day ends yesterday', () => {
    const p = resolveReportPeriod('sixty_day', now);
    expect(p.endIso).toBe('2026-08-04T23:59:59.999+02:00');
    // 60 inclusive days ending yesterday
    expect(p.startIso).toBe('2026-06-06T00:00:00.000+02:00');
  });

  it('custom rejects >90 days', () => {
    expect(() =>
      resolveReportPeriod('custom', now, {
        startDate: '2026-01-01',
        endDate: '2026-05-01',
      })
    ).toThrow(/90/);
  });

  it('periodDayCount drives #669 short vs long', () => {
    const week = resolveReportPeriod('weekly', now);
    expect(week.inclusiveDayCount).toBe(7);
    expect(week.isShortPeriod).toBe(true);
    const month = resolveReportPeriod('monthly', now);
    expect(month.isShortPeriod).toBe(false);
  });
});
