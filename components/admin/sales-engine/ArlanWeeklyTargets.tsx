'use client';

import type { ArlanWeeklyTargets } from '@/lib/sales-engine/briefing-service';

interface ArlanWeeklyTargetsProps {
  targets: ArlanWeeklyTargets;
}

const CATEGORY_CONFIG: { key: keyof ArlanWeeklyTargets; label: string }[] = [
  { key: 'data_connectivity', label: 'Data' },
  { key: 'backup_connectivity', label: 'Backup' },
  { key: 'iot_m2m', label: 'IoT' },
  { key: 'fleet_management', label: 'Fleet' },
  { key: 'made_for_business', label: 'MfB' },
];

export function ArlanWeeklyTargetsCard({ targets }: ArlanWeeklyTargetsProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        Arlan Weekly Deal Targets (10/week)
      </h3>
      <div className="grid grid-cols-5 gap-3">
        {CATEGORY_CONFIG.map(({ key, label }) => {
          const { current, target } = targets[key];
          const met = current >= target;
          return (
            <div key={key} className="text-center">
              <p className={`text-lg font-bold ${met ? 'text-emerald-600' : 'text-slate-900'}`}>
                {current}/{target}
              </p>
              <p className="text-[10px] text-slate-500">{label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
