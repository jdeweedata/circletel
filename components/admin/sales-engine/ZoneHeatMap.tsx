'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { SalesZone } from '@/lib/sales-engine/types';

export interface BaseStationLayer {
  id: string;
  site_name: string;
  hostname: string;
  active_connections: number;
  market: string;
  lat: number;
  lng: number;
}

export interface DFABuildingLayer {
  id: string;
  building_name: string | null;
  building_id: string | null;
  street_address: string | null;
  latitude: number;
  longitude: number;
  coverage_type: 'connected' | 'near-net';
  ftth: string | null;
  precinct: string | null;
}

interface ZoneHeatMapProps {
  zones: SalesZone[];
  onZoneSelect?: (zone: SalesZone) => void;
  selectedZoneId?: string;
  height?: string;
  baseStations?: BaseStationLayer[];
  dfaBuildings?: DFABuildingLayer[];
  showBaseStations?: boolean;
  showDFABuildings?: boolean;
}

// Color based on zone score (green = high, red = low)
function getZoneColor(score: number): string {
  if (score >= 70) return '#22c55e'; // green-500
  if (score >= 50) return '#f59e0b'; // amber-500
  if (score >= 30) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

function getZoneOpacity(score: number): number {
  return 0.2 + (score / 100) * 0.4; // 0.2 to 0.6
}

export function ZoneHeatMap({
  zones,
  onZoneSelect,
  selectedZoneId,
  height = '600px',
  baseStations = [],
  dfaBuildings = [],
  showBaseStations = false,
  showDFABuildings = false,
}: ZoneHeatMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const bsMarkersRef = useRef<google.maps.Marker[]>([]);
  const dfaMarkersRef = useRef<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: -25.7479, lng: 28.2293 }, // Pretoria/Centurion area
      zoom: 11,
      mapTypeId: 'roadmap',
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });

    googleMapRef.current = map;
    setMapLoaded(true);
  }, []);

  // Load Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    script.onerror = () => setError('Failed to load Google Maps');
    document.head.appendChild(script);

    return () => {
      // Cleanup markers and circles
      markersRef.current.forEach((m) => m.setMap(null));
      circlesRef.current.forEach((c) => c.setMap(null));
      bsMarkersRef.current.forEach((m) => m.setMap(null));
      dfaMarkersRef.current.forEach((m) => m.setMap(null));
    };
  }, [initMap]);

  // Update markers and zones when data changes
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    const map = googleMapRef.current;

    // Clear existing
    markersRef.current.forEach((m) => m.setMap(null));
    circlesRef.current.forEach((c) => c.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    if (zones.length === 0) return;

    // Add zone circles and markers
    const bounds = new google.maps.LatLngBounds();

    for (const zone of zones) {
      const position = { lat: zone.center_lat, lng: zone.center_lng };
      bounds.extend(position);

      const score = Number(zone.zone_score);
      const color = getZoneColor(score);

      // Zone circle (radius based on serviceable addresses, min 500m, max 3000m)
      const radius = Math.min(Math.max((zone.serviceable_addresses || 10) * 20, 500), 3000);
      const circle = new google.maps.Circle({
        map,
        center: position,
        radius,
        fillColor: color,
        fillOpacity: getZoneOpacity(score),
        strokeColor: selectedZoneId === zone.id ? '#F5831F' : color,
        strokeWeight: selectedZoneId === zone.id ? 3 : 1.5,
        strokeOpacity: 0.8,
        clickable: true,
      });

      circle.addListener('click', () => onZoneSelect?.(zone));
      circlesRef.current.push(circle);

      // Zone label marker
      const marker = new google.maps.Marker({
        map,
        position,
        label: {
          text: `${zone.name}\n${score.toFixed(0)}`,
          color: '#1f2937',
          fontSize: '11px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 0,
        },
      });

      marker.addListener('click', () => onZoneSelect?.(zone));
      markersRef.current.push(marker);

      // Customer pin markers
      if (zone.active_customers > 0) {
        const customerMarker = new google.maps.Marker({
          map,
          position: {
            lat: zone.center_lat + (Math.random() - 0.5) * 0.005,
            lng: zone.center_lng + (Math.random() - 0.5) * 0.005,
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: '#22c55e',
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          title: `${zone.active_customers} active customers`,
        });
        markersRef.current.push(customerMarker);
      }
    }

    // Fit map to show all zones
    if (zones.length > 0) {
      map.fitBounds(bounds, 50);
    }
  }, [zones, mapLoaded, selectedZoneId, onZoneSelect]);

  // Render base station markers
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    // Clear existing base station markers
    bsMarkersRef.current.forEach((m) => m.setMap(null));
    bsMarkersRef.current = [];

    if (!showBaseStations || baseStations.length === 0) return;

    const map = googleMapRef.current;

    for (const bs of baseStations) {
      const connections = bs.active_connections ?? 0;
      // Color by connection count: red < 5, orange 5-10, green > 10
      const fillColor = connections >= 10 ? '#f97316' : connections >= 5 ? '#fb923c' : '#fbbf24';

      const marker = new google.maps.Marker({
        map,
        position: { lat: Number(bs.lat), lng: Number(bs.lng) },
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z', // tower pin
          scale: 1.2,
          fillColor,
          fillOpacity: 0.9,
          strokeColor: '#7c2d12',
          strokeWeight: 1,
          anchor: new google.maps.Point(12, 24),
        },
        title: `${bs.site_name} (${connections} connections)`,
        zIndex: 100,
      });

      marker.addListener('click', () => {
        new google.maps.InfoWindow({
          content: `
            <div style="font-family: system-ui; font-size: 12px; max-width: 200px;">
              <p style="font-weight: 700; margin-bottom: 4px;">${bs.site_name}</p>
              <p style="color: #6b7280;">${bs.hostname}</p>
              <p style="margin-top: 4px;"><strong>${connections}</strong> active connections</p>
              <p style="color: #6b7280;">${bs.market}</p>
            </div>
          `,
        }).open(map, marker);
      });

      bsMarkersRef.current.push(marker);
    }
  }, [baseStations, showBaseStations, mapLoaded]);

  // Render DFA building markers
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    // Clear existing DFA markers
    dfaMarkersRef.current.forEach((m) => m.setMap(null));
    dfaMarkersRef.current = [];

    if (!showDFABuildings || dfaBuildings.length === 0) return;

    const map = googleMapRef.current;

    for (const building of dfaBuildings) {
      const isConnected = building.coverage_type === 'connected';
      const fillColor = isConnected ? '#a855f7' : '#eab308'; // purple or yellow

      const marker = new google.maps.Marker({
        map,
        position: { lat: building.latitude, lng: building.longitude },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 4,
          fillColor,
          fillOpacity: 0.7,
          strokeColor: isConnected ? '#7e22ce' : '#a16207',
          strokeWeight: 1,
        },
        title: building.building_name ?? building.building_id ?? 'DFA Building',
        zIndex: 50,
      });

      marker.addListener('click', () => {
        new google.maps.InfoWindow({
          content: `
            <div style="font-family: system-ui; font-size: 12px; max-width: 220px;">
              <p style="font-weight: 700; margin-bottom: 4px;">${building.building_name ?? 'DFA Building'}</p>
              ${building.street_address ? `<p style="color: #6b7280;">${building.street_address}</p>` : ''}
              <p style="margin-top: 4px;">
                <span style="display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ${isConnected ? '#f3e8ff' : '#fef9c3'}; color: ${isConnected ? '#7e22ce' : '#a16207'};">
                  ${building.coverage_type}
                </span>
              </p>
              ${building.ftth ? `<p style="margin-top: 4px; color: #6b7280;">FTTH: ${building.ftth}</p>` : ''}
              ${building.precinct ? `<p style="color: #6b7280;">Precinct: ${building.precinct}</p>` : ''}
            </div>
          `,
        }).open(map, marker);
      });

      dfaMarkersRef.current.push(marker);
    }
  }, [dfaBuildings, showDFABuildings, mapLoaded]);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200" style={{ height }}>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-lg" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-700 mb-2">Zone Score</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>70+ (High priority)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>50-69 (Medium)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>30-49 (Low)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>&lt;30 (Park)</span>
          </div>
        </div>
        {(showBaseStations || showDFABuildings) && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <p className="font-semibold text-gray-700 mb-2">Infrastructure</p>
            <div className="space-y-1">
              {showBaseStations && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Base Stations ({baseStations.length})</span>
                </div>
              )}
              {showDFABuildings && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span>DFA Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>DFA Near-Net</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
