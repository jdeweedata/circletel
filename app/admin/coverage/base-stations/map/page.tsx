'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BaseStationMap } from '@/components/admin/coverage/BaseStationMap';
import { Radio, List, RefreshCw, AlertTriangle, Search, MapPin } from 'lucide-react';
import Link from 'next/link';

interface BaseStation {
  id: string;
  serialNumber: string;
  hostname: string;
  siteName: string;
  activeConnections: number;
  market: string;
  lat: number;
  lng: number;
}

interface Market {
  name: string;
  count: number;
}

function BaseStationsMapContent() {
  const searchParams = useSearchParams();
  const [stations, setStations] = useState<BaseStation[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<BaseStation | null>(null);

  // URL params for highlighting
  const highlightId = searchParams.get('highlight');
  const initialLat = searchParams.get('lat');
  const initialLng = searchParams.get('lng');
  const initialZoom = searchParams.get('zoom');

  // Filter state
  const [market, setMarket] = useState('');
  const [minConnections, setMinConnections] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all stations (no pagination for map)
      const params = new URLSearchParams({
        page: '1',
        pageSize: '1000',
        sortBy: 'active_connections',
        sortOrder: 'desc',
      });

      if (market) params.set('market', market);

      const response = await fetch(`/api/admin/coverage/base-stations?${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch base stations');
      }

      let filteredStations = data.data.stations;

      // Apply min connections filter locally
      if (minConnections) {
        const min = parseInt(minConnections);
        filteredStations = filteredStations.filter(
          (s: BaseStation) => s.activeConnections >= min
        );
      }

      setStations(filteredStations);
      setMarkets(data.data.stats.markets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [market, minConnections]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const initialCenter =
    initialLat && initialLng
      ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) }
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MapPin className="h-8 w-8 text-orange-600" />
              Base Station Map
            </h1>
            <p className="text-gray-600 mt-1">
              Geographic view of all {stations.length} Tarana base stations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={fetchData} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/admin/coverage/base-stations">
              <Button variant="outline">
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Filter by Market
                </label>
                <Select value={market || 'all'} onValueChange={(v) => setMarket(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Markets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Markets</SelectItem>
                    {markets.map((m) => (
                      <SelectItem key={m.name} value={m.name}>
                        {m.name} ({m.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Min Connections
                </label>
                <Select
                  value={minConnections || 'all'}
                  onValueChange={(v) => setMinConnections(v === 'all' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="1">1+ connections</SelectItem>
                    <SelectItem value="5">5+ connections</SelectItem>
                    <SelectItem value="10">10+ connections</SelectItem>
                    <SelectItem value="20">20+ connections</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMarket('');
                    setMinConnections('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            {loading && stations.length === 0 ? (
              <div className="h-[600px] flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-2">
                  <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mx-auto" />
                  <p className="text-sm text-gray-600">Loading base stations...</p>
                </div>
              </div>
            ) : (
              <BaseStationMap
                stations={stations}
                highlightId={highlightId || undefined}
                initialCenter={initialCenter}
                initialZoom={initialZoom ? parseInt(initialZoom) : undefined}
                showCoverageCircles={false}
                onStationClick={setSelectedStation}
              />
            )}
          </CardContent>
        </Card>

        {/* Selected Station Info */}
        {selectedStation && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Radio className="h-5 w-5 text-orange-500" />
                  {selectedStation.siteName}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStation(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Hostname</p>
                  <p className="font-mono">{selectedStation.hostname}</p>
                </div>
                <div>
                  <p className="text-gray-500">Market</p>
                  <Badge variant="outline">{selectedStation.market || 'Unknown'}</Badge>
                </div>
                <div>
                  <p className="text-gray-500">Coordinates</p>
                  <p className="font-mono text-xs">
                    {selectedStation.lat.toFixed(6)}, {selectedStation.lng.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Active Connections</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                      {selectedStation.activeConnections}
                    </span>
                    <Badge
                      className={
                        selectedStation.activeConnections >= 10
                          ? 'bg-green-500'
                          : selectedStation.activeConnections >= 5
                          ? 'bg-yellow-500'
                          : selectedStation.activeConnections >= 1
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }
                    >
                      {selectedStation.activeConnections >= 10
                        ? 'HIGH'
                        : selectedStation.activeConnections >= 5
                        ? 'MEDIUM'
                        : selectedStation.activeConnections >= 1
                        ? 'LOW'
                        : 'INACTIVE'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function BaseStationsMapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="text-center space-y-2">
            <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <BaseStationsMapContent />
    </Suspense>
  );
}
