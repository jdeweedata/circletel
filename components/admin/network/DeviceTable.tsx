'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PiWifiHighBold, PiUserPlusBold, PiBuildingsBold, PiUserCircleBold } from 'react-icons/pi';
import { DeviceActionsMenu } from './DeviceActionsMenu';
import {
  DeviceStatusBadge,
  classifyRuijieStatus,
  type FleetStatus,
} from './DeviceStatusBadge';
import { DeviceHealthBar, healthFromCpu } from './DeviceHealthBar';

export interface RuijieListDevice {
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
  customer_name?: string | null;
  customer_order_id?: string | null;
  corporate_site_id?: string | null;
}

function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value)}%`;
}

function isDeviceUnlinked(device: RuijieListDevice): boolean {
  return !device.customer_order_id && !device.corporate_site_id;
}

type ChipFilter = 'all' | FleetStatus;

interface DeviceTableProps {
  devices: RuijieListDevice[];
  tunnelLimitReached: boolean;
  onReboot: (device: RuijieListDevice) => void;
  onLinkCustomer?: (device: RuijieListDevice) => void;
  formatRelativeTime: (date: string) => string;
  /** When set, parent owns status filter (e.g. URL sync). */
  statusChip?: ChipFilter;
  onStatusChipChange?: (value: ChipFilter) => void;
}

export function DeviceTable({
  devices,
  tunnelLimitReached,
  onReboot,
  onLinkCustomer,
  formatRelativeTime,
  statusChip: controlledChip,
  onStatusChipChange,
}: DeviceTableProps) {
  const router = useRouter();
  const [internalChip, setInternalChip] = useState<ChipFilter>('all');
  const statusChip = controlledChip ?? internalChip;
  const setStatusChip = onStatusChipChange ?? setInternalChip;

  const filtered = useMemo(() => {
    if (statusChip === 'all') return devices;
    return devices.filter((d) => classifyRuijieStatus(d) === statusChip);
  }, [devices, statusChip]);

  return (
    <Card className="min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-3 border-b border-gray-50 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold text-gray-900">
            Device Monitoring
          </CardTitle>
          <p className="mt-0.5 text-xs text-gray-400">
            {filtered.length} of {devices.length} devices · Ruijie Wi-Fi fleet
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 p-0.5">
          {(['all', 'online', 'warning', 'offline'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusChip(s)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                statusChip === s
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="min-w-0 p-0">
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="bg-gray-50/60 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                <th className="px-4 py-2.5">Device</th>
                <th className="hidden px-4 py-2.5 md:table-cell">Model</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="hidden px-4 py-2.5 xl:table-cell">Group</th>
                <th className="hidden px-4 py-2.5 xl:table-cell">IP</th>
                <th className="hidden px-4 py-2.5 md:table-cell text-center">CPU</th>
                <th className="hidden px-4 py-2.5 lg:table-cell text-center">Mem</th>
                <th className="px-4 py-2.5 text-center">Clients</th>
                <th className="hidden px-4 py-2.5 lg:table-cell">Health</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="hidden px-4 py-2.5 sm:table-cell">Synced</th>
                <th className="w-12 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-slate-400">
                    No devices match your filter
                  </td>
                </tr>
              ) : (
                filtered.map((device) => {
                  const isOnline = device.status === 'online';
                  const fleetStatus = classifyRuijieStatus(device);
                  const unlinked = isDeviceUnlinked(device);
                  const health = healthFromCpu(device.status, device.cpu_usage);

                  return (
                    <tr
                      key={device.sn}
                      className={cn(
                        'cursor-pointer border-t border-gray-50 transition-colors hover:bg-blue-50/40',
                        !isOnline && 'bg-red-50/20'
                      )}
                      onClick={() => router.push(`/admin/network/devices/${device.sn}`)}
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/admin/network/devices/${device.sn}`}
                          className="inline-flex items-center gap-2 font-medium text-slate-900 hover:text-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PiWifiHighBold
                            className={cn(
                              'h-4 w-4',
                              isOnline ? 'text-blue-500' : 'text-slate-400'
                            )}
                          />
                          <span className="max-w-[160px] truncate font-mono text-xs">
                            {device.device_name}
                          </span>
                          {device.mock_data && (
                            <Badge
                              variant="outline"
                              className="border-purple-200 bg-purple-50 text-[10px] text-purple-600"
                            >
                              MOCK
                            </Badge>
                          )}
                        </Link>
                        <p className="ml-6 mt-0.5 font-mono text-[11px] text-slate-400">
                          {device.sn}
                        </p>
                      </td>
                      <td className="hidden px-4 py-2.5 text-xs text-slate-600 md:table-cell">
                        {device.model || '—'}
                      </td>
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        {unlinked ? (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-amber-200 bg-amber-50 font-medium text-amber-800"
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
                                <PiUserPlusBold className="mr-1 h-3.5 w-3.5" />
                                Link
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex min-w-0 items-center gap-1.5">
                            {device.corporate_site_id ? (
                              <PiBuildingsBold className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                            ) : (
                              <PiUserCircleBold className="h-3.5 w-3.5 flex-shrink-0 text-purple-500" />
                            )}
                            <span className="max-w-[140px] truncate text-slate-700">
                              {device.customer_name || 'Linked'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="hidden px-4 py-2.5 text-xs text-slate-600 xl:table-cell">
                        {device.group_name || '—'}
                      </td>
                      <td className="hidden px-4 py-2.5 xl:table-cell">
                        <code className="font-mono text-xs text-slate-500">
                          {device.management_ip || '—'}
                        </code>
                      </td>
                      <td className="hidden px-4 py-2.5 text-center tabular-nums text-slate-700 md:table-cell">
                        {formatPct(device.cpu_usage)}
                      </td>
                      <td className="hidden px-4 py-2.5 text-center tabular-nums text-slate-700 lg:table-cell">
                        {formatPct(device.memory_usage)}
                      </td>
                      <td className="px-4 py-2.5 text-center font-medium tabular-nums text-slate-900">
                        {device.online_clients}
                      </td>
                      <td className="hidden px-4 py-2.5 lg:table-cell">
                        <DeviceHealthBar value={health} />
                      </td>
                      <td className="px-4 py-2.5">
                        <DeviceStatusBadge status={fleetStatus} />
                      </td>
                      <td className="hidden px-4 py-2.5 text-xs text-slate-500 sm:table-cell">
                        {formatRelativeTime(device.synced_at)}
                      </td>
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <DeviceActionsMenu
                          sn={device.sn}
                          deviceName={device.device_name}
                          isOnline={isOnline}
                          tunnelLimitReached={tunnelLimitReached}
                          isUnlinked={unlinked}
                          onReboot={() => onReboot(device)}
                          onLinkCustomer={
                            onLinkCustomer ? () => onLinkCustomer(device) : undefined
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
          <span className="text-xs text-gray-400">
            Showing {filtered.length} device{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
