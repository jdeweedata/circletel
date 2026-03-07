'use client';

import { PiWifiHighBold, PiWifiSlashBold } from 'react-icons/pi';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DeviceActionsMenu } from './DeviceActionsMenu';

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

interface DeviceCardProps {
  device: RuijieDevice;
  tunnelLimitReached: boolean;
  onReboot: (device: RuijieDevice) => void;
  formatRelativeTime: (date: string) => string;
}

export function DeviceCard({
  device,
  tunnelLimitReached,
  onReboot,
  formatRelativeTime,
}: DeviceCardProps) {
  const isOnline = device.status === 'online';
  const StatusIcon = isOnline ? PiWifiHighBold : PiWifiSlashBold;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border bg-white',
        !isOnline && 'bg-red-50/50 border-red-200'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon
            className={cn(
              'h-5 w-5 flex-shrink-0',
              isOnline ? 'text-green-600' : 'text-red-600'
            )}
          />
          <span className="font-medium truncate">{device.device_name}</span>
          {device.mock_data && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200 flex-shrink-0">
              MOCK
            </Badge>
          )}
        </div>
        <DeviceActionsMenu
          sn={device.sn}
          deviceName={device.device_name}
          isOnline={isOnline}
          tunnelLimitReached={tunnelLimitReached}
          onReboot={() => onReboot(device)}
        />
      </div>
      <div className="mt-2 text-sm text-gray-600">
        {device.model || 'Unknown'} • {device.group_name || 'No group'}
      </div>
      <div className="mt-1 text-sm text-gray-500">
        {device.online_clients} clients • Synced {formatRelativeTime(device.synced_at)}
      </div>
    </div>
  );
}
