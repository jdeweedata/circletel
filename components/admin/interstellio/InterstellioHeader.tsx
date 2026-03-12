'use client';

import {
  PiCaretRightBold,
  PiArrowsClockwiseBold,
  PiGearBold,
} from 'react-icons/pi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { StatusBadge, StatusVariant } from '@/components/admin/shared';

interface InterstellioHeaderProps {
  healthStatus: 'healthy' | 'degraded' | 'error';
  lastRefresh: Date | null;
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const HEALTH_STATUS_CONFIG: Record<string, { variant: StatusVariant; label: string }> = {
  healthy: { variant: 'success', label: 'Healthy' },
  degraded: { variant: 'warning', label: 'Degraded' },
  error: { variant: 'error', label: 'Error' },
};

export function InterstellioHeader({
  healthStatus,
  lastRefresh,
  autoRefresh,
  onAutoRefreshChange,
  onRefresh,
  isLoading,
}: InterstellioHeaderProps) {
  const statusConfig = HEALTH_STATUS_CONFIG[healthStatus] || HEALTH_STATUS_CONFIG.healthy;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/admin/integrations" className="hover:text-primary">Integrations</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <span className="text-slate-900">Interstellio RADIUS</span>
        </div>

        {/* Title Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 mt-4">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Interstellio RADIUS
            </h2>
            <StatusBadge status={statusConfig.label} variant={statusConfig.variant} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Auto-refresh toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={onAutoRefreshChange}
              />
              <Label htmlFor="auto-refresh" className="text-sm text-slate-600">
                Auto-refresh
              </Label>
            </div>

            {/* Last refresh time */}
            {lastRefresh && (
              <span className="text-xs text-slate-500">
                Updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}

            {/* Action button group */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Settings"
                aria-label="Integration Settings"
                onClick={() => window.location.href = '/admin/integrations'}
              >
                <PiGearBold className="w-5 h-5" />
              </button>
            </div>

            {/* Sync button */}
            <Button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <PiArrowsClockwiseBold className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
