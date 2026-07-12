'use client';

/**
 * Tarana Remote Node (RN) dashboard — per-device detail.
 *
 * Reuses existing endpoints (no new backend):
 *  - GET /api/admin/tarana/metrics/[serial]            → latest snapshot
 *  - GET /api/admin/tarana/metrics/[serial]?from&to    → history window (charts)
 */

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import {
  PiArrowsClockwiseBold,
  PiCellSignalFullBold,
  PiRulerBold,
  PiUploadSimpleBold,
  PiWarningBold,
} from 'react-icons/pi';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DetailPageHeader,
  InfoRow,
  SectionCard,
  StatCard,
  type StatusVariant,
} from '@/components/admin/shared';

interface RnMetric {
  rn_serial_number: string;
  bn_serial_number: string | null;
  captured_at: string;
  rssi_dbm: number | null;
  sinr_db: number | null;
  tx_power_dbm: number | null;
  rx_power_dbm: number | null;
  distance_m: number | null;
  rf_distance_m: number | null;
  rn_lat: number | null;
  rn_lng: number | null;
  rn_height_m: number | null;
  bn_lat: number | null;
  bn_lng: number | null;
  bn_height_m: number | null;
  link_status: string | null;
}

function linkVariant(status: string | null): StatusVariant {
  if (!status) return 'neutral';
  const s = status.toLowerCase();
  if (s.includes('up') || s.includes('connect') || s.includes('active')) return 'success';
  if (s.includes('down') || s.includes('disconnect') || s.includes('fail')) return 'error';
  return 'neutral';
}

function fmt(value: number | null | undefined, unit: string, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value.toFixed(digits)} ${unit}`;
}

function coord(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) return '—';
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function RemoteNodeDetailPage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial: rawSerial } = use(params);
  const serial = decodeURIComponent(rawSerial);

  const [latest, setLatest] = useState<RnMetric | null>(null);
  const [history, setHistory] = useState<RnMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const to = new Date();
      const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
      const base = `/api/admin/tarana/metrics/${encodeURIComponent(serial)}`;

      const [latestRes, historyRes] = await Promise.all([
        fetch(base, { credentials: 'include' }),
        fetch(`${base}?from=${from.toISOString()}&to=${to.toISOString()}`, {
          credentials: 'include',
        }),
      ]);

      if (!latestRes.ok) {
        const body = await latestRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load remote-node metrics');
      }

      const latestJson = await latestRes.json();
      setLatest((latestJson.latest ?? null) as RnMetric | null);

      if (historyRes.ok) {
        const historyJson = await historyRes.json();
        setHistory((historyJson.history ?? []) as RnMetric[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [serial]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // History arrives newest-first; charts read left-to-right (oldest → newest).
  const chartData = useMemo(
    () =>
      [...history].reverse().map((m) => ({
        time: m.captured_at
          ? new Date(m.captured_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })
          : '',
        rssi: m.rssi_dbm,
        tx: m.tx_power_dbm,
      })),
    [history]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <DetailPageHeader
        breadcrumbs={[
          { label: 'Network' },
          { label: 'Remote Nodes', href: '/admin/network/remote-nodes' },
          { label: serial },
        ]}
        title={serial}
        status={
          latest?.link_status
            ? { label: latest.link_status, variant: linkVariant(latest.link_status) }
            : undefined
        }
        actions={
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <PiArrowsClockwiseBold className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <PiWarningBold className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {loading && !latest ? (
          <p className="text-sm text-gray-500 py-8 text-center">Loading remote node…</p>
        ) : (
          <>
            {/* Latest snapshot */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="RSSI (received)"
                value={fmt(latest?.rssi_dbm ?? latest?.rx_power_dbm, 'dBm', 1)}
                icon={<PiCellSignalFullBold className="h-5 w-5" />}
              />
              <StatCard
                label="TX power"
                value={fmt(latest?.tx_power_dbm, 'dBm', 1)}
                icon={<PiUploadSimpleBold className="h-5 w-5" />}
              />
              <StatCard
                label="RF distance"
                value={fmt(latest?.rf_distance_m ?? latest?.distance_m, 'm')}
                icon={<PiRulerBold className="h-5 w-5" />}
              />
              <StatCard
                label="Connected BN"
                value={latest?.bn_serial_number ?? '—'}
              />
            </div>

            {/* Signal history */}
            <SectionCard title="Signal history — last 7 days" icon={PiCellSignalFullBold}>
              {chartData.length === 0 ? (
                <p className="text-sm text-gray-500 py-10 text-center">
                  No metric snapshots recorded in the last 7 days.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="time" tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      tickFormatter={(v: number) => `${v} dBm`}
                    />
                    <Tooltip formatter={(v: number | string) => `${v} dBm`} />
                    <Line
                      type="monotone"
                      dataKey="rssi"
                      name="RSSI"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="tx"
                      name="TX power"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--chart-1)' }} />
                  RSSI
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--chart-2)' }} />
                  TX power
                </span>
              </div>
            </SectionCard>

            {/* Device details */}
            <SectionCard title="Link & location" icon={PiRulerBold}>
              <div className="grid md:grid-cols-2 gap-x-8">
                <div>
                  <InfoRow label="RN serial" value={serial} />
                  <InfoRow label="Connected BN" value={latest?.bn_serial_number ?? '—'} />
                  <InfoRow label="Link status" value={latest?.link_status ?? '—'} />
                  <InfoRow label="RF distance" value={fmt(latest?.rf_distance_m ?? latest?.distance_m, 'm')} />
                </div>
                <div>
                  <InfoRow label="RN location" value={coord(latest?.rn_lat ?? null, latest?.rn_lng ?? null)} />
                  <InfoRow label="RN height" value={fmt(latest?.rn_height_m, 'm', 1)} />
                  <InfoRow label="BN location" value={coord(latest?.bn_lat ?? null, latest?.bn_lng ?? null)} />
                  <InfoRow
                    label="Last snapshot"
                    value={latest?.captured_at ? new Date(latest.captured_at).toLocaleString() : '—'}
                  />
                </div>
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
