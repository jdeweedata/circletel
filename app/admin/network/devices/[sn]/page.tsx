'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PiArrowLeftBold,
  PiArrowsClockwiseBold,
  PiCheckCircleBold,
  PiClockBold,
  PiCpuBold,
  PiLinkBold,
  PiMemoryBold,
  PiPowerBold,
  PiRadioBold,
  PiTimerBold,
  PiUsersBold,
  PiWarningBold,
  PiWifiHighBold,
  PiWifiSlashBold,
  PiXCircleBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

interface RuijieDevice {
  sn: string;
  device_name: string;
  model: string | null;
  group_name: string | null;
  management_ip: string | null;
  wan_ip: string | null;
  egress_ip: string | null;
  online_clients: number;
  status: string;
  config_status: string | null;
  firmware_version: string | null;
  mac_address: string | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  uptime_seconds: number | null;
  radio_2g_channel: number | null;
  radio_5g_channel: number | null;
  radio_2g_utilization: number | null;
  radio_5g_utilization: number | null;
  synced_at: string;
  mock_data: boolean;
}

interface RuijieTunnel {
  id: string;
  device_sn: string;
  tunnel_type: string;
  open_domain_url: string | null;
  open_ip_url: string | null;
  expires_at: string;
}

interface AuditEntry {
  id: string;
  adminName: string;
  action: string;
  status: string;
  createdAt: string;
}

