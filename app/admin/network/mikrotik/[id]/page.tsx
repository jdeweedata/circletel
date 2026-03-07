'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PiArrowLeftBold,
  PiArrowsClockwiseBold,
  PiWarningBold,
  PiDesktopBold,
  PiWifiHighBold,
  PiArrowClockwiseBold,
  PiDownloadBold,
  PiTrashBold,
  PiPencilBold,
  PiCpuBold,
  PiClockBold,
  PiChartLineBold,
} from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { MikrotikRouterWithClinic } from '@/lib/types/mikrotik';

function formatUptime(seconds: number | null): string {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MikrotikRouterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<MikrotikRouterWithClinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WiFi password modal
  const [wifiModalOpen, setWifiModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [updatingWifi, setUpdatingWifi] = useState(false);

  // Backup state
  const [backingUp, setBackingUp] = useState(false);

  // Reboot state
  const [rebooting, setRebooting] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState(false);

  const fetchRouter = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/network/mikrotik/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch router');
      }

      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load router');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRouter();
  }, [fetchRouter]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/admin/network/mikrotik/${id}/sync`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync failed');
      }

      await fetchRouter();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateWifi = async () => {
    if (!newPassword || newPassword.length < 8) return;

    setUpdatingWifi(true);
    try {
      const response = await fetch(`/api/admin/network/mikrotik/${id}/wifi`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vlan_id: 10,
          password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }

      setWifiModalOpen(false);
      setNewPassword('');
    } catch (err) {
      console.error('WiFi update failed:', err);
    } finally {
      setUpdatingWifi(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const response = await fetch(`/api/admin/network/mikrotik/${id}/backup`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Backup failed');
      }

      const result = await response.json();
      if (result.data?.backup_url) {
        window.open(result.data.backup_url, '_blank');
      }
      await fetchRouter();
    } catch (err) {
      console.error('Backup failed:', err);
    } finally {
      setBackingUp(false);
    }
  };

  const handleReboot = async () => {
    setRebooting(true);
    try {
      const response = await fetch(`/api/admin/network/mikrotik/${id}/reboot`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Reboot failed');
      }
    } catch (err) {
      console.error('Reboot failed:', err);
    } finally {
      setRebooting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/network/mikrotik/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      router.push('/admin/network/mikrotik');
    } catch (err) {
      console.error('Delete failed:', err);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 text-center">
          <PiWarningBold className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-800 font-medium">{error || 'Router not found'}</p>
          <Link href="/admin/network/mikrotik">
            <Button className="mt-4">Back to Routers</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/network/mikrotik">
            <Button variant="ghost" size="icon">
              <PiArrowLeftBold className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{data.identity}</h1>
              <Badge
                variant={
                  data.status === 'online'
                    ? 'default'
                    : data.status === 'offline'
                    ? 'destructive'
                    : 'secondary'
                }
                className={data.status === 'online' ? 'bg-green-100 text-green-800' : ''}
              >
                {data.status}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">
              {data.clinic_name || 'No clinic assigned'}
              {data.province && <span className="ml-1">• {data.province}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <PiArrowsClockwiseBold
              className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`}
            />
            Sync
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <PiTrashBold className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Router?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{data.identity}</strong> and all its
                  configuration data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiChartLineBold className="w-5 h-5" />
                Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <PiCpuBold className="w-4 h-4" />
                    CPU Usage
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      (data.cpu_usage ?? 0) > 80
                        ? 'text-red-600'
                        : (data.cpu_usage ?? 0) > 50
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  >
                    {data.cpu_usage ?? '-'}%
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <PiChartLineBold className="w-4 h-4" />
                    Memory Usage
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      (data.memory_usage ?? 0) > 80
                        ? 'text-red-600'
                        : (data.memory_usage ?? 0) > 50
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  >
                    {data.memory_usage ?? '-'}%
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <PiClockBold className="w-4 h-4" />
                    Uptime
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatUptime(data.uptime_seconds)}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <PiDesktopBold className="w-4 h-4" />
                    Firmware
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {data.firmware_version || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiDesktopBold className="w-5 h-5" />
                Connection Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Management IP</dt>
                  <dd className="font-mono text-gray-900">{data.management_ip}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">MAC Address</dt>
                  <dd className="font-mono text-gray-900">{data.mac_address}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">PPPoE Username</dt>
                  <dd className="font-mono text-gray-900">{data.pppoe_username}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Model</dt>
                  <dd className="text-gray-900">{data.model || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Serial Number</dt>
                  <dd className="font-mono text-gray-900">{data.serial_number || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Last Seen</dt>
                  <dd className="text-gray-900">{formatDate(data.last_seen_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* WiFi Configuration */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PiWifiHighBold className="w-5 h-5" />
                WiFi Configuration
              </CardTitle>
              <Dialog open={wifiModalOpen} onOpenChange={setWifiModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <PiPencilBold className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update WiFi Password</DialogTitle>
                    <DialogDescription>
                      This will change the password for the Staff WiFi network (VLAN 10).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Current SSID</Label>
                      <p className="text-sm text-gray-600">
                        {data.wifi_ssid_staff || 'Unjani Clinic Staff'}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setWifiModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateWifi}
                      disabled={updatingWifi || newPassword.length < 8}
                    >
                      {updatingWifi ? 'Updating...' : 'Update Password'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Staff Network (VLAN 10)</dt>
                  <dd className="text-gray-900">{data.wifi_ssid_staff || 'Unjani Clinic Staff'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Hotspot Network (VLAN 20)</dt>
                  <dd className="text-gray-900">{data.wifi_ssid_hotspot || 'Guest Hotspot'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleBackup}
                disabled={backingUp}
              >
                <PiDownloadBold className="w-4 h-4 mr-2" />
                {backingUp ? 'Creating Backup...' : 'Backup Config'}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-orange-600 hover:text-orange-700"
                  >
                    <PiArrowClockwiseBold className="w-4 h-4 mr-2" />
                    Reboot Router
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reboot Router?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reboot <strong>{data.identity}</strong>. The router will be
                      offline for approximately 2-3 minutes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReboot}
                      disabled={rebooting}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {rebooting ? 'Rebooting...' : 'Reboot'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Backup Info */}
          {data.config_backup_url && (
            <Card>
              <CardHeader>
                <CardTitle>Last Backup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  {formatDate(data.config_backup_at)}
                </p>
                <a
                  href={data.config_backup_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-circleTel-orange hover:underline"
                >
                  Download backup file
                </a>
              </CardContent>
            </Card>
          )}

          {/* Clinic Link */}
          {data.clinic && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Clinic</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{data.clinic.clinic_name}</p>
                <p className="text-sm text-gray-600">{data.clinic.address}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {data.clinic.region}, {data.clinic.province}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {data.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-1">
              <p>Created: {formatDate(data.created_at)}</p>
              <p>Updated: {formatDate(data.updated_at)}</p>
              <p>Synced: {formatDate(data.synced_at)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
