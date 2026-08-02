'use client';

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
};

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <div className="font-mono text-2xl font-semibold text-gray-900">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </div>
      {sub ? <div className="text-xs text-gray-400">{sub}</div> : null}
    </div>
  );
}

export type DeviceFleetStats = {
  total: number;
  online: number;
  warning: number;
  offline: number;
};

export function DeviceFleetStatCards({ stats }: { stats: DeviceFleetStats }) {
  const availability =
    stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0;

  return (
    <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard label="Total Devices" value={stats.total} sub="Across all segments" />
      <StatCard
        label="Online"
        value={stats.online}
        sub={`${availability}% availability`}
      />
      <StatCard label="Warnings" value={stats.warning} sub="Require attention" />
      <StatCard label="Offline" value={stats.offline} sub="Unreachable devices" />
    </div>
  );
}
