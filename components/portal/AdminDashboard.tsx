'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PiWarningBold } from 'react-icons/pi';
import type { PortalUser } from '@/lib/portal/portal-auth-provider';
import {
  PortalModernistShell,
  PageHeader,
  AlertBand,
  KpiStrip,
  RuledTable,
  PmButton,
} from '@/components/portal/modernist/PortalModernistShell';
import {
  StageBadge,
  StageBreakdown,
} from '@/components/portal/modernist/StageIndicators';
import {
  formatSiteLocation,
  formatTechnology,
  formatZar,
  type PortalSite,
} from '@/lib/portal/site-format';
import type { StageKey } from '@/lib/portal/onboarding-stage';

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  amount_due: number;
  status: string;
  due_date: string;
}

interface DashboardSummary {
  sitesLive: number;
  inOnboarding: number;
  preQualified: number;
  monthlySpend: number;
  stageCounts: Record<StageKey, number>;
  provinces: Array<{ province: string; count: number }>;
}

export default function AdminDashboard({ user }: { user: PortalUser }) {
  const [sites, setSites] = useState<PortalSite[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch('/api/portal/sites').then((r) => r.json()),
      fetch('/api/portal/billing').then((r) => r.json()),
      fetch('/api/portal/dashboard').then((r) => r.json()),
    ])
      .then(([sitesData, billingData, summaryData]) => {
        if (!mounted) return;
        setSites(sitesData.sites ?? []);
        setInvoices(billingData.invoices ?? []);
        setSummary(summaryData?.error ? null : summaryData);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const awaitingClinic = summary?.stageCounts.details_confirmed ?? 0;
  const totalPipeline = summary
    ? summary.sitesLive + summary.inOnboarding
    : sites.length;

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-20 text-sm"
        style={{ color: '#13274A' }}
      >
        Loading dashboard…
      </div>
    );
  }

  return (
    <PortalModernistShell>
      <PageHeader
        eyebrow={`${user.organisation_name} · Overview`}
        title="Dashboard"
        subtitle={`Welcome back, ${user.display_name}`}
        actions={
          <>
            <Link href="/portal/coverage">
              <PmButton variant="secondary">Coverage check</PmButton>
            </Link>
            <Link href="/portal/sites">
              <PmButton>View sites</PmButton>
            </Link>
          </>
        }
      />

      <KpiStrip
        items={[
          {
            label: 'Sites live',
            value: String(summary?.sitesLive ?? 0),
            note: 'At Go live',
          },
          {
            label: 'In onboarding',
            value: String(summary?.inOnboarding ?? 0),
            note: 'Stages 1 to 5',
          },
          {
            label: 'Pre-qualified',
            value: String(summary?.preQualified ?? 0),
            note: 'Ready to nominate',
          },
          {
            label: 'Monthly spend',
            value: formatZar(summary?.monthlySpend ?? 0),
            note: 'Excl VAT · free first month not billed',
          },
        ]}
      />

      {overdueInvoices.length > 0 && (
        <AlertBand
          action={
            <Link href="/portal/billing">
              <PmButton>View billing</PmButton>
            </Link>
          }
        >
          <span className="inline-flex items-center gap-2">
            <PiWarningBold className="w-4 h-4" aria-hidden="true" />
            {overdueInvoices.length} overdue invoice
            {overdueInvoices.length > 1 ? 's' : ''}
          </span>
        </AlertBand>
      )}

      {awaitingClinic > 0 && (
        <AlertBand
          action={
            <Link href="/portal/sites">
              <PmButton>Review</PmButton>
            </Link>
          }
        >
          <span className="inline-flex items-center gap-2">
            <PiWarningBold className="w-4 h-4" aria-hidden="true" />
            {awaitingClinic} clinic{awaitingClinic > 1 ? 's' : ''} at Clinic details
            confirmed — CircleTel is booking the installation visit.
          </span>
        </AlertBand>
      )}

      {summary && (
        <>
          <p
            className="mt-8 text-[10px] font-extrabold tracking-[0.08em] uppercase"
            style={{ color: 'var(--pm-navy)' }}
          >
            Pipeline by stage
          </p>
          <StageBreakdown counts={summary.stageCounts} total={totalPipeline} />
        </>
      )}

      <div className="mt-8 flex items-center justify-between">
        <p
          className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
          style={{ color: 'var(--pm-navy)' }}
        >
          Site overview
        </p>
        <Link
          href="/portal/sites"
          className="text-sm font-extrabold"
          style={{ color: '#D76026' }}
        >
          View all sites →
        </Link>
      </div>

      <RuledTable
        headers={['Site', 'Location', 'Technology', 'Stage', 'Health', 'Clients']}
      >
        {sites.slice(0, 10).map((site) => (
          <tr key={site.id} style={{ borderBottom: '1px solid var(--pm-divider)' }}>
            <td className="px-4 py-3">
              <Link
                href={`/portal/sites/${site.id}`}
                className="font-extrabold hover:opacity-80"
                style={{ color: 'var(--pm-navy)' }}
              >
                {site.site_name}
              </Link>
            </td>
            <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
              {formatSiteLocation(site)}
            </td>
            <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
              {formatTechnology(site.technology)}
            </td>
            <td className="px-4 py-3">
              <StageBadge stage={site.stage} size="sm" />
            </td>
            <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
              {site.health ? `${site.health.health_score}%` : '—'}
            </td>
            <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
              {site.health?.online_clients ?? '—'}
            </td>
          </tr>
        ))}
      </RuledTable>

      {summary && summary.provinces.length > 0 && (
        <>
          <p
            className="mt-8 text-[10px] font-extrabold tracking-[0.08em] uppercase"
            style={{ color: 'var(--pm-navy)' }}
          >
            Pre-qualified clinics by province
          </p>
          <div
            className="mt-6 bg-white"
            style={{ border: '2px solid var(--pm-divider)' }}
          >
            {summary.provinces.map((row, i) => {
              const widest = summary.provinces[0]?.count || 1;
              return (
                <div
                  key={row.province}
                  className="flex items-center gap-4 px-4 py-2.5"
                  style={{
                    borderTop: i > 0 ? '1px solid var(--pm-divider)' : undefined,
                  }}
                >
                  <span
                    className="flex-1 text-sm font-extrabold"
                    style={{ color: 'var(--pm-navy)' }}
                  >
                    {row.province}
                  </span>
                  <div
                    className="hidden sm:block h-2 w-48"
                    style={{ background: 'var(--pm-ground)' }}
                    role="presentation"
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.round((row.count / widest) * 100)}%`,
                        background: 'var(--pm-accent)',
                      }}
                    />
                  </div>
                  <span
                    className="w-8 text-right text-sm font-extrabold tabular-nums"
                    style={{ color: 'var(--pm-navy)' }}
                  >
                    {row.count}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </PortalModernistShell>
  );
}
