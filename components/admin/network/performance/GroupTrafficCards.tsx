'use client';

import { PiBroadcastBold, PiWifiHighBold } from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBytes } from '@/components/admin/network/TrafficChart';
import { cn } from '@/lib/utils';
import type { GroupTrafficCard } from '@/lib/network/analytics-aggregates';
import type { SsidActivityCard } from '@/lib/network/analytics-aggregates';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

type GroupTrafficCardsProps = {
  groups: GroupTrafficCard[];
  selectedGroupId?: string | null;
  onSelectGroup?: (groupId: string) => void;
  layout?: 'grid' | 'list';
  className?: string;
};

export function GroupTrafficCards({
  groups,
  selectedGroupId,
  onSelectGroup,
  layout = 'grid',
  className,
}: GroupTrafficCardsProps) {
  if (!groups.length) {
    return (
      <AnalyticsEmptyState
        title="Group Traffic"
        description="No group traffic rollups in this window yet. Run a Ruijie sync to populate throughput."
        icon={<PiBroadcastBold className="w-10 h-10" aria-hidden="true" />}
        className={className}
      />
    );
  }

  const isList = layout === 'list';

  return (
    <Card
      className={cn(
        'border border-slate-200/80 shadow-sm rounded-xl bg-white',
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900">Group Traffic</CardTitle>
        <p className="text-xs text-slate-500">
          Summed Ruijie rollups in the selected time window
        </p>
      </CardHeader>
      <CardContent
        className={cn(
          isList ? 'space-y-1.5' : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'
        )}
      >
        {groups.map((g) => {
          const active = g.groupId === selectedGroupId;
          return (
            <button
              key={g.groupId}
              type="button"
              onClick={() => onSelectGroup?.(g.groupId)}
              className={cn(
                'w-full text-left rounded-xl border transition-colors',
                isList ? 'px-3 py-2' : 'p-3',
                active
                  ? 'border-blue-300 bg-blue-50/60'
                  : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
              )}
            >
              {isList ? (
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {g.groupName}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-slate-900 shrink-0">
                    {formatBytes(g.totalBytes)}
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-900 truncate">{g.groupName}</p>
                  <p className="text-xl font-semibold tabular-nums text-slate-900 mt-1">
                    {formatBytes(g.totalBytes)}
                  </p>
                </>
              )}
              <p className={cn('text-xs text-slate-500', isList ? 'mt-0.5' : 'mt-1')}>
                ↓ {formatBytes(g.totalRxBytes)} · ↑ {formatBytes(g.totalTxBytes)} ·{' '}
                {g.sampleCount} samples
              </p>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

type SsidActivityCardsProps = {
  ssids: SsidActivityCard[];
  className?: string;
};

export function SsidActivityCards({ ssids, className }: SsidActivityCardsProps) {
  if (!ssids.length) {
    return (
      <AnalyticsEmptyState
        title="SSID Activity"
        description="No live STA associations with SSID names for this group. Ruijie does not expose SSID byte traffic here."
        icon={<PiWifiHighBold className="w-10 h-10" />}
        className={className}
      />
    );
  }

  const maxClients = Math.max(...ssids.map((s) => s.clients), 1);

  return (
    <Card
      className={cn(
        'border border-slate-200/80 shadow-sm rounded-xl bg-white',
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900">SSID Activity</CardTitle>
        <p className="text-xs text-slate-500">
          Live client counts by SSID (STA API — not byte traffic)
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {ssids.map((row) => {
          const pct = (row.clients / maxClients) * 100;
          return (
            <div key={row.ssid}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-slate-900 truncate">{row.ssid}</span>
                <span className="tabular-nums text-slate-600">
                  {row.clients} client{row.clients === 1 ? '' : 's'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
