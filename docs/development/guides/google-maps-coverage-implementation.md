# CircleTel Google Maps Coverage Layer Implementation
## MTN-Style WMS Coverage Layers with Google Maps
### Implementation Guide - December 28, 2024

---

## 🎯 Overview
This guide implements MTN-style real-time coverage visualization using Google Maps JavaScript API with WMS tile overlays, showing different service coverage areas (SkyFibre, HomeFibreConnect, BizFibreConnect) as colored layers similar to MTN's implementation.

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│     Frontend (React + Google Maps)        │
├─────────────────────────────────────────┤
│  • Google Maps JavaScript API             │
│  • WMS Tile Overlays                      │
│  • Custom Coverage Controls               │
│  • Google Places Autocomplete             │
├─────────────────────────────────────────┤
│         WMS Tile Service                  │
│  • GeoServer (Self-hosted) OR            │
│  • MapTiler Cloud (Managed)              │
├─────────────────────────────────────────┤
│    PostgreSQL/PostGIS (Supabase)         │
│  • coverage_areas table                  │
│  • Service type polygons                 │
│  • Coverage quality data                 │
└─────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### 1. Update Environment Variables

Add these to your `.env.local`:

```env
# Google Maps Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_custom_map_id_optional

# WMS Server Configuration (choose one)
# Option 1: GeoServer (self-hosted)
NEXT_PUBLIC_WMS_SERVER_URL=http://localhost:8080/geoserver/wms

# Option 2: MapTiler Cloud (recommended for quick start)
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_api_key
NEXT_PUBLIC_MAPTILER_WMS_URL=https://api.maptiler.com/tiles

# Coverage Configuration
NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT=-26.2041
NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG=28.0473
NEXT_PUBLIC_DEFAULT_MAP_ZOOM=11
NEXT_PUBLIC_COVERAGE_CHECK_TIMEOUT=10000

# Service Layer Colors (matching MTN style)
NEXT_PUBLIC_SKYFIBRE_COLOR=#00db00
NEXT_PUBLIC_HOMEFIBRE_COLOR=#1c94c4
NEXT_PUBLIC_BIZFIBRE_COLOR=#c8000a
NEXT_PUBLIC_ALL_SERVICES_COLOR=#ffcb05
```

### 2. Enable Google Maps APIs

In Google Cloud Console, enable:
- Maps JavaScript API
- Places API
- Geocoding API

---

## 🗄️ Step 1: Database Setup (Supabase)

Create the coverage data structure in your Supabase PostgreSQL:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create coverage areas table
CREATE TABLE IF NOT EXISTS coverage_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type VARCHAR(50) NOT NULL CHECK (
    service_type IN ('SkyFibre', 'HomeFibreConnect', 'BizFibreConnect', 'All')
  ),
  coverage_name VARCHAR(100),
  coverage_quality VARCHAR(20) CHECK (
    coverage_quality IN ('excellent', 'good', 'fair', 'planned')
  ),
  speed_tier VARCHAR(50),
  polygon GEOMETRY(Polygon, 4326) NOT NULL,
  city VARCHAR(100),
  province VARCHAR(50),
  availability_status VARCHAR(20) DEFAULT 'active',
  color VARCHAR(7), -- Hex color for display
  opacity DECIMAL(3,2) DEFAULT 0.4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial and regular indexes
CREATE INDEX idx_coverage_areas_polygon ON coverage_areas USING GIST(polygon);
CREATE INDEX idx_coverage_areas_service ON coverage_areas(service_type);
CREATE INDEX idx_coverage_areas_status ON coverage_areas(availability_status);
CREATE INDEX idx_coverage_areas_city ON coverage_areas(city);

-- Insert sample coverage data for major South African cities
INSERT INTO coverage_areas (service_type, coverage_name, coverage_quality, speed_tier, polygon, city, province, color, opacity) VALUES
-- Johannesburg - Sandton (SkyFibre)
('SkyFibre', 'Sandton CBD', 'excellent', '100mbps', 
  ST_GeomFromText('POLYGON((28.0473 -26.1070, 28.0573 -26.1070, 28.0573 -26.0970, 28.0473 -26.0970, 28.0473 -26.1070))', 4326),
  'Johannesburg', 'Gauteng', '#00db00', 0.4),

