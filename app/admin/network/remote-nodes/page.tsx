'use client';

/**
 * Tarana Remote Nodes (RN) — fleet view.
 *
 * Reuses existing endpoints (no new backend):
 *  - GET /api/admin/tarana/device-counts  → RN connected/disconnected/new-installs/total
 *  - GET /api/admin/tarana/metrics?limit=… → latest tarana_link_metrics rows (deduped per RN)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PiArrowsClockwiseBold,
  PiBroadcastBold,
  PiCellSignalFullBold,
  PiCellSignalSlashBold,
  PiPlusCircleBold,
  PiRadioBold,
  PiWarningBold,
} from 'react-icons/pi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard, StatusBadge, SectionCard, type StatusVariant } from '@/components/admin/shared';

interface RnCounts {
  connected: number;
  disconnected: number;
  spectrumUnassigned: number;
  newInstalls30d: number;
  total: number;
}

interface RnMetric {
  rn_serial_number: string;
  bn_serial_number: string | null;
  captured_at: string;
  rssi_dbm: number | null;
  distance_m: number | null;
  rf_distance_m: number | null;
  link_status: string | null;
}

/** Map a Tarana RF link-state string to a semantic StatusBadge variant. */
function linkVariant(status: string | null): StatusVariant {
  if (!status) return 'neutral';
  const s = status.toLowerCase();
  if (s.includes('up') || s.includes('connect') || s.includes('active')) return 'success';
  if (s.includes('down') || s.includes('disconnect') || s.includes('fail')) return 'error';
  return 'neutral';
}

function fmt(value: number | null, unit: string, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(digits)} ${unit}`;
}

export default function RemoteNodesPage() {
  const [counts, setCounts] = useState<RnCounts | null>(null);
  const [metrics, setMetrics] = useState<RnMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [countsRes, metricsRes] = await Promise.all([
        fetch('/api/admin/tarana/device-counts', { credentials: 'include' }),
        fetch('/api/admin/tarana/metrics?limit=500', { credentials: 'include' }),
      ]);

      // device-counts is optional (404 before first sync) — don't fail the page on it.
      if (countsRes.ok) {
        const countsJson = await countsRes.json();
        if (countsJson?.success && countsJson.data?.rn) setCounts(countsJson.data.rn as RnCounts);
      }

      if (!metricsRes.ok) {
        const body = await metricsRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load remote-node metrics');
      }
      const metricsJson = await metricsRes.json();
      setMetrics((metricsJson.metrics ?? []) as RnMetric[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Rows arrive ordered by captured_at desc → first per serial is the latest snapshot.
  const latestPerRn = useMemo(() => {
    const seen = new Map<string, RnMetric>();
    for (const m of metrics) {
      if (m.rn_serial_number && !seen.has(m.rn_serial_number)) seen.set(m.rn_serial_number, m);
    }
    return Array.from(seen.values());
  }, [metrics]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return latestPerRn;
    return latestPerRn.filter(
      (r) =>
        r.rn_serial_number.toLowerCase().includes(q) ||
        (r.bn_serial_number ?? '').toLowerCase().includes(q)
    );
  }, [latestPerRn, search]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <PiRadioBold className="h-8 w-8 text-orange-600" />
              Remote Nodes
            </h1>
            <p className="text-gray-600 mt-1">
              Tarana customer-premise radios (RNs) with the latest link telemetry.
            </p>
          </div>
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <PiArrowsClockwiseBold className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <PiWarningBold className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Fleet counts (from device-counts rollup) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Connected"
            value={counts ? counts.connected.toLocaleString() : '—'}
            icon={<PiCellSignalFullBold className="h-5 w-5" />}
          />
          <StatCard
            label="Disconnected"
            value={counts ? counts.disconnected.toLocaleString() : '—'}
            icon={<PiCellSignalSlashBold className="h-5 w-5" />}
          />
          <StatCard
            label="New Installs (30d)"
            value={counts ? counts.newInstalls30d.toLocaleString() : '—'}
            icon={<PiPlusCircleBold className="h-5 w-5" />}
          />
          <StatCard
            label="Total RNs"
            value={counts ? counts.total.toLocaleString() : latestPerRn.length.toLocaleString()}
            icon={<PiBroadcastBold className="h-5 w-5" />}
          />
        </div>

        {/* Directory */}
        <SectionCard
          title="Remote Node Directory"
          icon={PiRadioBold}
          action={
            <Input
              placeholder="Search serial or BN…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
          }
        >
          {loading && latestPerRn.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Loading remote nodes…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No remote-node metrics yet. Trigger a Tarana metrics collection to populate this view.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="px-3 py-2 font-medium">RN Serial</th>
                    <th className="px-3 py-2 font-medium">Connected BN</th>
                    <th className="px-3 py-2 font-medium">Link</th>
                    <th className="px-3 py-2 font-medium">RSSI</th>
                    <th className="px-3 py-2 font-medium">Distance</th>
                    <th className="px-3 py-2 font-medium">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.rn_serial_number} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/network/remote-nodes/${encodeURIComponent(r.rn_serial_number)}`}
                          className="font-medium text-primary hover:underline font-mono text-[13px]"
                        >
                          {r.rn_serial_number}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-[13px] text-gray-600">
                        {r.bn_serial_number ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          status={r.link_status ?? 'Unknown'}
                          variant={linkVariant(r.link_status)}
                        />
                      </td>
                      <td className="px-3 py-2 tabular-nums">{fmt(r.rssi_dbm, 'dBm', 1)}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {fmt(r.rf_distance_m ?? r.distance_m, 'm')}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {r.captured_at ? new Date(r.captured_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
