'use client';

import {
  PiWifiHighBold,
  PiUsersBold,
  PiCpuBold,
  PiTimerBold,
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared';

interface Device {
  status: string;
  online_clients: number;
  cpu_usage: number | null;
  memory_usage: number | null;
  uptime_seconds: number | null;
  config_status: string | null;
}

interface DeviceStatCardsProps {
  device: Device;
}

function formatUptime(seconds: number | null): string {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  return `${mins}m`;
}

function getConfigStatusLabel(status: string | null): string {
  if (!status) return 'Unknown';
  return status === 'Synced' ? 'Config Synced' : 'Config ' + status;
}

export function DeviceStatCards({ device }: DeviceStatCardsProps) {
  const isOnline = device.status === 'online';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Status"
        value={isOnline ? 'Online' : 'Offline'}
        subtitle={getConfigStatusLabel(device.config_status)}
        icon={<PiWifiHighBold className="w-5 h-5" />}
        iconBgColor={isOnline ? 'bg-emerald-100' : 'bg-red-100'}
        iconColor={isOnline ? 'text-emerald-600' : 'text-red-600'}
      />
      <StatCard
        label="Connected Clients"
        value={device.online_clients}
        subtitle="Active connections"
        icon={<PiUsersBold className="w-5 h-5" />}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
      />
      <StatCard
        label="Resource Usage"
        value={device.cpu_usage !== null ? `${device.cpu_usage}%` : '-'}
        subtitle={device.memory_usage !== null ? `Memory: ${device.memory_usage}%` : 'Memory: -'}
        icon={<PiCpuBold className="w-5 h-5" />}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
      />
      <StatCard
        label="Uptime"
        value={formatUptime(device.uptime_seconds)}
        subtitle="Since last reboot"
        icon={<PiTimerBold className="w-5 h-5" />}
        iconBgColor="bg-amber-100"
        iconColor="text-amber-600"
      />
    </div>
  );
}
