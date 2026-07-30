/**
 * First-response SLA helpers
 *
 * Computes business-hours deadlines for lead first response.
 * Default window: Mon–Fri 08:00–17:00 Africa/Johannesburg (SAST, UTC+2, no DST).
 *
 * Design: on insert or when status becomes `new`,
 * `first_response_due_at = created_at + 2 business hours`.
 *
 * Note: day-level business-day helpers live in `lib/dates/business-days.ts`
 * (weekends + SA public holidays). This module is hour-granularity and
 * intentionally uses Mon–Fri only (no holiday calendar).
 *
 * @module lib/leads/first-response-sla
 */

import { SAST_TIMEZONE } from '@/lib/dates';

/** Business day open hour (inclusive), local wall clock */
const BUSINESS_OPEN_HOUR = 8;
/** Business day close hour (exclusive), local wall clock */
const BUSINESS_CLOSE_HOUR = 17;

export interface AddBusinessHoursOptions {
  /** IANA timezone. Defaults to Africa/Johannesburg. */
  timeZone?: string;
}

interface ZonedParts {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number; // 0=Sun … 6=Sat
}

const WEEKDAY_TO_NUM: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });

  const bag: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') {
      bag[part.type] = part.value;
    }
  }

  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
    dayOfWeek: WEEKDAY_TO_NUM[bag.weekday] ?? 0,
  };
}

/**
 * Convert a wall-clock time in `timeZone` to a UTC Date.
 * Iteratively corrects offset so fixed-offset (SAST) and DST zones work.
 */
function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second);

  for (let i = 0; i < 4; i++) {
    const zoned = getZonedParts(new Date(utcMs), timeZone);
    const asIfUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second
    );
    const desired = Date.UTC(year, month - 1, day, hour, minute, second);
    const diff = desired - asIfUtc;
    if (diff === 0) break;
    utcMs += diff;
  }

  return new Date(utcMs);
}

