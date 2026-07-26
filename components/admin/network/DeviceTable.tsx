'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PiWifiHighBold } from 'react-icons/pi';
import { DeviceActionsMenu } from './DeviceActionsMenu';

interface RuijieDevice {
  sn: string;
  device_name: string;
  model: string | null;
  group_name: string | null;
  management_ip: string | null;
  online_clients: number;
  cpu_usage?: number | null;
  memory_usage?: number | null;
  status: string;
  config_status: string | null;
  synced_at: string;
  mock_data: boolean;
}

function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value)}%`;
}

function statusBadge(status: string): { label: string; className: string } {
  if (status === 'online') {
    return {
      label: 'Online',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (status === 'offline') {
    return {
      label: 'Offline',
      className: 'bg-red-50 text-red-700 border-red-200',
    };
  }
  return {
    label: status || 'Unknown',
    className: 'bg-slate-50 text-slate-600 border-slate-200',
  };
}

interface DeviceTableProps {
  devices: RuijieDevice[];
  tunnelLimitReached: boolean;
  onReboot: (device: RuijieDevice) => void;
  formatRelativeTime: (date: string) => string;
}

export function DeviceTable({
  devices,
  tunnelLimitReached,
  onReboot,
  formatRelativeTime,
}: DeviceTableProps) {
  const router = useRouter();

  return (
    <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Devices Monitoring
        </CardTitle>
        <p className="text-xs text-slate-500">
          Ruijie Wi-Fi fleet from Supabase cache · CPU / memory from live sync
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Model</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Group</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">IP</th>
                <th className="px-4 py-3 font-medium text-center">CPU</th>
                <th className="px-4 py-3 font-medium text-center">Mem</th>
                <th className="px-4 py-3 font-medium text-center">Clients</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Synced</th>
                <th className="px-4 py-3 font-medium w-12" />
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center">
                    <p className="text-slate-600 font-medium">No devices in cache</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Click Refresh to sync from Ruijie Cloud, or clear any active filters.
                    </p>
                  </td>
                </tr>
              ) : (
                devices.map((device) => {
                  const isOnline = device.status === 'online';
                  const status = statusBadge(device.status);

                  return (
                    <tr
                      key={device.sn}
                      className={cn(
                        'border-b border-slate-50 hover:bg-slate-50/80 cursor-pointer',
                        !isOnline && 'bg-red-50/30'
                      )}
                      onClick={() => router.push(`/admin/network/devices/${device.sn}`)}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/network/devices/${device.sn}`}
                          className="inline-flex items-center gap-2 font-medium text-slate-900 hover:text-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PiWifiHighBold
                            className={cn(
                              'w-4 h-4',
                              isOnline ? 'text-blue-500' : 'text-slate-400'
                            )}
                          />
                          <span className="truncate max-w-[180px]">{device.device_name}</span>
                          {device.mock_data && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-purple-50 text-purple-600 border-purple-200"
                            >
                              MOCK
                            </Badge>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                        {device.model || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                        {device.group_name || '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <code className="text-xs text-slate-500">
                          {device.management_ip || '—'}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-slate-700">
                        {formatPct(device.cpu_usage)}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-slate-700">
                        {formatPct(device.memory_usage)}
                      </td>
                      <td className="px-4 py-3 text-center font-medium tabular-nums text-slate-900">
                        {device.online_clients}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn('font-medium', status.className)}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                        {formatRelativeTime(device.synced_at)}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <DeviceActionsMenu
                          sn={device.sn}
                          deviceName={device.device_name}
                          isOnline={isOnline}
                          tunnelLimitReached={tunnelLimitReached}
                          onReboot={() => onReboot(device)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
