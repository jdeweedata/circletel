'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { SalesZone } from '@/lib/sales-engine/types';

interface ZoneHeatMapProps {
  zones: SalesZone[];
  onZoneSelect?: (zone: SalesZone) => void;
  selectedZoneId?: string;
  height?: string;
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

export function ZoneHeatMap({ zones, onZoneSelect, selectedZoneId, height = '600px' }: ZoneHeatMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
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
      </div>
    </div>
  );
}