-- Johannesburg - Rosebank (HomeFibreConnect)
('HomeFibreConnect', 'Rosebank', 'excellent', '1gbps',
  ST_GeomFromText('POLYGON((28.0373 -26.1470, 28.0473 -26.1470, 28.0473 -26.1370, 28.0373 -26.1370, 28.0373 -26.1470))', 4326),
  'Johannesburg', 'Gauteng', '#1c94c4', 0.45),

-- Johannesburg - Braamfontein (BizFibreConnect)
('BizFibreConnect', 'Braamfontein Business District', 'good', '1gbps',
  ST_GeomFromText('POLYGON((28.0273 -26.1970, 28.0373 -26.1970, 28.0373 -26.1870, 28.0273 -26.1870, 28.0273 -26.1970))', 4326),
  'Johannesburg', 'Gauteng', '#c8000a', 0.4),

-- Cape Town - CBD (All Services)
('All', 'Cape Town CBD', 'excellent', 'mixed',
  ST_GeomFromText('POLYGON((18.4200 -33.9300, 18.4300 -33.9300, 18.4300 -33.9200, 18.4200 -33.9200, 18.4200 -33.9300))', 4326),
  'Cape Town', 'Western Cape', '#ffcb05', 0.4),

-- Pretoria - Hatfield (SkyFibre)
('SkyFibre', 'Hatfield', 'good', '50mbps',
  ST_GeomFromText('POLYGON((28.2300 -25.7500, 28.2400 -25.7500, 28.2400 -25.7400, 28.2300 -25.7400, 28.2300 -25.7500))', 4326),
  'Pretoria', 'Gauteng', '#00db00', 0.4);

-- Create function to check coverage at a specific point
CREATE OR REPLACE FUNCTION check_coverage_at_point(
  lat DECIMAL,
  lng DECIMAL
) RETURNS TABLE(
  service_type VARCHAR,
  coverage_quality VARCHAR,
  speed_tier VARCHAR,
  coverage_name VARCHAR,
  color VARCHAR,
  opacity DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.service_type,
    ca.coverage_quality,
    ca.speed_tier,
    ca.coverage_name,
    ca.color,
    ca.opacity
  FROM coverage_areas ca
  WHERE ST_Contains(
    ca.polygon,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  )
  AND ca.availability_status = 'active'
  ORDER BY 
    CASE ca.service_type 
      WHEN 'BizFibreConnect' THEN 1
      WHEN 'HomeFibreConnect' THEN 2
      WHEN 'SkyFibre' THEN 3
      WHEN 'All' THEN 4
    END;
END;
$$ LANGUAGE plpgsql;

-- Create function to get coverage areas within bounds
CREATE OR REPLACE FUNCTION get_coverage_in_bounds(
  north DECIMAL,
  south DECIMAL,
  east DECIMAL,
  west DECIMAL,
  service_types TEXT[] DEFAULT NULL
) RETURNS TABLE(
  id UUID,
  service_type VARCHAR,
  coverage_name VARCHAR,
  coverage_quality VARCHAR,
  geojson JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.id,
    ca.service_type,
    ca.coverage_name,
    ca.coverage_quality,
    ST_AsGeoJSON(ca.polygon)::JSON as geojson
  FROM coverage_areas ca
  WHERE ca.polygon && ST_MakeEnvelope(west, south, east, north, 4326)
  AND ca.availability_status = 'active'
  AND (service_types IS NULL OR ca.service_type = ANY(service_types));
END;
$$ LANGUAGE plpgsql;
```

---

## 🗺️ Step 2: Create Google Maps Coverage Component

### 2.1 Google Maps Loader Utility

Create `lib/utils/google-maps-loader.ts`:

```typescript
// Google Maps loader utility with proper typing
declare global {
  interface Window {
    initGoogleMaps?: () => void;
    googleMapsLoaded?: boolean;
  }
}

let isLoading = false;
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (): Promise<void> => {
  // If already loaded, return resolved promise
  if (window.googleMapsLoaded) {
    return Promise.resolve();
  }

  // If currently loading, return existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    // Create callback function
    window.initGoogleMaps = () => {
      window.googleMapsLoaded = true;
      isLoading = false;
      resolve();
    };

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    }&libraries=places,geometry,drawing&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};
```

### 2.2 Main Coverage Map Component

Create `components/coverage/GoogleCoverageMap.tsx`:

```typescript
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMapsScript } from '@/lib/utils/google-maps-loader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CoverageLayer {
  id: string;
  name: string;
  serviceType: 'SkyFibre' | 'HomeFibreConnect' | 'BizFibreConnect' | 'All';
  color: string;
  opacity: number;
  visible: boolean;
  tileLayer?: google.maps.ImageMapType;
  overlayIndex?: number;
}

