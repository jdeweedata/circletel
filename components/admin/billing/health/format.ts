/** Format Rand with comma thousands separators, e.g. R62,230 (matches mock). */
export function formatRand(value: number): string {
  return `R${Math.round(value).toLocaleString('en-US')}`;
}

/** "22 Jul 2026" */
export function formatDueDate(isoDate: string): string {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Quote a CSV cell when it contains separators or quotes. */
export function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Build a CSV string and trigger a browser download. */
export function downloadCsv(filename: string, lines: Array<string | number>[]) {
  const csv = lines.map((cells) => cells.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
