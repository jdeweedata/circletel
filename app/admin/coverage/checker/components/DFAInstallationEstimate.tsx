'use client';

import { SectionCard } from '@/components/admin/shared';
import { PiClockBold, PiCurrencyDollarBold, PiNoteBold } from 'react-icons/pi';

interface DFAInstallationEstimateProps {
  estimate: {
    estimatedCost: string;
    estimatedDays: string;
    notes: string;
  };
}

export default function DFAInstallationEstimate({ estimate }: DFAInstallationEstimateProps) {
  return (
    <SectionCard title="Installation Estimate" icon={PiClockBold}>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <PiCurrencyDollarBold className="h-5 w-5 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Estimated Cost</p>
            <p className="text-sm font-semibold text-slate-900">{estimate.estimatedCost}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <PiClockBold className="h-5 w-5 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Timeline</p>
            <p className="text-sm font-semibold text-slate-900">{estimate.estimatedDays}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2">
        <PiNoteBold className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600">{estimate.notes}</p>
      </div>
    </SectionCard>
  );
}
