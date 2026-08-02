import Link from 'next/link';
import {
  PiArrowRightBold,
  PiArrowsLeftRightBold,
  PiBooksBold,
  PiCreditCardBold,
  PiFileTextBold,
} from 'react-icons/pi';

const LINKS = [
  {
    href: '/admin/finance/reconciliation',
    title: 'Finance reconciliation',
    description: 'Match NetCash cash to CircleTel invoices',
    icon: PiArrowsLeftRightBold,
  },
  {
    href: '/admin/integrations/zoho-books',
    title: 'Zoho Books',
    description: 'Payment sync health and failed entities',
    icon: PiBooksBold,
  },
  {
    href: '/admin/payments/transactions',
    title: 'Payment transactions',
    description: 'Browse NetCash / PayNow payment history',
    icon: PiCreditCardBold,
  },
  {
    href: '/admin/billing/invoices',
    title: 'Invoices',
    description: 'Open AR and invoice detail pages',
    icon: PiFileTextBold,
  },
  {
    href: '/admin/billing',
    title: 'AR health',
    description: 'Aging buckets and overdue register',
    icon: PiFileTextBold,
  },
] as const;

/**
 * Deep-link cards into recon-adjacent admin surfaces.
 */
export function DeepLinks() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {LINKS.map(({ href, title, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors hover:border-circleTel-orange/40 hover:bg-orange-50/40"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-circleTel-orange/10 text-circleTel-orange">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-slate-900 group-hover:text-circleTel-orange">
                {title}
              </p>
              <PiArrowRightBold
                className="h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
