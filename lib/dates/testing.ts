/**
 * Date Testing Utilities
 *
 * Helpers for testing date-dependent code.
 *
 * @module lib/dates/testing
 *
 * @example
 * ```typescript
 * import { mockDate, resetDate, freezeTime } from '@/lib/dates/testing';
 *
 * describe('billing tests', () => {
 *   afterEach(() => {
 *     resetDate();
 *   });
 *
 *   it('should calculate prorata correctly', () => {
 *     mockDate('2026-02-15');
 *     // Now Date.now() returns Feb 15, 2026
 *   });
 * });
 * ```
 */

import { parseISO } from 'date-fns';

// Store original Date for restoration
const OriginalDate = global.Date;

/**
 * Mock the current date for testing
 *
 * @param dateString - ISO date string or Date object
 */
export function mockDate(dateString: string | Date): void {
  const mockNow = typeof dateString === 'string'
    ? parseISO(dateString).getTime()
    : dateString.getTime();

  const MockDate = class extends OriginalDate {
    constructor(...args: Parameters<typeof OriginalDate>) {
      if (args.length === 0) {
        super(mockNow);
      } else {
        // @ts-expect-error - spreading into Date constructor
        super(...args);
      }
    }

    static now(): number {
      return mockNow;
    }
  } as DateConstructor;

  global.Date = MockDate;
}

/**
 * Reset Date to original implementation
 */
export function resetDate(): void {
  global.Date = OriginalDate;
}

/**
 * Freeze time at a specific date for the duration of a callback
 *
 * @param dateString - Date to freeze at
 * @param callback - Function to execute with frozen time
 */
export async function freezeTime<T>(
  dateString: string | Date,
  callback: () => T | Promise<T>
): Promise<T> {
  mockDate(dateString);
  try {
    return await callback();
  } finally {
    resetDate();
  }
}

/**
 * Create a date string for testing
 *
 * @param daysFromNow - Number of days from "now" (can be negative for past)
 * @param baseDate - Base date (default: current test date)
 */
export function testDate(daysFromNow: number, baseDate?: string): string {
  const base = baseDate ? parseISO(baseDate) : new Date();
  const result = new Date(base.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
  return result.toISOString().split('T')[0];
}

/**
 * Create a datetime string for testing
 *
 * @param daysFromNow - Days offset
 * @param hoursFromMidnight - Hours to add to midnight
 * @param baseDate - Base date
 */
export function testDateTime(
  daysFromNow: number,
  hoursFromMidnight: number = 12,
  baseDate?: string
): string {
  const date = testDate(daysFromNow, baseDate);
  const hours = String(hoursFromMidnight).padStart(2, '0');
  return `${date}T${hours}:00:00.000Z`;
}

/**
 * Common test dates for billing scenarios
 */
export const TEST_DATES = {
  /** Start of a month */
  monthStart: '2026-02-01T00:00:00.000Z',
  /** Middle of a month */
  midMonth: '2026-02-15T12:00:00.000Z',
  /** End of a month */
  monthEnd: '2026-02-28T23:59:59.999Z',
  /** Invoice due date (7 days from issue) */
  invoiceDue: '2026-02-22T12:00:00.000Z',
  /** Overdue invoice */
  overdue: '2026-01-15T12:00:00.000Z',
  /** Future date */
  future: '2026-03-15T12:00:00.000Z',
  /** Leap year date */
  leapYear: '2024-02-29T12:00:00.000Z',
} as const;
