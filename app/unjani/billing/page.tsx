'use client';

import { useEffect, useState } from 'react';
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

function formatDay(iso: string | null | undefined) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export default function PortalBillingPage() {
  const { user } = usePortalAuth();
  const { href } = usePortalApp();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [billedServices, setBilledServices] = useState<BilledService[]>([]);
  const [deferredCount, setDeferredCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

  if (!user) return null;

  return (
    <PortalModernistShell>
      <PageHeader
        eyebrow="Billing · Receivables"
        title="Billing"
        subtitle={`Unjani Connect billing for ${user.organisation_name}`}
        actions={
          <Link href={href('/billing/statement')}>
            <PmButton variant="secondary">Account statement</PmButton>
          </Link>
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
            <h2
              className="pb-4 text-[10px] font-extrabold tracking-[0.08em] uppercase"
              style={{ color: 'var(--pm-navy)' }}
            >
              Active services being billed
            </h2>
            <RuledTable headers={['Clinic', 'Monthly fee excl VAT', 'Billing start']}>
              {billedServices.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center" style={{ color: 'var(--pm-body)' }}>
                    No clinics are on a collectable service this month.
                  </td>
                </tr>
              ) : (
                billedServices.map((service) => (
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
          </section>
        </>
      )}
    </PortalModernistShell>
  );
}
