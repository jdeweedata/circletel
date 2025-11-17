'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  CheckCircle,
  Tool,
  FileText,
  AlertCircle,
  Loader2,
  Clock,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'communication' | 'installation' | 'payment';
  timestamp: string;
  title: string;
  description?: string;
  details: Record<string, any>;
  icon?: string;
}

interface TimelineStats {
  totalEvents: number;
  statusChanges: number;
  communications: number;
  installationEvents: number;
}

interface CommunicationTimelineProps {
  orderId: string;
  className?: string;
}

export function CommunicationTimeline({ orderId, className }: CommunicationTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimeline();
  }, [orderId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/orders/${orderId}/timeline`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch timeline');
      }

      setTimeline(result.data.timeline || []);
      setStats(result.data.stats || null);
    } catch (err) {
      console.error('Error fetching timeline:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (event: TimelineEvent) => {
    // Map icon strings to components
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      status: CheckCircle,
      email: Mail,
      sms: MessageSquare,
      whatsapp: MessageSquare,
      call: Phone,
      calendar: Calendar,
      tool: Tool,
      check: CheckCircle,
      create: FileText,
      internal_note: FileText,
      system_notification: AlertCircle,
    };

    const IconComponent = iconMap[event.icon || event.type] || AlertCircle;
    return IconComponent;
  };

  const getEventColor = (event: TimelineEvent) => {
    switch (event.type) {
      case 'status_change':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'communication':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'installation':
        return 'bg-green-100 text-green-600 border-green-200';
      case 'payment':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
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

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order Timeline
          </CardTitle>
          {stats && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{stats.totalEvents} events</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No timeline events yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200" />

            {/* Timeline events */}
            <div className="space-y-6">
              {timeline.map((event, index) => {
                const Icon = getIcon(event);
                const isLast = index === timeline.length - 1;

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center z-10',
                        getEventColor(event)
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                        <time className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTimestamp(event.timestamp)}
                        </time>
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}

                      {/* Event details */}
                      {event.details && typeof event.details === 'object' && Object.keys(event.details).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {/* Status change details */}
                          {event.type === 'status_change' && event.details.toStatus && (
                            <div className="flex items-center gap-2 text-xs">
                              {event.details.fromStatus && (
                                <>
                                  <Badge variant="outline" className="text-xs">
                                    {String(event.details.fromStatus).replace(/_/g, ' ')}
                                  </Badge>
                                  <span className="text-gray-400">→</span>
                                </>
                              )}
                              <Badge variant="default" className="text-xs">
                                {String(event.details.toStatus).replace(/_/g, ' ')}
                              </Badge>
                              {event.details.changedBy && (
                                <span className="text-gray-500 flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {String(event.details.changedBy)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Communication details */}
                          {event.type === 'communication' && event.details.channel && (
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Channel:</span>
                                <span className="capitalize">{String(event.details.channel)}</span>
                                {event.details.status && (
                                  <Badge
                                    variant={
                                      event.details.status === 'delivered'
                                        ? 'default'
                                        : event.details.status === 'failed'
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {String(event.details.status)}
                                  </Badge>
                                )}
                              </div>
                              {event.details.recipient && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">To:</span>
                                  <span>{String(event.details.recipient)}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Installation details */}
                          {event.type === 'installation' && event.details.technician && (
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span>Technician: {String(event.details.technician)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
