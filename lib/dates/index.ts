/**
 * Date/Time Utilities
 *
 * Centralized date handling for CircleTel with South African timezone support.
 * All dates are stored as UTC in the database and displayed in SAST.
 *
 * @module lib/dates
 *
 * SAST = South African Standard Time (UTC+2, no daylight saving)
 * Timezone: Africa/Johannesburg
 *
 * @example
 * ```typescript
 * import { formatDate, formatDateTime, toSAST, toUTC, now } from '@/lib/dates';
 *
 * // Format for display (automatically converts to SAST)
 * formatDate(invoice.due_date); // "15 Feb 2026"
 * formatDateTime(order.created_at); // "15 Feb 2026, 14:30"
 *
 * // Get current time in SAST
 * const sastNow = now(); // Current time in SAST
 *
 * // Store in database (UTC)
 * const utcTime = toUTC(localDate);
 * ```
 */

import {
  format,
  formatDistanceToNow,
  formatDistance,
  parseISO,
  isValid,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  differenceInMonths,
  differenceInYears,
  addDays,
  addMonths,
  addYears,
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  isBefore,
  isAfter,
  isFuture,
  isPast,
  eachDayOfInterval,
  eachMonthOfInterval,
  getDate,
  getMonth,
  getYear,
  setDate,
  lastDayOfMonth,
} from 'date-fns';

// Re-export commonly used date-fns functions
export {
  parseISO,
  isValid,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  differenceInMonths,
  differenceInYears,
  addDays,
  addMonths,
  addYears,
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  isBefore,
  isAfter,
  isFuture,
  isPast,
  eachDayOfInterval,
  eachMonthOfInterval,
  getDate,
  getMonth,
  getYear,
  setDate,
  lastDayOfMonth,
};

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * South African Standard Time offset in hours (UTC+2)
 * Note: South Africa does not observe daylight saving time
 */
export const SAST_OFFSET_HOURS = 2;
export const SAST_OFFSET_MS = SAST_OFFSET_HOURS * 60 * 60 * 1000;
export const SAST_TIMEZONE = 'Africa/Johannesburg';

/**
 * Common date format patterns
 */
export const DATE_FORMATS = {
  /** 15 Feb 2026 */
  display: 'd MMM yyyy',
  /** 15/02/2026 */
  short: 'dd/MM/yyyy',
  /** 15 February 2026 */
  long: 'd MMMM yyyy',
  /** 2026-02-15 */
  iso: 'yyyy-MM-dd',
  /** February 2026 */
  monthYear: 'MMMM yyyy',
  /** Feb 2026 */
  monthYearShort: 'MMM yyyy',
  /** 15 Feb */
  dayMonth: 'd MMM',
  /** Friday, 15 February 2026 */
  full: 'EEEE, d MMMM yyyy',
} as const;

export const TIME_FORMATS = {
  /** 14:30 */
  time: 'HH:mm',
  /** 14:30:45 */
  timeWithSeconds: 'HH:mm:ss',
  /** 2:30 PM */
  time12h: 'h:mm a',
} as const;

