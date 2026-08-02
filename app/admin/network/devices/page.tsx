'use client';

/**
 * Network Devices list — Ruijie fleet ops + Omada gateways/switches.
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
import { PiArrowsClockwiseBold, PiWarningBold, PiWarningCircleBold, PiXBold } from 'react-icons/pi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DeviceFilters,
  DeviceTable,
  DeviceCard,
  LinkCustomerDialog,
  DeviceFleetStatCards,
  DeviceStatusBadge,
  classifyRuijieStatus,
  classifyOmadaStatus,
  type RuijieListDevice,
  type DeviceFleetStats,
} from '@/components/admin/network';
import {
  NetworkOverviewTiles,
  type NetworkInventory,
} from '@/components/admin/network/performance';
import { computeNetworkInventory } from '@/lib/network/performance-aggregates';
import {
  DEVICE_TYPE_LABELS,
  type NetworkDevice,
} from '@/lib/network/types';

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

interface OmadaDevicesResponse {
  success?: boolean;
  devices: NetworkDevice[];
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
  const [omadaDevices, setOmadaDevices] = useState<NetworkDevice[]>([]);
  const [omadaError, setOmadaError] = useState<string | null>(null);
  const [omadaLoading, setOmadaLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(true);

  const [tunnelCount] = useState(0);
  const TUNNEL_LIMIT = 10;

  const fetchOmadaDevices = useCallback(async () => {
    setOmadaLoading(true);
    try {
      const response = await fetch('/api/admin/network/devices?type=omada', {
        credentials: 'include',
      });
      if (!response.ok) {
        setOmadaError(`Omada devices unavailable (${response.status})`);
        setOmadaDevices([]);
        return;
      }
      const result = (await response.json()) as OmadaDevicesResponse;
      setOmadaDevices(result.devices || []);
      setOmadaError(null);
    } catch (err) {
      console.error('Failed to load Omada devices:', err);
      setOmadaError('Failed to load Omada devices');
      setOmadaDevices([]);
    } finally {
      setOmadaLoading(false);
    }
  }, []);

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
    fetchOmadaDevices();
    const interval = setInterval(() => {
      fetchDevices();
      fetchOmadaDevices();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices, fetchOmadaDevices]);

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
      await Promise.all([fetchDevices(true), fetchOmadaDevices()]);
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
    const omadaGateways = omadaDevices.filter((d) => d.device_type === 'omada_gateway').length;
    const omadaSwitches = omadaDevices.filter((d) => d.device_type === 'omada_switch');
    const omadaSwitchOnline = omadaSwitches.filter(
      (d) => d.status === 'active' || d.status === 'deployed'
    ).length;
    return {
      gateway: computed.gateway + omadaGateways,
      ap: computed.ap,
      switch: {
        online: computed.switchOnline + omadaSwitchOnline,
        total: computed.switchTotal + omadaSwitches.length,
      },
      client: computed.client,
      guest: computed.guest,
    };
  }, [data?.devices, omadaDevices]);

  const fleetStats: DeviceFleetStats = useMemo(() => {
    const ruijie = data?.devices || [];
    let online = 0;
    let warning = 0;
    let offline = 0;

    for (const d of ruijie) {
      const s = classifyRuijieStatus(d);
      if (s === 'online') online += 1;
      else if (s === 'warning') warning += 1;
      else offline += 1;
    }
    for (const d of omadaDevices) {
      const s = classifyOmadaStatus(d.status);
      if (s === 'online') online += 1;
      else if (s === 'warning') warning += 1;
      else offline += 1;
    }

    return {
      total: ruijie.length + omadaDevices.length,
      online,
      warning,
      offline,
    };
  }, [data?.devices, omadaDevices]);

  if (loading) {
    return (
      <AdminPage>
        <LoadingState message="Loading devices..." />
      </AdminPage>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <PiWarningCircleBold className="h-12 w-12 text-red-500" />
        <p className="text-slate-600">{error}</p>
        <Button onClick={() => fetchDevices()}>Retry</Button>
      </div>
    );
  }

  const devices = data?.devices || [];
  const unlinkedCount = devices.filter(
    (d) => !d.customer_order_id && !d.corporate_site_id
  ).length;
  const isMockData = devices.length > 0 && devices.every((d) => d.mock_data);
  const omadaOnline = omadaDevices.filter(
    (d) => classifyOmadaStatus(d.status) === 'online'
  ).length;
  const omadaWarning = omadaDevices.filter(
    (d) => classifyOmadaStatus(d.status) === 'warning'
  ).length;

  return (
    <AdminPage>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-xs text-slate-400">Activity / Infrastructure / Devices</p>
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
              className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {isMockData && (
        <div className="flex items-center gap-3 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-700">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
          <span className="flex-1 font-medium">
            Displaying mock data — Connect Ruijie API for live data
          </span>
        </div>
      )}

      {isStale && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <PiWarningBold className="h-5 w-5 text-amber-600" />
            <span className="font-medium">
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
      )}

      {showAlert && !isStale && !isMockData && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
          <span className="flex-1">
            No critical alerts for this collection
            {data?.lastSynced
              ? ` — last updated ${formatRelativeTime(data.lastSynced)}`
              : ''}
          </span>
          <button
            type="button"
            onClick={() => setShowAlert(false)}
            className="text-xs font-medium text-blue-500 transition-colors hover:text-blue-700"
            aria-label="Dismiss alert"
          >
            <PiXBold className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Keep Omada-style Network Overview sprites */}
      <NetworkOverviewTiles inventory={inventory} />

      <DeviceFleetStatCards stats={fleetStats} />

      {/* Device Gateways & Outlines — Omada CPE */}
      <Card className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-gray-50 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-900">
              Device Gateways & Outlines
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-gray-400">
              {omadaLoading
                ? 'Loading Omada CPE…'
                : `${omadaDevices.length} gateways/switches · ${omadaOnline} online · ${omadaWarning} warning`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOmadaDevices()}
              disabled={omadaLoading}
            >
              <PiArrowsClockwiseBold
                className={`mr-2 h-4 w-4 ${omadaLoading ? 'animate-spin' : ''}`}
              />
              Reload Devices
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/network/hardware?source=omada">Show in Inventory</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {omadaError ? (
            <p className="px-5 py-4 text-sm text-red-600">{omadaError}</p>
          ) : omadaLoading && omadaDevices.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">Loading Omada devices…</p>
          ) : omadaDevices.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">
              No Omada gateways or switches found in inventory.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-0 bg-gray-50/60 hover:bg-gray-50/60">
                    <TableHead className="px-5 text-xs font-medium uppercase tracking-wider text-gray-400">
                      Device
                    </TableHead>
                    <TableHead className="px-5 text-xs font-medium uppercase tracking-wider text-gray-400">
                      Type
                    </TableHead>
                    <TableHead className="px-5 text-xs font-medium uppercase tracking-wider text-gray-400">
                      Unit
                    </TableHead>
                    <TableHead className="px-5 text-xs font-medium uppercase tracking-wider text-gray-400">
                      Domain
                    </TableHead>
                    <TableHead className="px-5 text-xs font-medium uppercase tracking-wider text-gray-400">
                      Server
                    </TableHead>
                    <TableHead className="px-5 text-xs font-medium uppercase tracking-wider text-gray-400">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {omadaDevices.map((device) => {
                    const fleetStatus = classifyOmadaStatus(device.status);
                    const serverParts = [
                      device.site_name,
                      device.pppoe_username || device.ip_address,
                    ].filter(Boolean);
                    return (
                      <TableRow
                        key={device.id}
                        className="border-t border-gray-50 transition-colors hover:bg-blue-50/40"
                      >
                        <TableCell className="px-5 font-mono text-xs font-medium text-gray-800">
                          {device.device_name}
                          <p className="mt-0.5 font-mono text-[11px] font-normal text-gray-400">
                            {device.serial_number}
                          </p>
                        </TableCell>
                        <TableCell className="px-5 text-xs text-gray-600">
                          {DEVICE_TYPE_LABELS[device.device_type] || device.device_type}
                        </TableCell>
                        <TableCell className="px-5 text-xs text-gray-500">
                          {device.model || '—'}
                        </TableCell>
                        <TableCell className="px-5 font-mono text-xs text-gray-500">
                          {device.customer_name || '—'}
                        </TableCell>
                        <TableCell className="px-5 font-mono text-xs text-gray-500">
                          {serverParts.length > 0 ? serverParts.join(' / ') : '—'}
                        </TableCell>
                        <TableCell className="px-5">
                          <DeviceStatusBadge status={fleetStatus} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
      <div className="space-y-3 md:hidden">
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
          <Card className="rounded-xl border border-slate-200/80 shadow-sm">
            <CardContent className="py-8 text-center text-slate-400">
              No devices found
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {devices.length} of {data?.total || 0} Ruijie devices
          {linkedFilter ? ` · customer filter: ${linkedFilter}` : ''}
          {omadaDevices.length > 0 ? ` · ${omadaDevices.length} Omada CPE` : ''}
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
