'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  PiHeartbeatBold,
  PiWifiHighBold,
  PiWarningBold,
  PiArrowLeftBold,
  PiMapPinBold,
  PiCpuBold,
  PiCalendarBold,
} from 'react-icons/pi';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import HealthTrendChart from '@/components/portal/HealthTrendChart';

interface SiteDetail {
  site: {
    id: string;
    site_name: string;
    site_code: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    status: string | null;
    technology_type: string | null;
    ruijie_device_sn: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    notes: string | null;
    created_at: string;
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

export default function PortalSiteDetailPage() {
  const params = useParams();
  const siteId = params.id as string;
  const { isAdmin } = usePortalAuth();
  const [data, setData] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portal/sites/${siteId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.site) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Site not found.</p>
        {isAdmin && (
          <Link href="/portal/sites" className="text-sm text-circleTel-orange hover:underline mt-2 inline-block">
            Back to sites
          </Link>
        )}
      </div>
    );
  }

  const { site, health, alerts } = data;
  const activeAlerts = alerts.filter((a) => !a.resolved_at);
  const hasMonitoring = !!site.ruijie_device_sn;
  const address = [site.address_line1, site.address_line2, site.city, site.province, site.postal_code]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Link
          href="/portal/sites"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-circleTel-orange"
        >
          <PiArrowLeftBold className="w-4 h-4" />
          Back to sites
        </Link>
      )}

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{site.site_name}</h1>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              site.status === 'active'
                ? 'bg-green-100 text-green-700'
                : site.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {site.status ?? 'unknown'}
          </span>
        </div>
        {address && (
          <p className="text-gray-500 mt-1 flex items-center gap-1">
            <PiMapPinBold className="w-4 h-4 shrink-0" />
            {address}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<PiHeartbeatBold className="w-6 h-6" />}
          label="Health Score"
          value={health ? `${health.health_score}%` : 'N/A'}
          color={health && health.health_score >= 80 ? 'green' : health && health.health_score >= 50 ? 'orange' : 'gray'}
        />
        <StatCard
          icon={<PiWifiHighBold className="w-6 h-6" />}
          label="Connected Clients"
          value={health?.connected_clients ?? '—'}
          color="blue"
        />
        <StatCard
          icon={<PiCpuBold className="w-6 h-6" />}
          label="CPU / Memory"
          value={
            health?.cpu_usage != null && health?.memory_usage != null
              ? `${health.cpu_usage}% / ${health.memory_usage}%`
              : '—'
          }
          color="purple"
        />
        <StatCard
          icon={<PiCalendarBold className="w-6 h-6" />}
          label="Last Updated"
          value={
            health
              ? new Date(health.created_at).toLocaleString('en-ZA', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'
          }
          color="gray"
        />
      </div>

      {!hasMonitoring && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          Automated monitoring is not available for this site (MTN LTE). Status is updated manually.
        </div>
      )}

      {hasMonitoring && <HealthTrendChart siteId={siteId} />}

      {activeAlerts.length > 0 && (
        <div className="bg-white rounded-xl border">
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <PiWarningBold className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Active Alerts ({activeAlerts.length})</h2>
          </div>
          <ul className="divide-y">
            {activeAlerts.map((alert) => (
              <li key={alert.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(alert.created_at).toLocaleString('en-ZA')}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    alert.severity === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : alert.severity === 'warning'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {alert.severity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {alerts.length > 0 && alerts.some((a) => a.resolved_at) && (
        <div className="bg-white rounded-xl border">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-gray-900">Recent Resolved Alerts</h2>
          </div>
          <ul className="divide-y">
            {alerts
              .filter((a) => a.resolved_at)
              .slice(0, 5)
              .map((alert) => (
                <li key={alert.id} className="px-4 py-3 flex items-center justify-between text-gray-500">
                  <div>
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs">
                      Resolved {new Date(alert.resolved_at!).toLocaleString('en-ZA')}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    resolved
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Site Information</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <InfoRow label="Technology" value={site.technology_type} />
          <InfoRow label="Site Code" value={site.site_code} />
          <InfoRow label="Contact" value={site.contact_name} />
          <InfoRow label="Phone" value={site.contact_phone} />
          <InfoRow label="Email" value={site.contact_email} />
          {site.notes && <InfoRow label="Notes" value={site.notes} />}
        </dl>
      </div>

      <div className="flex gap-4">
        <Link
          href="/portal/support"
          className="text-sm text-circleTel-orange hover:underline"
        >
          Raise support ticket for this site
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] ?? colorMap.gray}`}>
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

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
