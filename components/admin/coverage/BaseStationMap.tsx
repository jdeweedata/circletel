'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface BaseStationMapProps {
  stations: BaseStation[];
  highlightId?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  showCoverageCircles?: boolean;
  onStationClick?: (station: BaseStation) => void;
}

export function BaseStationMap({
  stations,
  highlightId,
  initialCenter,
  initialZoom = 6,
  showCoverageCircles = false,
  onStationClick,
}: BaseStationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCircles, setShowCircles] = useState(showCoverageCircles);

  const getMarkerColor = (connections: number): string => {
    if (connections >= 10) return '#22c55e'; // green-500
    if (connections >= 5) return '#eab308'; // yellow-500
    if (connections >= 1) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  const createMarkerIcon = (connections: number, isHighlighted: boolean) => {
    const color = getMarkerColor(connections);
    const scale = isHighlighted ? 10 : 7;
    const strokeWeight = isHighlighted ? 3 : 2;

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: isHighlighted ? '#1e40af' : '#ffffff',
      strokeWeight,
    };
  };

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];
  }, []);

  const clearCircles = useCallback(() => {
    circlesRef.current.forEach((circle) => {
      if (circle && circle.setMap) {
        circle.setMap(null);
      }
    });
    circlesRef.current = [];
  }, []);

  const addMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.google) return;

    clearMarkers();

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidBounds = false;

    stations.forEach((station) => {
      if (!station.lat || !station.lng) return;

      const position = { lat: station.lat, lng: station.lng };
      const isHighlighted = station.id === highlightId;

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        icon: createMarkerIcon(station.activeConnections, isHighlighted),
        title: station.siteName,
        zIndex: isHighlighted ? 1000 : station.activeConnections,
      });

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }

        const confidenceLevel =
          station.activeConnections >= 10
            ? 'HIGH'
            : station.activeConnections >= 5
            ? 'MEDIUM'
            : station.activeConnections >= 1
            ? 'LOW'
            : 'INACTIVE';

        const confidenceColor =
          station.activeConnections >= 10
            ? '#22c55e'
            : station.activeConnections >= 5
            ? '#eab308'
            : station.activeConnections >= 1
            ? '#f97316'
            : '#ef4444';

        const content = `
          <div style="padding: 12px; min-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 8px 0; color: #111827;">
              ${station.siteName}
            </h3>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
              ${station.hostname}
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
              Market: ${station.market || 'Unknown'}
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 12px; color: #374151;">Connections:</span>
              <span style="font-weight: 600; font-size: 14px;">${station.activeConnections}</span>
              <span style="
                background-color: ${confidenceColor};
                color: white;
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
              ">${confidenceLevel}</span>
            </div>
            <div style="font-size: 11px; color: #9ca3af;">
              ${station.lat.toFixed(6)}, ${station.lng.toFixed(6)}
            </div>
          </div>
        `;

        infoWindowRef.current = new window.google.maps.InfoWindow({
          content,
        });
        infoWindowRef.current.open(mapInstanceRef.current, marker);

        if (onStationClick) {
          onStationClick(station);
        }
      });

      markersRef.current.push(marker);
      bounds.extend(position);
      hasValidBounds = true;
    });

    // Fit bounds if we have markers and no initial center
    if (hasValidBounds && !initialCenter && !highlightId) {
      mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
    }

    // If highlight ID is set, center and zoom on that station
    if (highlightId) {
      const highlightedStation = stations.find((s) => s.id === highlightId);
      if (highlightedStation) {
        mapInstanceRef.current.setCenter({
          lat: highlightedStation.lat,
          lng: highlightedStation.lng,
        });
        mapInstanceRef.current.setZoom(14);
      }
    }
  }, [stations, highlightId, initialCenter, clearMarkers, onStationClick]);

  const addCoverageCircles = useCallback(() => {
    if (!mapInstanceRef.current || !window.google || !showCircles) return;

    clearCircles();

    stations.forEach((station) => {
      if (!station.lat || !station.lng) return;

      // 3km radius (high confidence)
      const circle3km = new window.google.maps.Circle({
        center: { lat: station.lat, lng: station.lng },
        radius: 3000,
        strokeColor: '#22c55e',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: '#22c55e',
        fillOpacity: 0.05,
        map: mapInstanceRef.current,
        zIndex: 1,
      });

      // 5km radius (max coverage)
      const circle5km = new window.google.maps.Circle({
        center: { lat: station.lat, lng: station.lng },
        radius: 5000,
        strokeColor: '#f97316',
        strokeOpacity: 0.2,
        strokeWeight: 1,
        fillColor: '#f97316',
        fillOpacity: 0.02,
        map: mapInstanceRef.current,
        zIndex: 0,
      });

      circlesRef.current.push(circle3km, circle5km);
    });
  }, [stations, showCircles, clearCircles]);

  const toggleCoverageCircles = () => {
    if (showCircles) {
      clearCircles();
    } else {
      addCoverageCircles();
    }
    setShowCircles(!showCircles);
  };

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    try {
      const center = initialCenter || { lat: -26.2041, lng: 28.0473 }; // Default: Johannesburg

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: initialZoom,
        mapTypeId: 'roadmap',
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      mapInstanceRef.current = map;
      setIsLoading(false);

      // Add markers after map is ready
      addMarkers();

      // Add coverage circles if enabled
      if (showCircles) {
        addCoverageCircles();
      }
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }
  }, [initialCenter, initialZoom, addMarkers, addCoverageCircles, showCircles]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      if (window.google && window.google.maps) {
        initializeMap();
      } else {
        existingScript.addEventListener('load', initializeMap);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    script.onerror = () => {
      setError('Failed to load Google Maps');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      clearMarkers();
      clearCircles();
    };
  }, [initializeMap, clearMarkers, clearCircles]);

  // Update markers when stations change
  useEffect(() => {
    if (mapInstanceRef.current && window.google) {
      addMarkers();
      if (showCircles) {
        addCoverageCircles();
      }
    }
  }, [stations, highlightId, addMarkers, showCircles, addCoverageCircles]);

  if (error) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center space-y-2">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-gray-600">Unable to load map visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          variant={showCircles ? 'default' : 'outline'}
          size="sm"
          onClick={toggleCoverageCircles}
          className="bg-white shadow-md"
        >
          {showCircles ? 'Hide Coverage' : 'Show Coverage'}
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-md p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-700">Connection Count</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>10+ (High)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>5-9 (Medium)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>1-4 (Low)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>0 (Inactive)</span>
          </div>
        </div>
        {showCircles && (
          <>
            <hr className="my-2" />
            <p className="text-xs font-semibold text-gray-700">Coverage Radius</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded border-2 border-green-500 bg-green-100" />
                <span>3km (High conf.)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded border-2 border-orange-500 bg-orange-100" />
                <span>5km (Max range)</span>
              </div>
            </div>
          </>
        )}
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20 rounded-lg">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full h-[600px] rounded-lg border border-gray-300" />

      {/* Station Count */}
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-white text-gray-800 shadow-md px-3 py-1">
          {stations.length} stations
        </Badge>
      </div>
    </div>
  );
}
