export interface ProRataInput {
  monthlyExVat: number;
  vatPct: number;
  activationDate: string; // YYYY-MM-DD
  billingDay: number;     // 1..28
}
export interface ProRataResult {
  days: number;
  daysInMonth: number;
  amountExVat: number;
  amountInclVat: number;
}

/**
 * First-invoice pro-rata: days from activation (inclusive) to the end of the
 * activation month, charged as a fraction of that month. Recurring months are full.
 */
export function computeProRata(input: ProRataInput): ProRataResult {
  const act = new Date(input.activationDate + 'T00:00:00Z');
  const year = act.getUTCFullYear();
  const month = act.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const actDay = act.getUTCDate();
  const days = daysInMonth - actDay + 1; // inclusive of activation day
  const inclFull = input.monthlyExVat * (1 + input.vatPct / 100);
  const amountInclVat = inclFull * days / daysInMonth;
  const amountExVat = input.monthlyExVat * days / daysInMonth;
  return { days, daysInMonth, amountExVat, amountInclVat };
}
