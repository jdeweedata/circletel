'use client';
import { PiBuildingBold, PiListBold, PiMapPinBold, PiPackageBold, PiSpinnerBold, PiWarningBold, PiXBold } from 'react-icons/pi';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DFABuildingMap } from '@/components/admin/coverage/DFABuildingMap';
import Link from 'next/link';

interface DFABuilding {
  id: string;
  objectId: number;
  buildingId: string | null;
  buildingName: string | null;
  streetAddress: string | null;
  latitude: number;
  longitude: number;
  coverageType: 'connected' | 'near-net';
  ftth: string | null;
  broadband: string | null;
  precinct: string | null;
}

interface Precinct {
  name: string;
  count: number;
}

function DFABuildingsMapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [buildings, setBuildings] = useState<DFABuilding[]>([]);
  const [precincts, setPrecincts] = useState<Precinct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<DFABuilding | null>(
    null
  );

  // URL params
  const highlightId = searchParams.get('highlight') || undefined;
  const initialLat = searchParams.get('lat')
    ? parseFloat(searchParams.get('lat')!)
    : undefined;
  const initialLng = searchParams.get('lng')
    ? parseFloat(searchParams.get('lng')!)
    : undefined;
  const initialZoom = searchParams.get('zoom')
    ? parseInt(searchParams.get('zoom')!)
    : 10;

  // Filter state
  const [type, setType] = useState(searchParams.get('type') || '');
  const [precinct, setPrecinct] = useState(searchParams.get('precinct') || '');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: '1',
        pageSize: '2000', // Load more for map view
      });

      if (type) params.set('type', type);
      if (precinct) params.set('precinct', precinct);

      const response = await fetch(`/api/admin/coverage/dfa-buildings?${params}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch DFA buildings');
      }

      setBuildings(data.data.buildings);
      setPrecincts(data.data.stats.precincts);

      // If highlight ID is set, find and select that building
      if (highlightId) {
        const highlighted = data.data.buildings.find(
          (b: DFABuilding) => b.id === highlightId
        );
        if (highlighted) {
          setSelectedBuilding(highlighted);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [type, precinct, highlightId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTypeChange = (value: string) => {
    setType(value === 'all' ? '' : value);
    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set('type', value);
    } else {
      params.delete('type');
    }
    router.push(`/admin/coverage/dfa-buildings/map?${params.toString()}`);
  };

  const handlePrecinctChange = (value: string) => {
    setPrecinct(value === 'all' ? '' : value);
    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set('precinct', value);
    } else {
      params.delete('precinct');
    }
    router.push(`/admin/coverage/dfa-buildings/map?${params.toString()}`);
  };

  const handleBuildingClick = (building: DFABuilding) => {
    setSelectedBuilding(building);
  };

  const closeSidebar = () => {
    setSelectedBuilding(null);
  };

  // Count by type
  const connectedCount = buildings.filter(
    (b) => b.coverageType === 'connected'
  ).length;
  const nearNetCount = buildings.filter(
    (b) => b.coverageType === 'near-net'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/coverage/dfa-buildings">
              <Button variant="outline" size="sm">
                <PiListBold className="h-4 w-4 mr-2" />
                List View
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PiBuildingBold className="h-6 w-6 text-purple-600" />
              DFA Buildings Map
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Select value={type || 'all'} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="near-net">Near-Net</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={precinct || 'all'}
              onValueChange={handlePrecinctChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Precincts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Precincts</SelectItem>
                {precincts.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name} ({p.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge className="bg-purple-100 text-purple-800">
                {connectedCount} Connected
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800">
                {nearNetCount} Near-Net
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-6 py-2">
          <Alert className="border-red-200 bg-red-50">
            <PiWarningBold className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Map + Sidebar */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center space-y-2">
                <PiSpinnerBold className="h-8 w-8 text-purple-500 animate-spin mx-auto" />
                <p className="text-sm text-gray-600">Loading buildings...</p>
              </div>
            </div>
          ) : (
            <DFABuildingMap
              buildings={buildings}
              highlightId={highlightId}
              initialCenter={
                initialLat && initialLng
                  ? { lat: initialLat, lng: initialLng }
                  : undefined
              }
              initialZoom={initialZoom}
              onBuildingClick={handleBuildingClick}
            />
          )}
        </div>

        {/* Sidebar - Selected Building */}
        {selectedBuilding && (
          <div className="w-96 bg-white border-l shadow-lg overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Building Details</h2>
              <Button variant="ghost" size="sm" onClick={closeSidebar}>
                <PiXBold className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Type Badge */}
              <Badge
                className={
                  selectedBuilding.coverageType === 'connected'
                    ? 'bg-purple-500'
                    : 'bg-yellow-500'
                }
              >
                {selectedBuilding.coverageType === 'connected'
                  ? 'Connected'
                  : 'Near-Net'}
              </Badge>

              {/* Building Info */}
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {selectedBuilding.buildingName || 'Unnamed Building'}
                </h3>
                {selectedBuilding.buildingId && (
                  <p className="text-sm text-gray-500 font-mono">
                    ID: {selectedBuilding.buildingId}
                  </p>
                )}
              </div>

              {selectedBuilding.streetAddress && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Address</p>
                  <p className="text-sm text-gray-600">
                    {selectedBuilding.streetAddress}
                  </p>
                </div>
              )}

              {/* Service Availability (for connected) */}
              {selectedBuilding.coverageType === 'connected' && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Service Availability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">FTTH</p>
                        <Badge
                          variant={
                            selectedBuilding.ftth === 'Yes'
                              ? 'default'
                              : 'outline'
                          }
                          className={
                            selectedBuilding.ftth === 'Yes'
                              ? 'bg-green-500'
                              : ''
                          }
                        >
                          {selectedBuilding.ftth || 'N/A'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Broadband</p>
                        <Badge
                          variant={
                            selectedBuilding.broadband === 'Yes'
                              ? 'default'
                              : 'outline'
                          }
                          className={
                            selectedBuilding.broadband === 'Yes'
                              ? 'bg-green-500'
                              : ''
                          }
                        >
                          {selectedBuilding.broadband || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedBuilding.precinct && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Precinct</p>
                  <Badge variant="outline">{selectedBuilding.precinct}</Badge>
                </div>
              )}

              {/* Coordinates */}
              <div>
                <p className="text-sm font-medium text-gray-700">Coordinates</p>
                <p className="text-xs text-gray-500 font-mono">
                  {selectedBuilding.latitude.toFixed(6)},{' '}
                  {selectedBuilding.longitude.toFixed(6)}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t space-y-2">
                <Link
                  href={`/admin/sales/feasibility?lat=${selectedBuilding.latitude}&lng=${selectedBuilding.longitude}&address=${encodeURIComponent(selectedBuilding.streetAddress || '')}`}
                  className="block"
                >
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <PiPackageBold className="h-4 w-4 mr-2" />
                    Check BizFibre Packages
                  </Button>
                </Link>
                <a
                  href={`https://www.google.com/maps?q=${selectedBuilding.latitude},${selectedBuilding.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full">
                    <PiMapPinBold className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DFABuildingsMapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center space-y-2">
            <PiSpinnerBold className="h-8 w-8 text-purple-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      }
    >
      <DFABuildingsMapContent />
    </Suspense>
  );
}
