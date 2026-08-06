// lib/billing/modernist/format-za.ts
export function formatRandZa(value: number): string {
  const n = Math.round(value);
  if (n === 0) return 'R 0';
  return `R ${n.toLocaleString('en-ZA').replace(/[\u00A0\u202F,]/g, ' ')}`;
}

export function formatRandZaCents(value: number): string {
  const fixed = (Math.round(value * 100) / 100).toFixed(2);
  const [whole, cents] = fixed.split('.');
  const grouped = Number(whole).toLocaleString('en-ZA').replace(/[\u00A0\u202F,]/g, ' ');
  return `R ${grouped},${cents}`;
}
