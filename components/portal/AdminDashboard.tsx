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
  formatSiteLocation,
  formatTechnology,
  type PortalSite,
} from '@/lib/portal/site-format';

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  amount_due: number;
  status: string;
  due_date: string;
}

export default function AdminDashboard({ user }: { user: PortalUser }) {
  const [sites, setSites] = useState<PortalSite[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch('/api/portal/sites').then((r) => r.json()),
      fetch('/api/portal/billing').then((r) => r.json()),
    ])
      .then(([sitesData, billingData]) => {
        if (!mounted) return;
        setSites(sitesData.sites ?? []);
        setInvoices(billingData.invoices ?? []);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const totalSites = sites.length;
  const onlineSites = sites.filter((s) => s.health && s.health.health_score > 0).length;
  const avgHealth =
    sites.reduce((sum, s) => sum + (s.health?.health_score ?? 0), 0) /
    (onlineSites || 1);
  const totalClients = sites.reduce(
    (sum, s) => sum + (s.health?.online_clients ?? 0),
    0
  );
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm" style={{ color: '#13274A' }}>
        Loading dashboard…
      </div>
    );
  }

  return (
    <PortalModernistShell>
      <PageHeader
        eyebrow="Organisation · Overview"
        title="Dashboard"
        subtitle={`Welcome back, ${user.display_name} — ${user.organisation_name}`}
        actions={
          <>
            <Link href="/portal/coverage">
              <PmButton variant="secondary">Coverage check</PmButton>
            </Link>
            <Link href="/portal/team">
              <PmButton>Manage team</PmButton>
            </Link>
          </>
        }
      />

      <KpiStrip
        items={[
          { label: 'Total sites', value: String(totalSites) },
          { label: 'Online', value: `${onlineSites}/${totalSites}` },
          { label: 'Avg health', value: `${Math.round(avgHealth)}%` },
          { label: 'Clients', value: String(totalClients) },
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
            <PiWarningBold className="w-4 h-4" />
            {overdueInvoices.length} overdue invoice
            {overdueInvoices.length > 1 ? 's' : ''}
          </span>
        </AlertBand>
      )}

      <div className="mt-8 flex items-center justify-between">
        <p
          className="text-[10px] font-extrabold tracking-[0.08em] uppercase"
          style={{ color: 'var(--pm-navy)' }}
        >
          Site overview
        </p>
        <Link href="/portal/sites" className="text-sm font-extrabold" style={{ color: '#D76026' }}>
          View all sites →
        </Link>
      </div>

      <RuledTable headers={['Site', 'Location', 'Technology', 'Health', 'Clients']}>
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
            <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
              {site.health ? `${site.health.health_score}%` : 'N/A'}
            </td>
            <td className="px-4 py-3" style={{ color: 'var(--pm-body)' }}>
              {site.health?.online_clients ?? '—'}
            </td>
          </tr>
        ))}
      </RuledTable>
    </PortalModernistShell>
  );
}
