'use client';

import {
  PiClockBold,
  PiMagnifyingGlassBold,
  PiChartBarBold,
  PiDownloadSimpleBold,
  PiEnvelopeBold,
  PiCreditCardBold,
  PiShieldCheckBold,
  PiFileTextBold,
  PiCheckCircleBold,
  PiWarningCircleBold,
  PiSpinnerBold,
  PiCalendarBold,
  PiChatBold,
  PiPhoneBold,
  PiWrenchBold,
  PiUserBold,
} from 'react-icons/pi';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'communication' | 'installation' | 'payment';
  timestamp: string;
  title: string;
  description?: string;
  details: Record<string, unknown>;
  icon?: string;
}

interface TimelineStats {
  totalEvents: number;
  statusChanges: number;
  communications: number;
  installationEvents: number;
}

interface OrderHistoryRedesignedProps {
  order: {
    id: string;
    order_number: string;
    created_at: string;
    technician_notes?: string;
    internal_notes?: string;
  };
}

type FilterCategory = 'all' | 'order' | 'comms' | 'payment' | 'compliance';

export function OrderHistoryRedesigned({ order }: OrderHistoryRedesignedProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  useEffect(() => {
    fetchTimeline();
  }, [order.id]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${order.id}/timeline`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch timeline');
      }

      setEvents(result.data.timeline || []);
      setStats(result.data.stats || null);
    } catch (err) {
      console.error('Error fetching timeline:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const mapEventTypeToCategory = (event: TimelineEvent): FilterCategory => {
    if (event.type === 'status_change') {
      return event.details.taskId ? 'compliance' : 'order';
    }
    if (event.type === 'communication') {
      return 'comms';
    }
    if (event.type === 'payment') {
      return 'payment';
    }
    if (event.type === 'installation') {
      return 'compliance';
    }
    return 'order';
  };

  const filteredEvents = events.filter((event) => {
    const matchesFilter =
      activeFilter === 'all' || mapEventTypeToCategory(event) === activeFilter;

    const matchesSearch =
      searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description &&
        event.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const uniqueActors = new Set<string>();
  events.forEach((event) => {
    if (event.details && typeof event.details === 'object') {
      const actor = event.details.changedBy || event.details.technician;
      if (actor && typeof actor === 'string') {
        uniqueActors.add(actor);
      }
    }
  });

  const getIcon = (event: TimelineEvent) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      status: PiCheckCircleBold,
      email: PiEnvelopeBold,
      sms: PiChatBold,
      whatsapp: PiChatBold,
      call: PiPhoneBold,
      calendar: PiCalendarBold,
      tool: PiWrenchBold,
      check: PiCheckCircleBold,
      create: PiFileTextBold,
      internal_note: PiFileTextBold,
      system_notification: PiWarningCircleBold,
    };

    const IconComponent = iconMap[event.icon || event.type] || PiWarningCircleBold;
    return IconComponent;
  };

  const getCategoryColor = (
    category: FilterCategory
  ): {
    bg: string;
    text: string;
    icon: React.ComponentType<{ className?: string }>;
  } => {
    switch (category) {
      case 'order':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          icon: PiCheckCircleBold,
        };
      case 'comms':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-600',
          icon: PiChatBold,
        };
      case 'payment':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-700',
          icon: PiCreditCardBold,
        };
      case 'compliance':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-600',
          icon: PiShieldCheckBold,
        };
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-600',
          icon: PiFileTextBold,
        };
    }
  };

  const getEventCategoryColor = (event: TimelineEvent) => {
    const category = mapEventTypeToCategory(event);
    return getCategoryColor(category);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Title', 'Description', 'Type', 'Actor'];
    const rows = filteredEvents.map((event) => [
      new Date(event.timestamp).toISOString(),
      event.title,
      event.description || '',
      event.type,
      (event.details?.changedBy || event.details?.technician || '') as string,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${order.order_number}-history.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5">
        {/* Left Column: Timeline Card - Loading */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <PiClockBold className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Order Timeline</h3>
          </div>
          <div className="flex items-center justify-center py-12">
            <PiSpinnerBold className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </div>

        {/* Right Column: At a Glance - Loading */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <PiChartBarBold className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">At a Glance</h3>
          </div>
          <div className="flex items-center justify-center py-12">
            <PiSpinnerBold className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <PiClockBold className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Order Timeline</h3>
          </div>
          <Alert variant="destructive">
            <PiWarningCircleBold className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
        <div />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5">
      {/* Left Column: Order Timeline Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <PiClockBold className="h-5 w-5 text-slate-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Order Timeline</h3>
            <Badge variant="secondary" className="text-xs font-bold">
              {String(filteredEvents.length)} events
            </Badge>
          </div>
        </div>

        {/* Search + Filter Toolbar */}
        <div className="space-y-3 mb-5 pb-5 border-b border-slate-100">
          {/* Search Bar */}
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 py-2.5 bg-slate-50">
            <PiMagnifyingGlassBold className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search the log…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm placeholder-slate-400 text-slate-900"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'order', label: 'Order' },
                { id: 'payment', label: 'Payment' },
                { id: 'comms', label: 'Comms' },
                { id: 'compliance', label: 'Compliance' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors',
                  activeFilter === filter.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center">
            <PiClockBold className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">No events match your filter.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredEvents.map((event, index) => {
              const Icon = getIcon(event);
              const colors = getEventCategoryColor(event);
              const isLast = index === filteredEvents.length - 1;

              return (
                <div
                  key={event.id}
                  className={cn(
                    'flex gap-3.5 py-4',
                    !isLast && 'border-b border-slate-100'
                  )}
                >
                  {/* Icon Circle */}
                  <div
                    className={cn(
                      'flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center',
                      colors.bg,
                      colors.text
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title + Time */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-900">
                        {event.title}
                      </h4>
                      <time className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0">
                        {formatTimestamp(event.timestamp)}
                      </time>
                    </div>

                    {/* Description */}
                    {typeof event.description === 'string' && event.description ? (
                      <p className="text-sm text-slate-600 mb-2">
                        {event.description}
                      </p>
                    ) : null}

                    {/* Actor Row */}
                    {event.details &&
                    typeof event.details === 'object' &&
                    (event.details.changedBy || event.details.technician) ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900">
                          {String(
                            event.details.changedBy ||
                              event.details.technician
                          )}
                        </span>
                        {typeof event.details.source === 'string' && event.details.source ? (
                          <>
                            <span className="text-slate-300 border-l border-slate-300 pl-2">
                              {event.details.source}
                            </span>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: At a Glance Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <PiChartBarBold className="h-5 w-5 text-slate-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">At a Glance</h3>
        </div>

        {/* Stats List */}
        <div className="space-y-0 mb-5 pb-5 border-b border-slate-100">
          {/* Total Events */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-600">Total events</span>
            <span className="text-sm font-bold text-slate-900">
              {String(events.length)}
            </span>
          </div>

          {/* Created */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-600">Created</span>
            <span className="text-sm font-bold text-slate-900">
              {formatFullDate(order.created_at)}
            </span>
          </div>

          {/* Last Activity */}
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <span className="text-sm text-slate-600">Last activity</span>
            <span className="text-sm font-bold text-slate-900">
              {events.length > 0
                ? formatFullDate(events[events.length - 1].timestamp)
                : 'N/A'}
            </span>
          </div>

          {/* Contributors */}
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-slate-600">Contributors</span>
            <span className="text-sm font-bold text-slate-900">
              {String(uniqueActors.size)}
            </span>
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 text-sm"
        >
          <PiDownloadSimpleBold className="h-4 w-4" />
          Export log (CSV)
        </Button>
      </div>
    </div>
  );
}
