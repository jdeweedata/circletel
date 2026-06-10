/**
 * Business Day Utilities
 *
 * Calculates business days excluding weekends (Sat/Sun) and South African public holidays.
 * Used for SLA tracking in the onboarding pipeline.
 *
 * @module lib/dates/business-days
 */

import { addDays, isWeekend, parseISO, isValid } from 'date-fns';

/**
 * South African public holidays (2025-2027) as date strings (YYYY-MM-DD)
 * Used for business day calculations. Add new holidays as needed.
 */
const SA_PUBLIC_HOLIDAYS = [
  // 2026
  '2026-01-01', // New Year's Day
  '2026-03-21', // Human Rights Day
  '2026-04-10', // Good Friday
  '2026-04-13', // Family Day
  '2026-04-27', // Freedom Day
  '2026-05-01', // Workers' Day
  '2026-06-16', // Youth Day
  '2026-06-17', // Public Holiday (Youth Day observed)
  '2026-08-09', // National Women's Day
  '2026-09-24', // Heritage Day
  '2026-12-25', // Christmas Day
  '2026-12-26', // Day of Goodwill
];

/**
 * Parse a date and normalize to YYYY-MM-DD string for holiday matching
 */
function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is a South African public holiday
 */
export function isPublicHoliday(date: Date): boolean {
  const dateStr = dateToString(date);
  return SA_PUBLIC_HOLIDAYS.includes(dateStr);
}

/**
 * Check if a date is a business day (not weekend, not public holiday)
 */
export function isBusinessDay(date: Date): boolean {
  if (!isValid(date)) return false;
  return !isWeekend(date) && !isPublicHoliday(date);
}

/**
 * Add N business days to a date
 *
 * Skips weekends (Sat/Sun) and South African public holidays.
 * For SLA tracking: addBusinessDays(submittedAt, 2) = vetting due date.
 *
 * @param date - Start date
 * @param days - Number of business days to add
 * @returns Date N business days later
 */
export function addBusinessDays(date: Date, days: number): Date {
  if (!isValid(date)) return date;

  let current = new Date(date);
  let count = 0;

  // Add days until we reach the target count
  while (count < days) {
    current = addDays(current, 1);
    if (isBusinessDay(current)) {
      count++;
    }
  }

  return current;
}

/**
 * Calculate business days between two dates (inclusive of start, exclusive of end)
 */
export function countBusinessDays(start: Date, end: Date): number {
  if (!isValid(start) || !isValid(end)) return 0;

  let current = new Date(start);
  let count = 0;

  while (current < end) {
    if (isBusinessDay(current)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}

/**
 * Get business days remaining until a date
 *
 * Returns negative if the date is in the past.
 *
 * @param fromDate - Reference date
 * @param untilDate - Target date
 * @returns Number of business days until untilDate
 */
export function getBusinessDaysUntil(fromDate: Date, untilDate: Date): number {
  if (!isValid(fromDate) || !isValid(untilDate)) return 0;

  let current = new Date(fromDate);
  let count = 0;
  const isNegative = fromDate > untilDate;

  // If counting backwards, swap direction
  if (isNegative) {
    [fromDate, untilDate] = [untilDate, fromDate];
    current = new Date(fromDate);
  }

  while (current < untilDate) {
    if (isBusinessDay(current)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return isNegative ? -count : count;
}
