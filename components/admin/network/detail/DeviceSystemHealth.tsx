'use client';

/**
 * System health for a Ruijie AP — flash/disk/memory headroom, process count and uptime.
 *
 * Every field here comes from the same current_performance call that already provides
 * CPU and memory (API V2.0.3 §2.6.5), so this card costs no extra Ruijie requests.
 * Uptime is derived from the management log, since no Cloud API exposes it directly.
 */

import { PiPulseBold } from 'react-icons/pi';
import { Progress } from '@/components/ui/progress';
import { SectionCard } from '@/components/admin/shared';
import type { DeviceSystemHealth as LibDeviceSystemHealth } from '@/lib/ruijie/performance-metrics';

/**
 * Alias of the lib type rather than a structural twin, so a field rename in
 * performance-metrics.ts fails the build here instead of silently diverging.
 */
export type DeviceSystemHealthData = LibDeviceSystemHealth;

interface DeviceSystemHealthProps {
  system: DeviceSystemHealthData | null | undefined;
  uptimeSeconds: number | null | undefined;
}

const DASH = '—';

function formatKb(kb: number | null | undefined): string {
  if (kb == null || !Number.isFinite(kb)) return DASH;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${(kb / 1024 / 1024).toFixed(2)} GB`;
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return DASH;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** Amber past 75%, red past 90% — storage pressure is what precedes a config-sync failure. */
function usageTone(pct: number): string {
  if (pct >= 90) return 'text-red-600';
  if (pct >= 75) return 'text-amber-600';
  return 'text-slate-900';
}

function UsageRow({ label, pct, free }: { label: string; pct: number | null; free: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className={`font-medium ${pct != null ? usageTone(pct) : ''}`}>
          {pct != null ? `${Math.round(pct)}%` : DASH}
          <span className="text-slate-400 font-normal"> · {free} free</span>
        </span>
      </div>
      <Progress value={pct ?? 0} className="h-2" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

export function DeviceSystemHealth({ system, uptimeSeconds }: DeviceSystemHealthProps) {
  return (
    <SectionCard icon={PiPulseBold} title="System Health" compact>
      <div className="space-y-4">
        <UsageRow
          label="Memory"
          pct={system?.memory_usage ?? null}
          free={formatKb(system?.memory_free_kb)}
        />
        <UsageRow
          label="Flash"
          pct={system?.flash_rate ?? null}
          free={formatKb(system?.flash_free_kb)}
        />
        {/* Disk only exists on models with storage; APs report 0/0 and are skipped. */}
        {system?.disk_free_kb != null && system.disk_free_kb > 0 && (
          <UsageRow
            label="Disk"
            pct={system.disk_rate ?? null}
            free={formatKb(system.disk_free_kb)}
          />
        )}

        <div className="grid grid-cols-3 gap-4 pt-1">
          <Stat label="Uptime" value={formatUptime(uptimeSeconds)} />
          <Stat
            label="Processes"
            value={system?.process_num != null ? String(system.process_num) : DASH}
          />
          {/* RAP2200/RAP62 have no temperature sensor — the field is hidden, not shown as 0. */}
          <Stat
            label={system?.cpu_temp != null ? 'CPU Temp' : 'Clients (device)'}
            value={
              system?.cpu_temp != null
                ? `${system.cpu_temp.toFixed(1)} °C`
                : system?.user_count != null
                  ? String(system.user_count)
                  : DASH
            }
          />
        </div>
      </div>
    </SectionCard>
  );
}
