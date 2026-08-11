'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FilterChips,
  RuledTable,
} from '@/components/portal/modernist/PortalModernistShell';
import { StageBadge } from '@/components/portal/modernist/StageIndicators';
import {
  formatSiteLocation,
  formatTechnology,
  formatZar,
  type PortalSite,
} from '@/lib/portal/site-format';

type Filter = 'all' | 'onboarding' | 'live';

export default function SiteListTable() {
  const [sites, setSites] = useState<PortalSite[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/portal/sites')
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setSites(data.sites ?? []);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(
    () => ({
      all: sites.length,
      onboarding: sites.filter((s) => s.stage !== 'live').length,
      live: sites.filter((s) => s.stage === 'live').length,
    }),
    [sites]
  );

  const visible = useMemo(() => {
    if (filter === 'live') return sites.filter((s) => s.stage === 'live');
    if (filter === 'onboarding') return sites.filter((s) => s.stage !== 'live');
    return sites;
  }, [sites, filter]);

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
      <FilterChips
        value={filter}
        onChange={(value) => setFilter(value as Filter)}
        options={[
          { value: 'all', label: `All ${counts.all}` },
          { value: 'onboarding', label: `In onboarding ${counts.onboarding}` },
          { value: 'live', label: `Live ${counts.live}` },
        ]}
      />

      <RuledTable
        headers={['Site', 'Location', 'Technology', 'Stage', 'Monthly']}
      >
        {visible.map((site) => (
          <tr key={site.id} style={{ borderBottom: '1px solid var(--pm-divider)' }}>
            <td className="px-4 py-3">
              <Link
                href={`/portal/sites/${site.id}`}
                className="font-extrabold hover:opacity-80"
                style={{ color: 'var(--pm-navy)' }}
              >
                {site.site_name}
              </Link>
              {site.site_code && (
                <p className="text-xs opacity-70" style={{ color: 'var(--pm-body)' }}>
                  {site.site_code}
                </p>
              )}
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
            <td
              className="px-4 py-3 text-right tabular-nums"
              style={{ color: 'var(--pm-body)' }}
            >
              {site.stage === 'live' ? formatZar(site.monthly_fee) : '—'}
            </td>
          </tr>
        ))}
      </RuledTable>
    </>
  );
}
