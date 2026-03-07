'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PiArrowsClockwiseBold,
  PiWarningBold,
  PiDesktopBold,
  PiWifiHighBold,
  PiPlusBold,
  PiMagnifyingGlassBold,
  PiDownloadBold,
} from 'react-icons/pi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { MikrotikRouter } from '@/lib/types/mikrotik';

interface RoutersResponse {
  success: boolean;
  data: {
    routers: MikrotikRouter[];
    total: number;
    filters: {
      provinces: string[];
      models: string[];
    };
  };
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatUptime(seconds: number | null): string {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export default function MikrotikRoutersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<RoutersResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters from URL
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [provinceFilter, setProvinceFilter] = useState(searchParams.get('province') || '');

  const fetchRouters = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (provinceFilter) params.set('province', provinceFilter);

      const response = await fetch(`/api/admin/network/mikrotik?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch routers');
      }

      const result: RoutersResponse = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load routers');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, provinceFilter]);

  useEffect(() => {
    fetchRouters();
    const interval = setInterval(() => fetchRouters(), 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchRouters]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (provinceFilter) params.set('province', provinceFilter);

    const newUrl = params.toString() ? `?${params.toString()}` : '/admin/network/mikrotik';
    router.replace(newUrl, { scroll: false });
  }, [search, statusFilter, provinceFilter, router]);

  const handleExportCSV = () => {
    if (!data?.routers) return;

    const headers = ['Identity', 'Clinic', 'Province', 'Management IP', 'Status', 'Firmware', 'Uptime', 'CPU %', 'Memory %', 'Last Seen'];
    const rows = data.routers.map((r) => [
      r.identity,
      r.clinic_name || '',
      r.province || '',
      r.management_ip,
      r.status,
      r.firmware_version || '',
      formatUptime(r.uptime_seconds),
      r.cpu_usage?.toString() || '',
      r.memory_usage?.toString() || '',
      r.last_seen_at || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mikrotik-routers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Stats
  const onlineCount = data?.routers.filter((r) => r.status === 'online').length || 0;
  const offlineCount = data?.routers.filter((r) => r.status === 'offline').length || 0;
  const unknownCount = data?.routers.filter((r) => r.status === 'unknown').length || 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 text-center">
          <PiWarningBold className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-800 font-medium">{error}</p>
          <Button onClick={() => fetchRouters()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MikroTik Routers</h1>
          <p className="text-gray-500 mt-1">
            Unjani clinic network devices
            <span className="ml-2 text-sm">• {data?.total || 0} routers</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!data?.routers.length}
          >
            <PiDownloadBold className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/admin/network/mikrotik/new">
            <Button>
              <PiPlusBold className="w-4 h-4 mr-2" />
              Add Router
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            statusFilter === '' ? 'ring-2 ring-circleTel-orange' : ''
          }`}
          onClick={() => setStatusFilter('')}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{data?.total || 0}</p>
              </div>
              <PiDesktopBold className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            statusFilter === 'online' ? 'ring-2 ring-green-500' : ''
          }`}
          onClick={() => setStatusFilter('online')}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Online</p>
                <p className="text-2xl font-bold text-green-600">{onlineCount}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            statusFilter === 'offline' ? 'ring-2 ring-red-500' : ''
          }`}
          onClick={() => setStatusFilter('offline')}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Offline</p>
                <p className="text-2xl font-bold text-red-600">{offlineCount}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            statusFilter === 'unknown' ? 'ring-2 ring-gray-500' : ''
          }`}
          onClick={() => setStatusFilter('unknown')}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unknown</p>
                <p className="text-2xl font-bold text-gray-600">{unknownCount}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by identity, clinic, or IP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Provinces</SelectItem>
                {data?.filters.provinces.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => fetchRouters(true)}
              disabled={refreshing}
            >
              <PiArrowsClockwiseBold
                className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Router Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Identity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Clinic
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Management IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Firmware
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Uptime
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  CPU / Mem
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.routers.map((router) => (
                <tr
                  key={router.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => window.location.href = `/admin/network/mikrotik/${router.id}`}
                >
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        router.status === 'online'
                          ? 'default'
                          : router.status === 'offline'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className={
                        router.status === 'online'
                          ? 'bg-green-100 text-green-800'
                          : ''
                      }
                    >
                      {router.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <PiDesktopBold className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm">{router.identity}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {router.clinic_name || '-'}
                    {router.province && (
                      <span className="text-gray-400 ml-1">({router.province})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {router.management_ip}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {router.firmware_version || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatUptime(router.uptime_seconds)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {router.cpu_usage !== null && router.memory_usage !== null ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            router.cpu_usage > 80
                              ? 'text-red-600'
                              : router.cpu_usage > 50
                              ? 'text-yellow-600'
                              : 'text-gray-600'
                          }
                        >
                          {router.cpu_usage}%
                        </span>
                        <span className="text-gray-300">/</span>
                        <span
                          className={
                            router.memory_usage > 80
                              ? 'text-red-600'
                              : router.memory_usage > 50
                              ? 'text-yellow-600'
                              : 'text-gray-600'
                          }
                        >
                          {router.memory_usage}%
                        </span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatRelativeTime(router.last_seen_at)}
                  </td>
                </tr>
              ))}

              {data?.routers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No routers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Showing {data?.routers.length || 0} of {data?.total || 0} routers</span>
        <Link href="/admin/network/mikrotik/sync-logs" className="text-circleTel-orange hover:underline">
          View Sync History
        </Link>
      </div>
    </div>
  );
}
