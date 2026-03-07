'use client';

import {
  PiCheckCircleBold,
  PiLinkBold,
  PiWifiHighBold,
  PiWifiSlashBold,
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared';
import { cn } from '@/lib/utils';

interface DeviceStatCardsProps {
  total: number;
  online: number;
  offline: number;
  activeTunnels: number;
  tunnelLimit: number;
  activeFilter: string;
  onFilterChange: (status: string) => void;
}

export function DeviceStatCards({
  total,
  online,
  offline,
  activeTunnels,
  tunnelLimit,
  activeFilter,
  onFilterChange,
}: DeviceStatCardsProps) {
  const onlinePercent = total > 0 ? Math.round((online / total) * 100) : 0;
  const tunnelWarning = activeTunnels >= 8;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Total Devices"
        value={total}
        icon={<PiWifiHighBold className="h-5 w-5" />}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
      />
      <StatCard
        label="Online"
        value={`${online} (${onlinePercent}%)`}
        icon={<PiCheckCircleBold className="h-5 w-5" />}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
        onClick={() => onFilterChange(activeFilter === 'online' ? '' : 'online')}
        isActive={activeFilter === 'online'}
      />
      <StatCard
        label="Offline"
        value={offline}
        icon={<PiWifiSlashBold className="h-5 w-5" />}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
        onClick={() => onFilterChange(activeFilter === 'offline' ? '' : 'offline')}
        isActive={activeFilter === 'offline'}
        className={cn(offline > 0 && 'ring-1 ring-red-200')}
      />
      <div className="relative">
        <StatCard
          label="Active Tunnels"
          value={`${activeTunnels}/${tunnelLimit}`}
          icon={<PiLinkBold className="h-5 w-5" />}
          iconBgColor={tunnelWarning ? 'bg-orange-100' : 'bg-gray-100'}
          iconColor={tunnelWarning ? 'text-orange-600' : 'text-gray-600'}
        />
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-lg overflow-hidden">
          <div
            className={cn(
              'h-full transition-all',
              tunnelWarning ? 'bg-orange-500' : 'bg-circleTel-orange'
            )}
            style={{ width: `${(activeTunnels / tunnelLimit) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
