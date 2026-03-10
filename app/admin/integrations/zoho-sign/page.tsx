'use client';

import { useState, useEffect } from 'react';
import {
  PiCheckCircleBold,
  PiWarningBold,
  PiXCircleBold,
  PiArrowClockwiseBold,
  PiFilePdfBold,
  PiUsersBold,
  PiClockBold,
  PiLinkBold
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared/StatCard';
import { SectionCard } from '@/components/admin/shared/SectionCard';

interface CheckResult {
  status: 'pass' | 'fail';
  message: string;
  duration_ms?: number;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    credentials: CheckResult;
    tokenRefresh: CheckResult;
    apiConnection: CheckResult;
  };
  details?: {
    region: string;
    scopes?: string[];
    requestCount?: number;
  };
}

export default function ZohoSignPage() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/zoho/sign/health');
      const data = await response.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return <PiCheckCircleBold className="h-6 w-6 text-green-500" />;
      case 'degraded':
        return <PiWarningBold className="h-6 w-6 text-yellow-500" />;
      case 'unhealthy':
        return <PiXCircleBold className="h-6 w-6 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'healthy' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getCheckStatusIcon = (status: 'pass' | 'fail') => {
    return status === 'pass'
      ? <PiCheckCircleBold className="h-5 w-5 text-green-500" />
      : <PiXCircleBold className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <PiFilePdfBold className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Zoho Sign Integration</h1>
                <p className="text-slate-500">Digital signature service for contracts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {health && (
                <div className={`px-4 py-2 rounded-full border font-medium flex items-center gap-2 ${getStatusColor(health.status)}`}>
                  {getStatusIcon(health.status)}
                  <span className="capitalize">{health.status}</span>
                </div>
              )}
              <button
                onClick={fetchHealth}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <PiArrowClockwiseBold className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <PiXCircleBold className="h-5 w-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Requests"
              value={health.details?.requestCount?.toString() || '0'}
              icon={<PiFilePdfBold className="h-5 w-5" />}
            />
            <StatCard
              label="Region"
              value={health.details?.region || 'US'}
              icon={<PiLinkBold className="h-5 w-5" />}
            />
            <StatCard
              label="API Latency"
              value={`${health.checks.apiConnection.duration_ms || 0}ms`}
              icon={<PiClockBold className="h-5 w-5" />}
            />
            <StatCard
              label="Token Refresh"
              value={`${health.checks.tokenRefresh.duration_ms || 0}ms`}
              icon={<PiArrowClockwiseBold className="h-5 w-5" />}
            />
          </div>
        )}

        {/* Health Checks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Health Checks" icon={PiCheckCircleBold}>
            {loading && !health ? (
              <div className="flex items-center justify-center py-8">
                <PiArrowClockwiseBold className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : health ? (
              <div className="space-y-4">
                {Object.entries(health.checks).map(([key, check]) => (
                  <div key={key} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    {getCheckStatusIcon(check.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        {check.duration_ms && (
                          <span className="text-sm text-slate-500">{check.duration_ms}ms</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{check.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="API Scopes" icon={PiUsersBold}>
            {health?.details?.scopes ? (
              <div className="space-y-2">
                {health.details.scopes.map((scope) => (
                  <div key={scope} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <PiCheckCircleBold className="h-4 w-4 text-green-500" />
                    <code className="text-sm text-slate-700">{scope}</code>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Scopes will appear once connected</p>
            )}
          </SectionCard>
        </div>

        {/* Last Check */}
        {health && (
          <div className="mt-6 text-center text-sm text-slate-500">
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
