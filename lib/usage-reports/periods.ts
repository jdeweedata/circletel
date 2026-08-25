import { addDays, differenceInDays, format, subDays } from 'date-fns';
import { displayDateRange, SAST_TIMEZONE, toSAST } from '@/lib/dates';
import type { ReportPeriod, ReportPeriodPreset } from './types';

export type { ReportPeriodPreset };

const MAX_CUSTOM_DAYS = 90;
const SAST_OFFSET = '+02:00';

type SastDateParts = { year: number; month: number; day: number };

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function sastStartIso({ year, month, day }: SastDateParts): string {
  return `${year}-${pad2(month)}-${pad2(day)}T00:00:00.000${SAST_OFFSET}`;
}

function sastEndIso({ year, month, day }: SastDateParts): string {
  return `${year}-${pad2(month)}-${pad2(day)}T23:59:59.999${SAST_OFFSET}`;
}

function sastCalendarAnchor({ year, month, day }: SastDateParts): Date {
  return new Date(`${year}-${pad2(month)}-${pad2(day)}T12:00:00${SAST_OFFSET}`);
}

function getSastDateParts(now: Date): SastDateParts & { dayOfWeek: number } {
  const sast = toSAST(now);
  if (!sast) {
    throw new Error('Invalid reference date');
  }

  return {
    year: sast.getUTCFullYear(),
    month: sast.getUTCMonth() + 1,
    day: sast.getUTCDate(),
    dayOfWeek: sast.getUTCDay(),
  };
}

function toSastPartsFromAnchor(anchor: Date): SastDateParts {
  const sast = toSAST(anchor);
  if (!sast) {
    throw new Error('Invalid SAST date');
  }

  return {
    year: sast.getUTCFullYear(),
    month: sast.getUTCMonth() + 1,
    day: sast.getUTCDate(),
  };
}

function addSastDays(date: SastDateParts, days: number): SastDateParts {
  return toSastPartsFromAnchor(addDays(sastCalendarAnchor(date), days));
}

function parseSastDateString(date: string): SastDateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error(`Invalid SAST date: ${date}`);
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function inclusiveDayCount(start: SastDateParts, end: SastDateParts): number {
  return differenceInDays(sastCalendarAnchor(end), sastCalendarAnchor(start)) + 1;
}

function buildReportPeriod(
  preset: ReportPeriodPreset,
  start: SastDateParts,
  end: SastDateParts,
  label: string
): ReportPeriod {
  const startIso = sastStartIso(start);
  const endIso = sastEndIso(end);
  const dayCount = inclusiveDayCount(start, end);

  return {
    preset,
    timezone: SAST_TIMEZONE,
    startIso,
    endIso,
    startUtc: new Date(startIso),
    endUtc: new Date(endIso),
    label,
    rangeLabel: displayDateRange(new Date(startIso), new Date(endIso)),
    inclusiveDayCount: dayCount,
    isShortPeriod: dayCount <= 7,
  };
}

function resolveWeekly(now: Date): ReportPeriod {
  const { dayOfWeek, ...today } = getSastDateParts(now);
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const thisMonday = addSastDays(today, -daysSinceMonday);
  const lastSunday = addSastDays(thisMonday, -1);
  const lastMonday = addSastDays(lastSunday, -6);

  return buildReportPeriod(
    'weekly',
    lastMonday,
    lastSunday,
    `Last complete week (${format(sastCalendarAnchor(lastMonday), 'd MMM')} – ${format(
      sastCalendarAnchor(lastSunday),
      'd MMM yyyy'
    )})`
  );
}

function resolveMonthly(now: Date): ReportPeriod {
  const { year, month } = getSastDateParts(now);
  const firstOfThisMonth = sastCalendarAnchor({ year, month, day: 1 });
  const lastDayPrevMonth = subDays(firstOfThisMonth, 1);
  const sastEnd = toSAST(lastDayPrevMonth);
  if (!sastEnd) {
    throw new Error('Invalid monthly period end');
  }

  const end: SastDateParts = {
    year: sastEnd.getUTCFullYear(),
    month: sastEnd.getUTCMonth() + 1,
    day: sastEnd.getUTCDate(),
  };
  const start: SastDateParts = { year: end.year, month: end.month, day: 1 };

  return buildReportPeriod(
    'monthly',
    start,
    end,
    format(sastCalendarAnchor(start), 'MMMM yyyy')
  );
}

function resolveSixtyDay(now: Date): ReportPeriod {
  const today = getSastDateParts(now);
  const end = addSastDays(today, -1);
  const start = addSastDays(end, -59);

  return buildReportPeriod('sixty_day', start, end, 'Last 60 days');
}

function resolveCustom(
  custom: { startDate: string; endDate: string }
): ReportPeriod {
  const start = parseSastDateString(custom.startDate);
  const end = parseSastDateString(custom.endDate);
  const dayCount = inclusiveDayCount(start, end);

  if (dayCount > MAX_CUSTOM_DAYS) {
    throw new Error(`Custom period cannot exceed ${MAX_CUSTOM_DAYS} days`);
  }

  if (dayCount < 1) {
    throw new Error('Custom period end date must be on or after start date');
  }

  return buildReportPeriod('custom', start, end, 'Custom period');
}

export function resolveReportPeriod(
  preset: ReportPeriodPreset,
  now: Date = new Date(),
  custom?: { startDate: string; endDate: string }
): ReportPeriod {
  switch (preset) {
    case 'weekly':
      return resolveWeekly(now);
    case 'monthly':
      return resolveMonthly(now);
    case 'sixty_day':
      return resolveSixtyDay(now);
    case 'custom':
      if (!custom) {
        throw new Error('Custom period requires startDate and endDate');
      }
      return resolveCustom(custom);
    default: {
      const _exhaustive: never = preset;
      throw new Error(`Unknown preset: ${_exhaustive}`);
    }
  }
}
