'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, OverlayView } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Search, Layers, Wifi, WifiOff } from 'lucide-react';
import { Coordinates, ServiceType, CoverageResponse, ServiceCoverage } from '@/lib/coverage/types';
import { MTNServiceCoverage } from '@/lib/coverage/mtn/types';

interface CoverageMapProps {
  onLocationSelect?: (coordinates: Coordinates, address?: string) => void;
  onCoverageCheck?: (coverage: CoverageResponse) => void;
  initialCenter?: Coordinates;
  showAddressSearch?: boolean;
  showCoverageControls?: boolean;
  height?: string;
}

interface CoverageMarker {
  coordinates: Coordinates;
  coverage: CoverageResponse;
  address?: string;
}

interface WMSOverlay {
  serviceType: ServiceType;
  enabled: boolean;
  opacity: number;
  layer: string;
  source: 'business' | 'consumer';
}

const DEFAULT_CENTER: Coordinates = {
  lat: -26.2041,
  lng: 28.0473 // Johannesburg
};

const SOUTH_AFRICA_BOUNDS = {
  north: -22.0,
  south: -35.0,
  east: 33.0,
  west: 16.0
};

const mapOptions = {
  restriction: {
    latLngBounds: SOUTH_AFRICA_BOUNDS,
    strictBounds: true
  },
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true
};

