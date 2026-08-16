'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { UnjaniAdminModernistShell } from '@/components/admin/unjani/UnjaniAdminModernistShell';
import {
  KpiStrip,
  PageHeader,
  RuledTable,
} from '@/components/portal/modernist/PortalModernistShell';
import { StageBadge } from '@/components/portal/modernist/StageIndicators';
import { AdminPage, ErrorState, LoadingState } from '@/components/backend';
import { formatClinicShortName, formatZar } from '@/lib/portal/site-format';
import { spendNote, type UnjaniDashboardKpis } from '@/lib/portal/dashboard-kpis';
import type { UnjaniKpiLists } from '@/lib/admin/unjani-kpi-lists';
import { stageDefinition, type StageKey } from '@/lib/portal/onboarding-stage';

export type UnjaniKpiMetric = 'sites-live' | 'in-onboarding' | 'pre-qualified' | 'monthly-spend';

const META: Record<
  UnjaniKpiMetric,
  { label: string; title: string; subtitle: string; accent: string; valueColor?: string }
> = {
  'sites-live': {
    label: 'Sites live',
    title: 'Sites live',
    subtitle: 'Active Unjani Connect clinics with a recorded go-live date.',
    accent: '#2F9E5E',
    valueColor: '#2F9E5E',
  },
  'in-onboarding': {
    label: 'In onboarding',
    title: 'In onboarding',
    subtitle: 'Clinics still on the six Unjani guide stages before go-live.',
    accent: '#13274A',
  },
  'pre-qualified': {
    label: 'Pre-qualified',
    title: 'Pre-qualified',
    subtitle: 'Coverage-checked clinics that are not yet in the onboarding pipeline.',
    accent: '#F5841E',
  },
  'monthly-spend': {
    label: 'Monthly spend',
    title: 'Monthly spend',
    subtitle: 'Live sites whose service is billable now (excl VAT).',
    accent: '#13274A',
  },
};

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` };
}

function formatDay(iso: string | null): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export function UnjaniKpiDetailPage({ metric }: { metric: UnjaniKpiMetric }) {
  const meta = META[metric];
  const [kpis, setKpis] = useState<UnjaniDashboardKpis | null>(null);
  const [lists, setLists] = useState<UnjaniKpiLists | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/unjani/portal-ops', { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to load');
      const data = await response.json();
      setKpis(data.kpis ?? null);
      setLists(data.kpiLists ?? null);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <UnjaniAdminModernistShell>
        <AdminPage>
          <LoadingState message="Loading Unjani clinics…" />
        </AdminPage>
      </UnjaniAdminModernistShell>
    );
  }

  if (error || !kpis || !lists) {
    return (
      <UnjaniAdminModernistShell>
        <AdminPage>
          <ErrorState title="Failed to load" message="The clinic list could not be loaded." onRetry={load} />
        </AdminPage>
      </UnjaniAdminModernistShell>
    );
  }

  const value =
    metric === 'sites-live'
      ? String(kpis.sitesLive)
      : metric === 'in-onboarding'
        ? String(kpis.inOnboarding)
        : metric === 'pre-qualified'
          ? String(kpis.preQualified)
          : formatZar(kpis.monthlySpend);
  const note =
    metric === 'in-onboarding'
      ? 'Across 5 stages'
      : metric === 'pre-qualified'
        ? 'Ready to add to the pipeline'
        : metric === 'monthly-spend'
          ? spendNote(kpis.billedSites, kpis.monthlySpend)
          : undefined;

  const unbilledLive = lists.sitesLive.filter((site) => !site.billed);

  return (
    <UnjaniAdminModernistShell>
      <AdminPage>
        <PageHeader
          eyebrow="Unjani Connect"
          title={meta.title}
          subtitle={meta.subtitle}
          actions={
            <Link
              href="/admin/unjani/onboarding"
              className="text-sm font-semibold underline underline-offset-2"
              style={{ color: 'var(--pm-navy)' }}
            >
              Clinic Onboarding
            </Link>
          }
        />

        <div className="mb-6">
          <KpiStrip
            variant="cards"
            items={[
              {
                label: meta.label,
                value,
                note,
                accent: meta.accent,
                valueColor: meta.valueColor,
              },
            ]}
          />
        </div>

        {metric === 'sites-live' && (
          <RuledTable headers={['Clinic', 'Go live', 'Monthly fee', 'Billing', '']}>
            {lists.sitesLive.length === 0 ? (
              <EmptyRow cols={5} />
            ) : (
              lists.sitesLive.map((row) => (
                <tr key={row.siteId} style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                  <td className="px-4 py-3 font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                    {formatClinicShortName(row.name)}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--pm-body)' }}>
                    {formatDay(row.installedAt)}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums" style={{ color: 'var(--pm-body)' }}>
                    {formatZar(row.monthlyFee)}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--pm-body)' }}>
                    {row.billed ? 'Billed' : 'Free first month'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/b2b-customers/site-details/${row.siteId}`}
                      className="text-sm font-semibold underline underline-offset-2"
                      style={{ color: 'var(--pm-navy)' }}
                    >
                      Site
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </RuledTable>
        )}

        {metric === 'in-onboarding' && (
          <RuledTable headers={['Clinic', 'Stage', '']}>
            {lists.inOnboarding.length === 0 ? (
              <EmptyRow cols={3} />
            ) : (
              lists.inOnboarding.map((row) => (
                <tr
                  key={`${row.stage}-${row.customerId ?? row.siteId ?? row.coverageCheckId ?? row.name}`}
                  style={{ borderBottom: '1px solid var(--pm-divider)' }}
                >
                  <td className="px-4 py-3 font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                    {formatClinicShortName(row.name)}
                  </td>
                  <td className="px-4 py-3">
                    <StageBadge stage={row.stage} size="sm" />
                    <span className="ml-2 text-xs" style={{ color: '#6B7280' }}>
                      {stageDefinition(row.stage as StageKey).description}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href="/admin/unjani/onboarding"
                      className="text-sm font-semibold underline underline-offset-2"
                      style={{ color: 'var(--pm-navy)' }}
                    >
                      Open pipeline
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </RuledTable>
        )}

        {metric === 'pre-qualified' && (
          <RuledTable headers={['Clinic', 'Address', 'Recommended', '']}>
            {lists.preQualified.length === 0 ? (
              <EmptyRow cols={4} />
            ) : (
              lists.preQualified.map((row) => (
                <tr key={row.coverageCheckId} style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                  <td className="px-4 py-3 font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                    {formatClinicShortName(row.name)}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--pm-body)' }}>
                    {row.address || '—'}
                    {row.latitude != null && row.longitude != null && (
                      <a
                        href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-xs underline underline-offset-2"
                        style={{ color: '#059669' }}
                      >
                        Map
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--pm-body)' }}>
                    {row.recommended}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href="/admin/unjani/onboarding#coverage"
                      className="text-sm font-semibold underline underline-offset-2"
                      style={{ color: 'var(--pm-navy)' }}
                    >
                      Coverage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </RuledTable>
        )}

        {metric === 'monthly-spend' && (
          <div className="space-y-8">
            <RuledTable headers={['Clinic', 'Go live', 'Monthly fee', '']}>
              {lists.monthlySpend.length === 0 ? (
                <EmptyRow cols={4} />
              ) : (
                lists.monthlySpend.map((row) => (
                  <tr key={row.siteId} style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                    <td className="px-4 py-3 font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                      {formatClinicShortName(row.name)}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--pm-body)' }}>
                      {formatDay(row.installedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums" style={{ color: 'var(--pm-body)' }}>
                      {formatZar(row.monthlyFee)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/b2b-customers/site-details/${row.siteId}`}
                        className="text-sm font-semibold underline underline-offset-2"
                        style={{ color: 'var(--pm-navy)' }}
                      >
                        Site
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </RuledTable>
            {unbilledLive.length > 0 && (
              <div>
                <p
                  className="mb-3 text-[10px] font-extrabold tracking-[0.08em] uppercase"
                  style={{ color: 'var(--pm-navy)' }}
                >
                  Live but not yet billed
                </p>
                <RuledTable headers={['Clinic', 'Go live', 'Status']}>
                  {unbilledLive.map((row) => (
                    <tr key={row.siteId} style={{ borderBottom: '1px solid var(--pm-divider)' }}>
                      <td className="px-4 py-3 font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                        {formatClinicShortName(row.name)}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--pm-body)' }}>
                        {formatDay(row.installedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--pm-body)' }}>
                        Free first month
                      </td>
                    </tr>
                  ))}
                </RuledTable>
              </div>
            )}
          </div>
        )}
      </AdminPage>
    </UnjaniAdminModernistShell>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
        No clinics in this list.
      </td>
    </tr>
  );
}
