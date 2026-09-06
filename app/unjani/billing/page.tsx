'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import { usePortalApp } from '@/lib/portal/portal-app-context';
import {
  PortalModernistShell,
  PageHeader,
  AlertBand,
  KpiStrip,
  RuledTable,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
import { formatClinicShortName, formatZar } from '@/lib/portal/site-format';
import { usePortalCapability } from '@/lib/portal/use-portal-capability';

interface BilledService {
  name: string;
  monthlyFee: number;
  billingStartDate?: string | null;
}

interface BillingSummary {
  billedCount: number;
  monthlySpend: number;
  unpaidCount: number;
  unpaidTotal: number;
  paidCount: number;
  paidTotal: number;
}

const PAGE_SIZE = 10;

function formatDay(iso: string | null | undefined) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

function matchesBilledService(service: BilledService, query: string) {
  const hay = [
    service.name,
    formatClinicShortName(service.name),
    formatDay(service.billingStartDate),
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(query);
}

export default function PortalBillingPage() {
  const { user } = usePortalAuth();
  const { href } = usePortalApp();
  const { allowed } = usePortalCapability('billing.read');
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [billedServices, setBilledServices] = useState<BilledService[]>([]);
  const [deferredCount, setDeferredCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch('/api/portal/billing')
      .then((r) => r.json())
      .then((data) => {
        setSummary(data.summary ?? null);
        setBilledServices(data.billedServices ?? []);
        setDeferredCount((data.deferredLive ?? []).length);
        setOverdueCount(
          (data.invoices ?? []).filter((invoice: { status?: string }) => invoice.status === 'overdue')
            .length
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return billedServices;
    return billedServices.filter((service) => matchesBilledService(service, q));
  }, [billedServices, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visible.slice(start, start + PAGE_SIZE);
  }, [visible, currentPage]);

  if (!user || !allowed) return null;

  return (
    <PortalModernistShell>
      <PageHeader
        eyebrow="Billing · Receivables"
        title="Billing"
        subtitle={`Unjani Connect billing for ${user.organisation_name}`}
        actions={
          <>
            <Link href={href('/billing/invoices')}>
              <PmButton variant="secondary">Invoices by month</PmButton>
            </Link>
            <Link href={href('/billing/statement')}>
              <PmButton variant="secondary">Account statement</PmButton>
            </Link>
          </>
        }
      />

      {overdueCount > 0 && (
        <AlertBand
          action={
            <Link href={href('/billing/unpaid')}>
              <PmButton variant="secondary">View unpaid</PmButton>
            </Link>
          }
        >
          You have {overdueCount} overdue invoice
          {overdueCount > 1 ? 's' : ''}. Please arrange payment with CircleTel.
        </AlertBand>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
          Loading billing…
        </div>
      ) : (
        <>
          <KpiStrip
            variant="cards"
            items={[
              {
                label: 'Monthly billed',
                value: formatZar(summary?.monthlySpend ?? 0),
                note: `${summary?.billedCount ?? 0} active services`,
                accent: '#13274A',
                href: href('/billing/monthly-billed'),
              },
              {
                label: 'Unpaid',
                value: formatZar(summary?.unpaidTotal ?? 0),
                note: `${summary?.unpaidCount ?? 0} open invoices`,
                accent: '#F5841E',
                href: href('/billing/unpaid'),
              },
              {
                label: 'Paid',
                value: formatZar(summary?.paidTotal ?? 0),
                note: `${summary?.paidCount ?? 0} settled`,
                accent: '#2F9E5E',
                valueColor: '#2F9E5E',
                href: href('/billing/paid'),
              },
              {
                label: 'Deferred live',
                value: String(deferredCount),
                note: deferredCount > 0 ? 'Billed from 1 Sep' : 'None',
                accent: '#13274A',
                href: href('/billing/deferred-live'),
              },
            ]}
          />

          <section className="pt-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2
                className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                style={{ color: 'var(--pm-navy)' }}
              >
                Active services being billed
                {visible.length > 0 && (
                  <span className="ml-2 font-semibold normal-case tracking-normal opacity-70">
                    · {currentPage} of {totalPages}
                  </span>
                )}
              </h2>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clinic or billing start"
                aria-label="Search active services being billed"
                className="min-h-11 w-full rounded-lg bg-white px-3 py-2 text-sm sm:max-w-xs"
                style={{
                  border: '1px solid var(--pm-divider)',
                  color: 'var(--pm-navy)',
                }}
              />
            </div>
            <RuledTable headers={['Clinic', 'Monthly fee excl VAT', 'Billing start']}>
              {billedServices.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center" style={{ color: 'var(--pm-body)' }}>
                    No clinics are on a collectable service this month.
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center" style={{ color: 'var(--pm-body)' }}>
                    No billed services match “{query.trim()}”.
                  </td>
                </tr>
              ) : (
                paged.map((service) => (
                  <tr key={service.name} style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                    <td className="px-4 py-3 font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                      {formatClinicShortName(service.name)}
                    </td>
                    <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--pm-body)' }}>
                      {formatZar(service.monthlyFee)}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
                      {formatDay(service.billingStartDate)}
                    </td>
                  </tr>
                ))
              )}
            </RuledTable>
            {visible.length > PAGE_SIZE && (
              <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs" style={{ color: '#6B7280' }}>
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, visible.length)} of {visible.length}
                </p>
                <div className="flex items-center gap-2">
                  <PmButton
                    variant="secondary"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </PmButton>
                  <PmButton
                    variant="secondary"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </PmButton>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </PortalModernistShell>
  );
}
