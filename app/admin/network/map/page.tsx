'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PiArrowsClockwiseBold,
  PiMapPinBold,
  PiWifiHighBold,
  PiWifiSlashBold,
  PiWarningCircleBold,
  PiUsersBold,
  PiHeartbeatBold,
  PiFunnelBold,
  PiListBold,
  PiCaretRightBold,
} from 'react-icons/pi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { NetworkMap, DeviceLocation } from '@/components/admin/network/NetworkMap';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

interface LocationsResponse {
  devices: DeviceLocation[];
  stats: {
    total: number;
    online: number;
    offline: number;
    withLocation: number;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function getHealthColor(score: number): string {
  if (score >= 80) return 'bg-green-50 text-green-700 border-green-200';
  if (score >= 50) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function NetworkMapPage() {
  const [data, setData] = useState<LocationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'online' | 'offline'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<DeviceLocation | null>(null);
  const [showDeviceList, setShowDeviceList] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await fetch('/api/admin/network/devices/locations', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch device locations');

      const result: LocationsResponse = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load device locations');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 2 minutes
    const interval = setInterval(() => fetchData(), 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter devices based on search and status
  const filteredDevices = data?.devices.filter((device) => {
    // Status filter
    if (selectedStatus !== 'all' && device.status !== selectedStatus) {
      return false;
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        device.device_name.toLowerCase().includes(query) ||
        device.site_name.toLowerCase().includes(query) ||
        device.site_address.toLowerCase().includes(query) ||
        (device.customer_name?.toLowerCase().includes(query) ?? false) ||
        (device.province?.toLowerCase().includes(query) ?? false)
      );
    }
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-[600px] bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <PiWarningCircleBold className="w-12 h-12 text-red-500" />
        <p className="text-gray-600">{error || 'No data available'}</p>
        <Button onClick={() => fetchData()}>Retry</Button>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Map</h1>
          <p className="text-gray-500 mt-1">
            Geographic view of all network devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showDeviceList ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDeviceList(!showDeviceList)}
          >
            <PiListBold className="w-4 h-4 mr-2" />
            {showDeviceList ? 'Hide List' : 'Show List'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <PiArrowsClockwiseBold
              className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-colors ${selectedStatus === 'all' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setSelectedStatus('all')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <PiMapPinBold className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${selectedStatus === 'online' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setSelectedStatus('online')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Online</p>
                <p className="text-2xl font-bold text-green-600">{stats.online}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <PiWifiHighBold className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${selectedStatus === 'offline' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setSelectedStatus('offline')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Offline</p>
                <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <PiWifiSlashBold className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">With Location</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withLocation}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <PiMapPinBold className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Legend */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-gray-700">Legend:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-600" />
                <span className="text-sm text-gray-600">Online (Healthy)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-600" />
                <span className="text-sm text-gray-600">Online (Warning)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-600" />
                <span className="text-sm text-gray-600">Online (Critical)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-500" />
                <span className="text-sm text-gray-600">Offline</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PiFunnelBold className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search devices, sites, provinces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className={`grid ${showDeviceList ? 'lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
        {/* Map */}
        <Card className={showDeviceList ? 'lg:col-span-2' : ''}>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            {filteredDevices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[600px] text-gray-500">
                <PiMapPinBold className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No devices with location data</p>
                <p className="text-sm mt-1">
                  {data.devices.length > 0
                    ? 'Link devices to corporate sites with coordinates to see them on the map'
                    : 'No devices found matching your filters'}
                </p>
              </div>
            ) : (
              <NetworkMap
                devices={filteredDevices}
                height="600px"
                selectedStatus={selectedStatus}
                onDeviceSelect={setSelectedDevice}
              />
            )}
          </CardContent>
        </Card>

        {/* Device List Sidebar */}
        {showDeviceList && (
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <PiListBold className="w-5 h-5" />
                  Devices ({filteredDevices.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[550px] overflow-y-auto">
                {filteredDevices.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No devices match your filters
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredDevices.map((device) => (
                      <div
                        key={device.sn}
                        className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedDevice?.sn === device.sn ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedDevice(device)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {device.status === 'online' ? (
                                <PiWifiHighBold className="w-4 h-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <PiWifiSlashBold className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              )}
                              <span className="font-medium text-gray-900 truncate">
                                {device.device_name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {device.site_name}
                            </p>
                            {device.province && (
                              <p className="text-xs text-gray-500">{device.province}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant="outline"
                              className={getHealthColor(device.health_score)}
                            >
                              {device.health_score}%
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <PiUsersBold className="w-3 h-3" />
                              {device.online_clients}
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/admin/network/devices/${device.sn}`}
                          className="mt-2 inline-flex items-center text-xs text-circleTel-orange hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View details <PiCaretRightBold className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Device Details Card */}
      {selectedDevice && !showDeviceList && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PiMapPinBold className="w-5 h-5" />
              Selected Device
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {selectedDevice.status === 'online' ? (
                    <PiWifiHighBold className="w-5 h-5 text-green-600" />
                  ) : (
                    <PiWifiSlashBold className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="font-semibold text-lg text-gray-900">
                    {selectedDevice.device_name}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      selectedDevice.status === 'online'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }
                  >
                    {selectedDevice.status}
                  </Badge>
                </div>
                <p className="text-gray-600">{selectedDevice.site_name}</p>
                <p className="text-sm text-gray-500">{selectedDevice.site_address}</p>
                {selectedDevice.customer_name && (
                  <p className="text-sm text-gray-600">
                    Customer: {selectedDevice.customer_name}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <PiUsersBold className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {selectedDevice.online_clients} clients
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <PiHeartbeatBold className="w-4 h-4 text-gray-400" />
                    <Badge
                      variant="outline"
                      className={getHealthColor(selectedDevice.health_score)}
                    >
                      {selectedDevice.health_score}%
                    </Badge>
                  </div>
                </div>
                <Link href={`/admin/network/devices/${selectedDevice.sn}`}>
                  <Button variant="outline" size="sm">
                    View Details
                    <PiCaretRightBold className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
