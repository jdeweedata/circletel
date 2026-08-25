import { isBusinessDay } from '@/lib/dates/business-days';
import { isVisitWindowBlocked } from '@/lib/admin/unjani-operator-actions';
import { parseCalendarDate, toCalendarDate } from '@/lib/admin/unjani-warehouse';
import type { AccessTech } from '@/lib/portal/coverage-summary';
import type { FieldJobStatus, FieldJobType } from '@/lib/types/technician-tracking';

export const OPEN_FIELD_JOB_STATUSES: FieldJobStatus[] = [
  'pending',
  'assigned',
  'en_route',
  'arrived',
  'in_progress',
  'on_hold',
];

export function installJobType(access: AccessTech): FieldJobType {
  return access === 'fixed_wireless' ? 'wireless_installation' : 'router_setup';
}

export function candidateVisitDays(input: {
  fromDate: string;
  fulfilByMax: string;
}): string[] {
  const days: string[] = [];
  let current = parseCalendarDate(input.fromDate);
  const end = parseCalendarDate(input.fulfilByMax);
  while (current.getTime() <= end.getTime()) {
    const iso = toCalendarDate(current);
    if (isBusinessDay(current) && !isVisitWindowBlocked(iso)) {
      days.push(iso);
    }
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 12, 0, 0);
  }
  return days;
}

export function countTechnicianWorkload(
  jobs: Array<{
    assigned_technician_id?: string | null;
    scheduled_date?: string | null;
    status?: string | null;
  }>,
  technicianId: string,
  date: string
): number {
  const open = new Set<string>(OPEN_FIELD_JOB_STATUSES);
  return jobs.filter(
    (job) =>
      job.assigned_technician_id === technicianId &&
      job.scheduled_date === date &&
      open.has(String(job.status ?? ''))
  ).length;
}
