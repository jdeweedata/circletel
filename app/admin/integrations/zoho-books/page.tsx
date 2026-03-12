'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PiBooksBold,
  PiUsersBold,
  PiFilePdfBold,
  PiCreditCardBold,
  PiWarningBold,
  PiArrowsClockwiseBold,
  PiCheckCircleBold,
  PiXCircleBold,
  PiClockBold,
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared/StatCard';
import { SectionCard } from '@/components/admin/shared/SectionCard';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    credentials: { status: 'pass' | 'fail'; message: string };
    tokenRefresh: { status: 'pass' | 'fail'; message: string; duration_ms?: number };
    apiConnection: { status: 'pass' | 'fail'; message: string; duration_ms?: number };
  };
  stats: {
    customersTotal: number;
    customersSynced: number;
    invoicesTotal: number;
    invoicesSynced: number;
    paymentsTotal: number;
    paymentsSynced: number;
    failedCount: number;
  };
  lastSync: {
    timestamp: string;
    duration_ms: number;
    result: 'success' | 'partial' | 'failed';
  } | null;
  details: {
    region: string;
    organizationId: string;
    apiLatencyMs: number;
  };
}

interface FailedEntity {
  type: 'customer' | 'invoice' | 'payment';
  id: string;
  displayId: string;
  error: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  lastAttempt: string;
}

