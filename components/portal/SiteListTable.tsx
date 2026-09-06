'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PmButton,
  RuledTable,
} from '@/components/portal/modernist/PortalModernistShell';
import {
  StageBadge,
  StageStrip,
} from '@/components/portal/modernist/StageIndicators';
import { emptyStageCounts, type StageClinicRef } from '@/lib/portal/count-onboarding-stages';
import { spendNote } from '@/lib/portal/dashboard-kpis';
import { pipelineOverviewRows } from '@/lib/portal/dashboard-overview';
import type { StageKey } from '@/lib/portal/onboarding-stage';
import {
  formatClinicShortName,
  formatSiteCode,
  formatSiteLocation,
  formatTechnology,
  formatZar,
  siteAddress,
  type PortalSite,
} from '@/lib/portal/site-format';
import { usePortalApp } from '@/lib/portal/portal-app-context';

type Filter = 'all' | 'onboarding' | 'live';

type ClinicRow = {
  key: string;
  name: string;
  stage: StageKey;
  siteId?: string;
  location: string;
  technology: string | null;
  code: string | null;
  monthlyFee: number | string | null;
  site: PortalSite | null;
};

const PAGE_SIZE = 10;

function siteProvince(site: PortalSite): string | null {
  return site.province || siteAddress(site).province || null;
}

