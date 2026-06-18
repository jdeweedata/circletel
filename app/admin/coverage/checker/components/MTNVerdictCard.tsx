'use client';

import { StatusBadge } from '@/components/admin/shared';
import { PiCheckCircleBold, PiXBold, PiDeviceMobileBold, PiBroadcastBold, PiHouseLineBold } from 'react-icons/pi';

export interface MTNService {
  type: string;
  available: boolean;
  signal: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  source?: 'business' | 'consumer';
  estimatedSpeed?: { download: number; upload: number; unit: 'Mbps' | 'Gbps' };
}

interface MTNVerdictCardProps {
  services: MTNService[];
  confidence?: 'high' | 'medium' | 'low';
}

// Technologies shown, in display order
const TECHS: { type: string; label: string; icon: typeof PiBroadcastBold }[] = [
  { type: '5g', label: '5G', icon: PiBroadcastBold },
  { type: 'lte', label: 'LTE (Mobile)', icon: PiDeviceMobileBold },
  { type: 'fixed_lte', label: 'Fixed LTE', icon: PiHouseLineBold },
];

const SIGNAL_RANK: Record<MTNService['signal'], number> = {
  excellent: 4, good: 3, fair: 2, poor: 1, none: 0,
};

const SIGNAL_LABEL: Record<MTNService['signal'], string> = {
  excellent: 'Excellent', good: 'Good', fair: 'Marginal', poor: 'Weak', none: 'No Coverage',
};

const SIGNAL_VARIANT: Record<MTNService['signal'], 'success' | 'warning' | 'error' | 'neutral'> = {
  excellent: 'success', good: 'success', fair: 'warning', poor: 'error', none: 'neutral',
};

// The same technology can be reported by both business and consumer sources —
// pick the best (available first, then strongest signal).
function bestForType(services: MTNService[], type: string): MTNService | null {
  const matches = services.filter((s) => s.type === type);
  if (matches.length === 0) return null;
  return matches.reduce<MTNService | null>((best, s) => {
    if (!best) return s;
    if (s.available !== best.available) return s.available ? s : best;
    return SIGNAL_RANK[s.signal] > SIGNAL_RANK[best.signal] ? s : best;
  }, null);
}

export default function MTNVerdictCard({ services, confidence }: MTNVerdictCardProps) {
  const rows = TECHS.map((tech) => ({ ...tech, service: bestForType(services, tech.type) }));
  const anyAvailable = rows.some((r) => r.service?.available);

  const cfg = anyAvailable
    ? { icon: PiCheckCircleBold, color: 'text-emerald-500', bgClass: 'bg-emerald-50 border-emerald-400', badge: 'success' as const, label: 'MTN Coverage Available' }
    : { icon: PiXBold, color: 'text-red-500', bgClass: 'bg-red-50 border-red-400', badge: 'error' as const, label: 'No MTN LTE / 5G Coverage' };
  const HeaderIcon = cfg.icon;

  return (
    <div className={`rounded-xl border-l-4 ${cfg.bgClass} p-5`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <HeaderIcon className={`h-8 w-8 ${cfg.color}`} />
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-1">
              MTN LTE / 5G Status
            </p>
            <StatusBadge variant={cfg.badge} status={cfg.label} />
          </div>
        </div>
        {confidence && (
          <p className="text-sm text-slate-500 text-right">
            Model confidence:{' '}
            <span className="font-semibold text-slate-700">
              {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
            </span>
          </p>
        )}
      </div>

      {/* Per-technology breakdown */}
      <div className="mt-4 space-y-2">
        {rows.map(({ type, label, icon: Icon, service }) => {
          const signal = service?.signal ?? 'none';
          const speed = service?.available ? service.estimatedSpeed : undefined;
          return (
            <div key={type} className="flex items-center justify-between gap-3 bg-white/70 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Icon className="h-5 w-5 text-slate-400 shrink-0" />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </div>
              <div className="flex items-center gap-3">
                {speed && (
                  <span className="text-xs text-slate-500">
                    ~{speed.download}{speed.unit} ↓ / {speed.upload}{speed.unit} ↑
                  </span>
                )}
                <StatusBadge variant={SIGNAL_VARIANT[signal]} status={SIGNAL_LABEL[signal]} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Estimated speeds are signal-based projections from MTN coverage maps, not guaranteed throughput.
      </p>
    </div>
  );
}
