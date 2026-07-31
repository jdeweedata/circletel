'use client';

/**
 * Network Devices list — Ruijie fleet ops.
 *
 * Customer link path (Task C3):
 * - Filter Customer link → Unlinked only
 * - Per-row Link opens LinkCustomerDialog → POST /api/ruijie/devices/[sn]/link
 * - Detail page also has Customer Assignment panel
 *
 * Link body: { type: "consumer"|"corporate", customer_order_id? | corporate_site_id? }
 * Search: GET /api/admin/search/customers?q=
 * Verify: ruijie_device_cache.customer_order_id or corporate_site_id set after link.
 *
 * Ops: do not mass-link with invented IDs — search real orders/sites from the picker.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PiArrowsClockwiseBold, PiWarningBold, PiWarningCircleBold } from 'react-icons/pi';
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
  DeviceFilters,
  DeviceTable,
  DeviceCard,
  LinkCustomerDialog,
  type RuijieListDevice,
} from '@/components/admin/network';
import {
  MetricCard,
  NetworkOverviewTiles,
  type NetworkInventory,
} from '@/components/admin/network/performance';
import { computeNetworkInventory } from '@/lib/network/performance-aggregates';

import {
  AdminPage,
  PageHeader,
  LoadingState,
} from '@/components/backend';


interface DevicesResponse {
  devices: RuijieListDevice[];
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

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [groupFilter, setGroupFilter] = useState(searchParams.get('group') || '');
  const [modelFilter, setModelFilter] = useState(searchParams.get('model') || '');
  const [linkedFilter, setLinkedFilter] = useState(searchParams.get('linked') || '');

  const [rebootDevice, setRebootDevice] = useState<RuijieListDevice | null>(null);
  const [rebooting, setRebooting] = useState(false);
  const [linkDevice, setLinkDevice] = useState<RuijieListDevice | null>(null);

  const [tunnelCount] = useState(0);
  const TUNNEL_LIMIT = 10;

  const fetchDevices = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);
        if (groupFilter) params.set('group', groupFilter);
        if (modelFilter) params.set('model', modelFilter);
        if (linkedFilter) params.set('linked', linkedFilter);

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
    },
    [search, statusFilter, groupFilter, modelFilter, linkedFilter]
  );

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(() => fetchDevices(), 30000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (groupFilter) params.set('group', groupFilter);
    if (modelFilter) params.set('model', modelFilter);
    if (linkedFilter) params.set('linked', linkedFilter);

    const newUrl = params.toString() ? `?${params.toString()}` : '/admin/network/devices';
    router.replace(newUrl, { scroll: false });
  }, [search, statusFilter, groupFilter, modelFilter, linkedFilter, router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/ruijie/sync', { method: 'POST', credentials: 'include' });
      await new Promise((r) => setTimeout(r, 2000));
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
        credentials: 'include',
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

    const headers = [
      'Device Name',
      'Model',
      'SN',
      'Group',
      'Status',
      'Config Status',
      'Mgmt IP',
      'CPU %',
      'Mem %',
      'Clients',
      'Customer',
      'Customer Order ID',
      'Corporate Site ID',
      'Last Synced',
    ];
    const rows = data.devices.map((d) => [
      d.device_name,
      d.model || '',
      d.sn,
      d.group_name || '',
      d.status,
      d.config_status || '',
      d.management_ip || '',
      d.cpu_usage == null ? '' : String(Math.round(d.cpu_usage)),
      d.memory_usage == null ? '' : String(Math.round(d.memory_usage)),
      d.online_clients.toString(),
      d.customer_name || '',
      d.customer_order_id || '',
      d.corporate_site_id || '',
      d.synced_at,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ruijie-devices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const isStale =
    data?.lastSynced &&
    Date.now() - new Date(data.lastSynced).getTime() > 15 * 60 * 1000;

  const inventory: NetworkInventory = useMemo(() => {
    const devices = data?.devices || [];
    const computed = computeNetworkInventory(devices);
    return {
      gateway: computed.gateway,
      ap: computed.ap,
      switch: { online: computed.switchOnline, total: computed.switchTotal },
      client: computed.client,
      guest: computed.guest,
    };
  }, [data?.devices]);

  if (loading) {
    return (
      <AdminPage>
        <LoadingState message="Loading devices..." />
      </AdminPage>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <PiWarningCircleBold className="w-12 h-12 text-red-500" />
        <p className="text-slate-600">{error}</p>
        <Button onClick={() => fetchDevices()}>Retry</Button>
      </div>
    );
  }

  const devices = data?.devices || [];
  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const unlinkedCount = devices.filter(
    (d) => !d.customer_order_id && !d.corporate_site_id
  ).length;
  const totalClients = devices.reduce((sum, d) => sum + (d.online_clients || 0), 0);
  const withCpu = devices.filter((d) => d.cpu_usage != null).length;
  const isMockData = devices.length > 0 && devices.every((d) => d.mock_data);
  const onlinePercent =
    devices.length > 0 ? Math.round((onlineCount / devices.length) * 100) : 0;

  return (
    <AdminPage>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400 mb-1">Activity / Infrastructure / Devices</p>
          <PageHeader title="Network Devices" subtitle="Manage CPE and network devices" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={linkedFilter === 'unlinked' ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              setLinkedFilter((prev) => (prev === 'unlinked' ? '' : 'unlinked'))
            }
          >
            Unlinked
            {linkedFilter !== 'linked' && devices.length > 0
              ? ` (${unlinkedCount})`
              : ''}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/network/health">System Health</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/network/analytics">Open Analytics</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <PiArrowsClockwiseBold
              className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {isMockData && (
        <Card className="border border-purple-200/80 bg-purple-50/80 shadow-sm rounded-xl">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-purple-800 text-sm">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="font-medium">
                Displaying mock data — Connect Ruijie API for live data
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {isStale && (
        <Card className="border border-amber-200/80 bg-amber-50/80 shadow-sm rounded-xl">
          <CardContent className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PiWarningBold className="w-5 h-5 text-amber-600" />
                <span className="text-amber-800 text-sm font-medium">
                  Device data may be outdated — last synced{' '}
                  {formatRelativeTime(data?.lastSynced || '')}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                Refresh Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px_280px] gap-4">
        <NetworkOverviewTiles inventory={inventory} />
        <MetricCard
          title="Online Devices"
          value={`${onlineCount}`}
          subtitle={`${onlinePercent}% of visible fleet`}
          delta={`${offlineCount} offline`}
          deltaPositive={offlineCount === 0}
        />
        <MetricCard
          title="Unlinked devices"
          value={`${unlinkedCount}`}
          subtitle={
            linkedFilter === 'unlinked'
              ? 'Filter: unlinked only'
              : 'No customer / site assignment'
          }
          delta={`${withCpu} with CPU · ${totalClients} clients`}
        />
      </div>

      <DeviceFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        groupFilter={groupFilter}
        onGroupChange={setGroupFilter}
        modelFilter={modelFilter}
        onModelChange={setModelFilter}
        linkedFilter={linkedFilter}
        onLinkedChange={setLinkedFilter}
        groups={data?.filters.groups || []}
        models={data?.filters.models || []}
        onExport={handleExportCSV}
      />

      <div className="hidden md:block">
        <DeviceTable
          devices={devices}
          tunnelLimitReached={tunnelCount >= TUNNEL_LIMIT}
          onReboot={setRebootDevice}
          onLinkCustomer={setLinkDevice}
          formatRelativeTime={formatRelativeTime}
        />
      </div>
      <div className="md:hidden space-y-3">
        {devices.map((device) => (
          <DeviceCard
            key={device.sn}
            device={device}
            tunnelLimitReached={tunnelCount >= TUNNEL_LIMIT}
            onReboot={setRebootDevice}
            onLinkCustomer={setLinkDevice}
            formatRelativeTime={formatRelativeTime}
          />
        ))}
        {devices.length === 0 && (
          <Card className="border border-slate-200/80 shadow-sm rounded-xl">
            <CardContent className="py-8 text-center text-slate-400">
              No devices found
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {devices.length} of {data?.total || 0} devices
          {linkedFilter ? ` · customer filter: ${linkedFilter}` : ''}
        </span>
        <span>
          Active tunnels: {tunnelCount}/{TUNNEL_LIMIT}
        </span>
      </div>

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

      <LinkCustomerDialog
        open={!!linkDevice}
        onOpenChange={(open) => {
          if (!open) setLinkDevice(null);
        }}
        sn={linkDevice?.sn || ''}
        deviceName={linkDevice?.device_name}
        onLinked={() => {
          setLinkDevice(null);
          fetchDevices(true);
        }}
      />
    </AdminPage>
  );
}