function rowMatchesQuery(row: ClinicRow, q: string): boolean {
  if (!q) return true;
  const hay = [row.name, row.code ?? '', row.location, formatTechnology(row.technology)]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export default function SiteListTable() {
  const { href, isUnjani } = usePortalApp();
  const [sites, setSites] = useState<PortalSite[]>([]);
  const [stageCounts, setStageCounts] = useState(emptyStageCounts);
  const [stageClinics, setStageClinics] = useState<StageClinicRef[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [stageFilter, setStageFilter] = useState<StageKey | null>(null);
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const sitesReq = fetch('/api/portal/sites').then((r) => r.json());
    const dashboardReq = isUnjani
      ? fetch('/api/portal/dashboard').then((r) => r.json())
      : Promise.resolve(null);

    Promise.all([sitesReq, dashboardReq])
      .then(([sitesData, summaryData]) => {
        if (!mounted) return;
        const next = (sitesData.sites ?? []) as PortalSite[];
        setSites(next);
        if (next[0]) setSelectedKey(next[0].id);
        if (summaryData && !summaryData.error && summaryData.stageCounts) {
          setStageCounts(summaryData.stageCounts);
          setStageClinics(summaryData.stageClinics ?? []);
        } else {
          const counts = emptyStageCounts();
          for (const site of next) {
            counts[site.stage] = (counts[site.stage] ?? 0) + 1;
          }
          setStageCounts(counts);
          setStageClinics([]);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isUnjani]);

  const counts = useMemo(
    () => ({
      all: sites.length,
      onboarding: sites.filter((s) => s.stage !== 'live').length,
      live: sites.filter((s) => s.stage === 'live').length,
    }),
    [sites]
  );

  const billedSites = useMemo(
    () => sites.filter((s) => s.stage === 'live' && s.billed),
    [sites]
  );

  const billedSpend = useMemo(
    () => billedSites.reduce((sum, s) => sum + Number(s.monthly_fee ?? 0), 0),
    [billedSites]
  );

  const provinces = useMemo(() => {
    const set = new Set<string>();
    for (const site of sites) {
      const value = siteProvince(site);
      if (value) set.add(value);
    }
    return [...set].sort();
  }, [sites]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const siteById = new Map(sites.map((site) => [site.id, site]));

    if (stageFilter) {
      return pipelineOverviewRows({
        stage: stageFilter,
        clinics: stageClinics,
        sites,
      })
        .map((row): ClinicRow => {
          const site = row.siteId ? siteById.get(row.siteId) ?? null : null;
          return {
            key: row.key,
            name: row.name,
            stage: row.stage,
            siteId: row.siteId,
            location: row.location,
            technology: row.technology,
            code: site ? formatSiteCode(site) : null,
            monthlyFee: site?.monthly_fee ?? null,
            site,
          };
        })
        .filter((row) => {
          if (province !== 'all') {
            const siteProv = row.site ? siteProvince(row.site) : null;
            if (siteProv) {
              if (siteProv !== province) return false;
            } else if (!row.location.toLowerCase().includes(province.toLowerCase())) {
              return false;
            }
          }
          return rowMatchesQuery(row, q);
        });
    }

    return sites
      .filter((site) => {
        if (filter === 'live' && site.stage !== 'live') return false;
        if (filter === 'onboarding' && site.stage === 'live') return false;
        if (province !== 'all' && siteProvince(site) !== province) return false;
        return true;
      })
      .map(
        (site): ClinicRow => ({
          key: site.id,
          name: formatClinicShortName(site.site_name),
          stage: site.stage,
          siteId: site.id,
          location: formatSiteLocation(site),
          technology: site.technology,
          code: formatSiteCode(site),
          monthlyFee: site.monthly_fee,
          site,
        })
      )
      .filter((row) => rowMatchesQuery(row, q));
  }, [sites, stageClinics, filter, stageFilter, province, query]);

  useEffect(() => {
    setPage(1);
  }, [filter, stageFilter, query, province]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visible.slice(start, start + PAGE_SIZE);
  }, [visible, currentPage]);

  const selected =
    visible.find((row) => row.key === selectedKey) ?? paged[0] ?? null;

  if (loading) {
    return (
      <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
        Loading sites…
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="py-16 text-center text-sm" style={{ color: 'var(--pm-body)' }}>
        No sites found for your organisation.
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(
          [
            {
              key: 'all' as const,
              label: 'All sites',
              value: String(counts.all),
              note: undefined as string | undefined,
              accent: '#13274A',
              valueColor: '#13274A',
            },
            {
              key: 'live' as const,
              label: 'Sites live',
              value: String(counts.live),
              note: undefined,
              accent: '#2F9E5E',
              valueColor: '#2F9E5E',
            },
            {
              key: 'onboarding' as const,
              label: 'In onboarding',
              value: String(counts.onboarding),
              note: 'Nomination through install',
              accent: '#13274A',
              valueColor: '#13274A',
            },
          ] as const
        ).map((card) => {
          const on = filter === card.key && !stageFilter;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                setStageFilter(null);
                setFilter(card.key);
              }}
              className="rounded-xl bg-white px-4 py-4 text-left shadow-sm ring-1 ring-black/[0.06] transition-opacity hover:opacity-90"
              style={{
                borderBottom: `3px solid ${card.accent}`,
                outline: on ? `2px solid ${card.accent}` : undefined,
                outlineOffset: 0,
              }}
              aria-pressed={on}
            >
              <p
                className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
                style={{ color: 'var(--pm-navy)' }}
              >
                {card.label}
              </p>
              <p
                className="mt-1 text-2xl font-extrabold tabular-nums"
                style={{ color: card.valueColor }}
              >
                {card.value}
              </p>
              {card.note && (
                <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
                  {card.note}
                </p>
              )}
            </button>
          );
        })}
        <Link href={href('/billing')} className="block hover:opacity-90">
          <div
            className="relative h-full rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.06]"
            style={{ borderBottom: '3px solid #13274A' }}
          >
            <p
              className="pr-6 text-[10px] font-extrabold tracking-[0.08em] uppercase"
              style={{ color: 'var(--pm-navy)' }}
            >
              Monthly spend
            </p>
            <p
              className="mt-1 text-2xl font-extrabold tabular-nums"
              style={{ color: 'var(--pm-navy)' }}
            >
              {formatZar(billedSpend)}
            </p>
            <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
              {spendNote(billedSites.length, billedSpend)}
            </p>
          </div>
        </Link>
      </div>

      {isUnjani && (
        <section className="!mt-10">
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
            counts={stageCounts}
            selected={stageFilter}
            onSelect={(key) => {
              setStageFilter(key);
              if (key) setFilter('all');
            }}
          />
        </section>
      )}

      <div className="pt-12 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,1fr)]">
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clinics"
              className="min-h-11 w-full flex-1 rounded-lg bg-white px-3 py-2 text-sm"
              style={{
                border: '1px solid var(--pm-divider)',
                color: 'var(--pm-navy)',
              }}
            />
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="min-h-11 w-full rounded-lg bg-white px-3 py-2 text-sm sm:w-auto"
              style={{
                border: '1px solid var(--pm-divider)',
                color: 'var(--pm-navy)',
              }}
            >
              <option value="all">All provinces</option>
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <p
            className="mt-6 text-[10px] font-extrabold tracking-[0.08em] uppercase"
            style={{ color: 'var(--pm-navy)' }}
          >
            {visible.length} clinic{visible.length === 1 ? '' : 's'}
            {visible.length > 0 && (
              <span className="ml-2 font-semibold normal-case tracking-normal opacity-70">
                · {currentPage} of {totalPages}
              </span>
            )}
          </p>

          <RuledTable
            headers={['Clinic', 'Location', 'Technology', 'Stage', 'Monthly', '']}
            className="mt-3 rounded-xl shadow-sm ring-1 ring-black/[0.06]"
          >
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: '#6B7280' }}
                >
                  {stageFilter
                    ? 'No clinics in this stage.'
                    : 'No clinics match these filters.'}
                </td>
              </tr>
            ) : (
              paged.map((row) => {
                const on = row.key === selected?.key;
                return (
                  <tr
                    key={row.key}
                    onClick={() => setSelectedKey(row.key)}
                    className="cursor-pointer"
                    style={{
                      borderBottom: '1px solid var(--pm-divider)',
                      background: on
                        ? 'color-mix(in srgb, #13274A 6%, #FFFFFF)'
                        : undefined,
                    }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="block font-extrabold"
                        style={{ color: 'var(--pm-navy)' }}
                      >
                        {row.name}
                      </span>
                      {row.code && (
                        <span className="block text-xs" style={{ color: '#6B7280' }}>
                          {row.code}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--pm-body)' }}>
                      {row.location}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--pm-body)' }}>
                      {formatTechnology(row.technology)}
                    </td>
                    <td className="px-4 py-3">
                      <StageBadge stage={row.stage} size="sm" />
                    </td>
                    <td
                      className="px-4 py-3 text-right text-sm tabular-nums"
                      style={{ color: 'var(--pm-body)' }}
                    >
                      {row.stage === 'live' ? formatZar(row.monthlyFee) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {row.siteId ? (
                        <Link
                          href={href(`/sites/${row.siteId}`)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PmButton variant="cta" className="whitespace-nowrap">
                            View
                          </PmButton>
                        </Link>
                      ) : (
                        <Link
                          href={href('/coverage')}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PmButton variant="secondary" className="whitespace-nowrap">
                            Coverage
                          </PmButton>
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </RuledTable>

          {totalPages > 1 && (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <aside>
          {selected ? (
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
              <p
                className="mb-2 text-[10px] font-extrabold tracking-[0.08em] uppercase"
                style={{ color: 'var(--pm-navy)' }}
              >
                Site
              </p>
              <p className="text-lg font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                {selected.name}
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--pm-body)' }}>
                {selected.location}
              </p>
              {selected.code && (
                <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
                  {selected.code}
                </p>
              )}
              <div className="mt-3">
                <StageBadge stage={selected.stage} size="sm" />
              </div>
              <ul className="mt-4 space-y-1 text-sm" style={{ color: 'var(--pm-body)' }}>
                <li>Technology — {formatTechnology(selected.technology)}</li>
                <li>
                  Monthly —{' '}
                  {selected.stage === 'live'
                    ? formatZar(selected.monthlyFee)
                    : 'Not billed yet'}
                </li>
                {selected.site?.site_contact_name && (
                  <li>On-site — {selected.site.site_contact_name}</li>
                )}
                {selected.site?.site_contact_phone && (
                  <li>{selected.site.site_contact_phone}</li>
                )}
                {selected.site?.site_contact_email && (
                  <li>{selected.site.site_contact_email}</li>
                )}
              </ul>
              <div className="mt-4">
                {selected.siteId ? (
                  <Link href={href(`/sites/${selected.siteId}`)}>
                    <PmButton variant="cta">View site</PmButton>
                  </Link>
                ) : (
                  <Link href={href('/coverage')}>
                    <PmButton variant="secondary">Open coverage</PmButton>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/[0.06]"
              style={{ color: 'var(--pm-body)' }}
            >
              Select a site to see its details.
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
