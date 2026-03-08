'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PiArrowsClockwiseBold,
  PiWarningCircleBold,
  PiArrowLeftBold,
  PiWifiHighBold,
  PiRadioBold,
  PiLinkBold,
  PiClockBold,
  PiClockCountdownBold,
  PiCheckCircleBold,
  PiXCircleBold,
  PiInfoBold,
  PiGearBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { UnderlineTabs, TabPanel, SectionCard } from '@/components/admin/shared';
import { DeviceHeader, DeviceStatCards } from '@/components/admin/network/detail';

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

const TAB_CONFIG = [
  { id: 'overview', label: 'Overview' },
  { id: 'radio', label: 'Radio' },
  { id: 'tunnel', label: 'Tunnel' },
  { id: 'history', label: 'History' },
] as const;

type TabId = typeof TAB_CONFIG[number]['id'];

function formatTimeRemaining(expiresAt: string): string {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return 'Expired';
  const hours = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  return `${hours}h ${mins}m`;
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

export default function RuijieDeviceDetailPage({
  params,
}: {
  params: Promise<{ sn: string }>;
}) {
  const { sn } = use(params);
  const searchParams = useSearchParams();
  const autoLaunchTunnel = searchParams.get('action') === 'tunnel';

  const [device, setDevice] = useState<RuijieDevice | null>(null);
  const [tunnels, setTunnels] = useState<RuijieTunnel[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

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
      const response = await fetch(`/api/ruijie/devices/${sn}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch device');
      const data = await response.json();
      setDevice(data.device);
      setTunnels(data.tunnels || []);
      setError(null);
      return data.device;
    } catch (err) {
      setError('Failed to load device');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sn]);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`/api/ruijie/devices/${sn}/metrics`, {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.metrics) {
        setDevice(prev => prev ? { ...prev, ...data.metrics } : prev);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  }, [sn]);

  const fetchAuditLog = useCallback(async () => {
    try {
      const response = await fetch(`/api/ruijie/audit/${sn}`, {
        credentials: 'include',
      });
      if (!response.ok) return;
      const data = await response.json();
      setAuditLog(data.actions || []);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    }
  }, [sn]);

  useEffect(() => {
    const loadData = async () => {
      const deviceData = await fetchDevice();
      // Fetch live metrics if device is online
      if (deviceData?.status === 'online') {
        fetchMetrics();
      }
      fetchAuditLog();
    };
    loadData();
  }, [fetchDevice, fetchMetrics, fetchAuditLog]);

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
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [tunnels]);

  // Auto-launch tunnel if action=tunnel
  useEffect(() => {
    if (autoLaunchTunnel && device && tunnels.length === 0 && !tunnelLoading) {
      handleLaunchTunnel();
    }
  }, [autoLaunchTunnel, device, tunnels.length, tunnelLoading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const deviceData = await fetchDevice();
    if (deviceData?.status === 'online') {
      await fetchMetrics();
    }
    await fetchAuditLog();
  };

  const handleLaunchTunnel = async () => {
    setTunnelLoading(true);
    setTunnelError(null);

    try {
      const response = await fetch('/api/ruijie/tunnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sn, tunnelType: 'eweb' }),
        credentials: 'include',
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

      if (data.tunnel.openDomainUrl) {
        window.open(data.tunnel.openDomainUrl, '_blank');
      }

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
      await fetch(`/api/ruijie/tunnel/${sn}`, { method: 'DELETE', credentials: 'include' });
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
      await fetch(`/api/ruijie/reboot/${sn}`, { method: 'POST', credentials: 'include' });
      setRebootDialogOpen(false);
      fetchAuditLog();
    } catch (err) {
      console.error('Failed to reboot:', err);
    } finally {
      setRebooting(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <PiWifiHighBold className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-slate-500 mt-6 font-medium">Loading device details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !device) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <PiWarningCircleBold className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Device Not Found</h2>
            <p className="text-slate-500 mb-6">{error || 'The device you are looking for does not exist.'}</p>
            <Link href="/admin/network/devices">
              <Button className="bg-primary hover:bg-primary/90">
                <PiArrowLeftBold className="h-4 w-4 mr-2" />
                Back to Devices
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOnline = device.status === 'online';
  const hasActiveTunnel = tunnels.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Header */}
      <DeviceHeader
        device={device}
        isOnline={isOnline}
        hasActiveTunnel={hasActiveTunnel}
        tunnelLoading={tunnelLoading}
        onReboot={() => setRebootDialogOpen(true)}
        onLaunchTunnel={handleLaunchTunnel}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stat Cards */}
        <DeviceStatCards device={device} />

        {/* Tabs */}
        <UnderlineTabs
          tabs={TAB_CONFIG}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />

        {/* OVERVIEW TAB */}
        <TabPanel id="overview" activeTab={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Information */}
            <SectionCard icon={PiInfoBold} title="Device Information" compact>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Serial Number</p>
                  <p className="font-mono text-sm">{device.sn}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Model</p>
                  <p className="text-sm font-medium">{device.model || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Group</p>
                  <p className="text-sm font-medium">{device.group_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Firmware</p>
                  <p className="text-sm font-medium">{device.firmware_version || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">MAC Address</p>
                  <p className="font-mono text-sm">{device.mac_address || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Config Status</p>
                  {device.config_status === 'Synced' ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-0">
                      <PiCheckCircleBold className="w-3 h-3 mr-1" /> Synced
                    </Badge>
                  ) : device.config_status === 'Failed' ? (
                    <Badge className="bg-red-50 text-red-700 border-0">
                      <PiXCircleBold className="w-3 h-3 mr-1" /> Failed
                    </Badge>
                  ) : (
                    <span className="text-sm">-</span>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Network Information */}
            <SectionCard icon={PiGearBold} title="Network Configuration" compact>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Management IP</p>
                  <p className="font-mono text-sm bg-slate-100 px-2 py-1 rounded inline-block">
                    {device.management_ip || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">WAN IP</p>
                  <p className="font-mono text-sm bg-slate-100 px-2 py-1 rounded inline-block">
                    {device.wan_ip || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Egress IP</p>
                  <p className="font-mono text-sm bg-slate-100 px-2 py-1 rounded inline-block">
                    {device.egress_ip || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Synced</p>
                  <p className="text-sm text-slate-600">{formatRelativeTime(device.synced_at)}</p>
                </div>
              </div>
            </SectionCard>
          </div>
        </TabPanel>

        {/* RADIO TAB */}
        <TabPanel id="radio" activeTab={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 2.4 GHz Radio */}
            <SectionCard icon={PiRadioBold} title="2.4 GHz Radio" compact>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Channel</span>
                  <span className="font-bold text-lg">{device.radio_2g_channel || '-'}</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Channel Utilization</span>
                    <span className="font-medium">{device.radio_2g_utilization ?? '-'}%</span>
                  </div>
                  <Progress value={device.radio_2g_utilization || 0} className="h-3" />
                </div>
              </div>
            </SectionCard>

            {/* 5 GHz Radio */}
            <SectionCard icon={PiRadioBold} title="5 GHz Radio" compact>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Channel</span>
                  <span className="font-bold text-lg">{device.radio_5g_channel || '-'}</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Channel Utilization</span>
                    <span className="font-medium">{device.radio_5g_utilization ?? '-'}%</span>
                  </div>
                  <Progress value={device.radio_5g_utilization || 0} className="h-3" />
                </div>
              </div>
            </SectionCard>
          </div>
        </TabPanel>

        {/* TUNNEL TAB */}
        <TabPanel id="tunnel" activeTab={activeTab} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* eWeb Tunnel */}
            <SectionCard
              icon={PiLinkBold}
              title="eWeb Tunnel"
              action={
                hasActiveTunnel ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-0">
                    <PiClockCountdownBold className="w-3 h-3 mr-1" />
                    {timeRemaining}
                  </Badge>
                ) : null
              }
              compact
            >
              {tunnelError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {tunnelError}
                </div>
              )}

              {hasActiveTunnel ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <PiCheckCircleBold className="w-5 h-5" />
                      <span className="font-medium">Tunnel session is active</span>
                    </div>
                    <p className="text-sm text-emerald-600 mt-1">
                      Expires in {timeRemaining}. The tunnel will auto-close after 3 hours.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => window.open(tunnels[0].open_domain_url || '', '_blank')}
                    >
                      <PiLinkBold className="w-4 h-4 mr-2" />
                      Open eWeb Interface
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
                  <p className="text-sm text-slate-500">
                    Launch an eWeb session to access the device&apos;s management interface remotely.
                    Tunnels auto-expire after 3 hours.
                  </p>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Tunnel Slots
                    </p>
                    <div className="flex items-center gap-2">
                      <Progress value={(activeTunnelCount / TUNNEL_LIMIT) * 100} className="h-2 flex-1" />
                      <span className="text-sm font-medium text-slate-600">
                        {activeTunnelCount}/{TUNNEL_LIMIT}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={handleLaunchTunnel}
                    disabled={tunnelLoading || !isOnline}
                  >
                    {tunnelLoading ? (
                      <PiArrowsClockwiseBold className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <PiLinkBold className="w-4 h-4 mr-2" />
                    )}
                    Launch eWeb Tunnel
                  </Button>
                </div>
              )}
            </SectionCard>

            {/* Tunnel Info */}
            <SectionCard icon={PiClockBold} title="Tunnel Information" compact>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Max Duration</p>
                    <p className="text-sm font-medium">3 hours</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tenant Limit</p>
                    <p className="text-sm font-medium">10 concurrent</p>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  Tunnels provide secure remote access to the device web interface via Ruijie Cloud.
                </div>
              </div>
            </SectionCard>
          </div>
        </TabPanel>

        {/* HISTORY TAB */}
        <TabPanel id="history" activeTab={activeTab} className="mt-6">
          <SectionCard icon={PiClockBold} title="Recent Actions" compact>
            {auditLog.length === 0 ? (
              <div className="text-center py-8">
                <PiClockBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No actions recorded for this device</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        entry.status === 'success' ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        {entry.status === 'success' ? (
                          <PiCheckCircleBold className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <PiXCircleBold className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 capitalize">
                          {entry.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-slate-500">by {entry.adminName}</p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-400">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabPanel>
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
