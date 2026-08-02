'use client';

import { cn } from '@/lib/utils';

export type FleetStatus = 'online' | 'warning' | 'offline';

/** Minimal shape for status classification (avoids circular import with DeviceTable). */
type RuijieStatusInput = {
  status: string;
  cpu_usage?: number | null;
  config_status: string | null;
};

const STATUS_STYLES: Record<
  FleetStatus,
  { dot: string; text: string; bg: string; label: string }
> = {
  online: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    label: 'Online',
  },
  warning: {
    dot: 'bg-amber-400',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    label: 'Warning',
  },
  offline: {
    dot: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
    label: 'Offline',
  },
};

const SYNCED_CONFIG = new Set(['UP_TO_DATE', 'Synced', 'synced', 'ok', 'OK']);

export function classifyRuijieStatus(device: RuijieStatusInput): FleetStatus {
  if (device.status === 'offline') return 'offline';
  if (device.status === 'online') {
    if (device.cpu_usage != null && device.cpu_usage >= 80) return 'warning';
    if (device.config_status && !SYNCED_CONFIG.has(device.config_status)) {
      return 'warning';
    }
    return 'online';
  }
  return 'warning';
}

export function classifyOmadaStatus(status: string): FleetStatus {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'deployed') return 'online';
  if (s === 'offline' || s === 'decommissioned' || s === 'down') return 'offline';
  return 'warning';
}

export function DeviceStatusBadge({
  status,
  className,
}: {
  status: FleetStatus;
  className?: string;
}) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        s.bg,
        s.text,
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}
