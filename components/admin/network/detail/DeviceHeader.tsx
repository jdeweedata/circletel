'use client';

import {
  PiCaretRightBold,
  PiPowerBold,
  PiLinkBold,
  PiArrowsClockwiseBold,
  PiWifiHighBold,
  PiWifiSlashBold,
} from 'react-icons/pi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/shared';

interface Device {
  sn: string;
  device_name: string;
  model: string | null;
  group_name: string | null;
  status: string;
}

interface DeviceHeaderProps {
  device: Device;
  isOnline: boolean;
  hasActiveTunnel: boolean;
  tunnelLoading: boolean;
  onReboot: () => void;
  onLaunchTunnel: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

export function DeviceHeader({
  device,
  isOnline,
  hasActiveTunnel,
  tunnelLoading,
  onReboot,
  onLaunchTunnel,
  onRefresh,
  refreshing,
}: DeviceHeaderProps) {
  const statusConfig = isOnline
    ? { className: 'bg-emerald-50 text-emerald-700', label: 'Online', icon: PiWifiHighBold }
    : { className: 'bg-red-50 text-red-700', label: 'Offline', icon: PiWifiSlashBold };

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/admin/network/devices" className="hover:text-primary">Network</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <Link href="/admin/network/devices" className="hover:text-primary">Devices</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <span className="text-slate-900">{device.device_name}</span>
        </div>

        {/* Title Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {device.device_name}
            </h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={statusConfig.label} className={statusConfig.className} />
              {device.group_name && (
                <span className="text-sm text-slate-500 hidden sm:inline">
                  {device.group_name}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Grouped icon buttons */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                title="Refresh"
                aria-label="Refresh"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <PiArrowsClockwiseBold className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200 disabled:opacity-50"
                title="Reboot Device"
                aria-label="Reboot Device"
                onClick={onReboot}
                disabled={!isOnline}
              >
                <PiPowerBold className="w-5 h-5" />
              </button>
            </div>

            {/* Launch Tunnel button */}
            <Button
              type="button"
              onClick={onLaunchTunnel}
              disabled={tunnelLoading || !isOnline || hasActiveTunnel}
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              {tunnelLoading ? (
                <PiArrowsClockwiseBold className="w-5 h-5 animate-spin" />
              ) : (
                <PiLinkBold className="w-5 h-5" />
              )}
              {hasActiveTunnel ? 'Tunnel Active' : 'Launch eWeb'}
            </Button>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-sm text-slate-500 mt-2">
          {device.model} &bull; {device.sn}
        </p>
      </div>
    </div>
  );
}
