'use client';

import Link from 'next/link';
import { PiWifiHighBold, PiWifiSlashBold, PiUserPlusBold } from 'react-icons/pi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DeviceActionsMenu } from './DeviceActionsMenu';
import type { RuijieListDevice } from './DeviceTable';

function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value)}%`;
}

interface DeviceCardProps {
  device: RuijieListDevice;
  tunnelLimitReached: boolean;
  onReboot: (device: RuijieListDevice) => void;
  onLinkCustomer?: (device: RuijieListDevice) => void;
  formatRelativeTime: (date: string) => string;
}

export function DeviceCard({
  device,
  tunnelLimitReached,
  onReboot,
  onLinkCustomer,
  formatRelativeTime,
}: DeviceCardProps) {
  const isOnline = device.status === 'online';
  const StatusIcon = isOnline ? PiWifiHighBold : PiWifiSlashBold;
  const unlinked = !device.customer_order_id && !device.corporate_site_id;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-slate-200/80 bg-white shadow-sm',
        !isOnline && 'bg-red-50/40 border-red-200'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/network/devices/${device.sn}`}
          className="flex items-center gap-2 min-w-0 hover:text-blue-600"
        >
          <StatusIcon
            className={cn(
              'h-5 w-5 flex-shrink-0',
              isOnline ? 'text-blue-500' : 'text-red-500'
            )}
          />
          <span className="font-medium truncate text-slate-900">{device.device_name}</span>
          {device.mock_data && (
            <Badge
              variant="outline"
              className="text-xs bg-purple-50 text-purple-600 border-purple-200 flex-shrink-0"
            >
              MOCK
            </Badge>
          )}
        </Link>
        <DeviceActionsMenu
          sn={device.sn}
          deviceName={device.device_name}
          isOnline={isOnline}
          tunnelLimitReached={tunnelLimitReached}
          isUnlinked={unlinked}
          onReboot={() => onReboot(device)}
          onLinkCustomer={onLinkCustomer ? () => onLinkCustomer(device) : undefined}
        />
      </div>
      <div className="mt-2 text-sm text-slate-500">
        {device.model || 'Unknown'} · {device.group_name || 'No group'}
      </div>
      <div className="mt-1 flex items-center gap-2 flex-wrap">
        {unlinked ? (
          <>
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-800 border-amber-200 text-xs"
            >
              Unlinked
            </Badge>
            {onLinkCustomer && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onLinkCustomer(device)}
              >
                <PiUserPlusBold className="w-3.5 h-3.5 mr-1" />
                Link
              </Button>
            )}
          </>
        ) : (
          <span className="text-sm text-slate-600 truncate">
            {device.customer_name || 'Linked customer'}
          </span>
        )}
      </div>
      <div className="mt-1 text-sm text-slate-500">
        CPU {formatPct(device.cpu_usage)} · Mem {formatPct(device.memory_usage)} ·{' '}
        {device.online_clients} clients · Synced {formatRelativeTime(device.synced_at)}
      </div>
    </div>
  );
}
