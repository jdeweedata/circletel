'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import type { PaymentProviderType } from '@/lib/types/payment.types';

interface ProviderCapabilities {
  supports_cards: boolean;
  supports_eft: boolean;
  supports_instant_eft: boolean;
  supports_recurring: boolean;
  supports_refunds: boolean;
  supported_currencies: string[];
  max_amount: number | null;
  min_amount: number;
}

interface ProviderHealthCheck {
  provider: PaymentProviderType;
  healthy: boolean;
  configured: boolean;
  available: boolean;
  response_time_ms: number;
  capabilities?: ProviderCapabilities;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  timestamp: string;
  response_time_ms: number;
  providers: ProviderHealthCheck[];
  summary: {
    total_providers: number;
    healthy_providers: number;
    unhealthy_providers: number;
    configured_providers: number;
    unconfigured_providers: number;
  };
  error?: string;
  message?: string;
}

export default function PaymentMonitoringDashboard() {
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Fetch health data
  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/health?detailed=true');
      const data: HealthCheckResponse = await response.json();
      setHealthData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchHealthData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealthData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get status badge
  const getStatusBadge = (healthy: boolean, configured: boolean) => {
    if (!configured) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-700">Not Configured</Badge>;
    }
    if (healthy) {
      return <Badge variant="outline" className="bg-green-100 text-green-700">Healthy</Badge>;
    }
    return <Badge variant="outline" className="bg-red-100 text-red-700">Unhealthy</Badge>;
  };

  // Get provider display name
  const getProviderName = (provider: PaymentProviderType): string => {
    const names: Record<PaymentProviderType, string> = {
      'netcash': 'NetCash Pay Now',
      'zoho_billing': 'ZOHO Billing',
      'payfast': 'PayFast',
      'paygate': 'PayGate'
    };
    return names[provider] || provider;
  };

  // Get provider icon/logo
  const getProviderIcon = (provider: PaymentProviderType): string => {
    // You can replace these with actual logos
    return provider.toUpperCase().charAt(0);
  };

  if (loading && !healthData) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-circleTel-orange" />
          <span className="ml-3 text-lg">Loading payment provider status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral">Payment Provider Monitoring</h1>
          <p className="text-circleTel-secondaryNeutral mt-1">
            Real-time health status and monitoring for payment gateways
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-circleTel-secondaryNeutral">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Last refresh: {lastRefresh.toLocaleTimeString()}</span>
            </div>
          </div>
          <Button
            onClick={() => fetchHealthData()}
            disabled={loading}
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Card */}
      {healthData && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${getStatusColor(healthData.status)} animate-pulse`} />
                  Overall System Status
                </CardTitle>
                <CardDescription className="mt-2">
                  {healthData.status === 'healthy' && 'All payment providers are operational'}
                  {healthData.status === 'degraded' && 'Some payment providers are experiencing issues'}
                  {healthData.status === 'unhealthy' && 'Payment system is experiencing critical issues'}
                  {healthData.status === 'error' && 'Unable to retrieve payment system status'}
                </CardDescription>
              </div>
              <Badge
                className={`${getStatusColor(healthData.status)} text-white px-4 py-2 text-base`}
              >
                {healthData.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Activity className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {healthData.summary.total_providers}
                  </div>
                  <div className="text-sm text-blue-700">Total Providers</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-900">
                    {healthData.summary.healthy_providers}
                  </div>
                  <div className="text-sm text-green-700">Healthy</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-900">
                    {healthData.summary.unhealthy_providers}
                  </div>
                  <div className="text-sm text-red-700">Unhealthy</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-900">
                    {healthData.response_time_ms}ms
                  </div>
                  <div className="text-sm text-orange-700">Response Time</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-refresh Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Auto-refresh Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'default' : 'outline'}
              className={autoRefresh ? 'bg-circleTel-orange hover:bg-circleTel-orange/90' : ''}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
            {autoRefresh && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-circleTel-secondaryNeutral">Refresh every:</span>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="border rounded-md px-3 py-2 text-sm"
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provider Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {healthData?.providers.map((provider) => (
          <Card key={provider.provider} className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-circleTel-orange text-white flex items-center justify-center font-bold text-xl">
                    {getProviderIcon(provider.provider)}
                  </div>
                  <div>
                    <CardTitle>{getProviderName(provider.provider)}</CardTitle>
                    <CardDescription className="mt-1">{provider.provider}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(provider.healthy, provider.configured)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Indicators */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2 text-sm">
                  {provider.configured ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={provider.configured ? 'text-green-700' : 'text-gray-500'}>
                    Configured
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {provider.available ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={provider.available ? 'text-green-700' : 'text-red-700'}>
                    Available
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-700">{provider.response_time_ms}ms</span>
                </div>
              </div>

              {/* Capabilities */}
              {provider.capabilities && (
                <div className="space-y-3">
                  <div className="font-semibold text-sm text-circleTel-darkNeutral">Capabilities</div>

                  <div className="flex flex-wrap gap-2">
                    {provider.capabilities.supports_cards && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        💳 Cards
                      </Badge>
                    )}
                    {provider.capabilities.supports_eft && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        🏦 EFT
                      </Badge>
                    )}
                    {provider.capabilities.supports_instant_eft && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        ⚡ Instant EFT
                      </Badge>
                    )}
                    {provider.capabilities.supports_recurring && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        🔄 Recurring
                      </Badge>
                    )}
                    {provider.capabilities.supports_refunds && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        ↩️ Refunds
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                    <div>
                      <span className="text-circleTel-secondaryNeutral">Currencies:</span>
                      <div className="font-medium text-circleTel-darkNeutral">
                        {provider.capabilities.supported_currencies?.join(', ') || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-circleTel-secondaryNeutral">Amount Range:</span>
                      <div className="font-medium text-circleTel-darkNeutral">
                        R{provider.capabilities.min_amount ?? 0} -
                        {provider.capabilities.max_amount
                          ? ` R${provider.capabilities.max_amount}`
                          : ' Unlimited'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning for unconfigured providers */}
              {!provider.configured && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <div className="font-semibold">Configuration Required</div>
                    <div className="mt-1">
                      This provider is not configured. Add the required environment variables to enable it.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error State */}
      {healthData?.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Health Check Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{healthData.message || healthData.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
