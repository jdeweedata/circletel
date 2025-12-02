'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Activity,
  Webhook,
  RotateCcw,
  User,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

interface UnifiedLog {
  id: string;
  log_type: 'activity' | 'webhook' | 'sync';
  event_type: string;
  status: 'success' | 'failed' | 'pending' | 'processing' | 'retry';
  message: string;
  details: Record<string, unknown> | null;
  user_email: string | null;
  ip_address: string | null;
  created_at: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
}

interface IntegrationLogsTableProps {
  logs: UnifiedLog[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function IntegrationLogsTable({
  logs,
  isLoading = false,
  emptyMessage = 'No logs found',
}: IntegrationLogsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'retry':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      success: 'bg-green-50 text-green-700 border-green-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      processing: 'bg-blue-50 text-blue-700 border-blue-200',
      retry: 'bg-orange-50 text-orange-700 border-orange-200',
    };

    return (
      <Badge className={config[status as keyof typeof config] || 'bg-gray-50 text-gray-700 border-gray-200'}>
        {status}
      </Badge>
    );
  };

  const getLogTypeIcon = (logType: string) => {
    switch (logType) {
      case 'activity':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'webhook':
        return <Webhook className="w-4 h-4 text-blue-600" />;
      case 'sync':
        return <RotateCcw className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLogTypeBadge = (logType: string) => {
    const config = {
      activity: 'bg-purple-50 text-purple-700 border-purple-200',
      webhook: 'bg-blue-50 text-blue-700 border-blue-200',
      sync: 'bg-orange-50 text-orange-700 border-orange-200',
    };

    return (
      <Badge variant="outline" className={config[logType as keyof typeof config] || 'bg-gray-50 text-gray-700'}>
        {getLogTypeIcon(logType)}
        <span className="ml-1 capitalize">{logType}</span>
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium mb-1">{emptyMessage}</p>
        <p className="text-sm">Logs will appear here when activity occurs</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const isExpanded = expandedRows.has(log.id);
        const hasDetails = log.details && Object.keys(log.details).some(k => log.details![k] != null);

        return (
          <div
            key={log.id}
            className={`border rounded-lg transition-all ${
              log.status === 'failed' ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-white'
            }`}
          >
            {/* Main Row */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50"
              onClick={() => hasDetails && toggleRow(log.id)}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(log.status)}
                </div>

                {/* Log Type & Event */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getLogTypeBadge(log.log_type)}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {formatEventType(log.event_type)}
                    </span>
                    {getStatusBadge(log.status)}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {log.message}
                  </p>
                </div>
              </div>

              {/* Right Side Info */}
              <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                {/* User/IP */}
                {(log.user_email || log.ip_address) && (
                  <div className="text-right hidden md:block">
                    {log.user_email && (
                      <div className="text-xs text-gray-600 truncate max-w-[150px]">
                        {log.user_email}
                      </div>
                    )}
                    {log.ip_address && (
                      <div className="text-xs text-gray-400 font-mono">
                        {log.ip_address}
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(log.created_at)}
                </div>

                {/* Expand Button */}
                {hasDetails && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(log.id);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && hasDetails && (
              <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
                <div className="pt-3 space-y-3">
                  {/* Related Entity */}
                  {log.related_entity_type && log.related_entity_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Related:</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.related_entity_type}: {log.related_entity_id.slice(0, 8)}...
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  )}

                  {/* Details JSON */}
                  <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                      {JSON.stringify(
                        Object.fromEntries(
                          Object.entries(log.details || {}).filter(([_, v]) => v != null)
                        ),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
