'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PiCpuBold, PiMemoryBold, PiBroadcastBold } from 'react-icons/pi';
import {
  NetworkOverviewIcon,
  type NetworkOverviewIconName,
} from '@/components/icons/NetworkOverviewIcon';

export type EdgeDeviceInfo = {
  sn: string;
  device_name: string;
  model: string | null;
  status: string;
  role: string;
  online_clients: number;
  cpu_usage: number | null;
  memory_usage: number | null;
  radio_2g_utilization: number | null;
  radio_5g_utilization: number | null;
  management_ip: string | null;
  wan_ip: string | null;
  synced_at: string | null;
};

type EdgeDeviceCardProps = {
  device: EdgeDeviceInfo | null;
  className?: string;
};

function avgRadio(a: number | null, b: number | null): number | null {
  const vals = [a, b].filter((v): v is number => typeof v === 'number');
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

export function EdgeDeviceCard({ device, className }: EdgeDeviceCardProps) {
  if (!device) {
    return (
      <Card className={cn('border border-slate-200/80 shadow-sm rounded-xl bg-white', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-slate-800">Primary device</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-sm text-slate-400">No Data</CardContent>
      </Card>
    );
  }

  const online = device.status === 'online';
  const radio = avgRadio(device.radio_2g_utilization, device.radio_5g_utilization);
  const roleIconName: NetworkOverviewIconName =
    device.role === 'gateway'
      ? 'gateway'
      : device.role === 'switch'
        ? 'switch'
        : 'ap';

  return (
    <Card className={cn('border border-slate-200/80 shadow-sm rounded-xl bg-white', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base font-medium text-slate-800 truncate">
              <Link href={`/admin/network/devices/${device.sn}`} className="hover:text-blue-600">
                {device.device_name}
              </Link>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {device.model || 'Unknown model'} · {device.sn}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              online
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }
          >
            {online ? 'CONNECTED' : 'OFFLINE'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <NetworkOverviewIcon name={roleIconName} size={18} title={device.role} />
          <span className="capitalize">{device.role === 'unknown' ? 'device' : device.role}</span>
          {(device.wan_ip || device.management_ip) && (
            <span className="tabular-nums">· {device.wan_ip || device.management_ip}</span>
          )}
          <span>· {device.online_clients} clients</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-slate-50 p-2.5">
            <div className="text-[11px] text-slate-500 inline-flex items-center gap-1">
              <PiCpuBold className="w-3.5 h-3.5" /> CPU
            </div>
            <div className="text-lg font-semibold tabular-nums mt-0.5">
              {device.cpu_usage == null ? '—' : `${Math.round(device.cpu_usage)}%`}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <div className="text-[11px] text-slate-500 inline-flex items-center gap-1">
              <PiMemoryBold className="w-3.5 h-3.5" /> Memory
            </div>
            <div className="text-lg font-semibold tabular-nums mt-0.5">
              {device.memory_usage == null ? '—' : `${Math.round(device.memory_usage)}%`}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <div className="text-[11px] text-slate-500 inline-flex items-center gap-1">
              <PiBroadcastBold className="w-3.5 h-3.5" /> Radio
            </div>
            <div className="text-lg font-semibold tabular-nums mt-0.5">
              {radio == null ? '—' : `${Math.round(radio)}%`}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          Port map unavailable from Ruijie API — shown when supported.
        </p>
      </CardContent>
    </Card>
  );
}
