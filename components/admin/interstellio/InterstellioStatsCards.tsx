'use client';

import { StatCard } from '@/components/admin/shared';

interface InterstellioStats {
  totalSubscribers: number;
  activeSubscribers: number;
  inactiveSubscribers: number;
  activeSessions: number;
  totalUsage: {
    uploadGb: number;
    downloadGb: number;
  };
}

interface InterstellioStatsCardsProps {
  stats: InterstellioStats | null;
  linkedServices: number;
  isLoading?: boolean;
}

function formatUsage(uploadGb: number, downloadGb: number): string {
  const total = uploadGb + downloadGb;
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1)} TB`;
  }
  return `${total.toFixed(1)} GB`;
}

export function InterstellioStatsCards({
  stats,
  linkedServices,
  isLoading = false,
}: InterstellioStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-pulse">
            <div className="h-3 bg-slate-200 rounded w-24 mb-3" />
            <div className="h-5 bg-slate-200 rounded w-16 mb-2" />
            <div className="h-3 bg-slate-200 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  const totalSubscribers = stats?.totalSubscribers ?? 0;
  const activeSubscribers = stats?.activeSubscribers ?? 0;
  const activeSessions = stats?.activeSessions ?? 0;
  const uploadGb = stats?.totalUsage?.uploadGb ?? 0;
  const downloadGb = stats?.totalUsage?.downloadGb ?? 0;
  const unlinked = totalSubscribers - linkedServices;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Subscribers"
        value={totalSubscribers}
        subtitle={`${activeSubscribers} online`}
      />
      <StatCard
        label="Active Sessions"
        value={activeSessions}
        subtitle={`Across ${activeSubscribers} subscribers`}
      />
      <StatCard
        label="Linked Services"
        value={linkedServices}
        subtitle={unlinked > 0 ? `${unlinked} unlinked` : 'All linked'}
      />
      <StatCard
        label="Total Usage"
        value={formatUsage(uploadGb, downloadGb)}
        subtitle={`↑${uploadGb.toFixed(1)}GB ↓${downloadGb.toFixed(1)}GB`}
      />
    </div>
  );
}
