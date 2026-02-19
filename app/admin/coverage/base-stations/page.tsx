'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BaseStationStats } from '@/components/admin/coverage/BaseStationStats';
import { BaseStationTable } from '@/components/admin/coverage/BaseStationTable';
import { Radio, Map, RefreshCw, AlertTriangle, Download } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface BaseStation {
  id: string;
  serialNumber: string;
  hostname: string;
  siteName: string;
  activeConnections: number;
  market: string;
  lat: number;
  lng: number;
  region: string;
  lastUpdated: string;
}

interface Market {
  name: string;
  count: number;
}

interface Stats {
  totalStations: number;
  totalConnections: number;
  avgConnections: number;
  marketCount: number;
  markets: Market[];
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface SyncStatus {
  id: string;
  status: string;
  inserted: number;
  updated: number;
  deleted: number;
  duration_ms: number;
  created_at: string;
}

export default function BaseStationsPage() {
  const [stations, setStations] = useState<BaseStation[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStations: 0,
    totalConnections: 0,
    avgConnections: 0,
    marketCount: 0,
    markets: [],
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [market, setMarket] = useState('');
  const [sortBy, setSortBy] = useState('active_connections');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pending' | 'running' | 'completed' | 'failed'>('idle');
  const [lastSync, setLastSync] = useState<SyncStatus | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.set('search', search);
      if (market) params.set('market', market);

      const response = await fetch(`/api/admin/coverage/base-stations?${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch base stations');
      }

      setStations(data.data.stations);
      setStats(data.data.stats);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, search, market, sortBy, sortOrder]);

  // Fetch sync status from API
  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/tarana/sync/status');
      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setLastSync(data.data);
        const status = data.data.status as 'pending' | 'running' | 'completed' | 'failed';
        setSyncStatus(status);
        return status;
      }
      return 'idle';
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
      return 'idle';
    }
  }, []);

  // Trigger a new sync
  const triggerSync = async () => {
    try {
      setSyncStatus('pending');

      const response = await fetch('/api/admin/tarana/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to trigger sync');
      }

      // Start polling for status updates
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(async () => {
        const status = await fetchSyncStatus();
        if (status === 'completed' || status === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          // Refresh table data on completion
          if (status === 'completed') {
            fetchData();
          }
        }
      }, 2000);

    } catch (err) {
      console.error('Sync trigger failed:', err);
      setSyncStatus('failed');
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Fetch sync status on mount
  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination((prev) => ({ ...prev, page: 1, pageSize }));
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleMarketChange = (value: string) => {
    setMarket(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (by: string, order: 'asc' | 'desc') => {
    setSortBy(by);
    setSortOrder(order);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const exportToCSV = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '1000',
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (market) params.set('market', market);

      const response = await fetch(`/api/admin/coverage/base-stations?${params}`);
      const data = await response.json();

      if (!data.success) throw new Error('Failed to export');

      const csvRows = [
        ['Site Name', 'Hostname', 'Serial Number', 'Market', 'Latitude', 'Longitude', 'Active Connections', 'Region'].join(','),
        ...data.data.stations.map((s: BaseStation) =>
          [
            `"${s.siteName}"`,
            s.hostname,
            s.serialNumber,
            s.market || '',
            s.lat,
            s.lng,
            s.activeConnections,
            s.region || '',
          ].join(',')
        ),
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `base-stations-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Radio className="h-8 w-8 text-orange-600" />
              Tarana Base Stations
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor SkyFibre coverage base stations from BN-Report
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Last sync info */}
            {lastSync && (
              <div className="text-sm text-gray-500 mr-2">
                Last sync: {formatDistanceToNow(new Date(lastSync.created_at))} ago
                {lastSync.status === 'completed' && (
                  <span className="ml-1">
                    ({lastSync.inserted} new, {lastSync.updated} updated)
                  </span>
                )}
              </div>
            )}

            {/* Sync Now Button */}
            <Button
              onClick={triggerSync}
              disabled={syncStatus === 'pending' || syncStatus === 'running'}
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  syncStatus === 'pending' || syncStatus === 'running' ? 'animate-spin' : ''
                }`}
              />
              {syncStatus === 'running' ? 'Syncing...' : 'Sync Now'}
            </Button>

            <Button onClick={fetchData} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Link href="/admin/coverage/base-stations/map">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Map className="h-4 w-4 mr-2" />
                View Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <BaseStationStats
          totalStations={stats.totalStations}
          totalConnections={stats.totalConnections}
          avgConnections={stats.avgConnections}
          marketCount={stats.marketCount}
          loading={loading && stations.length === 0}
        />

        {/* Table Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Base Station Directory
            </CardTitle>
            <CardDescription>
              View all {stats.totalStations.toLocaleString()} Tarana base stations with coverage information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BaseStationTable
              stations={stations}
              markets={stats.markets}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearchChange={handleSearchChange}
              onMarketChange={handleMarketChange}
              onSortChange={handleSortChange}
              currentSort={{ by: sortBy, order: sortOrder }}
              currentSearch={search}
              currentMarket={market}
            />
          </CardContent>
        </Card>

        {/* Coverage Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Connection Count Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span>10+ connections (High confidence coverage)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span>5-9 connections (Medium confidence)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500" />
                <span>1-4 connections (Low confidence)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span>0 connections (Potentially inactive)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
