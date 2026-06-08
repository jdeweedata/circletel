'use client';

import { StatusBadge } from '@/components/admin/shared';
import { PiCheckCircleBold, PiLightningBold, PiXBold, PiBuildingBold } from 'react-icons/pi';

interface DFAVerdictCardProps {
  result: {
    coverageType: 'connected' | 'near-net' | 'none';
    message: string;
    connected?: { buildingId: string; status: string; ftth: string | null; broadband: string | null; precinct: string | null; };
    nearNet?: { distanceMeters: number; display: string; timeline: string; note: string; };
  };
}

const CONFIG = {
  connected: {
    icon: PiCheckCircleBold,
    color: 'text-emerald-500',
    bgClass: 'bg-emerald-50 border-emerald-400',
    badge: 'success' as const,
    label: 'Connected — Active Fibre',
  },
  'near-net': {
    icon: PiLightningBold,
    color: 'text-amber-500',
    bgClass: 'bg-amber-50 border-amber-400',
    badge: 'warning' as const,
    label: 'Near-Net — Extension Required',
  },
  none: {
    icon: PiXBold,
    color: 'text-red-500',
    bgClass: 'bg-red-50 border-red-400',
    badge: 'error' as const,
    label: 'No DFA Coverage',
  },
};

export default function DFAVerdictCard({ result }: DFAVerdictCardProps) {
  const cfg = CONFIG[result.coverageType];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border-l-4 ${cfg.bgClass} p-5`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Icon className={`h-8 w-8 ${cfg.color}`} />
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-1">
              DFA Fibre Status
            </p>
            <StatusBadge variant={cfg.badge} status={cfg.label} />
          </div>
        </div>
        <p className="text-sm text-slate-500 max-w-md text-right">{result.message}</p>
      </div>

      {/* Connected building details */}
      {result.coverageType === 'connected' && result.connected && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-white/60 rounded-lg p-3">
          <div>
            <span className="text-slate-500">Building ID</span>
            <p className="font-mono font-semibold text-slate-700">{result.connected.buildingId}</p>
          </div>
          <div>
            <span className="text-slate-500">Status</span>
            <p className="font-semibold text-emerald-700">{result.connected.status}</p>
          </div>
          {result.connected.precinct && (
            <div>
              <span className="text-slate-500">Precinct</span>
              <p className="font-semibold text-slate-700">{result.connected.precinct}</p>
            </div>
          )}
          {result.connected.ftth && (
            <div>
              <span className="text-slate-500">FTTH</span>
              <p className="font-semibold text-slate-700">{result.connected.ftth}</p>
            </div>
          )}
        </div>
      )}

      {/* Near-net details */}
      {result.coverageType === 'near-net' && result.nearNet && (
        <div className="mt-3 bg-amber-100/60 rounded-lg p-3 flex items-center gap-3">
          <PiBuildingBold className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              ~{result.nearNet.display} from nearest fibre point
            </p>
            <p className="text-xs text-amber-700 mt-0.5">{result.nearNet.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}
