'use client';
import { PiArrowsClockwiseBold, PiBuildingBold, PiBuildingsBold, PiMapPinBold } from 'react-icons/pi';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface DFABuildingStatsProps {
  totalBuildings: number;
  connectedCount: number;
  nearNetCount: number;
  precinctCount: number;
  lastSync?: {
    id: string;
    status: string;
    connectedCount: number;
    nearNetCount: number;
    durationMs: number;
    completedAt: string;
  } | null;
  loading?: boolean;
}

export function DFABuildingStats({
  totalBuildings,
  connectedCount,
  nearNetCount,
  precinctCount,
  lastSync,
  loading = false,
}: DFABuildingStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Connected Buildings</CardTitle>
          <PiBuildingBold className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-700">
            {connectedCount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Active DFA fiber connections
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Near-Net Buildings</CardTitle>
          <PiBuildingsBold className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-700">
            {nearNetCount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Within 200m of fiber network
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Buildings</CardTitle>
          <PiBuildingBold className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBuildings.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            All DFA coverage buildings
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Precincts</CardTitle>
          <PiMapPinBold className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{precinctCount}</div>
          <p className="text-xs text-muted-foreground">Coverage regions</p>
        </CardContent>
      </Card>

      {lastSync && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <PiArrowsClockwiseBold className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  lastSync.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : lastSync.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : lastSync.status === 'running'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {lastSync.status}
              </span>
              <span className="text-muted-foreground">
                {lastSync.completedAt &&
                !isNaN(new Date(lastSync.completedAt).getTime())
                  ? formatDistanceToNow(new Date(lastSync.completedAt)) + ' ago'
                  : 'In progress'}
              </span>
              <span className="text-muted-foreground">
                {lastSync.connectedCount} connected, {lastSync.nearNetCount} near-net
              </span>
              {lastSync.durationMs && (
                <span className="text-muted-foreground">
                  ({(lastSync.durationMs / 1000).toFixed(1)}s)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
