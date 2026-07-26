'use client';

/**
 * Per-device traffic history.
 *
 * Ruijie's flow/show/hour endpoint (API V2.0.3 §2.5.2) is keyed by serial number, so this
 * is genuinely this AP's own throughput — not its group's. Buckets are 10 minutes wide.
 */

import { useCallback, useEffect, useState } from 'react';
import { PiArrowsClockwiseBold, PiWarningCircleBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { TrafficChart } from '@/components/admin/network/TrafficChart';

interface TrafficPoint {
  timestamp: number;
  timeString: string;
  rxBytes: number;
  txBytes: number;
}

interface TrafficHistory {
  totalRxBytes: number;
  totalTxBytes: number;
  totalBytes: number;
  avgRxRate: number;
  avgTxRate: number;
  peakRxBytes: number;
  peakTxBytes: number;
  dataPoints: TrafficPoint[];
}

interface DeviceTrafficPanelProps {
  sn: string;
}

const WINDOWS = [
  { hours: 6, label: '6h' },
  { hours: 24, label: '24h' },
  { hours: 72, label: '3d' },
  { hours: 168, label: '7d' },
] as const;

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatBps(bps: number | null | undefined): string {
  if (bps == null || !Number.isFinite(bps) || bps === 0) return '0 bps';
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  const i = Math.min(Math.floor(Math.log(bps) / Math.log(1000)), units.length - 1);
  return `${(bps / Math.pow(1000, i)).toFixed(1)} ${units[i]}`;
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

export function DeviceTrafficPanel({ sn }: DeviceTrafficPanelProps) {
  const [hours, setHours] = useState<number>(24);
  const [history, setHistory] = useState<TrafficHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTraffic = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ruijie/devices/${sn}/traffic?hours=${hours}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const data = await response.json();
      setHistory(data.history ?? null);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch device traffic:', err);
      setError('Could not load traffic history from Ruijie Cloud.');
      setHistory(null);
    } finally {
      setLoading(false);
    }
  }, [sn, hours]);

  useEffect(() => {
    fetchTraffic();
  }, [fetchTraffic]);

  const points = history?.dataPoints ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
          {WINDOWS.map((w) => (
            <button
              key={w.hours}
              type="button"
              onClick={() => setHours(w.hours)}
              aria-pressed={hours === w.hours}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                hours === w.hours
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={fetchTraffic} disabled={loading}>
          <PiArrowsClockwiseBold
            className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <PiWarningCircleBold className="w-4 h-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Downloaded" value={formatBytes(history?.totalRxBytes)} />
        <Tile label="Uploaded" value={formatBytes(history?.totalTxBytes)} />
        <Tile
          label="Avg Rate"
          value={formatBps(history?.avgRxRate)}
          hint={`↑ ${formatBps(history?.avgTxRate)}`}
        />
        <Tile
          label="Busiest Bucket"
          value={formatBytes(history?.peakRxBytes)}
          hint="download, per 10 min"
        />
      </div>

      {loading && points.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-slate-500">
          Loading traffic history…
        </div>
      ) : (
        <TrafficChart dataPoints={points} title={`Device Traffic — last ${hours}h`} />
      )}
    </div>
  );
}
