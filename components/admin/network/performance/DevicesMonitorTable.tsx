'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PiWifiHighBold, PiCaretLeftBold, PiCaretRightBold } from 'react-icons/pi';

export type DeviceMonitorRow = {
  sn: string;
  device_name: string;
  model?: string | null;
  group_name: string | null;
  customer_name: string | null;
  status: string;
  health_score: number;
  synced_at?: string | null;
  last_seen_at?: string | null;
};

type DevicesMonitorTableProps = {
  rows: DeviceMonitorRow[];
  className?: string;
};

function statusLabel(row: DeviceMonitorRow): { label: string; className: string } {
  if (row.status === 'offline' || row.health_score < 50) {
    return { label: row.status === 'offline' ? 'Offline' : 'Critical', className: 'bg-red-50 text-red-700 border-red-200' };
  }
  if (row.health_score < 80) {
    return { label: 'In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  return { label: 'Healthy', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diffMins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const h = Math.floor(diffMins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function DevicesMonitorTable({ rows, className }: DevicesMonitorTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const slice = useMemo(() => {
    const start = safePage * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  const from = rows.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(rows.length, (safePage + 1) * pageSize);

  return (
    <Card className={cn('border border-slate-200/80 shadow-sm rounded-xl bg-white', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">Devices Monitoring</CardTitle>
        <p className="text-xs text-slate-500">Ruijie Wi-Fi fleet status from Supabase cache</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Environment</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Checked</th>
                <th className="px-4 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No devices in cache yet.
                  </td>
                </tr>
              ) : (
                slice.map((row) => {
                  const status = statusLabel(row);
                  return (
                    <tr key={row.sn} className="border-b border-slate-50 hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/network/devices/${row.sn}`}
                          className="inline-flex items-center gap-2 font-medium text-slate-900 hover:text-blue-600"
                        >
                          <PiWifiHighBold className="w-4 h-4 text-blue-500" />
                          <span className="truncate max-w-[180px]">{row.device_name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.group_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{row.model || 'AP'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn('font-medium', status.className)}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatRelative(row.synced_at || row.last_seen_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600 inline-flex items-center justify-center">
                            {(row.customer_name || 'CT').slice(0, 2).toUpperCase()}
                          </span>
                          <span className="text-slate-700 truncate max-w-[140px]">
                            {row.customer_name || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing {from}-{to} of {rows.length} entries
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(0);
              }}
            >
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Show 10</SelectItem>
                <SelectItem value="25">Show 25</SelectItem>
                <SelectItem value="50">Show 50</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <PiCaretLeftBold className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-500 tabular-nums">
              {safePage + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              <PiCaretRightBold className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