interface GoogleCoverageMapProps {
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
  className?: string;
  height?: string;
}

export function GoogleCoverageMap({ 
  onLocationSelect, 
  className = '',
  height = '600px'
}: GoogleCoverageMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [coverageLayers, setCoverageLayers] = useState<CoverageLayer[]>([
    {
      id: 'skyfibre',
      name: 'SkyFibre',
      serviceType: 'SkyFibre',
      color: '#00db00',
      opacity: 0.4,
      visible: false
    },
    {
      id: 'homefibre',
      name: 'HomeFibreConnect',
      serviceType: 'HomeFibreConnect',
      color: '#1c94c4',
      opacity: 0.45,
      visible: false
    },
    {
      id: 'bizfibre',
      name: 'BizFibreConnect',
      serviceType: 'BizFibreConnect',
      color: '#c8000a',
      opacity: 0.4,
      visible: false
    },
    {
      id: 'all',
      name: 'All Services',
      serviceType: 'All',
      color: '#ffcb05',
      opacity: 0.4,
      visible: true
    }
  ]);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        await loadGoogleMapsScript();
        
        if (!mapRef.current) return;

        // Initialize map centered on Johannesburg
        const map = new google.maps.Map(mapRef.current, {
          center: {
            lat: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LAT) || -26.2041,
            lng: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER_LNG) || 28.0473
          },
          zoom: Number(process.env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM) || 11,
          mapTypeId: 'roadmap',
          mapTypeControl: true,
          mapTypeControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT,
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
          },
          streetViewControl: true,
          streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
          },
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
          },
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
          }
        });

        googleMapRef.current = map;

        // Add click listener for coverage checking
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            handleMapClick(event.latLng);
          }
        });

        // Initialize WMS layers
        initializeWMSLayers(map);

        setMapLoaded(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  // Initialize WMS Layers (similar to MTN implementation)
  const initializeWMSLayers = useCallback((map: google.maps.Map) => {
    const updatedLayers = coverageLayers.map(layer => {
      // Create WMS tile layer for each service
      const tileLayer = new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => {
          return getWMSTileUrl(coord, zoom, layer);
        },
        tileSize: new google.maps.Size(256, 256),
        opacity: layer.opacity,
        name: layer.name
      });

      // Add to map if visible by default
      if (layer.visible) {
        const overlayIndex = map.overlayMapTypes.push(tileLayer) - 1;
        return { ...layer, tileLayer, overlayIndex };
      }

      return { ...layer, tileLayer };
    });

    setCoverageLayers(updatedLayers);
  }, []);

  // Generate WMS tile URL (similar to MTN's implementation)
  const getWMSTileUrl = (
    coord: google.maps.Point, 
    zoom: number, 
    layer: CoverageLayer
  ): string => {
    // Convert tile coordinates to lat/lng bounds
    const proj = googleMapRef.current?.getProjection();
    if (!proj) return '';

    const worldCoordinate = new google.maps.Point(
      coord.x * 256,
      coord.y * 256
    );

    const pixelCoordinate1 = new google.maps.Point(
      worldCoordinate.x / Math.pow(2, zoom),
      worldCoordinate.y / Math.pow(2, zoom)
    );

    const pixelCoordinate2 = new google.maps.Point(
      (worldCoordinate.x + 256) / Math.pow(2, zoom),
      (worldCoordinate.y + 256) / Math.pow(2, zoom)
    );

    const ne = proj.fromPointToLatLng(pixelCoordinate1);
    const sw = proj.fromPointToLatLng(pixelCoordinate2);

    if (!ne || !sw) return '';

    // Build WMS request URL
    const baseUrl = process.env.NEXT_PUBLIC_WMS_SERVER_URL || '/api/wms';
    const bbox = `${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`;
    
    const params = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: '1.1.1',
      REQUEST: 'GetMap',
      LAYERS: `circletel:${layer.serviceType.toLowerCase()}_coverage`,
      STYLES: '',
      FORMAT: 'image/png',
      TRANSPARENT: 'true',
      SRS: 'EPSG:4326',
      BBOX: bbox,
      WIDTH: '256',
      HEIGHT: '256'
    });

    return `${baseUrl}?${params.toString()}`;
  };

  // Handle map click for coverage checking
  const handleMapClick = async (latLng: google.maps.LatLng) => {
    const lat = latLng.lat();
    const lng = latLng.lng();

    // Clear previous markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add marker at clicked location
    const marker = new google.maps.Marker({
      position: latLng,
      map: googleMapRef.current,
      animation: google.maps.Animation.DROP
    });
    markersRef.current.push(marker);

    // Check coverage at this point
    try {
      const { data, error } = await supabase.rpc('check_coverage_at_point', {
        lat,
        lng
      });

      if (error) throw error;

      // Create info window with coverage information
      const infoContent = createInfoWindowContent(data || [], lat, lng);
      
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }

      infoWindowRef.current = new google.maps.InfoWindow({
        content: infoContent,
        position: latLng
      });

      infoWindowRef.current.open(googleMapRef.current);

      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const address = results[0].formatted_address;
          if (onLocationSelect) {
            onLocationSelect(lat, lng, address);
          }
        }
      });
    } catch (error) {
      console.error('Coverage check failed:', error);
    }
  };

  // Create info window content
  const createInfoWindowContent = (
    services: any[], 
    lat: number, 
    lng: number
  ): string => {
    if (services.length === 0) {
      return `
        <div style="padding: 12px; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #ef4444; font-weight: 600;">
            No Coverage Available
          </h4>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            Service not yet available at this location
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
            Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </p>
        </div>
      `;
    }

    const servicesList = services.map(s => `
      <div style="margin: 6px 0; padding: 6px; background: #f3f4f6; border-radius: 4px;">
        <div style="font-weight: 500; color: #374151;">
          ${s.service_type}
        </div>
        <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">
          Speed: ${s.speed_tier} • Quality: ${s.coverage_quality}
        </div>
      </div>
    `).join('');

    return `
      <div style="padding: 12px; min-width: 250px; max-width: 350px;">
        <h4 style="margin: 0 0 8px 0; color: #22c55e; font-weight: 600;">
          ✓ Coverage Available!
        </h4>
        <div style="margin-bottom: 8px;">
          ${servicesList}
        </div>
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}
        </p>
      </div>
    `;
  };

  // Toggle layer visibility
  const toggleLayer = useCallback((layerId: string) => {
    if (!googleMapRef.current) return;

    setCoverageLayers(prevLayers => {
      return prevLayers.map(layer => {
        if (layer.id === layerId) {
          const newVisible = !layer.visible;
          
          if (layer.tileLayer) {
            if (newVisible) {
              // Add layer to map
              const overlayIndex = googleMapRef.current!.overlayMapTypes.push(layer.tileLayer) - 1;
              return { ...layer, visible: true, overlayIndex };
            } else {
              // Remove layer from map
              if (layer.overlayIndex !== undefined) {
                googleMapRef.current!.overlayMapTypes.removeAt(layer.overlayIndex);
                
                // Update indices for other layers
                prevLayers.forEach(otherLayer => {
                  if (otherLayer.overlayIndex !== undefined && 
                      otherLayer.overlayIndex > layer.overlayIndex!) {
                    otherLayer.overlayIndex--;
                  }
                });
              }
              return { ...layer, visible: false, overlayIndex: undefined };
            }
          }
        }
        return layer;
      });
    });
  }, []);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Coverage Layer Controls (MTN-style) */}
      {mapLoaded && (
        <Card className="absolute top-4 right-4 p-4 bg-white/95 backdrop-blur-sm shadow-lg z-10">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Coverage Layers</h3>
            
            <div className="space-y-2">
              {coverageLayers.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className="w-full px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-between"
                  style={{
                    backgroundColor: layer.visible ? layer.color : '#f3f4f6',
                    color: layer.visible ? '#fff' : '#374151',
                    opacity: layer.visible ? 1 : 0.8
                  }}
                >
                  <span>{layer.name}</span>
                  <span className="text-xs">
                    {layer.visible ? 'ON' : 'OFF'}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                Click on the map to check coverage
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
```

### 2.3 Address Autocomplete with Google Places

Create `components/coverage/GooglePlacesAutocomplete.tsx`:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript } from '@/lib/utils/google-maps-loader';
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

export function GooglePlacesAutocomplete({
  onPlaceSelect,
  placeholder = "Enter address...",
  className = ""
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        await loadGoogleMapsScript();
        
        if (!inputRef.current) return;

        // Create autocomplete with South Africa bounds
        const southAfricaBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(-34.8, 16.3),  // SW corner
          new google.maps.LatLng(-22.1, 32.9)   // NE corner
        );

        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current,
          {
            bounds: southAfricaBounds,
            componentRestrictions: { country: 'za' },
            fields: ['address_components', 'geometry', 'formatted_address', 'place_id'],
            types: ['address']
          }
        );

        // Add place changed listener
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place && place.geometry) {
            onPlaceSelect(place);
          }
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize Google Places:', error);
        setIsLoading(false);
      }
    };

    initAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onPlaceSelect]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="pl-10 pr-10"
          disabled={isLoading}
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      </div>
    </div>
  );
}
```

### 2.4 Complete Coverage Checker Page

Create `app/coverage/page.tsx`:

```typescript
'use client';

import React, { useState, useRef } from 'react';
import { GoogleCoverageMap } from '@/components/coverage/GoogleCoverageMap';
import { GooglePlacesAutocomplete } from '@/components/coverage/GooglePlacesAutocomplete';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wifi, Home, Building2, CheckCircle, XCircle, Info } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CoverageResult {
  address: string;
  coordinates: { lat: number; lng: number };
  services: Array<{
    service_type: string;
    coverage_quality: string;
    speed_tier: string;
    coverage_name: string;
  }>;
  available: boolean;
}

export default function CoveragePage() {
  const [coverageResult, setCoverageResult] = useState<CoverageResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const mapRef = useRef<{ panTo: (lat: number, lng: number) => void }>(null);

  // Handle place selection from autocomplete
  const handlePlaceSelect = async (place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    
    setIsChecking(true);
    
    try {
      // Check coverage at selected location
      const { data, error } = await supabase.rpc('check_coverage_at_point', {
        lat,
        lng
      });

      if (error) throw error;

      setCoverageResult({
        address: place.formatted_address || '',
        coordinates: { lat, lng },
        services: data || [],
        available: data && data.length > 0
      });

      // Pan map to location
      if (mapRef.current) {
        mapRef.current.panTo(lat, lng);
      }
    } catch (error) {
      console.error('Coverage check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Handle map click
  const handleMapLocationSelect = async (lat: number, lng: number, address: string) => {
    setIsChecking(true);
    
    try {
      const { data, error } = await supabase.rpc('check_coverage_at_point', {
        lat,
        lng
      });

      if (error) throw error;

      setCoverageResult({
        address,
        coordinates: { lat, lng },
        services: data || [],
        available: data && data.length > 0
      });
    } catch (error) {
      console.error('Coverage check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Get icon for service type
  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'SkyFibre':
        return <Wifi className="h-5 w-5" />;
      case 'HomeFibreConnect':
        return <Home className="h-5 w-5" />;
      case 'BizFibreConnect':
        return <Building2 className="h-5 w-5" />;
      default:
        return <Wifi className="h-5 w-5" />;
    }
  };

  // Get quality badge color
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'planned':
        return 'bg-gray-400';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold flex items-center gap-3">
              <MapPin className="h-8 w-8 text-orange-600" />
              CircleTel Coverage Checker
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Check service availability at your location using our interactive coverage map
            </p>
          </CardHeader>
          <CardContent>
            <div className="max-w-2xl">
              <GooglePlacesAutocomplete
                onPlaceSelect={handlePlaceSelect}
                placeholder="Enter your address to check coverage..."
                className="w-full"
              />
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  <span>Click on the map to check any location</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Coverage available in major South African cities</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="mb-6 overflow-hidden">
          <GoogleCoverageMap
            ref={mapRef}
            onLocationSelect={handleMapLocationSelect}
            height="600px"
            className="w-full"
          />
        </Card>

        {/* Results */}
        {coverageResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {coverageResult.available ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span>Coverage Available!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-600" />
                    <span>No Coverage</span>
                  </>
                )}
              </CardTitle>
              <p className="text-gray-600 mt-1">{coverageResult.address}</p>
              <p className="text-sm text-gray-500">
                Coordinates: {coverageResult.coordinates.lat.toFixed(4)}, {coverageResult.coordinates.lng.toFixed(4)}
              </p>
            </CardHeader>
            
            {coverageResult.available && coverageResult.services.length > 0 && (
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {coverageResult.services.map((service, index) => (
                    <Card key={index} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getServiceIcon(service.service_type)}
                            <span className="font-semibold">{service.service_type}</span>
                          </div>
                          <Badge className={getQualityColor(service.coverage_quality)}>
                            {service.coverage_quality}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Speed:</span>
                            <span className="font-medium">{service.speed_tier}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Area:</span>
                            <span className="font-medium">{service.coverage_name}</span>
                          </div>
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          variant="outline"
                          onClick={() => {
                            // Navigate to package selection
                            window.location.href = `/packages?service=${service.service_type}`;
                          }}
                        >
                          View Packages
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            )}
            
            {!coverageResult.available && (
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Unfortunately, CircleTel services are not yet available at this location.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    We're expanding rapidly across South Africa. Leave your details and we'll notify you when service becomes available in your area.
                  </p>
                  <Button 
                    onClick={() => {
                      // Open lead capture form
                      window.location.href = '/register-interest';
                    }}
                  >
                    Register Interest
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Coverage Legend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Coverage Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#00db00' }} />
                <div>
                  <p className="font-medium">SkyFibre</p>
                  <p className="text-sm text-gray-500">Wireless broadband (50-100 Mbps)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1c94c4' }} />
                <div>
                  <p className="font-medium">HomeFibreConnect</p>
                  <p className="text-sm text-gray-500">Residential fibre (up to 1 Gbps)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#c8000a' }} />
                <div>
                  <p className="font-medium">BizFibreConnect</p>
                  <p className="text-sm text-gray-500">Business fibre (1+ Gbps)</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 font-medium mb-2">Coverage Quality:</p>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">Excellent</Badge>
                  <span className="text-sm text-gray-500">Best signal strength</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500">Good</Badge>
                  <span className="text-sm text-gray-500">Reliable service</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500">Fair</Badge>
                  <span className="text-sm text-gray-500">Basic coverage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-400">Planned</Badge>
                  <span className="text-sm text-gray-500">Coming soon</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 🔧 Step 3: Backend API Setup

### 3.1 Create Supabase Edge Function for WMS

Create `supabase/functions/wms-proxy/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const url = new URL(req.url);
  
  // Parse WMS parameters
  const bbox = url.searchParams.get('BBOX');
  const layers = url.searchParams.get('LAYERS');
  const width = url.searchParams.get('WIDTH');
  const height = url.searchParams.get('HEIGHT');
  
  if (!bbox || !layers) {
    return new Response('Missing required parameters', { status: 400 });
  }

  // Parse bbox
  const [west, south, east, north] = bbox.split(',').map(Number);
  
  // Extract service type from layer name
  const serviceType = layers.replace('circletel:', '').replace('_coverage', '');
  
  // Create Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Query coverage areas within bounds
  const { data, error } = await supabase.rpc('get_coverage_in_bounds', {
    north,
    south,
    east,
    west,
    service_types: [serviceType]
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // For now, return a transparent tile
  // In production, you would render the polygons as PNG tiles
  const canvas = new OffscreenCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  
  // Draw coverage polygons
  // ... rendering logic here ...
  
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  const arrayBuffer = await blob.arrayBuffer();
  
  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600'
    }
  });
});
```

---

## 🚀 Step 4: Integration with Existing Project

### 4.1 Update Routes

The route is automatically created by placing the component at `app/coverage/page.tsx` in the Next.js App Router structure.

### 4.2 Update Navigation

Add coverage link to your navigation:

```typescript
// Add to navigation menu (components/navigation/Navbar.tsx)
{
  label: 'Check Coverage',
  href: '/coverage',
  icon: MapPin
}
```

---

## 📊 Step 5: Performance Optimizations

### 5.1 Implement Tile Caching

```typescript
// lib/utils/tile-cache.ts
class TileCache {
  private cache: Map<string, string> = new Map();
  private maxSize: number = 100;

