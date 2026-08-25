'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PiInfoBold, PiWarningBold } from 'react-icons/pi';
import type { PortalUser } from '@/lib/portal/portal-auth-provider';
import { usePortalApp } from '@/lib/portal/portal-app-context';
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
  StageStrip,
} from '@/components/portal/modernist/StageIndicators';
import {
  formatClinicShortName,
  formatSiteCode,
  formatSiteLocation,
  formatTechnology,
  formatZar,
  type PortalSite,
} from '@/lib/portal/site-format';
import { spendNote } from '@/lib/portal/dashboard-kpis';
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
  billedSites: number;
  inOnboarding: number;
  preQualified: number;
  monthlySpend: number;
  stageCounts: Record<StageKey, number>;
  provinces: Array<{ province: string; count: number }>;
}

export default function AdminDashboard({ user }: { user: PortalUser }) {
  const { href, isUnjani } = usePortalApp();
  const [sites, setSites] = useState<PortalSite[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<StageKey | null>(null);

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

  const overviewSites = useMemo(() => {
    const filtered = stageFilter
      ? sites.filter((site) => site.stage === stageFilter)
      : sites;
    return filtered.slice(0, 8);
  }, [sites, stageFilter]);

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
        showRule={false}
        eyebrow="Organisation · Overview"
        title="Dashboard"
        subtitle={`Welcome back, ${user.display_name} — ${user.organisation_name}`}
        actions={
          isUnjani ? (
            <>
              <Link href={href('/coverage')}>
                <PmButton variant="secondary">Coverage check</PmButton>
              </Link>
              <Link href={href('/coverage')}>
                <PmButton variant="cta">+ Onboard a clinic</PmButton>
              </Link>
            </>
          ) : undefined
        }
      />

      <KpiStrip
        variant="cards"
        items={[
          {
            label: 'Sites live',
            value: String(summary?.sitesLive ?? 0),
            href: href('/sites'),
            accent: '#2F9E5E',
            valueColor: '#2F9E5E',
          },
          {
            label: 'In onboarding',
            value: String(summary?.inOnboarding ?? 0),
            note: 'Across 5 stages',
            href: href('/sites'),
            accent: '#13274A',
          },
          ...(isUnjani
            ? [
                {
                  label: 'Pre-qualified',
                  value: String(summary?.preQualified ?? 0),
                  note: 'Ready to add to the pipeline',
                  href: href('/coverage'),
                  accent: '#F5841E',
                },
              ]
            : []),
          {
            label: 'Monthly spend',
            value: formatZar(summary?.monthlySpend ?? 0),
            note: spendNote(summary?.billedSites ?? 0, summary?.monthlySpend ?? 0),
            href: href('/billing'),
            accent: '#13274A',
          },
        ]}
      />

      {overdueInvoices.length > 0 && (
        <AlertBand
          action={
            <Link href={href('/billing')}>
              <PmButton variant="secondary">View billing</PmButton>
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

      {isUnjani && awaitingClinic > 0 && (
        <AlertBand
          tone="peach"
          action={
            <Link href={href('/sites')}>
              <PmButton variant="secondary">Review</PmButton>
            </Link>
          }
        >
          <span className="inline-flex items-center gap-2">
            <PiInfoBold className="w-4 h-4 shrink-0" aria-hidden="true" />
            {awaitingClinic} clinic{awaitingClinic > 1 ? 's' : ''} at Clinic
            details confirmed. Next is agreeing an installation date with the
            on-site contact.
          </span>
        </AlertBand>
      )}

      {isUnjani && summary && (
        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <p
              className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
              style={{ color: 'var(--pm-navy)' }}
            >
              Pipeline by stage
            </p>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Click a stage to filter
            </p>
          </div>
          <StageStrip
            counts={summary.stageCounts}
            selected={stageFilter}
            onSelect={setStageFilter}
          />
        </section>
      )}

      <div className="pt-24 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,1fr)]">
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
              style={{ color: 'var(--pm-navy)' }}
            >
              Site overview
            </p>
            <Link href={href('/sites')}>
              <PmButton
                variant="secondary"
                className="transition-colors hover:!bg-[#13274A] hover:!text-white"
              >
                View all sites
              </PmButton>
            </Link>
          </div>

          <RuledTable
            headers={['Site', 'Location', 'Technology', 'Stage']}
            className="mt-3 rounded-xl shadow-sm ring-1 ring-black/[0.06]"
          >
            {overviewSites.map((site) => {
              const code = formatSiteCode(site);
              return (
                <tr
                  key={site.id}
                  style={{ borderBottom: '1px solid var(--pm-divider)' }}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={href(`/sites/${site.id}`)}
                      className="block hover:opacity-80"
                    >
                      <span
                        className="block font-extrabold"
                        style={{ color: 'var(--pm-navy)' }}
                      >
                        {formatClinicShortName(site.site_name)}
                      </span>
                      {code && (
                        <span className="block text-xs" style={{ color: '#6B7280' }}>
                          {code}
                        </span>
                      )}
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
                </tr>
              );
            })}
          </RuledTable>
        </section>

        {isUnjani && summary && summary.provinces.length > 0 && (
          <section>
            <p
              className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
              style={{ color: 'var(--pm-navy)' }}
            >
              Clinics in the pipeline by province
            </p>
            <div className="mt-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/[0.06]">
              {summary.provinces.map((row, i) => {
                const widest = summary.provinces[0]?.count || 1;
                return (
                  <div
                    key={row.province}
                    className="flex items-center gap-3 py-2"
                    style={{
                      borderTop: i > 0 ? '1px solid #F3F4F6' : undefined,
                    }}
                  >
                    <span
                      className="w-32 shrink-0 text-sm font-medium"
                      style={{ color: 'var(--pm-navy)' }}
                    >
                      {row.province}
                    </span>
                    <div
                      className="h-2.5 min-w-0 flex-1 rounded-full"
                      style={{ background: '#EEF1F6' }}
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((row.count / widest) * 100)}%`,
                          background: '#13274A',
                        }}
                      />
                    </div>
                    <span
                      className="w-6 text-right text-sm font-extrabold tabular-nums"
                      style={{ color: 'var(--pm-navy)' }}
                    >
                      {row.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </PortalModernistShell>
  );
}
