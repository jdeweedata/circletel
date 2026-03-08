'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider';
import {
  PiWifiHighBold,
  PiWifiSlashBold,
  PiUsersBold,
  PiHeartbeatBold,
  PiMapPinBold,
  PiCaretRightBold,
} from 'react-icons/pi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// =============================================================================
// TYPES
// =============================================================================

export interface DeviceLocation {
  sn: string;
  device_name: string;
  model: string | null;
  group_name: string | null;
  customer_name: string | null;
  status: string;
  online_clients: number;
  health_score: number;
  latitude: number;
  longitude: number;
  site_name: string;
  site_address: string;
  province: string | null;
}

interface NetworkMapProps {
  devices: DeviceLocation[];
  height?: string;
  onDeviceSelect?: (device: DeviceLocation) => void;
  selectedStatus?: 'all' | 'online' | 'offline';
}

// =============================================================================
// CONSTANTS
// =============================================================================

// South Africa center coordinates
const SOUTH_AFRICA_CENTER = {
  lat: -30.5595,
  lng: 22.9375,
};

const SOUTH_AFRICA_BOUNDS = {
  north: -22.0,
  south: -35.0,
  east: 33.0,
  west: 16.0,
};

// Map options created as a function to avoid referencing google.maps at module load time
function getMapOptions(): google.maps.MapOptions {
  return {
    restriction: {
      latLngBounds: SOUTH_AFRICA_BOUNDS,
      strictBounds: false,
    },
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
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

function getHealthLabel(score: number): string {
  if (score >= 80) return 'Healthy';
  if (score >= 50) return 'Warning';
  return 'Critical';
}

// Create SVG marker icon for devices
// Note: google.maps.SymbolPath.CIRCLE = 0
function createMarkerIcon(status: string, healthScore: number): google.maps.Symbol {
  // Determine color based on status and health
  let fillColor: string;
  if (status === 'offline') {
    fillColor = '#6B7280'; // gray-500
  } else if (healthScore >= 80) {
    fillColor = '#16A34A'; // green-600
  } else if (healthScore >= 50) {
    fillColor = '#CA8A04'; // yellow-600
  } else {
    fillColor = '#DC2626'; // red-600
  }

  return {
    path: 0, // google.maps.SymbolPath.CIRCLE
    scale: 10,
    fillColor,
    fillOpacity: 0.9,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function NetworkMap({
  devices,
  height = '600px',
  onDeviceSelect,
  selectedStatus = 'all',
}: NetworkMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceLocation | null>(null);
  const [hoveredDevice, setHoveredDevice] = useState<string | null>(null);

  // Filter devices based on status
  const filteredDevices = useMemo(() => {
    if (selectedStatus === 'all') return devices;
    return devices.filter((d) => d.status === selectedStatus);
  }, [devices, selectedStatus]);

  // Calculate map bounds to fit all devices
  const fitBounds = useCallback(() => {
    if (!map || filteredDevices.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    filteredDevices.forEach((device) => {
      bounds.extend({ lat: device.latitude, lng: device.longitude });
    });

    // Add some padding
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

    // Don't zoom in too much for single devices
    const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
      const currentZoom = map.getZoom();
      if (currentZoom && currentZoom > 15) {
        map.setZoom(15);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, filteredDevices]);

  // Fit bounds when devices change
  useEffect(() => {
    fitBounds();
  }, [fitBounds]);

  const handleMarkerClick = (device: DeviceLocation) => {
    setSelectedDevice(device);
    onDeviceSelect?.(device);
  };

  const handleInfoWindowClose = () => {
    setSelectedDevice(null);
  };

  if (loadError) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <PiMapPinBold className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Failed to load map</p>
          <p className="text-sm">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg animate-pulse"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <PiMapPinBold className="w-8 h-8 mx-auto mb-2 opacity-50 animate-bounce" />
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height }}
      center={SOUTH_AFRICA_CENTER}
      zoom={6}
      onLoad={setMap}
      options={getMapOptions()}
    >
      {filteredDevices.map((device) => (
        <Marker
          key={device.sn}
          position={{ lat: device.latitude, lng: device.longitude }}
          icon={createMarkerIcon(device.status, device.health_score)}
          onClick={() => handleMarkerClick(device)}
          onMouseOver={() => setHoveredDevice(device.sn)}
          onMouseOut={() => setHoveredDevice(null)}
          title={device.device_name}
          animation={
            hoveredDevice === device.sn ? 1 : undefined // 1 = google.maps.Animation.BOUNCE
          }
        />
      ))}

      {selectedDevice && (
        <InfoWindow
          position={{ lat: selectedDevice.latitude, lng: selectedDevice.longitude }}
          onCloseClick={handleInfoWindowClose}
        >
          <div className="p-2 min-w-[240px] max-w-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {selectedDevice.status === 'online' ? (
                  <PiWifiHighBold className="w-5 h-5 text-green-600" />
                ) : (
                  <PiWifiSlashBold className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-semibold text-gray-900">
                  {selectedDevice.device_name}
                </span>
              </div>
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

            {/* Site Info */}
            <div className="space-y-2 mb-3">
              <div className="flex items-start gap-2">
                <PiMapPinBold className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedDevice.site_name}
                  </p>
                  <p className="text-xs text-gray-500">{selectedDevice.site_address}</p>
                </div>
              </div>

              {selectedDevice.customer_name && (
                <p className="text-sm text-gray-600">
                  Customer: {selectedDevice.customer_name}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <PiUsersBold className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {selectedDevice.online_clients} clients
                </span>
              </div>
              <div className="flex items-center gap-1">
                <PiHeartbeatBold className="w-4 h-4 text-gray-400" />
                <Badge variant="outline" className={getHealthColor(selectedDevice.health_score)}>
                  {selectedDevice.health_score}% {getHealthLabel(selectedDevice.health_score)}
                </Badge>
              </div>
            </div>

            {/* Model */}
            {selectedDevice.model && (
              <p className="text-xs text-gray-500 mb-3">Model: {selectedDevice.model}</p>
            )}

            {/* View Details Link */}
            <Link href={`/admin/network/devices/${selectedDevice.sn}`}>
              <Button variant="outline" size="sm" className="w-full">
                View Details
                <PiCaretRightBold className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
