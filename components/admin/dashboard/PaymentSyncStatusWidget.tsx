'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Zap
} from 'lucide-react';

interface PaymentSyncStats {
  stats: {
    pending: number;
    syncing: number;
    synced: number;
    failed: number;
    skipped: number;
  };
  total: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  failedPercent: number;
  recentFailed: Array<{
    id: string;
    transaction_id: string;
    reference: string;
    amount: number;
    zoho_last_sync_error: string;
    updated_at: string;
  }>;
  lastSuccessfulSync: string | null;
  paymentsToday: number;
}

export function PaymentSyncStatusWidget() {
  const [data, setData] = useState<PaymentSyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSyncStats();
  }, []);

  const fetchSyncStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/payments/sync-stats');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch sync stats');
      }

      setData(result.data);
    } catch (err) {
      console.error('Error fetching payment sync stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sync stats');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50';
      case 'unhealthy':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            ZOHO Payment Sync
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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            ZOHO Payment Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={fetchSyncStats}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              ZOHO Payment Sync
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              NetCash → Supabase → ZOHO Billing
            </CardDescription>
          </div>
          <Badge className={getHealthColor(data.healthStatus)}>
            {getHealthIcon(data.healthStatus)}
            <span className="ml-1 capitalize">{data.healthStatus}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{data.stats.synced}</div>
            <div className="text-xs text-green-600">Synced</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-700">{data.stats.pending}</div>
            <div className="text-xs text-yellow-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{data.stats.failed}</div>
            <div className="text-xs text-red-600">Failed</div>
          </div>
        </div>

        {/* Today's Payments */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Today&apos;s Payments</span>
          </div>
          <span className="text-lg font-bold text-blue-700">{data.paymentsToday}</span>
        </div>

        {/* Last Sync Time */}
        {data.lastSuccessfulSync && (
          <div className="text-xs text-gray-500 mb-4">
            Last sync: {formatDate(data.lastSuccessfulSync)}
          </div>
        )}

        {/* Recent Failed Syncs */}
        {data.recentFailed.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-600 mb-2">Recent Failures</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {data.recentFailed.slice(0, 3).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-2 bg-red-50 rounded text-xs"
                >
                  <div>
                    <span className="font-medium text-gray-900">{payment.reference}</span>
                    <span className="text-gray-500 ml-2">{formatCurrency(payment.amount)}</span>
                  </div>
                  <span className="text-red-600 truncate max-w-[120px]" title={payment.zoho_last_sync_error}>
                    {payment.zoho_last_sync_error?.substring(0, 20)}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={fetchSyncStats}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Link href="/admin/billing/payments" className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