interface FailedResponse {
  entities: FailedEntity[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function ZohoBooksAdminPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [failed, setFailed] = useState<FailedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/zoho/books/health');
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  }, []);

  const fetchFailed = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/zoho/books/failed?page=${page}&pageSize=10`);
      const data = await res.json();
      setFailed(data);
    } catch (error) {
      console.error('Failed to fetch failed entities:', error);
    }
  }, [page]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchHealth(), fetchFailed()]);
      setLoading(false);
    };
    load();
  }, [fetchHealth, fetchFailed]);

  const handleSync = async (type: 'full' | 'customers' | 'invoices' | 'payments') => {
    setSyncing(type);
    try {
      await fetch('/api/admin/zoho/books/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      await Promise.all([fetchHealth(), fetchFailed()]);
    } finally {
      setSyncing(null);
    }
  };

  const handleRetry = async (entityType: string, entityId: string) => {
    await fetch('/api/admin/zoho/books/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId }),
    });
    await Promise.all([fetchHealth(), fetchFailed()]);
  };

  const handleReset = async (entityType: string, entityId: string) => {
    await fetch('/api/admin/zoho/books/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType, entityId }),
    });
    await fetchFailed();
  };

  const handleRetryAll = async () => {
    setSyncing('retry-all');
    try {
      await fetch('/api/admin/zoho/books/retry-all', { method: 'POST' });
      await Promise.all([fetchHealth(), fetchFailed()]);
    } finally {
      setSyncing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'customer': return <PiUsersBold className="w-4 h-4" />;
      case 'invoice': return <PiFilePdfBold className="w-4 h-4" />;
      case 'payment': return <PiCreditCardBold className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <PiBooksBold className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Zoho Books Integration</h1>
            <p className="text-gray-500">Accounting sync for customers, invoices, payments</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {health && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
              {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
            </span>
          )}
          <button
            onClick={() => Promise.all([fetchHealth(), fetchFailed()])}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <PiArrowsClockwiseBold className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {health && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Customers"
            value={`${health.stats.customersSynced}/${health.stats.customersTotal}`}
            subtitle="synced"
            icon={<PiUsersBold className="w-5 h-5" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            label="Invoices"
            value={`${health.stats.invoicesSynced}/${health.stats.invoicesTotal}`}
            subtitle="synced"
            icon={<PiFilePdfBold className="w-5 h-5" />}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatCard
            label="Payments"
            value={`${health.stats.paymentsSynced}/${health.stats.paymentsTotal}`}
            subtitle="synced"
            icon={<PiCreditCardBold className="w-5 h-5" />}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard
            label="Failed"
            value={health.stats.failedCount.toString()}
            subtitle="pending retry"
            icon={<PiWarningBold className="w-5 h-5" />}
            iconBgColor={health.stats.failedCount > 0 ? 'bg-red-100' : 'bg-gray-100'}
            iconColor={health.stats.failedCount > 0 ? 'text-red-600' : 'text-gray-600'}
          />
        </div>
      )}

      {/* Health Checks & Quick Actions */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Health Checks */}
        <SectionCard title="Health Checks">
          <div className="space-y-3">
            {health && Object.entries(health.checks).map(([key, check]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  {check.status === 'pass' ? (
                    <PiCheckCircleBold className="w-5 h-5 text-green-500" />
                  ) : (
                    <PiXCircleBold className="w-5 h-5 text-red-500" />
                  )}
                  <span className="font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="max-w-[200px] truncate" title={check.message}>
                    {check.message}
                  </span>
                  {'duration_ms' in check && check.duration_ms !== undefined && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{check.duration_ms}ms</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard title="Quick Actions">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSync('full')}
                disabled={!!syncing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {syncing === 'full' && <span className="animate-spin">⟳</span>}
                Run Full Sync
              </button>
              <button
                onClick={() => handleSync('customers')}
                disabled={!!syncing}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {syncing === 'customers' ? '⟳ ' : ''}Customers
              </button>
              <button
                onClick={() => handleSync('invoices')}
                disabled={!!syncing}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {syncing === 'invoices' ? '⟳ ' : ''}Invoices
              </button>
              <button
                onClick={() => handleSync('payments')}
                disabled={!!syncing}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {syncing === 'payments' ? '⟳ ' : ''}Payments
              </button>
            </div>

            {health?.lastSync && (
              <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t">
                <PiClockBold className="w-4 h-4" />
                <span>Last sync: {new Date(health.lastSync.timestamp).toLocaleString()}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{health.lastSync.duration_ms}ms</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  health.lastSync.result === 'success' ? 'bg-green-100 text-green-700' :
                  health.lastSync.result === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {health.lastSync.result}
                </span>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Failed Entities Table */}
      <SectionCard
        title="Failed Entities"
        action={
          failed && failed.entities.length > 0 ? (
            <button
              onClick={handleRetryAll}
              disabled={!!syncing}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
            >
              {syncing === 'retry-all' ? '⟳ Retrying...' : 'Retry All Failed'}
            </button>
          ) : null
        }
      >
        {failed && failed.entities.length > 0 ? (
          <>
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Entity ID</th>
                  <th className="pb-2">Error</th>
                  <th className="pb-2">Retries</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {failed.entities.map((entity) => (
                  <tr key={`${entity.type}-${entity.id}`} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(entity.type)}
                        <span className="capitalize">{entity.type}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-sm">{entity.displayId}</td>
                    <td className="py-3 text-sm text-gray-600 max-w-xs truncate" title={entity.error}>
                      {entity.error}
                    </td>
                    <td className="py-3">
                      <span className={`text-sm ${entity.retryCount >= entity.maxRetries ? 'text-red-600 font-medium' : ''}`}>
                        {entity.retryCount}/{entity.maxRetries}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleRetry(entity.type, entity.id)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Retry
                        </button>
                        <button
                          onClick={() => handleReset(entity.type, entity.id)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {failed.pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">
                  Page {failed.pagination.page} of {failed.pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(failed.pagination.totalPages, p + 1))}
                    disabled={page === failed.pagination.totalPages}
                    className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <PiCheckCircleBold className="w-12 h-12 mx-auto mb-2 text-green-400" />
            <p>All entities synced successfully</p>
          </div>
        )}
      </SectionCard>

      {/* Details Footer */}
      {health && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <div className="flex gap-6">
            <span>Region: <strong>{health.details.region}</strong></span>
            <span>Org ID: <strong>{health.details.organizationId}</strong></span>
            <span>API Latency: <strong>{health.details.apiLatencyMs}ms</strong></span>
          </div>
          <span>Last checked: {new Date(health.timestamp).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
