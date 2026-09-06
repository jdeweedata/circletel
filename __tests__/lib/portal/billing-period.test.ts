/**
 * @jest-environment node
 */

import {
  formatMonthLabel,
  invoiceMonthKey,
  monthBounds,
  parsePortalStatementOptions,
  pdfDisposition,
} from '@/lib/portal/billing-period';

describe('monthBounds', () => {
  it('returns first and last day for a 31-day month', () => {
    expect(monthBounds('2026-01')).toEqual({ from: '2026-01-01', to: '2026-01-31' });
  });

  it('handles February in a non-leap year', () => {
    expect(monthBounds('2025-02')).toEqual({ from: '2025-02-01', to: '2025-02-28' });
  });

  it('handles February in a leap year', () => {
    expect(monthBounds('2024-02')).toEqual({ from: '2024-02-01', to: '2024-02-29' });
  });

  it('rejects invalid months', () => {
    expect(monthBounds('2026-13')).toBeNull();
    expect(monthBounds('2026-00')).toBeNull();
    expect(monthBounds('bad')).toBeNull();
    expect(monthBounds('')).toBeNull();
  });
});

describe('invoiceMonthKey', () => {
  it('extracts YYYY-MM from period_start', () => {
    expect(invoiceMonthKey('2026-08-01')).toBe('2026-08');
  });

  it('returns null for missing or short values', () => {
    expect(invoiceMonthKey(null)).toBeNull();
    expect(invoiceMonthKey('2026')).toBeNull();
  });
});

describe('formatMonthLabel', () => {
  it('formats a calendar month', () => {
    expect(formatMonthLabel('2026-08')).toMatch(/August.*2026/);
  });
});

describe('parsePortalStatementOptions', () => {
  it('prefers from+to over month and period', () => {
    const params = new URLSearchParams({
      from: '2026-01-01',
      to: '2026-01-31',
      month: '2026-08',
      period: '3m',
    });
    expect(parsePortalStatementOptions(params)).toEqual({
      from: '2026-01-01',
      to: '2026-01-31',
    });
  });

  it('maps month=YYYY-MM to bounds', () => {
    const params = new URLSearchParams({ month: '2026-09' });
    expect(parsePortalStatementOptions(params)).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
    });
  });

  it('falls back to period when month is invalid', () => {
    const params = new URLSearchParams({ month: 'nope', period: '6m' });
    expect(parsePortalStatementOptions(params)).toEqual({ period: '6m' });
  });

  it('defaults to 12m', () => {
    expect(parsePortalStatementOptions(new URLSearchParams())).toEqual({
      period: '12m',
    });
  });
});

describe('pdfDisposition', () => {
  it('defaults to attachment', () => {
    expect(pdfDisposition(null)).toBe('attachment');
    expect(pdfDisposition('download')).toBe('attachment');
  });

  it('accepts inline', () => {
    expect(pdfDisposition('inline')).toBe('inline');
  });
});
