'use client';

import { useEffect, useState } from 'react';
import type { SignalQuality } from '@/lib/coverage/prediction/types';
import { SectionCard, StatusBadge } from '@/components/admin/shared';
import { PiClockBold, PiTrashBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'tarana-coverage-checks';
const MAX_HISTORY = 20;

export interface RecentCheck {
  id: string;
  address: string;
  lat: number;
  lng: number;
  signalQuality: SignalQuality;
  distanceKm: number;
  bnSiteName: string;
  checkedAt: string;
}

interface RecentChecksPanelProps {
  onRecheck: (lat: number, lng: number, address: string) => void;
}

const QUALITY_VARIANT: Record<SignalQuality, 'success' | 'warning' | 'error' | 'neutral'> = {
  excellent: 'success', good: 'success',
  fair: 'warning', poor: 'warning',
  none: 'error',
};

const QUALITY_LABEL: Record<SignalQuality, string> = {
  excellent: 'Excellent', good: 'Good',
  fair: 'Marginal', poor: 'Weak',
  none: 'No Coverage',
};

export function loadRecentChecks(): RecentCheck[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveRecentCheck(check: RecentCheck): void {
  const existing = loadRecentChecks().filter(c => c.id !== check.id);
  const updated = [check, ...existing].slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export default function RecentChecksPanel({ onRecheck }: RecentChecksPanelProps) {
  const [checks, setChecks] = useState<RecentCheck[]>([]);

  useEffect(() => {
    setChecks(loadRecentChecks());
    // Refresh when storage changes (other tabs)
    const handler = () => setChecks(loadRecentChecks());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  function refresh() {
    setChecks(loadRecentChecks());
  }

  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    setChecks([]);
  }

  if (checks.length === 0) return null;

  return (
    <SectionCard
      title="Recent Checks"
      icon={PiClockBold}
      action={
        <Button variant="ghost" size="sm" onClick={clearHistory} className="text-slate-400 hover:text-red-500 h-7 px-2">
          <PiTrashBold className="mr-1" /> Clear
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-medium text-slate-500 pb-2 pr-4">Address</th>
              <th className="text-left text-xs font-medium text-slate-500 pb-2 pr-4">Coverage</th>
              <th className="text-left text-xs font-medium text-slate-500 pb-2 pr-4">Distance</th>
              <th className="text-left text-xs font-medium text-slate-500 pb-2 pr-4">Base Node</th>
              <th className="text-left text-xs font-medium text-slate-500 pb-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {checks.map(check => (
              <tr
                key={check.id}
                className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => { onRecheck(check.lat, check.lng, check.address); refresh(); }}
              >
                <td className="py-2 pr-4 text-slate-700 max-w-[200px] truncate">{check.address}</td>
                <td className="py-2 pr-4">
                  <StatusBadge
                    variant={QUALITY_VARIANT[check.signalQuality]}
                    status={QUALITY_LABEL[check.signalQuality]}
                  />
                </td>
                <td className="py-2 pr-4 text-slate-600">
                  {check.signalQuality === 'none' ? '—' : `${check.distanceKm.toFixed(1)} km`}
                </td>
                <td className="py-2 pr-4 text-slate-600 max-w-[160px] truncate">{check.bnSiteName || '—'}</td>
                <td className="py-2 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(check.checkedAt).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
