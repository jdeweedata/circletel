'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PiBuildings, PiWifiHighBold, PiHeartbeatBold, PiWarningBold } from 'react-icons/pi';
import type { PortalUser } from '@/lib/portal/portal-auth-provider';

interface SiteHealth {
  health_score: number;
  connected_clients: number;
}

interface Site {
  id: string;
  site_name: string;
  site_code: string | null;
  city: string | null;
  province: string | null;
  status: string | null;
  technology_type: string | null;
  ruijie_device_sn: string | null;
  health: SiteHealth | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  amount_due: number;
  status: string;
  due_date: string;
}

export default function AdminDashboard({ user }: { user: PortalUser }) {
  const [sites, setSites] = useState<Site[]>([]);
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
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const totalSites = sites.length;
  const onlineSites = sites.filter((s) => s.health && s.health.health_score > 0).length;
  const avgHealth = sites.reduce((sum, s) => sum + (s.health?.health_score ?? 0), 0) / (onlineSites || 1);
  const totalClients = sites.reduce((sum, s) => sum + (s.health?.connected_clients ?? 0), 0);
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user.display_name} — {user.organisation_name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<PiBuildings className="w-6 h-6" />} label="Total Sites" value={totalSites} color="blue" />
        <StatCard icon={<PiWifiHighBold className="w-6 h-6" />} label="Online Sites" value={`${onlineSites}/${totalSites}`} color="green" />
        <StatCard icon={<PiHeartbeatBold className="w-6 h-6" />} label="Avg Health Score" value={`${Math.round(avgHealth)}%`} color="orange" />
        <StatCard icon={<PiWifiHighBold className="w-6 h-6" />} label="Connected Clients" value={totalClients} color="purple" />
      </div>

      {overdueInvoices.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiWarningBold className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Overdue Invoices</h3>
          </div>
          <ul className="space-y-1 text-sm text-red-800">
            {overdueInvoices.map((inv) => (
              <li key={inv.id}>
                {inv.invoice_number} — R{inv.amount_due.toFixed(2)} due {new Date(inv.due_date).toLocaleDateString('en-ZA')}
              </li>
            ))}
          </ul>
          <Link href="/portal/billing" className="text-sm font-medium text-red-700 hover:underline mt-2 inline-block">
            View billing →
          </Link>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Site Overview</h2>
          <Link href="/portal/sites" className="text-sm text-circleTel-orange hover:underline">
            View all sites →
          </Link>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Site</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Technology</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Health</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Clients</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sites.slice(0, 10).map((site) => (
                <tr key={site.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/portal/sites/${site.id}`} className="font-medium text-gray-900 hover:text-circleTel-orange">
                      {site.site_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                    {[site.city, site.province].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {site.technology_type ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {site.health ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        site.health.health_score >= 80 ? 'bg-green-100 text-green-700' :
                        site.health.health_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {site.health.health_score}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {site.health?.connected_clients ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sites.length > 10 && (
            <div className="px-4 py-3 bg-gray-50 border-t text-center">
              <Link href="/portal/sites" className="text-sm text-circleTel-orange hover:underline">
                View all {sites.length} sites →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
