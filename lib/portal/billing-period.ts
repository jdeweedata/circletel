/**
 * Portal billing period helpers — calendar months and statement query parsing.
 */

import type { StatementOptions } from '@/lib/billing/statement-data';

/** YYYY-MM → first/last day of that UTC calendar month. */
export function monthBounds(yearMonth: string): { from: string; to: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  const from = `${match[1]}-${match[2]}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${match[1]}-${match[2]}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

/** Invoice period_start → YYYY-MM key, or null. */
export function invoiceMonthKey(periodStart: string | null | undefined): string | null {
  if (!periodStart || periodStart.length < 7) return null;
  const key = periodStart.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(key) ? key : null;
}

export function formatMonthLabel(yearMonth: string): string {
  const bounds = monthBounds(yearMonth);
  if (!bounds) return yearMonth;
  const date = new Date(`${bounds.from}T12:00:00Z`);
  return date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/**
 * Parse portal statement search params into StatementOptions.
 * Precedence: from+to → month=YYYY-MM → period → default 12m.
 */
export function parsePortalStatementOptions(searchParams: URLSearchParams): StatementOptions {
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (from && to) {
    return { from, to };
  }

  const month = searchParams.get('month');
  if (month) {
    const bounds = monthBounds(month);
    if (bounds) return bounds;
  }

  const period = searchParams.get('period');
  if (period === '3m' || period === '6m' || period === '12m' || period === 'all') {
    return { period };
  }

  return { period: '12m' };
}

export function pdfDisposition(
  raw: string | null
): 'inline' | 'attachment' {
  return raw === 'inline' ? 'inline' : 'attachment';
}
