'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PiArrowsClockwiseBold,
  PiCaretRightBold,
  PiCheckCircleBold,
  PiCopyBold,
  PiDownloadBold,
  PiEyeBold,
  PiFunnelBold,
  PiLinkBold,
  PiPowerBold,
  PiWarningBold,
  PiWifiHighBold,
  PiWifiSlashBold,
  PiXBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

function getStatusConfig(status: string) {
  switch (status) {
    case 'online':
      return { icon: PiWifiHighBold, color: 'text-green-600', bg: 'bg-green-50', label: 'Online' };
    case 'offline':
      return { icon: PiWifiSlashBold, color: 'text-red-600', bg: 'bg-red-50', label: 'Offline' };
    default:
      return { icon: PiWifiHighBold, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Unknown' };
  }
}

function getConfigStatusBadge(configStatus: string | null) {
  switch (configStatus) {
    case 'Synced':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Synced</Badge>;
    case 'Failed':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
    case 'Pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    default:
      return null;
  }
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
      // Show success feedback
    } catch (err) {
      console.error('Failed to reboot:', err);
    } finally {
      setRebooting(false);
    }
  };

  const handleCopySN = (sn: string) => {
    navigator.clipboard.writeText(sn);
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

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setGroupFilter('');
    setModelFilter('');
  };

  const hasFilters = search || statusFilter || groupFilter || modelFilter;

  // Check if data is stale (> 15 mins)
  const isStale = data?.lastSynced &&
    (Date.now() - new Date(data.lastSynced).getTime()) > 15 * 60 * 1000;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PiArrowsClockwiseBold className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Network Devices</h1>
            <p className="text-gray-500 mt-1">Ruijie Cloud managed devices</p>
          </div>
          <div className="flex items-center gap-3">
            {data?.lastSynced && (
              <span className="text-sm text-gray-500">
                Last synced: {formatRelativeTime(data.lastSynced)}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <PiArrowsClockwiseBold className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
            >
              <PiDownloadBold className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

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

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
                <Input
                  placeholder="Search by SN, name, or IP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-40">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Group</label>
                <Select value={groupFilter || 'all'} onValueChange={(v) => setGroupFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {data?.filters.groups.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Model</label>
                <Select value={modelFilter || 'all'} onValueChange={(v) => setModelFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {data?.filters.models.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <PiXBold className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead>Device Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>SN</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Mgmt IP</TableHead>
                  <TableHead className="text-center">Clients</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.devices.map((device) => {
                  const statusConfig = getStatusConfig(device.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={device.sn}>
                      <TableCell>
                        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${statusConfig.bg}`}>
                          <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                          <span className={`text-sm font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{device.device_name}</span>
                          {device.mock_data && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                              MOCK
                            </Badge>
                          )}
                          {getConfigStatusBadge(device.config_status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{device.model || '-'}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{device.sn}</code>
                      </TableCell>
                      <TableCell className="text-gray-600">{device.group_name || '-'}</TableCell>
                      <TableCell>
                        <code className="text-xs text-gray-600">{device.management_ip || '-'}</code>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{device.online_clients}</span>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatRelativeTime(device.synced_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/admin/network/devices/${device.sn}`}>
                                <Button variant="ghost" size="sm">
                                  <PiEyeBold className="w-4 h-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/admin/network/devices/${device.sn}?action=tunnel`}>
                                <Button variant="ghost" size="sm">
                                  <PiLinkBold className="w-4 h-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Launch eWeb</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRebootDevice(device)}
                                disabled={device.status === 'offline'}
                              >
                                <PiPowerBold className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reboot Device</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopySN(device.sn)}
                              >
                                <PiCopyBold className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy SN</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {data?.devices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No devices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
    </TooltipProvider>
  );
}
