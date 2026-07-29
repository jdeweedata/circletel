'use client';

import { PiAppWindowBold } from 'react-icons/pi';
import { AppFlowChart, formatBytes } from '@/components/admin/network/TrafficChart';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

export type AppFlowItem = {
  appGroupName: string;
  appName: string;
  downFlow: number;
  upFlow: number;
  upDownFlow: number;
};

type TopApplicationsCardProps = {
  data: AppFlowItem[];
  maxItems?: number;
};

export function TopApplicationsCard({ data, maxItems = 10 }: TopApplicationsCardProps) {
  if (!data.length) {
    return (
      <AnalyticsEmptyState
        title="Top Applications"
        description="No application flow data from Ruijie for this group (EG app-flow unavailable or empty)."
        icon={<PiAppWindowBold className="w-10 h-10" />}
      />
    );
  }

  return <AppFlowChart data={data} title="Top Applications by Traffic" maxItems={maxItems} />;
}

export function AppCategoryBreakdown({ data }: { data: AppFlowItem[] }) {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <PiAppWindowBold className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-sm text-slate-600">
          Categories appear when Ruijie returns app-flow groups for this network.
        </p>
      </div>
    );
  }

  const categories = data.reduce(
    (acc, app) => {
      const cat = app.appGroupName || 'Other';
      if (!acc[cat]) acc[cat] = { total: 0, apps: 0 };
      acc[cat].total += app.upDownFlow;
      acc[cat].apps += 1;
      return acc;
    },
    {} as Record<string, { total: number; apps: number }>
  );

  const sorted = Object.entries(categories).sort(([, a], [, b]) => b.total - a.total);
  const totalTraffic = data.reduce((sum, app) => sum + app.upDownFlow, 0);
  const colors: Record<string, string> = {
    Streaming: 'bg-violet-500',
    Social: 'bg-blue-500',
    Work: 'bg-emerald-500',
    Gaming: 'bg-red-500',
    Other: 'bg-slate-500',
  };

  return (
    <div className="space-y-4">
      {sorted.map(([category, stats]) => {
        const percentage = totalTraffic > 0 ? (stats.total / totalTraffic) * 100 : 0;
        return (
          <div key={category}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colors[category] || 'bg-slate-400'}`} />
                <span className="font-medium text-sm text-slate-900">{category}</span>
                <span className="text-xs text-slate-500">
                  ({stats.apps} app{stats.apps > 1 ? 's' : ''})
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{formatBytes(stats.total)}</span>
                <span className="text-slate-400 w-12 text-right">{percentage.toFixed(0)}%</span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors[category] || 'bg-slate-400'} rounded-full`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
