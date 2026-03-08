'use client';

import {
  PiWifiHighBold,
  PiUsersBold,
  PiGearBold,
  PiLinkBold,
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared';

interface Device {
  sn: string;
  status: string;
  online_clients: number;
  config_status: string | null;
  model: string | null;
  group_name: string | null;
}

interface DeviceStatCardsProps {
  device: Device;
}

function getConfigStatusLabel(status: string | null): string {
  if (!status) return 'Unknown';
  if (status === 'UP_TO_DATE' || status === 'Synced') return 'Config synced';
  return status.replace(/_/g, ' ');
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
        label="Model"
        value={device.model || '-'}
        subtitle="Device type"
        icon={<PiGearBold className="w-5 h-5" />}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
      />
      <StatCard
        label="Network Group"
        value={device.group_name || '-'}
        subtitle="Ruijie Cloud group"
        icon={<PiLinkBold className="w-5 h-5" />}
        iconBgColor="bg-amber-100"
        iconColor="text-amber-600"
      />
    </div>
  );
}
