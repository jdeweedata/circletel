'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DFABuildingStats } from '@/components/admin/coverage/DFABuildingStats';
import { DFABuildingTable } from '@/components/admin/coverage/DFABuildingTable';
import { Building, Map, RefreshCw, AlertTriangle, Download } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface DFABuilding {
  id: string;
  objectId: number;
  buildingId: string | null;
  buildingName: string | null;
  streetAddress: string | null;
  latitude: number;
  longitude: number;
  coverageType: 'connected' | 'near-net';
  ftth: string | null;
  broadband: string | null;
  precinct: string | null;
  promotion: string | null;
  propertyOwner: string | null;
  lastSyncedAt: string;
  createdAt: string;
}

interface Precinct {
  name: string;
  count: number;
}

interface Stats {
  totalBuildings: number;
  connectedCount: number;
  nearNetCount: number;
  precinctCount: number;
  precincts: Precinct[];
  lastSync: {
    id: string;
    status: string;
    connectedCount: number;
    nearNetCount: number;
    durationMs: number;
    completedAt: string;
  } | null;
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
  connected_count: number;
  near_net_count: number;
  duration_ms: number;
  completed_at: string;
}

export default function DFABuildingsPage() {
  const [buildings, setBuildings] = useState<DFABuilding[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBuildings: 0,
    connectedCount: 0,
    nearNetCount: 0,
    precinctCount: 0,
    precincts: [],
    lastSync: null,
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
  const [type, setType] = useState('');
  const [precinct, setPrecinct] = useState('');
  const [ftth, setFtth] = useState('');
  const [sortBy, setSortBy] = useState('building_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sync state
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'pending' | 'running' | 'completed' | 'failed'
  >('idle');
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
      if (type) params.set('type', type);
      if (precinct) params.set('precinct', precinct);
      if (ftth) params.set('ftth', ftth);

      const response = await fetch(`/api/admin/coverage/dfa-buildings?${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch DFA buildings');
      }

      setBuildings(data.data.buildings);
      setStats(data.data.stats);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, search, type, precinct, ftth, sortBy, sortOrder]);

  // Fetch sync status from API
  const fetchSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/coverage/dfa-buildings/sync');
      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setLastSync(data.data);
        const status = data.data.status as
          | 'pending'
          | 'running'
          | 'completed'
          | 'failed';
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

      const response = await fetch('/api/admin/coverage/dfa-buildings/sync', {
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

  const handleTypeChange = (value: string) => {
    setType(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePrecinctChange = (value: string) => {
    setPrecinct(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleFtthChange = (value: string) => {
    setFtth(value);
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
        pageSize: '5000',
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (type) params.set('type', type);
      if (precinct) params.set('precinct', precinct);
      if (ftth) params.set('ftth', ftth);

      const response = await fetch(`/api/admin/coverage/dfa-buildings?${params}`);
      const data = await response.json();

      if (!data.success) throw new Error('Failed to export');

      const csvRows = [
        [
          'Building ID',
          'Building Name',
          'Address',
          'Type',
          'FTTH',
          'Broadband',
          'Precinct',
          'Latitude',
          'Longitude',
        ].join(','),
        ...data.data.buildings.map((b: DFABuilding) =>
          [
            b.buildingId || '',
            `"${(b.buildingName || '').replace(/"/g, '""')}"`,
            `"${(b.streetAddress || '').replace(/"/g, '""')}"`,
            b.coverageType,
            b.ftth || '',
            b.broadband || '',
            b.precinct || '',
            b.latitude,
            b.longitude,
          ].join(',')
        ),
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dfa-buildings-${new Date().toISOString().split('T')[0]}.csv`;
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
              <Building className="h-8 w-8 text-purple-600" />
              DFA Connected Buildings
            </h1>
            <p className="text-gray-600 mt-1">
              Dark Fibre Africa coverage for BizFibre Connect products
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Last sync info */}
            {lastSync &&
              lastSync.completed_at &&
              !isNaN(new Date(lastSync.completed_at).getTime()) && (
                <div className="text-sm text-gray-500 mr-2">
                  Last sync:{' '}
                  {formatDistanceToNow(new Date(lastSync.completed_at))} ago
                  {lastSync.status === 'completed' && (
                    <span className="ml-1">
                      ({lastSync.connected_count} connected,{' '}
                      {lastSync.near_net_count} near-net)
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
                  syncStatus === 'pending' || syncStatus === 'running'
                    ? 'animate-spin'
                    : ''
                }`}
              />
              {syncStatus === 'running' ? 'Syncing...' : 'Sync Now'}
            </Button>

            <Button onClick={fetchData} disabled={loading} variant="outline">
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Link href="/admin/coverage/dfa-buildings/map">
              <Button className="bg-purple-600 hover:bg-purple-700">
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
        <DFABuildingStats
          totalBuildings={stats.totalBuildings}
          connectedCount={stats.connectedCount}
          nearNetCount={stats.nearNetCount}
          precinctCount={stats.precinctCount}
          lastSync={stats.lastSync}
          loading={loading && buildings.length === 0}
        />

        {/* Table Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Building Directory
            </CardTitle>
            <CardDescription>
              View all {stats.totalBuildings.toLocaleString()} DFA buildings with
              fiber coverage information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DFABuildingTable
              buildings={buildings}
              precincts={stats.precincts}
              pagination={pagination}
              loading={loading}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSearchChange={handleSearchChange}
              onTypeChange={handleTypeChange}
              onPrecinctChange={handlePrecinctChange}
              onFtthChange={handleFtthChange}
              onSortChange={handleSortChange}
              currentSort={{ by: sortBy, order: sortOrder }}
              currentSearch={search}
              currentType={type}
              currentPrecinct={precinct}
              currentFtth={ftth}
            />
          </CardContent>
        </Card>

        {/* Coverage Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Coverage Type Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-600" />
                <span>Connected - Active DFA fiber connection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span>Near-Net - Within 200m of fiber network</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