function formatUptime(seconds: number | null): string {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatTimeRemaining(expiresAt: string): string {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return 'Expired';
  const hours = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

function MetricGauge({ label, value, max = 100, unit = '%', color = 'bg-circleTel-orange' }: {
  label: string;
  value: number | null;
  max?: number;
  unit?: string;
  color?: string;
}) {
  const percentage = value ? Math.min((value / max) * 100, 100) : 0;
  const isHigh = percentage > 80;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium ${isHigh ? 'text-red-600' : 'text-gray-900'}`}>
          {value ?? '-'}{value !== null && unit}
        </span>
      </div>
      <Progress value={percentage} className={`h-2 ${isHigh ? '[&>div]:bg-red-500' : `[&>div]:${color}`}`} />
    </div>
  );
}

export default function RuijieDeviceDetailPage({
  params,
}: {
  params: Promise<{ sn: string }>;
}) {
  const { sn } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoLaunchTunnel = searchParams.get('action') === 'tunnel';

  const [device, setDevice] = useState<RuijieDevice | null>(null);
  const [tunnels, setTunnels] = useState<RuijieTunnel[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tunnel state
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const [tunnelError, setTunnelError] = useState<string | null>(null);
  const [activeTunnelCount, setActiveTunnelCount] = useState(0);
  const TUNNEL_LIMIT = 10;

  // Reboot state
  const [rebootDialogOpen, setRebootDialogOpen] = useState(false);
  const [rebooting, setRebooting] = useState(false);

  // Countdown timer
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  const fetchDevice = useCallback(async () => {
    try {
      const response = await fetch(`/api/ruijie/devices/${sn}`);
      if (!response.ok) throw new Error('Failed to fetch device');
      const data = await response.json();
      setDevice(data.device);
      setTunnels(data.tunnels || []);
      setError(null);
    } catch (err) {
      setError('Failed to load device');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sn]);

  const fetchAuditLog = useCallback(async () => {
    try {
      const response = await fetch(`/api/ruijie/audit/${sn}`);
      if (!response.ok) return;
      const data = await response.json();
      setAuditLog(data.actions || []);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    }
  }, [sn]);

  useEffect(() => {
    fetchDevice();
    fetchAuditLog();
  }, [fetchDevice, fetchAuditLog]);

  // Update countdown timer
  useEffect(() => {
    if (tunnels.length === 0) {
      setTimeRemaining(null);
      return;
    }

    const activeTunnel = tunnels[0];
    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(activeTunnel.expires_at));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [tunnels]);

  // Auto-launch tunnel if action=tunnel
  useEffect(() => {
    if (autoLaunchTunnel && device && tunnels.length === 0 && !tunnelLoading) {
      handleLaunchTunnel();
    }
  }, [autoLaunchTunnel, device, tunnels.length, tunnelLoading]);

  const handleLaunchTunnel = async () => {
    setTunnelLoading(true);
    setTunnelError(null);

    try {
      const response = await fetch('/api/ruijie/tunnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sn, tunnelType: 'eweb' }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setTunnelError(`Tunnel limit reached (${data.active}/${data.max}). Close an existing session.`);
        } else {
          setTunnelError(data.error || 'Failed to create tunnel');
        }
        return;
      }

      setActiveTunnelCount(data.active);

      // Open tunnel in new tab
      if (data.tunnel.openDomainUrl) {
        window.open(data.tunnel.openDomainUrl, '_blank');
      }

      // Refresh to show active tunnel
      fetchDevice();
      fetchAuditLog();

    } catch (err) {
      setTunnelError('Failed to create tunnel');
      console.error(err);
    } finally {
      setTunnelLoading(false);
    }
  };

  const handleCloseTunnel = async () => {
    setTunnelLoading(true);
    try {
      await fetch(`/api/ruijie/tunnel/${sn}`, { method: 'DELETE' });
      setTunnels([]);
      fetchAuditLog();
    } catch (err) {
      console.error('Failed to close tunnel:', err);
    } finally {
      setTunnelLoading(false);
    }
  };

  const handleReboot = async () => {
    setRebooting(true);
    try {
      await fetch(`/api/ruijie/reboot/${sn}`, { method: 'POST' });
      setRebootDialogOpen(false);
      fetchAuditLog();
    } catch (err) {
      console.error('Failed to reboot:', err);
    } finally {
      setRebooting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PiArrowsClockwiseBold className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <PiWarningBold className="w-12 h-12 text-red-500" />
        <p className="text-gray-600">{error || 'Device not found'}</p>
        <Link href="/admin/network/devices">
          <Button variant="outline">Back to Devices</Button>
        </Link>
      </div>
    );
  }

  const isOnline = device.status === 'online';
  const hasActiveTunnel = tunnels.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/network/devices">
            <Button variant="ghost" size="sm">
              <PiArrowLeftBold className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{device.device_name}</h1>
              {device.mock_data && (
                <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                  MOCK
                </Badge>
              )}
              <Badge
                variant="outline"
                className={isOnline
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
                }
              >
                {isOnline ? <PiWifiHighBold className="w-3 h-3 mr-1" /> : <PiWifiSlashBold className="w-3 h-3 mr-1" />}
                {device.status}
              </Badge>
            </div>
            <p className="text-gray-500">{device.model} | {device.sn}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setRebootDialogOpen(true)}
            disabled={!isOnline}
          >
            <PiPowerBold className="w-4 h-4 mr-2" />
            Reboot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Device Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Group</label>
                <p className="font-medium">{device.group_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Firmware</label>
                <p className="font-medium">{device.firmware_version || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Management IP</label>
                <p className="font-mono text-sm">{device.management_ip || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">WAN IP</label>
                <p className="font-mono text-sm">{device.wan_ip || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Egress IP</label>
                <p className="font-mono text-sm">{device.egress_ip || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">MAC Address</label>
                <p className="font-mono text-sm">{device.mac_address || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Uptime</label>
                <p className="font-medium flex items-center gap-1">
                  <PiTimerBold className="w-4 h-4 text-gray-400" />
                  {formatUptime(device.uptime_seconds)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Config Status</label>
                <p>
                  {device.config_status === 'Synced' && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <PiCheckCircleBold className="w-3 h-3 mr-1" /> Synced
                    </Badge>
                  )}
                  {device.config_status === 'Failed' && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <PiXCircleBold className="w-3 h-3 mr-1" /> Failed
                    </Badge>
                  )}
                  {!device.config_status && '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PiCpuBold className="w-5 h-5" />
              Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricGauge label="CPU Usage" value={device.cpu_usage} />
            <MetricGauge label="Memory Usage" value={device.memory_usage} />
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 mb-3">
                <PiUsersBold className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Online Clients</span>
                <span className="ml-auto font-bold text-lg">{device.online_clients}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radio Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PiRadioBold className="w-5 h-5" />
              Radio Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">2.4 GHz (Ch {device.radio_2g_channel || '-'})</span>
                  <span className="font-medium">{device.radio_2g_utilization ?? '-'}%</span>
                </div>
                <Progress value={device.radio_2g_utilization || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">5 GHz (Ch {device.radio_5g_channel || '-'})</span>
                  <span className="font-medium">{device.radio_5g_utilization ?? '-'}%</span>
                </div>
                <Progress value={device.radio_5g_utilization || 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* eWeb Tunnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PiLinkBold className="w-5 h-5" />
              eWeb Tunnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tunnelError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {tunnelError}
              </div>
            )}

            {hasActiveTunnel ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Session Active</span>
                    <Badge variant="outline" className="bg-white text-green-700">
                      <PiClockBold className="w-3 h-3 mr-1" />
                      {timeRemaining}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(tunnels[0].open_domain_url || '', '_blank')}
                  >
                    <PiLinkBold className="w-4 h-4 mr-2" />
                    Open eWeb
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCloseTunnel}
                    disabled={tunnelLoading}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Launch an eWeb session to access the device management interface.
                </p>
                <Button
                  className="w-full bg-circleTel-orange hover:bg-orange-600"
                  onClick={handleLaunchTunnel}
                  disabled={tunnelLoading || !isOnline}
                >
                  {tunnelLoading ? (
                    <PiArrowsClockwiseBold className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <PiLinkBold className="w-4 h-4 mr-2" />
                  )}
                  Launch eWeb
                  {activeTunnelCount > 0 && ` (${activeTunnelCount}/${TUNNEL_LIMIT} slots)`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLog.length === 0 ? (
              <p className="text-sm text-gray-500">No actions recorded</p>
            ) : (
              <div className="space-y-3">
                {auditLog.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between text-sm">
                    <div>
                      <span className="font-medium capitalize">{entry.action.replace('_', ' ')}</span>
                      <span className="text-gray-500"> by {entry.adminName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.status === 'success' ? (
                        <PiCheckCircleBold className="w-4 h-4 text-green-500" />
                      ) : (
                        <PiXCircleBold className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-gray-400 text-xs">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reboot Confirmation Dialog */}
      <AlertDialog open={rebootDialogOpen} onOpenChange={setRebootDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reboot Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reboot <strong>{device.device_name}</strong> ({device.sn}).
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
