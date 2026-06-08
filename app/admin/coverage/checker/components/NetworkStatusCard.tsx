'use client';

import type { LiveNetworkStatus } from '@/lib/coverage/prediction/types';
import { SectionCard } from '@/components/admin/shared';
import { Badge } from '@/components/ui/badge';
import {
  PiCheckCircleBold,
  PiWarningCircleBold,
  PiUsersBold,
  PiRadioBold,
} from 'react-icons/pi';

interface NetworkStatusCardProps {
  liveStatus: LiveNetworkStatus;
}

export default function NetworkStatusCard({ liveStatus }: NetworkStatusCardProps) {
  const { bnOnline, bnActiveConnections, networkSummary } = liveStatus;

  return (
    <SectionCard title="Live Network Status" icon={PiRadioBold}>
      <div className="space-y-3">
        {/* BN Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Base Station Status</span>
          {bnOnline ? (
            <Badge className="bg-green-500 hover:bg-green-600 gap-1">
              <PiCheckCircleBold className="h-3 w-3" />
              Online
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <PiWarningCircleBold className="h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>

        {/* Active Connections */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Active Connections</span>
          <span className="text-sm font-semibold flex items-center gap-1">
            <PiUsersBold className="h-3.5 w-3.5 text-slate-400" />
            {bnActiveConnections}
          </span>
        </div>

        {/* Network Summary */}
        {networkSummary && (
          <div className="border-t border-slate-100 pt-3 mt-1">
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
              Network Overview
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 rounded px-2 py-1.5">
                <span className="text-slate-500">BNs online</span>
                <span className="float-right font-semibold">
                  {networkSummary.onlineBNs}/{networkSummary.totalBNs}
                </span>
              </div>
              <div className="bg-slate-50 rounded px-2 py-1.5">
                <span className="text-slate-500">RNs online</span>
                <span className="float-right font-semibold">
                  {networkSummary.onlineRNs}/{networkSummary.totalRNs}
                </span>
              </div>
            </div>
            {networkSummary.fetchedAt && (
              <p className="text-xs text-slate-400 mt-1.5">
                Last synced: {new Date(networkSummary.fetchedAt).toLocaleString('en-ZA')}
              </p>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
