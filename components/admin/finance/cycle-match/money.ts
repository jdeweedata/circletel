export function formatZar(amount: number | null | undefined, empty = '—'): string {
  if (amount == null || Number.isNaN(Number(amount))) return empty;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatSignedZar(amount: number): string {
  const abs = formatZar(Math.abs(amount));
  if (amount > 0) return `+${abs}`;
  if (amount < 0) return `-${abs.replace('R', 'R')}`;
  return abs;
}
