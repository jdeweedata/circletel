import { isVisitWindowBlocked } from '@/lib/admin/unjani-operator-actions';
import {
  OPEN_FIELD_JOB_STATUSES,
  candidateVisitDays,
  countTechnicianWorkload,
  installJobType,
} from '@/lib/admin/unjani-install-schedule';

describe('Unjani install visit scheduling', () => {
  it('skips weekends, holidays and the 25th–7th inside the fulfil window', () => {
    const days = candidateVisitDays({
      fromDate: '2026-08-18',
      fulfilByMax: '2026-09-15',
    });
    expect(days).not.toContain('2026-08-22');
    expect(days).not.toContain('2026-09-01');
    expect(days).not.toContain('2026-09-07');
    expect(days[0]).toBe('2026-08-18');
    expect(days).toContain('2026-09-10');
    expect(days.every((day) => !isVisitWindowBlocked(day))).toBe(true);
  });

  it('counts open field jobs per technician per day', () => {
    expect(
      countTechnicianWorkload(
        [
          {
            assigned_technician_id: 'tech-1',
            scheduled_date: '2026-09-10',
            status: 'assigned',
          },
          {
            assigned_technician_id: 'tech-1',
            scheduled_date: '2026-09-10',
            status: 'in_progress',
          },
          {
            assigned_technician_id: 'tech-1',
            scheduled_date: '2026-09-10',
            status: 'completed',
          },
          {
            assigned_technician_id: 'tech-2',
            scheduled_date: '2026-09-10',
            status: 'pending',
          },
        ],
        'tech-1',
        '2026-09-10'
      )
    ).toBe(2);
    expect(OPEN_FIELD_JOB_STATUSES).toEqual(
      expect.arrayContaining(['assigned', 'in_progress', 'pending'])
    );
  });

  it('uses wireless installation for Tarana and router setup otherwise', () => {
    expect(installJobType('fixed_wireless')).toBe('wireless_installation');
    expect(installJobType('5g')).toBe('router_setup');
    expect(installJobType('4g')).toBe('router_setup');
  });
});
