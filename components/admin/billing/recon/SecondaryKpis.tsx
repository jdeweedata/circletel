import {
  PiCurrencyDollarBold,
  PiFileTextBold,
  PiUsersBold,
} from 'react-icons/pi';

export interface SecondaryKpisProps {
  openAr: number;
  collectedLast30Days: number;
  activeServices: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCount(n: number): string {
  return new Intl.NumberFormat('en-ZA').format(n);
}

/**
 * Compact secondary KPIs (dashed cards) — open AR, collected 30d, active services.
 * Visually subordinate to the primary CashMatchStrip.
 */
export function SecondaryKpis({
  openAr,
  collectedLast30Days,
  activeServices,
}: SecondaryKpisProps) {
  const items = [
    {
      label: 'Open AR',
      value: formatCurrency(openAr),
      icon: PiFileTextBold,
    },
    {
      label: 'Collected (30 days)',
      value: formatCurrency(collectedLast30Days),
      icon: PiCurrencyDollarBold,
    },
    {
      label: 'Active services',
      value: formatCount(activeServices),
      icon: PiUsersBold,
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="truncate text-base font-semibold tabular-nums text-slate-800">
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
