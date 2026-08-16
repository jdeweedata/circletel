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
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
import { formatZar } from '@/lib/portal/site-format';

interface BillingSummary {
  billedCount: number;
  monthlySpend: number;
  unpaidCount: number;
  unpaidTotal: number;
  paidCount: number;
  paidTotal: number;
}

export default function PortalBillingPage() {
  const { user } = usePortalAuth();
  const { href } = usePortalApp();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [deferredCount, setDeferredCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/billing')
      .then((r) => r.json())
      .then((data) => {
        setSummary(data.summary ?? null);
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
      )}
    </PortalModernistShell>
  );
}
