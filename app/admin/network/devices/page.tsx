'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PiArrowsClockwiseBold, PiWarningBold } from 'react-icons/pi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DeviceStatCards,
  DeviceFilters,
  DeviceTable,
  DeviceCard,
} from '@/components/admin/network';

interface RuijieDevice {
  sn: string;
  device_name: string;
  model: string | null;
  group_name: string | null;
  management_ip: string | null;
  online_clients: number;
  status: string;
  config_status: string | null;
  synced_at: string;
  mock_data: boolean;
}

interface DevicesResponse {
  devices: RuijieDevice[];
  total: number;
  lastSynced: string | null;
  filters: {
    groups: string[];
    models: string[];
  };
}

function formatRelativeTime(dateString: string): string {
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

export default function RuijieDevicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<DevicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters from URL
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [groupFilter, setGroupFilter] = useState(searchParams.get('group') || '');
  const [modelFilter, setModelFilter] = useState(searchParams.get('model') || '');

  // Reboot dialog
  const [rebootDevice, setRebootDevice] = useState<RuijieDevice | null>(null);
  const [rebooting, setRebooting] = useState(false);

  // Tunnel count
  const [tunnelCount, setTunnelCount] = useState(0);
  const TUNNEL_LIMIT = 10;

  const fetchDevices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (groupFilter) params.set('group', groupFilter);
      if (modelFilter) params.set('model', modelFilter);

      const response = await fetch(`/api/ruijie/devices?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch devices');

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load devices');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, groupFilter, modelFilter]);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(() => fetchDevices(), 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDevices]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (groupFilter) params.set('group', groupFilter);
    if (modelFilter) params.set('model', modelFilter);

    const newUrl = params.toString() ? `?${params.toString()}` : '/admin/network/devices';
    router.replace(newUrl, { scroll: false });
  }, [search, statusFilter, groupFilter, modelFilter, router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/ruijie/sync', { method: 'POST', credentials: 'include' });
      // Wait a moment for sync to start, then fetch fresh data
      await new Promise(r => setTimeout(r, 2000));
      await fetchDevices(true);
    } catch (err) {
      console.error('Failed to trigger sync:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleReboot = async () => {
    if (!rebootDevice) return;
    setRebooting(true);
    try {
      const response = await fetch(`/api/ruijie/reboot/${rebootDevice.sn}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Reboot failed');
      setRebootDevice(null);
    } catch (err) {
      console.error('Failed to reboot:', err);
    } finally {
      setRebooting(false);
    }
  };

  const handleExportCSV = () => {
    if (!data?.devices) return;

    const headers = ['Device Name', 'Model', 'SN', 'Group', 'Status', 'Config Status', 'Mgmt IP', 'Clients', 'Last Synced'];
    const rows = data.devices.map(d => [
      d.device_name,
      d.model || '',
      d.sn,
      d.group_name || '',
      d.status,
      d.config_status || '',
      d.management_ip || '',
      d.online_clients.toString(),
      d.synced_at,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ruijie-devices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Check if data is stale (> 15 mins)
  const isStale = data?.lastSynced &&
    (Date.now() - new Date(data.lastSynced).getTime()) > 15 * 60 * 1000;

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        {/* Skeleton filter bar */}
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        {/* Skeleton table */}
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  const onlineCount = data?.devices.filter((d) => d.status === 'online').length || 0;
  const offlineCount = data?.devices.filter((d) => d.status === 'offline').length || 0;
  const isMockData = data?.devices.every((d) => d.mock_data) && (data?.devices.length || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Devices</h1>
          <p className="text-gray-500 mt-1">
            Ruijie Cloud managed devices
            {data?.lastSynced && (
              <span className="ml-2 text-sm">
                • Last synced {formatRelativeTime(data.lastSynced)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Mock Data Banner */}
      {isMockData && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-purple-800">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="font-medium">
                Displaying mock data — Connect Ruijie API for live data
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stale Warning */}
      {isStale && (
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiWarningBold className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">
                  Device data may be outdated — last synced {formatRelativeTime(data?.lastSynced || '')}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Refresh Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <DeviceStatCards
        total={data?.total || 0}
        online={onlineCount}
        offline={offlineCount}
        activeTunnels={tunnelCount}
        tunnelLimit={TUNNEL_LIMIT}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Filters */}
      <DeviceFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        groupFilter={groupFilter}
        onGroupChange={setGroupFilter}
        modelFilter={modelFilter}
        onModelChange={setModelFilter}
        groups={data?.filters.groups || []}
        models={data?.filters.models || []}
        onRefresh={handleRefresh}
        onExport={handleExportCSV}
        refreshing={refreshing}
      />

      {/* Device List - Table on desktop, Cards on mobile */}
      <div className="hidden md:block">
        <DeviceTable
          devices={data?.devices || []}
          tunnelLimitReached={tunnelCount >= TUNNEL_LIMIT}
          onReboot={setRebootDevice}
          formatRelativeTime={formatRelativeTime}
        />
      </div>
      <div className="md:hidden space-y-3">
        {data?.devices.map((device) => (
          <DeviceCard
            key={device.sn}
            device={device}
            tunnelLimitReached={tunnelCount >= TUNNEL_LIMIT}
            onReboot={setRebootDevice}
            formatRelativeTime={formatRelativeTime}
          />
        ))}
        {data?.devices.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No devices found
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Showing {data?.devices.length || 0} of {data?.total || 0} devices</span>
        <span>Active tunnels: {tunnelCount}/{TUNNEL_LIMIT}</span>
      </div>

      {/* Reboot Confirmation Dialog */}
      <AlertDialog open={!!rebootDevice} onOpenChange={() => setRebootDevice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reboot Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reboot <strong>{rebootDevice?.device_name}</strong> ({rebootDevice?.sn}).
              The device will be offline for approximately 2-3 minutes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReboot}
              disabled={rebooting}
              className="bg-red-600 hover:bg-red-700"
            >
              {rebooting ? 'Rebooting...' : 'Reboot'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
