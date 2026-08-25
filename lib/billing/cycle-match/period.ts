/** Calendar-month bounds for cycle match (inclusive dates, YYYY-MM-DD). */

export function parseYearMonth(raw: string | null | undefined): string {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return raw;
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' })
  );
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function monthBounds(yearMonth: string): {
  yearMonth: string;
  periodMonth: string;
  start: string;
  end: string;
  label: string;
} {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const start = `${yearStr}-${monthStr}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  const label = new Date(`${start}T12:00:00+02:00`).toLocaleDateString('en-ZA', {
    month: 'short',
    year: 'numeric',
  });
  return { yearMonth, periodMonth: start, start, end, label };
}
