'use client';

/**
 * Network Sites — physical Tarana sites, aggregated from base stations.
 *
 * Reuses the existing endpoint (no new backend):
 *  - GET /api/admin/coverage/base-stations?pageSize=1000 → stations grouped by site_name
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PiArrowsClockwiseBold,
  PiBroadcastBold,
  PiBuildingsBold,
  PiMapPinBold,
  PiPlugsConnectedBold,
  PiWarningBold,
} from 'react-icons/pi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard, StatusBadge, SectionCard } from '@/components/admin/shared';

interface BaseStation {
  siteName: string;
  market: string | null;
  region: string | null;
  activeConnections: number;
  deviceStatus: number;
}

interface SiteRow {
  siteName: string;
  market: string;
  region: string;
  stationCount: number;
  onlineCount: number;
  totalConnections: number;
}

export default function NetworkSitesPage() {
  const [stations, setStations] = useState<BaseStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        '/api/admin/coverage/base-stations?pageSize=1000&sortBy=site_name&sortOrder=asc',
        { credentials: 'include' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load network sites');
      }
      setStations((json.data?.stations ?? []) as BaseStation[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sites = useMemo<SiteRow[]>(() => {
    const map = new Map<string, SiteRow>();
    for (const s of stations) {
      const key = s.siteName || 'Unknown';
      const existing = map.get(key);
      if (existing) {
        existing.stationCount += 1;
        existing.onlineCount += s.deviceStatus === 1 ? 1 : 0;
        existing.totalConnections += s.activeConnections || 0;
      } else {
        map.set(key, {
          siteName: key,
          market: s.market || '—',
          region: s.region || '—',
          stationCount: 1,
          onlineCount: s.deviceStatus === 1 ? 1 : 0,
          totalConnections: s.activeConnections || 0,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.siteName.localeCompare(b.siteName));
  }, [stations]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter(
      (s) => s.siteName.toLowerCase().includes(q) || s.market.toLowerCase().includes(q)
    );
  }, [sites, search]);

  const totals = useMemo(
    () => ({
      sites: sites.length,
      stations: stations.length,
      connections: sites.reduce((sum, s) => sum + s.totalConnections, 0),
      markets: new Set(sites.map((s) => s.market)).size,
    }),
    [sites, stations]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <PiMapPinBold className="h-8 w-8 text-orange-600" />
              Network Sites
            </h1>
            <p className="text-gray-600 mt-1">
              Physical Tarana sites on the CircleTel network, with base-station coverage.
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

        {/* Totals */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Sites" value={totals.sites.toLocaleString()} icon={<PiMapPinBold className="h-5 w-5" />} />
          <StatCard label="Base Stations" value={totals.stations.toLocaleString()} icon={<PiBroadcastBold className="h-5 w-5" />} />
          <StatCard label="Active Connections" value={totals.connections.toLocaleString()} icon={<PiPlugsConnectedBold className="h-5 w-5" />} />
          <StatCard label="Markets" value={totals.markets.toLocaleString()} icon={<PiBuildingsBold className="h-5 w-5" />} />
        </div>

        {/* Directory */}
        <SectionCard
          title="Site Directory"
          icon={PiMapPinBold}
          action={
            <Input
              placeholder="Search site or market…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
          }
        >
          {loading && sites.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Loading sites…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No sites found. Base-station data may not be synced yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="px-3 py-2 font-medium">Site</th>
                    <th className="px-3 py-2 font-medium">Market</th>
                    <th className="px-3 py-2 font-medium">Region</th>
                    <th className="px-3 py-2 font-medium">Base stations</th>
                    <th className="px-3 py-2 font-medium">Connections</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.siteName} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{s.siteName}</td>
                      <td className="px-3 py-2 text-gray-600">{s.market}</td>
                      <td className="px-3 py-2 text-gray-600">{s.region}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {s.onlineCount}/{s.stationCount} online
                      </td>
                      <td className="px-3 py-2 tabular-nums">{s.totalConnections.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          status={s.onlineCount === s.stationCount ? 'All online' : s.onlineCount === 0 ? 'Offline' : 'Degraded'}
                          variant={s.onlineCount === s.stationCount ? 'success' : s.onlineCount === 0 ? 'error' : 'warning'}
                        />
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
