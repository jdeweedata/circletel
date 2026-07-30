/**
 * First-response SLA business-hours helper tests
 *
 * Business window: Mon–Fri 08:00–17:00 Africa/Johannesburg (SAST, UTC+2, no DST)
 */

import { describe, it, expect } from '@jest/globals';
import {
  addBusinessHours,
  computeFirstResponseDueAt,
} from '@/lib/leads/first-response-sla';

/** Parse a SAST wall-clock ISO without offset as Africa/Johannesburg */
function sast(isoLocal: string): Date {
  // Accept "YYYY-MM-DDTHH:mm:ss" as SAST
  return new Date(`${isoLocal}+02:00`);
}

function expectSast(actual: Date, isoLocal: string): void {
  expect(actual.toISOString()).toBe(sast(isoLocal).toISOString());
}

describe('addBusinessHours', () => {
  describe('mid-day within same business day', () => {
    it('Wednesday 10:00 SAST + 2h → Wednesday 12:00 SAST', () => {
      // 2026-06-10 is a Wednesday
      const result = addBusinessHours(sast('2026-06-10T10:00:00'), 2);
      expectSast(result, '2026-06-10T12:00:00');
    });

    it('Monday 08:00 SAST + 1h → Monday 09:00 SAST', () => {
      const result = addBusinessHours(sast('2026-06-08T08:00:00'), 1);
      expectSast(result, '2026-06-08T09:00:00');
    });

    it('Thursday 09:15 SAST + 0.5h → Thursday 09:45 SAST', () => {
      const result = addBusinessHours(sast('2026-06-11T09:15:00'), 0.5);
      expectSast(result, '2026-06-11T09:45:00');
    });
  });

  describe('cross end-of-day into next business day', () => {
    it('Wednesday 16:00 SAST + 2h → Thursday 09:00 SAST', () => {
      // 1h remaining Wed (16:00–17:00), then 1h from Thu 08:00 → 09:00
      const result = addBusinessHours(sast('2026-06-10T16:00:00'), 2);
      expectSast(result, '2026-06-11T09:00:00');
    });

    it('Wednesday 16:30 SAST + 2h → Thursday 09:30 SAST', () => {
      // 0.5h Wed + 1.5h Thu from 08:00
      const result = addBusinessHours(sast('2026-06-10T16:30:00'), 2);
      expectSast(result, '2026-06-11T09:30:00');
    });
  });

  describe('cross weekend', () => {
    it('Friday 16:30 SAST + 2h → Monday 09:30 SAST', () => {
      // 0.5h Fri remaining, then Mon 08:00 + 1.5h
      const result = addBusinessHours(sast('2026-06-12T16:30:00'), 2);
      expectSast(result, '2026-06-15T09:30:00');
    });

    it('Friday 15:00 SAST + 4h → Monday 10:00 SAST', () => {
      // 2h Fri remaining (15–17), then Mon 08:00 + 2h → 10:00
      const result = addBusinessHours(sast('2026-06-12T15:00:00'), 4);
      expectSast(result, '2026-06-15T10:00:00');
    });
  });

  describe('after hours and weekends snap to next open', () => {
    it('Saturday morning + 2h → Monday 10:00 SAST', () => {
      const result = addBusinessHours(sast('2026-06-13T09:00:00'), 2);
      expectSast(result, '2026-06-15T10:00:00');
    });

    it('Sunday evening + 2h → Monday 10:00 SAST', () => {
      const result = addBusinessHours(sast('2026-06-14T20:00:00'), 2);
      expectSast(result, '2026-06-15T10:00:00');
    });

    it('Wednesday 18:00 SAST + 2h → Thursday 10:00 SAST', () => {
      const result = addBusinessHours(sast('2026-06-10T18:00:00'), 2);
      expectSast(result, '2026-06-11T10:00:00');
    });

    it('Wednesday before open 07:00 SAST + 2h → Wednesday 10:00 SAST', () => {
      const result = addBusinessHours(sast('2026-06-10T07:00:00'), 2);
      expectSast(result, '2026-06-10T10:00:00');
    });

    it('exactly at close 17:00 SAST + 2h → next business day 10:00 SAST', () => {
      const result = addBusinessHours(sast('2026-06-10T17:00:00'), 2);
      expectSast(result, '2026-06-11T10:00:00');
    });
  });

  describe('edge cases', () => {
    it('adds 0 hours and returns the same instant when already in business hours', () => {
      const start = sast('2026-06-10T11:00:00');
      const result = addBusinessHours(start, 0);
      expect(result.toISOString()).toBe(start.toISOString());
    });

    it('returns an invalid date for invalid input', () => {
      const invalid = new Date('invalid');
      const result = addBusinessHours(invalid, 2);
      expect(Number.isNaN(result.getTime())).toBe(true);
    });

    it('uses Africa/Johannesburg by default (UTC input mid-day SAST)', () => {
      // 08:00 UTC = 10:00 SAST Wednesday
      const start = new Date('2026-06-10T08:00:00.000Z');
      const result = addBusinessHours(start, 2);
      // 12:00 SAST = 10:00 UTC
      expect(result.toISOString()).toBe('2026-06-10T10:00:00.000Z');
    });
  });
});

describe('computeFirstResponseDueAt', () => {
  it('is a convenience for addBusinessHours(createdAt, 2)', () => {
    const createdAt = sast('2026-06-10T10:00:00');
    expect(computeFirstResponseDueAt(createdAt).toISOString()).toBe(
      addBusinessHours(createdAt, 2).toISOString()
    );
  });

  it('sets due 2 business hours after after-hours create', () => {
    // Friday 18:00 SAST → Monday 10:00 SAST
    const result = computeFirstResponseDueAt(sast('2026-06-12T18:00:00'));
    expectSast(result, '2026-06-15T10:00:00');
  });
});
