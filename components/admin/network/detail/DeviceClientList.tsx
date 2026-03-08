'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PiWifiHighBold,
  PiWifiMediumBold,
  PiWifiLowBold,
  PiWifiSlashBold,
  PiDevicesBold,
  PiArrowsClockwiseBold,
  PiUsersBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionCard } from '@/components/admin/shared';

interface RuijieClient {
  mac: string;
  userIp: string;
  ssid: string;
  rssi: number;
  band: string;
  channel: number;
  sn: string;
  signalQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface DeviceClientListProps {
  sn: string;
}

const QUALITY_CONFIG = {
  excellent: {
    label: 'Excellent',
    icon: PiWifiHighBold,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  good: {
    label: 'Good',
    icon: PiWifiHighBold,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  fair: {
    label: 'Fair',
    icon: PiWifiMediumBold,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
  poor: {
    label: 'Poor',
    icon: PiWifiLowBold,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
  },
};

function SignalIndicator({ rssi, quality }: { rssi: number; quality: 'excellent' | 'good' | 'fair' | 'poor' }) {
  const config = QUALITY_CONFIG[quality];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded ${config.bg}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="text-sm">
        <span className="font-mono">{rssi} dBm</span>
      </div>
    </div>
  );
}

export function DeviceClientList({ sn }: DeviceClientListProps) {
  const [clients, setClients] = useState<RuijieClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch(`/api/ruijie/devices/${sn}/clients`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClients(data.clients || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setError('Failed to load connected clients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sn]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchClients();
  };

  // Count clients by quality
  const qualityCounts = clients.reduce(
    (acc, client) => {
      acc[client.signalQuality]++;
      return acc;
    },
    { excellent: 0, good: 0, fair: 0, poor: 0 }
  );

  if (loading) {
    return (
      <SectionCard icon={PiUsersBold} title="Connected Clients" compact>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 mt-3 text-sm">Loading clients...</p>
          </div>
        </div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard icon={PiUsersBold} title="Connected Clients" compact>
        <div className="text-center py-8">
          <PiWifiSlashBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <PiDevicesBold className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Clients</p>
            </div>
          </div>
        </div>
        {(['excellent', 'good', 'fair', 'poor'] as const).map((quality) => {
          const config = QUALITY_CONFIG[quality];
          const Icon = config.icon;
          return (
            <div key={quality} className={`rounded-lg border p-4 ${config.bg} ${config.border}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/60`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${config.color}`}>{qualityCounts[quality]}</p>
                  <p className={`text-xs uppercase tracking-wider ${config.color} opacity-80`}>
                    {config.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Client List */}
      <SectionCard
        icon={PiUsersBold}
        title="Connected Clients"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <PiArrowsClockwiseBold className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
        compact
      >
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <PiDevicesBold className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No clients currently connected</p>
            <p className="text-slate-400 text-sm mt-1">
              Clients will appear here when devices connect to this AP
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    MAC Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    SSID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Band
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Signal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Quality
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clients.map((client) => {
                  const config = QUALITY_CONFIG[client.signalQuality];
                  return (
                    <tr key={client.mac} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-slate-900">{client.mac}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-slate-600">{client.userIp}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-900">{client.ssid}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono">
                          {client.band}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-slate-600">{client.channel}</span>
                      </td>
                      <td className="px-4 py-3">
                        <SignalIndicator rssi={client.rssi} quality={client.signalQuality} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${config.badge} border-0`}>
                          {config.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