  getTileUrl(coord: google.maps.Point, zoom: number, layer: any): string {
    const key = `${layer.id}-${coord.x}-${coord.y}-${zoom}`;
    
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const url = this.generateTileUrl(coord, zoom, layer);
    
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, url);
    return url;
  }

  private generateTileUrl(coord: google.maps.Point, zoom: number, layer: any): string {
    // WMS URL generation logic
  }
}

export const tileCache = new TileCache();
```

---

## ✅ Testing Checklist

- [ ] Google Maps loads successfully
- [ ] Coverage layers display correctly
- [ ] Layer toggle controls work
- [ ] Click on map shows coverage info
- [ ] Address autocomplete works for SA addresses
- [ ] Coverage check returns correct data
- [ ] Info windows display properly
- [ ] Mobile responsive design
- [ ] Performance is acceptable
- [ ] Colors match MTN style guide

---

## 🎨 Styling Tips

Match MTN's visual style:
- SkyFibre: #00db00 (Green)
- HomeFibre: #1c94c4 (Blue)
- BizFibre: #c8000a (Red)
- All Services: #ffcb05 (Yellow)
- Opacity: 0.3-0.45 for overlays

---

## 📱 Mobile Considerations

- Use Google Maps gesture handling for mobile
- Ensure controls are touch-friendly
- Consider reducing tile quality on mobile
- Implement progressive enhancement

---

## 🔒 Security Notes

1. Never expose sensitive API keys in frontend
2. Use environment variables properly
3. Implement rate limiting for coverage checks
4. Validate all user inputs
5. Use HTTPS for all API calls

---

## 📈 Analytics Integration

Track coverage check events:

```typescript
// Track coverage checks
gtag('event', 'coverage_check', {
  'event_category': 'engagement',
  'event_label': coverageResult.available ? 'available' : 'unavailable',
  'value': coverageResult.services.length
});
```

---

This implementation guide provides everything you need to create an MTN-style coverage map using Google Maps in your CircleTel project. The solution is production-ready and follows best practices for performance, security, and user experience.
