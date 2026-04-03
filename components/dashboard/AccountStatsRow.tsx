// components/dashboard/AccountStatsRow.tsx
import Link from 'next/link';

interface AccountStatsRowProps {
  activeServices: number;
  totalOrders: number;
  openTickets: number;
  accountBalance: number;
}

export function AccountStatsRow({
  activeServices,
  totalOrders,
  openTickets,
  accountBalance,
}: AccountStatsRowProps) {
  const balanceColor = accountBalance > 0 ? '#dc2626' : '#16a34a';
  const balanceFormatted = new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(accountBalance));

  const chips: Array<{
    label: string;
    value: string | number;
    href?: string;
    valueColor?: string;
  }> = [
    { label: 'Services', value: activeServices },
    { label: 'Orders', value: totalOrders, href: '/dashboard/orders' },
    { label: 'Tickets', value: openTickets },
    {
      label: 'Balance Due',
      value: `R${balanceFormatted}`,
      href: '/dashboard/billing',
      valueColor: balanceColor,
    },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {chips.map((chip) => {
        const inner = (
          <div
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex flex-col items-center min-w-[90px]"
            style={{ borderColor: '#e2e8f0' }}
          >
            <span
              className="text-lg font-bold"
              style={{ color: chip.valueColor ?? '#1e293b' }}
            >
              {chip.value}
            </span>
            <span className="text-xs text-slate-500 mt-0.5">{chip.label}</span>
          </div>
        );

        if (chip.href) {
          return (
            <Link
              key={chip.label}
              href={chip.href}
              className="hover:shadow-md transition-shadow rounded-xl"
            >
              {inner}
            </Link>
          );
        }
        return <div key={chip.label}>{inner}</div>;
      })}
    </div>
  );
}
