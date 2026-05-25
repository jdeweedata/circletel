'use client';
import { PiCheckCircleBold, PiRadioBold, PiUsersBold, PiWarningCircleBold } from 'react-icons/pi';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BaseStationStatsProps {
  totalStations: number;
  totalConnections: number;
  avgConnections: number;
  marketCount: number;
  onlineStations: number;
  offlineStations: number;
  loading?: boolean;
}

export function BaseStationStats({
  totalStations,
  totalConnections,
  avgConnections,
  marketCount,
  onlineStations,
  offlineStations,
  loading = false,
}: BaseStationStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mb-1" />
              <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const onlinePct = totalStations > 0 ? ((onlineStations / totalStations) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
          <PiRadioBold className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStations.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Active Tarana base stations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Online BNs</CardTitle>
          <PiCheckCircleBold className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{onlineStations.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{onlinePct}% of base stations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Offline BNs</CardTitle>
          <PiWarningCircleBold className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{offlineStations.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Require attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
          <PiUsersBold className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalConnections.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Active customer connections</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg / Station</CardTitle>
          <PiUsersBold className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgConnections}</div>
          <p className="text-xs text-muted-foreground">Connections per station</p>
        </CardContent>
      </Card>
    </div>
  );
}
