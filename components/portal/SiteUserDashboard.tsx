'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PiHeartbeatBold, PiWifiHighBold, PiWarningBold, PiCalendarBold } from 'react-icons/pi';
import type { PortalUser } from '@/lib/portal/portal-auth-provider';

interface SiteDetail {
  site: {
    id: string;
    site_name: string;
    site_code: string | null;
    address_line1: string | null;
    city: string | null;
    province: string | null;
    status: string | null;
    technology_type: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    contact_email: string | null;
  };
  health: {
    health_score: number;
    connected_clients: number;
    cpu_usage: number | null;
    memory_usage: number | null;
    created_at: string;
  } | null;
  alerts: Array<{
    id: string;
    alert_type: string;
    severity: string;
    message: string;
    created_at: string;
    resolved_at: string | null;
  }>;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  amount_due: number;
  status: string;
  due_date: string;
}

export default function SiteUserDashboard({ user }: { user: PortalUser }) {
  const [siteData, setSiteData] = useState<SiteDetail | null>(null);
  const [nextInvoice, setNextInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user.site_id) {
      setLoading(false);
      return;
    }

    let mounted = true;
    Promise.all([
      fetch(`/api/portal/sites/${user.site_id}`).then((r) => r.json()),
      fetch('/api/portal/billing').then((r) => r.json()),
    ])
      .then(([site, billing]) => {
        if (!mounted) return;
        setSiteData(site);
        const pending = (billing.invoices ?? []).find(
          (i: Invoice) => i.status === 'pending' || i.status === 'overdue'
        );
        setNextInvoice(pending ?? null);
      })
      .catch(console.error)
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user.site_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user.site_id || !siteData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No site assigned to your account.</p>
      </div>
    );
  }

  const { site, health, alerts } = siteData;
  const activeAlerts = alerts.filter((a) => !a.resolved_at);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{site.site_name}</h1>
        <p className="text-gray-500 mt-1">
          {[site.address_line1, site.city, site.province].filter(Boolean).join(', ')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              site.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
            }`}>
              <PiWifiHighBold className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-xl font-bold text-gray-900 capitalize">{site.status ?? 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-50 text-orange-600">
              <PiHeartbeatBold className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Health Score</p>
              <p className="text-xl font-bold text-gray-900">
                {health ? `${health.health_score}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <PiWifiHighBold className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Connected Clients</p>
              <p className="text-xl font-bold text-gray-900">
                {health?.connected_clients ?? '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              nextInvoice?.status === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'
            }`}>
              <PiCalendarBold className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Next Invoice</p>
              <p className="text-xl font-bold text-gray-900">
                {nextInvoice ? `R${nextInvoice.amount_due.toFixed(2)}` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!health && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          Automated monitoring is not available for this site. Status is updated manually.
        </div>
      )}

      {activeAlerts.length > 0 && (
        <div className="bg-white rounded-xl border">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <PiWarningBold className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Active Alerts</h2>
          </div>
          <ul className="divide-y">
            {activeAlerts.map((alert) => (
              <li key={alert.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleString('en-ZA')}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  alert.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {alert.severity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Site Information</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-gray-500">Technology</dt>
            <dd className="font-medium text-gray-900">{site.technology_type ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Site Code</dt>
            <dd className="font-medium text-gray-900">{site.site_code ?? '—'}</dd>
          </div>
          {site.contact_name && (
            <div>
              <dt className="text-gray-500">Contact</dt>
              <dd className="font-medium text-gray-900">{site.contact_name}</dd>
            </div>
          )}
          {site.contact_phone && (
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{site.contact_phone}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex gap-4">
        <Link
          href={`/portal/sites/${site.id}`}
          className="text-sm text-circleTel-orange hover:underline"
        >
          View full site details →
        </Link>
        <Link
          href="/portal/support"
          className="text-sm text-circleTel-orange hover:underline"
        >
          Raise support ticket →
        </Link>
      </div>
    </div>
  );
}
