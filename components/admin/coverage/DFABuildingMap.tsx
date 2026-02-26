'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface DFABuildingMapProps {
  buildings: DFABuilding[];
  highlightId?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onBuildingClick?: (building: DFABuilding) => void;
}

export function DFABuildingMap({
  buildings,
  highlightId,
  initialCenter,
  initialZoom = 10,
  onBuildingClick,
}: DFABuildingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getMarkerColor = (coverageType: 'connected' | 'near-net'): string => {
    return coverageType === 'connected' ? '#9333ea' : '#eab308'; // purple-600 / yellow-500
  };

  const createMarkerIcon = (
    coverageType: 'connected' | 'near-net',
    isHighlighted: boolean
  ) => {
    const color = getMarkerColor(coverageType);
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

  const addMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.google) return;

    clearMarkers();

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidBounds = false;

    buildings.forEach((building) => {
      if (!building.latitude || !building.longitude) return;

      const position = { lat: building.latitude, lng: building.longitude };
      const isHighlighted = building.id === highlightId;

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        icon: createMarkerIcon(building.coverageType, isHighlighted),
        title: building.buildingName || building.buildingId || 'DFA Building',
        zIndex: isHighlighted ? 1000 : building.coverageType === 'connected' ? 100 : 50,
      });

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }

        const typeLabel =
          building.coverageType === 'connected' ? 'CONNECTED' : 'NEAR-NET';
        const typeColor =
          building.coverageType === 'connected' ? '#9333ea' : '#eab308';

        const content = `
          <div style="padding: 12px; min-width: 260px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="
                background-color: ${typeColor};
                color: white;
                font-size: 10px;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: 600;
              ">${typeLabel}</span>
            </div>
            <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0; color: #111827;">
              ${building.buildingName || 'Unnamed Building'}
            </h3>
            ${building.buildingId ? `
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                ID: ${building.buildingId}
              </div>
            ` : ''}
            ${building.streetAddress ? `
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                ${building.streetAddress}
              </div>
            ` : ''}
            ${building.coverageType === 'connected' ? `
              <div style="display: flex; gap: 12px; margin-bottom: 8px;">
                <div style="font-size: 12px;">
                  <span style="color: #374151;">FTTH:</span>
                  <span style="font-weight: 600; margin-left: 4px; color: ${building.ftth === 'Yes' ? '#22c55e' : '#6b7280'};">
                    ${building.ftth || 'N/A'}
                  </span>
                </div>
                <div style="font-size: 12px;">
                  <span style="color: #374151;">Broadband:</span>
                  <span style="font-weight: 600; margin-left: 4px; color: ${building.broadband === 'Yes' ? '#22c55e' : '#6b7280'};">
                    ${building.broadband || 'N/A'}
                  </span>
                </div>
              </div>
            ` : ''}
            ${building.precinct ? `
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                Precinct: ${building.precinct}
              </div>
            ` : ''}
            <div style="font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px;">
              ${building.latitude.toFixed(6)}, ${building.longitude.toFixed(6)}
            </div>
            <a href="/admin/sales/feasibility?lat=${building.latitude}&lng=${building.longitude}&address=${encodeURIComponent(building.streetAddress || '')}"
               style="display: inline-block; margin-top: 8px; font-size: 12px; color: #9333ea; text-decoration: none; font-weight: 500;">
              Check BizFibre Packages &rarr;
            </a>
          </div>
        `;

        infoWindowRef.current = new window.google.maps.InfoWindow({
          content,
        });
        infoWindowRef.current.open(mapInstanceRef.current, marker);

        if (onBuildingClick) {
          onBuildingClick(building);
        }
      });

      markersRef.current.push(marker);
      bounds.extend(position);
      hasValidBounds = true;
    });

    // Fit bounds if we have markers and no initial center
    if (hasValidBounds && !initialCenter && !highlightId) {
      mapInstanceRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });
    }

    // If highlight ID is set, center and zoom on that building
    if (highlightId) {
      const highlightedBuilding = buildings.find((b) => b.id === highlightId);
      if (highlightedBuilding) {
        mapInstanceRef.current.setCenter({
          lat: highlightedBuilding.latitude,
          lng: highlightedBuilding.longitude,
        });
        mapInstanceRef.current.setZoom(17);
      }
    }
  }, [buildings, highlightId, initialCenter, clearMarkers, onBuildingClick]);

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
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }
  }, [initialCenter, initialZoom, addMarkers]);

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

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
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
    };
  }, [initializeMap, clearMarkers]);

  // Update markers when buildings change
  useEffect(() => {
    if (mapInstanceRef.current && window.google) {
      addMarkers();
    }
  }, [buildings, highlightId, addMarkers]);

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

  // Count by type
  const connectedCount = buildings.filter(
    (b) => b.coverageType === 'connected'
  ).length;
  const nearNetCount = buildings.filter(
    (b) => b.coverageType === 'near-net'
  ).length;

  return (
    <div className="relative">
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-md p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-700">Building Type</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-purple-600" />
            <span>Connected ({connectedCount})</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Near-Net ({nearNetCount})</span>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20 rounded-lg">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      <div
        ref={mapRef}
        className="w-full h-[600px] rounded-lg border border-gray-300"
      />

      {/* Building Count */}
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-white text-gray-800 shadow-md px-3 py-1">
          {buildings.length} buildings
        </Badge>
      </div>
    </div>
  );
}