export default function CoverageMap({
  onLocationSelect,
  onCoverageCheck,
  initialCenter = DEFAULT_CENTER,
  showAddressSearch = true,
  showCoverageControls = true,
  height = '500px'
}: CoverageMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState<Coordinates>(initialCenter);
  const [markers, setMarkers] = useState<CoverageMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<CoverageMarker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [wmsOverlays, setWmsOverlays] = useState<WMSOverlay[]>([
    { serviceType: 'fibre', enabled: false, opacity: 0.7, layer: 'FTTBCoverage', source: 'business' },
    { serviceType: 'fixed_lte', enabled: true, opacity: 0.7, layer: 'FLTECoverageEBU', source: 'business' },
    { serviceType: 'uncapped_wireless', enabled: false, opacity: 0.7, layer: 'UncappedWirelessEBU', source: 'consumer' },
    { serviceType: '5g', enabled: false, opacity: 0.7, layer: '_5gCoverage', source: 'consumer' },
    { serviceType: 'lte', enabled: false, opacity: 0.7, layer: 'lteCoverage', source: 'consumer' }
  ]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleMapClick = useCallback(async (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const coordinates: Coordinates = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };

    setIsLoading(true);
    onLocationSelect?.(coordinates);

    try {
      // Check coverage at clicked location
      const response = await fetch('/api/coverage/mtn/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates,
          includeSignalStrength: true
        })
      });

      if (!response.ok) {
        throw new Error(`Coverage check failed: ${response.status}`);
      }

      const coverageData: { success: boolean; data: CoverageResponse } = await response.json();

      if (coverageData.success) {
        const newMarker: CoverageMarker = {
          coordinates,
          coverage: coverageData.data
        };

        setMarkers(prev => [...prev, newMarker]);
        setSelectedMarker(newMarker);
        onCoverageCheck?.(coverageData.data);
      }
    } catch (error) {
      console.error('Failed to check coverage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onLocationSelect, onCoverageCheck]);

  const handleAddressSearch = useCallback(async () => {
    if (!searchAddress.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/coverage/mtn/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: searchAddress,
          includeSignalStrength: true
        })
      });

      if (!response.ok) {
        throw new Error(`Address search failed: ${response.status}`);
      }

      const coverageData: { success: boolean; data: CoverageResponse } = await response.json();

      if (coverageData.success) {
        const coordinates = coverageData.data.coordinates;

        setCenter(coordinates);
        map?.panTo(coordinates);
        map?.setZoom(15);

        const newMarker: CoverageMarker = {
          coordinates,
          coverage: coverageData.data,
          address: searchAddress
        };

        setMarkers(prev => [...prev, newMarker]);
        setSelectedMarker(newMarker);
        onLocationSelect?.(coordinates, searchAddress);
        onCoverageCheck?.(coverageData.data);
      }
    } catch (error) {
      console.error('Failed to search address:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchAddress, map, onLocationSelect, onCoverageCheck]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAddressSearch();
    }
  }, [handleAddressSearch]);

  const toggleWMSOverlay = useCallback((serviceType: ServiceType) => {
    setWmsOverlays(prev => prev.map(overlay =>
      overlay.serviceType === serviceType
        ? { ...overlay, enabled: !overlay.enabled }
        : overlay
    ));
  }, []);

  const updateOverlayOpacity = useCallback((serviceType: ServiceType, opacity: number) => {
    setWmsOverlays(prev => prev.map(overlay =>
      overlay.serviceType === serviceType
        ? { ...overlay, opacity }
        : overlay
    ));
  }, []);

  // Create WMS overlays when map and overlays change
  useEffect(() => {
    if (!map) return;

    // Remove existing overlays
    const existingOverlays = (map as any)._wmsOverlays || [];
    existingOverlays.forEach((overlay: any) => overlay.setMap(null));

    // Add enabled overlays
    const newOverlays: any[] = [];

    wmsOverlays.filter(overlay => overlay.enabled).forEach(overlay => {
      const wmsUrl = `/api/coverage/mtn/wms-proxy?configId=${overlay.source}&layer=${overlay.layer}&bbox={bbox}&width={width}&height={height}&format=image/png&transparent=true`;

      // Create ImageMapType for WMS overlay
      const imageMapType = new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => {
          const projection = map.getProjection();
          if (!projection) return '';

          const scale = 1 << zoom;
          const worldCoordinate = new google.maps.Point(
            coord.x / scale,
            coord.y / scale
          );

          const pixelCoordinate = new google.maps.Point(
            worldCoordinate.x * 256,
            worldCoordinate.y * 256
          );

          const topLeft = projection.fromPointToLatLng(
            new google.maps.Point(
              pixelCoordinate.x,
              pixelCoordinate.y
            )
          );

          const bottomRight = projection.fromPointToLatLng(
            new google.maps.Point(
              pixelCoordinate.x + 256,
              pixelCoordinate.y + 256
            )
          );

          if (!topLeft || !bottomRight) return '';

          const bbox = `${topLeft.lng()},${bottomRight.lat()},${bottomRight.lng()},${topLeft.lat()}`;

          return wmsUrl
            .replace('{bbox}', bbox)
            .replace('{width}', '256')
            .replace('{height}', '256');
        },
        tileSize: new google.maps.Size(256, 256),
        opacity: overlay.opacity,
        name: overlay.serviceType
      });

      map.overlayMapTypes.push(imageMapType);
      newOverlays.push(imageMapType);
    });

    (map as any)._wmsOverlays = newOverlays;
  }, [map, wmsOverlays]);

  const renderCoverageInfo = (coverage: CoverageResponse) => {
    const availableServices = coverage.services.filter(service => service.available);
    const unavailableServices = coverage.services.filter(service => !service.available);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {coverage.available ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          <span className="font-medium">
            {coverage.available ? 'Coverage Available' : 'No Coverage'}
          </span>
          <Badge variant={coverage.confidence === 'high' ? 'default' : 'secondary'}>
            {coverage.confidence} confidence
          </Badge>
        </div>

        {availableServices.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Available Services</h4>
            <div className="space-y-2">
              {availableServices.map((service: ServiceCoverage, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div>
                    <span className="text-sm font-medium capitalize">
                      {service.type.replace('_', ' ')}
                    </span>
                    <Badge
                      className="ml-2 text-xs"
                      variant={
                        service.signal === 'excellent' ? 'default' :
                        service.signal === 'good' ? 'secondary' :
                        service.signal === 'fair' ? 'outline' : 'destructive'
                      }
                    >
                      {service.signal}
                    </Badge>
                  </div>
                  {service.estimatedSpeed && (
                    <div className="text-right text-xs text-gray-600">
                      <div>↓ {service.estimatedSpeed.download}{service.estimatedSpeed.unit}</div>
                      <div>↑ {service.estimatedSpeed.upload}{service.estimatedSpeed.unit}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {unavailableServices.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Unavailable Services</h4>
            <div className="grid grid-cols-2 gap-1">
              {unavailableServices.map((service: ServiceCoverage, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {service.type.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {showAddressSearch && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Search Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                ref={searchInputRef}
                placeholder="Enter address in South Africa..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <Button
                onClick={handleAddressSearch}
                disabled={isLoading || !searchAddress.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showCoverageControls && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Coverage Layers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {wmsOverlays.map(overlay => (
                <div key={overlay.serviceType} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium capitalize cursor-pointer">
                      {overlay.serviceType.replace('_', ' ')}
                    </label>
                    <Button
                      variant={overlay.enabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWMSOverlay(overlay.serviceType)}
                    >
                      {overlay.enabled ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                  {overlay.enabled && (
                    <div className="space-y-1">
                      <label className="text-xs text-gray-600">Opacity</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={overlay.opacity}
                        onChange={(e) => updateOverlayOpacity(overlay.serviceType, parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height }}
              center={center}
              zoom={10}
              onClick={handleMapClick}
              onLoad={setMap}
              options={mapOptions}
            >
              {markers.map((marker, index) => (
                <Marker
                  key={index}
                  position={marker.coordinates}
                  onClick={() => setSelectedMarker(marker)}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: marker.coverage.available ? '#16a34a' : '#dc2626',
                    fillOpacity: 0.8,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                  }}
                />
              ))}

              {selectedMarker && (
                <OverlayView
                  position={selectedMarker.coordinates}
                  mapPaneName="overlayMouseTarget"
                >
                  <Card className="max-w-sm shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {selectedMarker.address || 'Coverage Information'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {renderCoverageInfo(selectedMarker.coverage)}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => setSelectedMarker(null)}
                      >
                        Close
                      </Button>
                    </CardContent>
                  </Card>
                </OverlayView>
              )}

              {isLoading && (
                <OverlayView
                  position={center}
                  mapPaneName="overlayMouseTarget"
                >
                  <Card className="shadow-lg">
                    <CardContent className="p-4 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Checking coverage...</span>
                    </CardContent>
                  </Card>
                </OverlayView>
              )}
            </GoogleMap>
          </LoadScript>
        </CardContent>
      </Card>
    </div>
  );
}