function isWeekday(dayOfWeek: number): boolean {
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

function minutesSinceMidnight(hour: number, minute: number, second: number): number {
  return hour * 60 + minute + second / 60;
}

function addCalendarDays(
  year: number,
  month: number,
  day: number,
  days: number
): { year: number; month: number; day: number; dayOfWeek: number } {
  // Use UTC noon to avoid DST edge issues when advancing calendar days
  const base = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  base.setUTCDate(base.getUTCDate() + days);
  return {
    year: base.getUTCFullYear(),
    month: base.getUTCMonth() + 1,
    day: base.getUTCDate(),
    dayOfWeek: base.getUTCDay(),
  };
}

/**
 * Snap a zoned instant to the start of the next business window if needed.
 * If already inside Mon–Fri [08:00, 17:00), returns the same parts.
 */
function snapToBusinessStart(parts: ZonedParts): ZonedParts {
  const openMin = BUSINESS_OPEN_HOUR * 60;
  const closeMin = BUSINESS_CLOSE_HOUR * 60;
  const currentMin = minutesSinceMidnight(parts.hour, parts.minute, parts.second);

  let year = parts.year;
  let month = parts.month;
  let day = parts.day;
  let dayOfWeek = parts.dayOfWeek;
  let hour = parts.hour;
  let minute = parts.minute;
  let second = parts.second;

  if (isWeekday(dayOfWeek) && currentMin >= openMin && currentMin < closeMin) {
    return parts;
  }

  // Before open on a weekday → same day open
  if (isWeekday(dayOfWeek) && currentMin < openMin) {
    return {
      year,
      month,
      day,
      hour: BUSINESS_OPEN_HOUR,
      minute: 0,
      second: 0,
      dayOfWeek,
    };
  }

  // After close or weekend → next weekday open
  let advance = 1;
  if (isWeekday(dayOfWeek) && currentMin >= closeMin) {
    advance = 1;
  } else if (dayOfWeek === 6) {
    // Saturday → Monday
    advance = 2;
  } else if (dayOfWeek === 0) {
    // Sunday → Monday
    advance = 1;
  }

  let next = addCalendarDays(year, month, day, advance);
  while (!isWeekday(next.dayOfWeek)) {
    next = addCalendarDays(next.year, next.month, next.day, 1);
  }

  return {
    year: next.year,
    month: next.month,
    day: next.day,
    hour: BUSINESS_OPEN_HOUR,
    minute: 0,
    second: 0,
    dayOfWeek: next.dayOfWeek,
  };
}

function nextBusinessOpen(parts: ZonedParts): ZonedParts {
  // Start from "just after" current day close by advancing one calendar day
  let next = addCalendarDays(parts.year, parts.month, parts.day, 1);
  while (!isWeekday(next.dayOfWeek)) {
    next = addCalendarDays(next.year, next.month, next.day, 1);
  }
  return {
    year: next.year,
    month: next.month,
    day: next.day,
    hour: BUSINESS_OPEN_HOUR,
    minute: 0,
    second: 0,
    dayOfWeek: next.dayOfWeek,
  };
}

/**
 * Add N business hours to a start instant.
 *
 * Business hours are Mon–Fri 08:00–17:00 in the given timezone
 * (default Africa/Johannesburg). Time outside the window does not count;
 * the clock starts at the next open.
 *
 * @param start - Start instant (typically UTC Date from the DB)
 * @param hours - Business hours to add (may be fractional)
 * @param options.timeZone - IANA timezone (default SAST)
 */
export function addBusinessHours(
  start: Date,
  hours: number,
  options?: AddBusinessHoursOptions
): Date {
  if (Number.isNaN(start.getTime())) {
    return new Date(NaN);
  }

  if (hours === 0) {
    return new Date(start.getTime());
  }

  if (hours < 0) {
    throw new Error('addBusinessHours: hours must be non-negative');
  }

  const timeZone = options?.timeZone ?? SAST_TIMEZONE;
  let remainingMs = hours * 60 * 60 * 1000;

  let parts = snapToBusinessStart(getZonedParts(start, timeZone));
  let cursor = zonedTimeToUtc(
    parts.year,
    parts.month,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    timeZone
  );

  // Safety: max ~1 year of iterations (365 business days)
  let guard = 0;
  while (remainingMs > 0 && guard < 400) {
    guard += 1;
    parts = getZonedParts(cursor, timeZone);

    // Ensure we are inside a business window
    const snapped = snapToBusinessStart(parts);
    if (
      snapped.year !== parts.year ||
      snapped.month !== parts.month ||
      snapped.day !== parts.day ||
      snapped.hour !== parts.hour ||
      snapped.minute !== parts.minute ||
      snapped.second !== parts.second
    ) {
      cursor = zonedTimeToUtc(
        snapped.year,
        snapped.month,
        snapped.day,
        snapped.hour,
        snapped.minute,
        snapped.second,
        timeZone
      );
      parts = snapped;
    }

    const close = zonedTimeToUtc(
      parts.year,
      parts.month,
      parts.day,
      BUSINESS_CLOSE_HOUR,
      0,
      0,
      timeZone
    );
    const availableMs = close.getTime() - cursor.getTime();

    if (availableMs <= 0) {
      const next = nextBusinessOpen(parts);
      cursor = zonedTimeToUtc(
        next.year,
        next.month,
        next.day,
        next.hour,
        next.minute,
        next.second,
        timeZone
      );
      continue;
    }

    if (remainingMs <= availableMs) {
      return new Date(cursor.getTime() + remainingMs);
    }

    remainingMs -= availableMs;
    const next = nextBusinessOpen(parts);
    cursor = zonedTimeToUtc(
      next.year,
      next.month,
      next.day,
      next.hour,
      next.minute,
      next.second,
      timeZone
    );
  }

  return cursor;
}

/**
 * Convenience: first-response due at = created_at + 2 business hours (SAST).
 */
export function computeFirstResponseDueAt(createdAt: Date): Date {
  return addBusinessHours(createdAt, 2);
}
