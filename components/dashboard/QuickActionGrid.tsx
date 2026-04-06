'use client';

import Link from 'next/link';

interface ActionCard {
  label: string;
  icon: string;
  href: string;
  primary?: boolean;
}

const ACTION_CARDS: ActionCard[] = [
  { label: 'Pay Now',               icon: '💳', href: '/dashboard/billing',          primary: true },
  { label: 'Invoices & Statements', icon: '📑', href: '/dashboard/invoices' },
  { label: 'Update Banking',        icon: '🏦', href: '/dashboard/payment-method' },
  { label: 'My Profile',            icon: '👤', href: '/dashboard/profile' },
  { label: 'Log a Ticket',          icon: '🎫', href: '/dashboard/tickets' },
  { label: 'Get Help',              icon: '❓', href: '/dashboard/support' },
  { label: 'Check Usage',           icon: '📊', href: '/dashboard/usage' },
  { label: 'Upgrade Plan',          icon: '⬆️', href: '/dashboard/services/upgrade' },
];

export function QuickActionGrid() {
  return (
    <div>
      <p
        className="text-xs font-bold tracking-wider mb-3"
        style={{ color: '#94a3b8', letterSpacing: '0.05em' }}
      >
        MY ACCOUNT
      </p>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
        {ACTION_CARDS.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group flex flex-col items-center justify-center gap-2 bg-white border rounded-xl py-4 px-2 text-center transition-all hover:shadow-md"
            style={{
              borderColor: '#e2e8f0',
              borderRadius: '12px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#F5831F';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px rgba(245,131,31,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
              (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}
          >
            <span className="text-xl sm:text-[22px] leading-none">{card.icon}</span>
            <span
              className="text-[11px] font-semibold leading-tight"
              style={{ color: card.primary ? '#F5831F' : '#1e293b' }}
            >
              {card.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
