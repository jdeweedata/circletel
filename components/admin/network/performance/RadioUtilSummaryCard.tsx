'use client';

import Link from 'next/link';
import { PiBroadcastBold } from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RadioUtilSummary } from '@/lib/network/analytics-aggregates';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';
import { ResourceUsageList } from './ResourceUsageList';

type RadioUtilSummaryCardProps = {
  radio: RadioUtilSummary;
  className?: string;
};

export function RadioUtilSummaryCard({ radio, className }: RadioUtilSummaryCardProps) {
  if (radio.devicesWithRadio === 0) {
    return (
      <AnalyticsEmptyState
        title="Channel / Radio Util"
        description="No radio utilization in device cache for this group. Ruijie does not provide spectrum density (dBm) here — sync live metrics first."
        icon={<PiBroadcastBold className="w-10 h-10" />}
        className={className}
      />
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <ResourceUsageList
        title="Radio Utilization"
        subtitle={`${radio.devicesWithRadio}/${radio.totalDevices} devices with util · from cache (not fake dBm density)`}
        rows={[
          {
            key: '2g',
            label: '2.4 GHz util',
            value: radio.avg2g,
            icon: <PiBroadcastBold className="w-4 h-4" />,
          },
          {
            key: '5g',
            label: '5 GHz util',
            value: radio.avg5g,
            icon: <PiBroadcastBold className="w-4 h-4" />,
          },
          {
            key: 'blend',
            label: 'Blended util',
            value: radio.avgBlended,
            icon: <PiBroadcastBold className="w-4 h-4" />,
          },
        ]}
      />

      <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Channels in use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-slate-400 mb-1.5">2.4 GHz</p>
            <div className="flex flex-wrap gap-1.5">
              {radio.channels2g.length ? (
                radio.channels2g.map((ch) => (
                  <Badge key={`2g-${ch}`} variant="outline" className="tabular-nums">
                    Ch {ch}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1.5">5 GHz</p>
            <div className="flex flex-wrap gap-1.5">
              {radio.channels5g.length ? (
                radio.channels5g.map((ch) => (
                  <Badge key={`5g-${ch}`} variant="outline" className="tabular-nums">
                    Ch {ch}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </div>
          </div>

          {radio.byDevice.length > 0 ? (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-2">Highest util devices</p>
              <ul className="space-y-1.5">
                {radio.byDevice.slice(0, 5).map((d) => (
                  <li key={d.sn} className="flex items-center justify-between text-sm gap-2">
                    <Link
                      href={`/admin/network/devices/${d.sn}`}
                      className="truncate text-slate-800 hover:text-blue-600"
                    >
                      {d.device_name}
                    </Link>
                    <span className="tabular-nums text-slate-500 shrink-0">
                      {d.radio_2g_utilization == null ? '—' : `${Math.round(d.radio_2g_utilization)}%`}{' '}
                      /{' '}
                      {d.radio_5g_utilization == null ? '—' : `${Math.round(d.radio_5g_utilization)}%`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
