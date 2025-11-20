'use client';

/**
 * ZOHO Billing Sync Monitoring Dashboard
 *
 * Provides real-time monitoring and management of ZOHO Billing integration:
 * - Sync status summary (overall and by entity type)
 * - Recent sync activity logs
 * - Failed sync alerts
 * - Manual retry interface
 *
 * @module app/admin/zoho-sync/page
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, AlertCircle, CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react';

interface SyncStatus {
  total: number;
  synced: number;
  pending: number;
  failed: number;
  syncing: number;
  retrying: number;
}

interface SyncStatusResponse {
  overall: SyncStatus;
  by_entity: {
    customers: SyncStatus;
    subscriptions: SyncStatus;
    invoices: SyncStatus;
    payments: SyncStatus;
  };
  recent_failures: any[];
  sync_health: {
    success_rate: number;
    has_failures: boolean;
    failure_count_24h: number;
  };
}

interface SyncLog {
  id: string;
  entity_type: string;
  entity_id: string;
  zoho_entity_type: string;
  zoho_entity_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  entity_details: any;
}

export default function ZohoSyncDashboard() {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterEntity, setFilterEntity] = useState<string>('');

  // Fetch sync status
  const fetchStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const response = await fetch('/api/admin/zoho-sync/status');
      const result = await response.json();

      if (result.success) {
        setStatus(result.data);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Fetch sync logs
  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterEntity) params.append('entity_type', filterEntity);
      params.append('limit', '50');

      const response = await fetch(`/api/admin/zoho-sync/logs?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data.logs);
      }
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Manual retry
  const handleRetry = async (entityType: string, entityId: string) => {
    const retryKey = `${entityType}-${entityId}`;
    setRetryingIds(prev => new Set(prev).add(retryKey));

    try {
      const response = await fetch('/api/admin/zoho-sync/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully synced ${entityType}`);
        // Refresh data
        fetchStatus();
        fetchLogs();
      } else {
        alert(`Failed to sync: ${result.error}`);
      }
    } catch (error) {
      console.error('Retry error:', error);
      alert('Retry failed');
    } finally {
      setRetryingIds(prev => {
        const updated = new Set(prev);
        updated.delete(retryKey);
        return updated;
      });
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, [filterStatus, filterEntity]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">ZOHO Billing Sync</h1>
          <p className="text-gray-600 mt-2">Monitor and manage ZOHO integration sync status</p>
        </div>
        <button
          onClick={() => {
            fetchStatus();
            fetchLogs();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-circleTel-orange text-white rounded-md hover:bg-opacity-90 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Status Cards */}
      {isLoadingStatus ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
        </div>
      ) : status ? (
        <>
          {/* Overall Health */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Overall Sync Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatusCard
                title="Total Entities"
                value={status.overall.total}
                icon={<Clock />}
                color="bg-blue-500"
              />
              <StatusCard
                title="Synced"
                value={status.overall.synced}
                icon={<CheckCircle />}
                color="bg-green-500"
                subtitle={`${status.sync_health.success_rate}% success rate`}
              />
              <StatusCard
                title="Pending"
                value={status.overall.pending}
                icon={<Clock />}
                color="bg-yellow-500"
              />
              <StatusCard
                title="Failed"
                value={status.overall.failed}
                icon={<XCircle />}
                color="bg-red-500"
                subtitle={`${status.sync_health.failure_count_24h} in last 24h`}
              />
            </div>
          </div>

          {/* By Entity Type */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Sync Status by Entity Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <EntityCard title="Customers" stats={status.by_entity.customers} />
              <EntityCard title="Subscriptions" stats={status.by_entity.subscriptions} />
              <EntityCard title="Invoices" stats={status.by_entity.invoices} />
              <EntityCard title="Payments" stats={status.by_entity.payments} />
            </div>
          </div>
        </>
      ) : null}

      {/* Sync Activity Logs */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Sync Activity</h2>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">All Entity Types</option>
            <option value="customer">Customers</option>
            <option value="subscription">Subscriptions</option>
            <option value="invoice">Invoices</option>
            <option value="payment">Payments</option>
          </select>
        </div>

        {/* Logs Table */}
        {isLoadingLogs ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-circleTel-orange" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    onRetry={handleRetry}
                    isRetrying={retryingIds.has(`${log.entity_type}-${log.entity_id}`)}
                  />
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No sync activity found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Status Card Component
function StatusCard({ title, value, icon, color, subtitle }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <div className={`${color} text-white p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-circleTel-darkNeutral">{value.toLocaleString()}</div>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// Entity Card Component
function EntityCard({ title, stats }: { title: string; stats: SyncStatus }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total:</span>
          <span className="font-medium">{stats.total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-600">Synced:</span>
          <span className="font-medium">{stats.synced}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-yellow-600">Pending:</span>
          <span className="font-medium">{stats.pending}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-red-600">Failed:</span>
          <span className="font-medium">{stats.failed}</span>
        </div>
      </div>
    </div>
  );
}

// Log Row Component
function LogRow({ log, onRetry, isRetrying }: any) {
  const statusColors = {
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    retrying: 'bg-blue-100 text-blue-800'
  };

  const getEntityDetails = () => {
    if (!log.entity_details) return 'N/A';

    if (log.entity_type === 'customer') {
      return log.entity_details.name || log.entity_details.email || 'Unknown';
    } else if (log.entity_type === 'invoice') {
      return log.entity_details.invoice_number || 'Unknown';
    } else if (log.entity_type === 'subscription') {
      return log.entity_details.package_name || 'Unknown';
    } else if (log.entity_type === 'payment') {
      return log.entity_details.reference || 'Unknown';
    }

    return 'N/A';
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 capitalize">{log.entity_type}</div>
        <div className="text-xs text-gray-500">{log.zoho_entity_type}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[log.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
          {log.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {getEntityDetails()}
      </td>
      <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
        {log.error_message || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(log.created_at).toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {log.status === 'failed' && (
          <button
            onClick={() => onRetry(log.entity_type, log.entity_id)}
            disabled={isRetrying}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-circleTel-orange text-white rounded hover:bg-opacity-90 disabled:opacity-50"
          >
            {isRetrying ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RotateCcw className="w-3 h-3" />
            )}
            Retry
          </button>
        )}
      </td>
    </tr>
  );
}
