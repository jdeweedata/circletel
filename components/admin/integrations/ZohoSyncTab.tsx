'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  RotateCcw,
  Loader2,
  User,
  Package,
  FileSpreadsheet,
  CreditCard,
} from 'lucide-react';
import { ManualSyncForm } from './ManualSyncForm';

interface ZohoSyncLog {
  id: string;
  entity_type: 'customer' | 'subscription' | 'invoice' | 'payment';
  entity_id: string;
  status: 'success' | 'failed' | 'pending' | 'retrying';
  zoho_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  entity_details: {
    name?: string;
    email?: string;
    invoice_number?: string;
    amount?: number;
    customer_name?: string;
    package_name?: string;
    reference?: string;
  } | null;
}

interface ZohoSyncTabProps {
  isActive: boolean;
}

/**
 * ZohoSyncTab - Manages Zoho Billing synchronization
 * Displays sync logs, status summaries, and manual sync controls
 */
export function ZohoSyncTab({ isActive }: ZohoSyncTabProps) {
  const [syncLogs, setSyncLogs] = useState<ZohoSyncLog[]>([]);
  const [syncLogsLoading, setSyncLogsLoading] = useState(false);
  const [syncLogFilter, setSyncLogFilter] = useState<string>('all');
  const [syncStatusFilter, setSyncStatusFilter] = useState<string>('all');
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const fetchSyncLogs = useCallback(async () => {
    try {
      setSyncLogsLoading(true);
      const params = new URLSearchParams();
      if (syncLogFilter !== 'all') params.set('entity_type', syncLogFilter);
      if (syncStatusFilter !== 'all') params.set('status', syncStatusFilter);
      params.set('limit', '50');

      const response = await fetch(`/api/admin/zoho-sync/logs?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch sync logs (${response.status})`);
      }

      const data = await response.json();
      setSyncLogs(data.data?.logs || []);
    } catch (err) {
      console.error('Error fetching sync logs:', err);
    } finally {
      setSyncLogsLoading(false);
    }
  }, [syncLogFilter, syncStatusFilter]);

  const handleRetrySync = async (entityType: string, entityId: string) => {
    const key = `${entityType}-${entityId}`;
    setRetryingIds(prev => new Set(prev).add(key));

    try {
      const response = await fetch('/api/admin/zoho-sync/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchSyncLogs();
      } else {
        alert(`Retry failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error retrying sync:', err);
      alert('Failed to retry sync. Please try again.');
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Fetch logs when tab becomes active or filters change
  useEffect(() => {
    if (isActive) {
      fetchSyncLogs();
    }
  }, [isActive, fetchSyncLogs]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEntityLabel = (log: ZohoSyncLog) => {
    if (!log.entity_details) return log.entity_id.slice(0, 8) + '...';

    switch (log.entity_type) {
      case 'customer':
        return log.entity_details.name || log.entity_details.email || log.entity_id.slice(0, 8);
      case 'subscription':
        return log.entity_details.package_name || log.entity_id.slice(0, 8);
      case 'invoice':
        return log.entity_details.invoice_number || log.entity_id.slice(0, 8);
      case 'payment':
        return log.entity_details.reference || log.entity_id.slice(0, 8);
      default:
        return log.entity_id.slice(0, 8);
    }
  };

  const entityIcons = {
    customer: <User className="h-4 w-4" />,
    subscription: <Package className="h-4 w-4" />,
    invoice: <FileSpreadsheet className="h-4 w-4" />,
    payment: <CreditCard className="h-4 w-4" />,
  };

  const statusConfig = {
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: <CheckCircle className="h-4 w-4" /> },
    failed: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: <XCircle className="h-4 w-4" /> },
    pending: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: <Clock className="h-4 w-4" /> },
    retrying: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: <RefreshCw className="h-4 w-4 animate-spin" /> },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-circleTel-orange" />
          Zoho Billing Sync Management
        </CardTitle>
        <CardDescription>
          Monitor and manage synchronization between CircleTel and Zoho Billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sync Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {syncLogs.filter(l => l.status === 'success').length}
              </div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {syncLogs.filter(l => l.status === 'failed').length}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">
                {syncLogs.filter(l => l.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <RefreshCw className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {syncLogs.filter(l => l.status === 'retrying').length}
              </div>
              <div className="text-sm text-muted-foreground">Retrying</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Entity Type:</span>
                <select
                  value={syncLogFilter}
                  onChange={(e) => setSyncLogFilter(e.target.value)}
                  className="border px-3 py-2 rounded-lg text-sm bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                >
                  <option value="all">All Types</option>
                  <option value="customer">Customers</option>
                  <option value="subscription">Subscriptions</option>
                  <option value="invoice">Invoices</option>
                  <option value="payment">Payments</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <select
                  value={syncStatusFilter}
                  onChange={(e) => setSyncStatusFilter(e.target.value)}
                  className="border px-3 py-2 rounded-lg text-sm bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="retrying">Retrying</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSyncLogs}
                disabled={syncLogsLoading}
                className="ml-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncLogsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Sync Activity</CardTitle>
            <CardDescription>Last 50 sync operations</CardDescription>
          </CardHeader>
          <CardContent>
            {syncLogsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
              </div>
            ) : syncLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <RotateCcw className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium mb-1">No sync logs found</p>
                <p className="text-sm">Sync activity will appear here when data is synchronized with Zoho</p>
              </div>
            ) : (
              <div className="space-y-3">
                {syncLogs.map((log) => {
                  const isRetrying = retryingIds.has(`${log.entity_type}-${log.entity_id}`);
                  const status = statusConfig[log.status];

                  return (
                    <div
                      key={log.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${status.bg} ${status.border}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${status.bg} ${status.text}`}>
                          {entityIcons[log.entity_type]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm capitalize">{log.entity_type}</span>
                            <Badge variant="outline" className="text-xs">
                              {getEntityLabel(log)}
                            </Badge>
                            <Badge className={`${status.bg} ${status.text} ${status.border} text-xs`}>
                              {status.icon}
                              <span className="ml-1 capitalize">{log.status}</span>
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDate(log.created_at)}
                            {log.zoho_id && (
                              <span className="ml-2">
                                Zoho ID: <code className="bg-muted px-1 rounded">{log.zoho_id}</code>
                              </span>
                            )}
                          </div>
                          {log.error_message && (
                            <div className="text-xs text-red-600 mt-1 max-w-md truncate">
                              Error: {log.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                      {log.status === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetrySync(log.entity_type, log.entity_id)}
                          disabled={isRetrying}
                          className="text-circleTel-orange border-circleTel-orange hover:bg-circleTel-orange hover:text-white"
                        >
                          {isRetrying ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Retry
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Sync Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manual Sync</CardTitle>
            <CardDescription>Manually trigger a sync for a specific entity</CardDescription>
          </CardHeader>
          <CardContent>
            <ManualSyncForm onSync={handleRetrySync} isRetrying={retryingIds.size > 0} />
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
