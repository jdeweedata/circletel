'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PiClockBold,
  PiArrowsClockwiseBold,
  PiPowerBold,
  PiWifiHighBold,
  PiWifiSlashBold,
  PiGearBold,
  PiWarningCircleBold,
  PiListBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionCard } from '@/components/admin/shared';

interface LogEntry {
  id: number;
  sn: string;
  logType: string;
  logDetail: string;
  operateTime: number;
}

interface DeviceActivityLogProps {
  sn: string;
}

/**
 * Configuration for different log types
 * Maps logType from Ruijie API to display properties
 */
const LOG_TYPE_CONFIG: Record<string, {
  label: string;
  icon: typeof PiPowerBold;
  bgColor: string;
  iconColor: string;
  badgeClass: string;
}> = {
  reboot: {
    label: 'Reboot',
    icon: PiPowerBold,
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    badgeClass: 'bg-amber-100 text-amber-700 border-0',
  },
  onoffline: {
    label: 'Status Change',
    icon: PiWifiHighBold,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    badgeClass: 'bg-blue-100 text-blue-700 border-0',
  },
  config: {
    label: 'Config Sync',
    icon: PiGearBold,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    badgeClass: 'bg-purple-100 text-purple-700 border-0',
  },
};

/**
 * Get config for a log type, with fallback for unknown types
 */
function getLogTypeConfig(logType: string) {
  return LOG_TYPE_CONFIG[logType] || {
    label: logType,
    icon: PiListBold,
    bgColor: 'bg-slate-50',
    iconColor: 'text-slate-600',
    badgeClass: 'bg-slate-100 text-slate-700 border-0',
  };
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  return new Date(timestamp).toLocaleDateString();
}

/**
 * Format timestamp to absolute date/time
 */
function formatAbsoluteTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Determine if a log entry indicates the device went online
 */
function isOnlineEvent(logDetail: string): boolean {
  const lowerDetail = logDetail.toLowerCase();
  return lowerDetail.includes('online') && !lowerDetail.includes('offline');
}

/**
 * Determine if a log entry indicates the device went offline
 */
function isOfflineEvent(logDetail: string): boolean {
  const lowerDetail = logDetail.toLowerCase();
  return lowerDetail.includes('offline');
}

export function DeviceActivityLog({ sn }: DeviceActivityLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/ruijie/devices/${sn}/logs`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch device logs:', err);
      setError('Failed to load activity logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sn]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  // Loading state
  if (loading) {
    return (
      <SectionCard icon={PiClockBold} title="Activity Log" compact>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 mt-3 text-sm">Loading activity logs...</p>
          </div>
        </div>
      </SectionCard>
    );
  }

  // Error state
  if (error) {
    return (
      <SectionCard icon={PiClockBold} title="Activity Log" compact>
        <div className="text-center py-8">
          <PiWarningCircleBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      </SectionCard>
    );
  }

  // Group logs by date for better organization
  const groupedLogs = logs.reduce<Record<string, LogEntry[]>>((acc, log) => {
    const dateKey = new Date(log.operateTime).toLocaleDateString('en-ZA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(log);
    return acc;
  }, {});

  const dateKeys = Object.keys(groupedLogs);

  return (
    <SectionCard
      icon={PiClockBold}
      title="Activity Log"
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <PiArrowsClockwiseBold className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
      compact
    >
      {logs.length === 0 ? (
        <div className="text-center py-12">
          <PiClockBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No activity logs available</p>
          <p className="text-slate-400 text-sm mt-1">
            Device events will appear here when they occur
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dateKeys.map((dateKey) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="sticky top-0 bg-white py-2 mb-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {dateKey}
                </h4>
              </div>

              {/* Timeline for this date */}
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />

                {/* Log entries */}
                <div className="space-y-4">
                  {groupedLogs[dateKey].map((log, index) => {
                    const config = getLogTypeConfig(log.logType);
                    const Icon = config.icon;

                    // Special handling for online/offline events
                    let displayIcon = Icon;
                    let displayBgColor = config.bgColor;
                    let displayIconColor = config.iconColor;

                    if (log.logType === 'onoffline') {
                      if (isOfflineEvent(log.logDetail)) {
                        displayIcon = PiWifiSlashBold;
                        displayBgColor = 'bg-red-50';
                        displayIconColor = 'text-red-600';
                      } else if (isOnlineEvent(log.logDetail)) {
                        displayIcon = PiWifiHighBold;
                        displayBgColor = 'bg-emerald-50';
                        displayIconColor = 'text-emerald-600';
                      }
                    }

                    const DisplayIcon = displayIcon;

                    return (
                      <div key={`${log.id}-${index}`} className="relative flex items-start gap-4 pl-0">
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ${displayBgColor} flex items-center justify-center ring-4 ring-white`}>
                          <DisplayIcon className={`w-4 h-4 ${displayIconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge className={config.badgeClass}>
                              {config.label}
                            </Badge>
                            <span className="text-sm text-slate-400">
                              {formatRelativeTime(log.operateTime)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mt-1">
                            {log.logDetail}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatAbsoluteTime(log.operateTime)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