export const DATETIME_FORMATS = {
  /** 15 Feb 2026, 14:30 */
  display: "d MMM yyyy, HH:mm",
  /** 15/02/2026 14:30 */
  short: 'dd/MM/yyyy HH:mm',
  /** 15 February 2026 at 14:30 */
  long: "d MMMM yyyy 'at' HH:mm",
  /** 2026-02-15T14:30:00 */
  iso: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type DateInput = Date | string | number | null | undefined;

// =============================================================================
// CORE PARSING
// =============================================================================

/**
 * Parse a date input into a Date object
 *
 * Handles:
 * - Date objects (returned as-is)
 * - ISO strings (parsed with parseISO)
 * - Timestamps (converted to Date)
 * - null/undefined (returns null)
 */
export function parseDate(input: DateInput): Date | null {
  if (!input) return null;

  if (input instanceof Date) {
    return isValid(input) ? input : null;
  }

  if (typeof input === 'number') {
    const date = new Date(input);
    return isValid(date) ? date : null;
  }

  if (typeof input === 'string') {
    // Try ISO format first
    const isoDate = parseISO(input);
    if (isValid(isoDate)) return isoDate;

    // Try native parsing as fallback
    const nativeDate = new Date(input);
    return isValid(nativeDate) ? nativeDate : null;
  }

  return null;
}

/**
 * Safely parse a date, throwing if invalid
 */
export function parseDateStrict(input: DateInput): Date {
  const date = parseDate(input);
  if (!date) {
    throw new Error(`Invalid date input: ${input}`);
  }
  return date;
}

// =============================================================================
// TIMEZONE CONVERSION
// =============================================================================

/**
 * Get the current time
 *
 * Returns a Date object representing the current moment.
 * The Date is in UTC internally, but can be displayed in SAST using format functions.
 */
export function now(): Date {
  return new Date();
}

/**
 * Convert a UTC date to SAST (South African Standard Time)
 *
 * Note: JavaScript Dates are always UTC internally. This function adjusts
 * the time to represent the equivalent SAST time when formatted.
 *
 * @param date - Date in UTC
 * @returns Date adjusted to SAST
 */
export function toSAST(date: DateInput): Date | null {
  const parsed = parseDate(date);
  if (!parsed) return null;

  // Add SAST offset to get local time representation
  return new Date(parsed.getTime() + SAST_OFFSET_MS);
}

/**
 * Convert a SAST date to UTC for database storage
 *
 * @param date - Date in SAST
 * @returns Date in UTC
 */
export function toUTC(date: DateInput): Date | null {
  const parsed = parseDate(date);
  if (!parsed) return null;

  // Subtract SAST offset to get UTC
  return new Date(parsed.getTime() - SAST_OFFSET_MS);
}

/**
 * Get the current time as an ISO string (for database storage)
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Get the current SAST date as a formatted string
 */
export function nowSAST(formatStr: string = DATE_FORMATS.display): string {
  const sastDate = toSAST(now());
  return sastDate ? format(sastDate, formatStr) : '';
}

// =============================================================================
// FORMATTING FUNCTIONS
// =============================================================================

/**
 * Format a date for display (e.g., "15 Feb 2026")
 *
 * @param date - Date to format
 * @param formatStr - Format string (default: display format)
 * @returns Formatted date string or empty string if invalid
 */
export function formatDate(
  date: DateInput,
  formatStr: string = DATE_FORMATS.display
): string {
  const parsed = parseDate(date);
  if (!parsed) return '';

  try {
    return format(parsed, formatStr);
  } catch {
    return '';
  }
}

/**
 * Format a date with time (e.g., "15 Feb 2026, 14:30")
 */
export function formatDateTime(
  date: DateInput,
  formatStr: string = DATETIME_FORMATS.display
): string {
  return formatDate(date, formatStr);
}

/**
 * Format time only (e.g., "14:30")
 */
export function formatTime(
  date: DateInput,
  formatStr: string = TIME_FORMATS.time
): string {
  return formatDate(date, formatStr);
}

/**
 * Format as ISO date string (e.g., "2026-02-15")
 */
export function formatISO(date: DateInput): string {
  return formatDate(date, DATE_FORMATS.iso);
}

/**
 * Format as full ISO datetime string for API/database
 */
export function formatISOFull(date: DateInput): string {
  const parsed = parseDate(date);
  return parsed ? parsed.toISOString() : '';
}

// =============================================================================
// RELATIVE TIME
// =============================================================================

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 *
 * @param date - Date to compare
 * @param options - Formatting options
 */
export function formatRelative(
  date: DateInput,
  options: { addSuffix?: boolean; baseDate?: Date } = {}
): string {
  const parsed = parseDate(date);
  if (!parsed) return '';

  const { addSuffix = true, baseDate = new Date() } = options;

  try {
    return formatDistanceToNow(parsed, { addSuffix });
  } catch {
    return '';
  }
}

/**
 * Format distance between two dates (e.g., "3 days")
 */
export function formatDuration(
  start: DateInput,
  end: DateInput,
  options: { includeSeconds?: boolean } = {}
): string {
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (!startDate || !endDate) return '';

  try {
    return formatDistance(startDate, endDate, options);
  } catch {
    return '';
  }
}

// =============================================================================
// BILLING-SPECIFIC HELPERS
// =============================================================================

/**
 * Get the billing day of month (1-28)
 * Caps at 28 to handle February consistently
 */
export function getBillingDay(date: DateInput): number {
  const parsed = parseDate(date);
  if (!parsed) return 1;

  const day = getDate(parsed);
  return Math.min(day, 28);
}

/**
 * Get the next billing date based on billing day
 *
 * @param billingDay - Day of month (1-28)
 * @param fromDate - Reference date (default: now)
 * @returns Next billing date
 */
export function getNextBillingDate(
  billingDay: number,
  fromDate: DateInput = now()
): Date {
  const date = parseDate(fromDate) || now();
  const day = Math.min(Math.max(billingDay, 1), 28);

  let result = setDate(date, day);

  // If the billing day has passed this month, use next month
  if (isBefore(result, date)) {
    result = addMonths(result, 1);
  }

  return startOfDay(result);
}

/**
 * Calculate prorata days for billing
 *
 * @param startDate - Service start date
 * @param endDate - End of billing period (default: end of month)
 * @returns Object with days remaining and total days in period
 */
export function calculateProrataDays(
  startDate: DateInput,
  endDate?: DateInput
): { daysRemaining: number; totalDays: number; factor: number } {
  const start = parseDate(startDate);
  if (!start) {
    return { daysRemaining: 0, totalDays: 30, factor: 0 };
  }

  const end = endDate ? parseDate(endDate) : endOfMonth(start);
  if (!end) {
    return { daysRemaining: 0, totalDays: 30, factor: 0 };
  }

  const monthStart = startOfMonth(start);
  const monthEnd = endOfMonth(start);

  const totalDays = differenceInDays(monthEnd, monthStart) + 1;
  const daysRemaining = differenceInDays(end, start) + 1;
  const factor = Math.min(daysRemaining / totalDays, 1);

  return {
    daysRemaining: Math.max(0, daysRemaining),
    totalDays,
    factor: Math.round(factor * 10000) / 10000, // 4 decimal places
  };
}

/**
 * Get invoice due date (typically 7 or 30 days from issue)
 */
export function getInvoiceDueDate(
  issueDate: DateInput,
  termsDays: number = 7
): Date {
  const date = parseDate(issueDate) || now();
  return addDays(date, termsDays);
}

/**
 * Check if an invoice is overdue
 */
export function isOverdue(dueDate: DateInput): boolean {
  const due = parseDate(dueDate);
  if (!due) return false;

  return isPast(due) && !isToday(due);
}

/**
 * Get days until due / days overdue
 */
export function getDaysUntilDue(dueDate: DateInput): number {
  const due = parseDate(dueDate);
  if (!due) return 0;

  return differenceInDays(due, now());
}

// =============================================================================
// DATE RANGE HELPERS
// =============================================================================

/**
 * Get start and end of today
 */
export function getToday(): { start: Date; end: Date } {
  const today = now();
  return {
    start: startOfDay(today),
    end: endOfDay(today),
  };
}

/**
 * Get start and end of current month
 */
export function getCurrentMonth(): { start: Date; end: Date } {
  const today = now();
  return {
    start: startOfMonth(today),
    end: endOfMonth(today),
  };
}

/**
 * Get start and end of current year
 */
export function getCurrentYear(): { start: Date; end: Date } {
  const today = now();
  return {
    start: startOfYear(today),
    end: endOfYear(today),
  };
}

/**
 * Get last N days range
 */
export function getLastNDays(n: number): { start: Date; end: Date } {
  const today = now();
  return {
    start: startOfDay(subDays(today, n - 1)),
    end: endOfDay(today),
  };
}

/**
 * Get last N months range
 */
export function getLastNMonths(n: number): { start: Date; end: Date } {
  const today = now();
  return {
    start: startOfMonth(subMonths(today, n - 1)),
    end: endOfMonth(today),
  };
}

// =============================================================================
// COMPARISON HELPERS
// =============================================================================

/**
 * Check if a date is within a range
 */
export function isWithinRange(
  date: DateInput,
  start: DateInput,
  end: DateInput
): boolean {
  const d = parseDate(date);
  const s = parseDate(start);
  const e = parseDate(end);

  if (!d || !s || !e) return false;

  return (isAfter(d, s) || isSameDay(d, s)) && (isBefore(d, e) || isSameDay(d, e));
}

/**
 * Check if two dates are in the same billing period (month)
 */
export function isSameBillingPeriod(date1: DateInput, date2: DateInput): boolean {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  if (!d1 || !d2) return false;

  return isSameMonth(d1, d2) && isSameYear(d1, d2);
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Format date for display with fallback
 */
export function displayDate(
  date: DateInput,
  fallback: string = '-'
): string {
  const formatted = formatDate(date);
  return formatted || fallback;
}

/**
 * Format datetime for display with fallback
 */
export function displayDateTime(
  date: DateInput,
  fallback: string = '-'
): string {
  const formatted = formatDateTime(date);
  return formatted || fallback;
}

/**
 * Format a date range for display
 * e.g., "15 Feb - 28 Feb 2026" or "15 Feb 2026 - 15 Mar 2026"
 */
export function displayDateRange(
  start: DateInput,
  end: DateInput
): string {
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (!startDate || !endDate) return '';

  if (isSameMonth(startDate, endDate)) {
    // Same month: "15 - 28 Feb 2026"
    return `${format(startDate, 'd')} - ${format(endDate, 'd MMM yyyy')}`;
  } else if (isSameYear(startDate, endDate)) {
    // Same year: "15 Feb - 15 Mar 2026"
    return `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')}`;
  } else {
    // Different years: "15 Dec 2025 - 15 Jan 2026"
    return `${format(startDate, 'd MMM yyyy')} - ${format(endDate, 'd MMM yyyy')}`;
  }
}

/**
 * Get human-readable age description
 * e.g., "2 days old", "3 months old"
 */
export function getAge(date: DateInput): string {
  const d = parseDate(date);
  if (!d) return '';

  const days = differenceInDays(now(), d);

  if (days === 0) return 'today';
  if (days === 1) return '1 day old';
  if (days < 30) return `${days} days old`;

  const months = differenceInMonths(now(), d);
  if (months === 1) return '1 month old';
  if (months < 12) return `${months} months old`;

  const years = differenceInYears(now(), d);
  if (years === 1) return '1 year old';
  return `${years} years old`;
}
