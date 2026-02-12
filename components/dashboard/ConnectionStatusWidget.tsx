'use client';

import React, { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Globe,
  Activity,
  AlertCircle
} from 'lucide-react';

interface ConnectionStatus {
  isConnected: boolean;
  ipAddress: string | null;
  sessionDuration: number | null;
  sessionStart: string | null;
  lastSeen: string | null;
  totalSessionsToday: number;
  terminateCauses: Record<string, number>;
  subscriberId: string | null;
  error?: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatTime(isoString: string | null): string {
  if (!isoString) return '--';

  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '--';
  }
}

export function ConnectionStatusWidget() {
  const { session } = useCustomerAuth();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async (isRefresh = false) => {
    if (!session?.access_token) return;

    if (isRefresh) setRefreshing(true);

    try {
      const response = await fetch('/api/dashboard/connection-status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch connection status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchStatus(), 30000);

    return () => clearInterval(interval);
  }, [session?.access_token]);

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-100 rounded w-24 animate-pulse mb-2" />
              <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status || !status.subscriberId) {
    return null; // Don't show widget if no service
  }

  const isConnected = status.isConnected;

  return (
    <Card className={`border-2 ${isConnected ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  Connection Status
                </span>
                <Badge
                  variant="outline"
                  className={isConnected
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-red-100 text-red-700 border-red-300'
                  }
                >
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>

              {status.error ? (
                <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {status.error}
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-600">
                  {status.ipAddress && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      {status.ipAddress}
                    </span>
                  )}
                  {status.sessionDuration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(status.sessionDuration)}
                    </span>
                  )}
                  {status.totalSessionsToday > 0 && (
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" />
                      {status.totalSessionsToday} session{status.totalSessionsToday !== 1 ? 's' : ''} today
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {!isConnected && status.lastSeen && (
          <p className="text-xs text-gray-500 mt-3 pl-12">
            Last connected at {formatTime(status.lastSeen)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default ConnectionStatusWidget;
