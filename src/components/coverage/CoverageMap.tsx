import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Layers, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TechnologyType, MultiProviderCoverageResult } from '@/services/multiProviderCoverage';
import clsx from 'clsx';

interface CoverageMapProps {
  result: MultiProviderCoverageResult;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  activeTechnologies: ToggleState;
  onToggleTechnology: (tech: TechnologyType, enabled: boolean) => void;
  height?: string;
  className?: string;
}

interface ToggleState {
  FIBRE: boolean;
  FIXED_WIRELESS: boolean;
  LTE: boolean;
}

// Technology visualization configuration
const TECHNOLOGY_COLORS = {
  'FIBRE': '#10B981', // Green
  'FIXED_WIRELESS': '#F59E0B', // Orange
  'LTE': '#3B82F6' // Blue
} as const;

const TECHNOLOGY_LABELS = {
  'FIBRE': 'Fibre',
  'FIXED_WIRELESS': 'SkyFibre',
  'LTE': '4G/5G'
} as const;

// Simulated coverage areas for visualization
const COVERAGE_AREAS = {
  'FIBRE': [
    // Johannesburg CBD
    { lat: -26.2041, lng: 28.0473, radius: 8000, provider: 'DFA' },
    { lat: -26.1951, lng: 28.0351, radius: 5000, provider: 'Openserve' },
    { lat: -26.2087, lng: 28.0567, radius: 6000, provider: 'Vuma' },

    // Cape Town CBD
    { lat: -33.9249, lng: 18.4241, radius: 7000, provider: 'DFA' },
    { lat: -33.9185, lng: 18.4232, radius: 5500, provider: 'Openserve' },

    // Pretoria CBD
    { lat: -25.7479, lng: 28.2293, radius: 5000, provider: 'DFA' },
    { lat: -25.7416, lng: 28.2256, radius: 4000, provider: 'Openserve' },

    // Durban CBD
    { lat: -29.8587, lng: 31.0218, radius: 4500, provider: 'DFA' },
  ],
  'FIXED_WIRELESS': [
    // CircleTel SkyFibre tower coverage (wider areas)
    { lat: -26.2041, lng: 28.0473, radius: 15000, provider: 'CircleTel Wireless' },
    { lat: -33.9249, lng: 18.4241, radius: 12000, provider: 'CircleTel Wireless' },
    { lat: -25.7479, lng: 28.2293, radius: 12000, provider: 'CircleTel Wireless' },
    { lat: -29.8587, lng: 31.0218, radius: 10000, provider: 'CircleTel Wireless' },

    // Additional towers
    { lat: -26.1486, lng: 28.0506, radius: 8000, provider: 'CircleTel Wireless' }, // Sandton
    { lat: -33.9608, lng: 25.6022, radius: 8000, provider: 'CircleTel Wireless' }, // Port Elizabeth
  ],
  'LTE': [
    // LTE coverage (country-wide, showing major areas)
    { lat: -26.2041, lng: 28.0473, radius: 50000, provider: 'CircleTel Wireless' },
    { lat: -33.9249, lng: 18.4241, radius: 40000, provider: 'CircleTel Wireless' },
    { lat: -25.7479, lng: 28.2293, radius: 35000, provider: 'CircleTel Wireless' },
    { lat: -29.8587, lng: 31.0218, radius: 30000, provider: 'CircleTel Wireless' },
  ]
};

export const CoverageMap: React.FC<CoverageMapProps> = ({
  result,
  onLocationSelect,
  activeTechnologies,
  onToggleTechnology,
  height = '400px',
  className
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: result.coordinates.lat, lng: result.coordinates.lng },
      styles: [
        {
          featureType: 'poi',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          stylers: [{ visibility: 'simplified' }]
        }
      ],
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    googleMapRef.current = map;

    // Add click listener for location selection
    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            onLocationSelect(lat, lng, results[0].formatted_address);
          } else {
            onLocationSelect(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        });
      }
    });

    // Create info window
    infoWindowRef.current = new google.maps.InfoWindow();

    setMapLoaded(true);
  }, [result.coordinates, onLocationSelect]);

  // Update coverage overlays when technologies change
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    // Clear existing overlays
    circlesRef.current.forEach(circle => circle.setMap(null));
    circlesRef.current = [];

    // Add coverage areas for active technologies
    Object.entries(activeTechnologies).forEach(([tech, isActive]) => {
      if (!isActive) return;

      const technology = tech as TechnologyType;
      const areas = COVERAGE_AREAS[technology] || [];
      const color = TECHNOLOGY_COLORS[technology];

      areas.forEach(area => {
        const circle = new google.maps.Circle({
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: 0.15,
          map: googleMapRef.current,
          center: { lat: area.lat, lng: area.lng },
          radius: area.radius,
          clickable: true,
        });

        // Add click listener to show coverage info
        circle.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (infoWindowRef.current && event.latLng) {
            infoWindowRef.current.setContent(`
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: ${color}; font-weight: 600;">
                  ${TECHNOLOGY_LABELS[technology]} Coverage
                </h3>
                <p style="margin: 0 0 4px 0; font-size: 14px;">
                  <strong>Provider:</strong> ${area.provider}
                </p>
                <p style="margin: 0 0 4px 0; font-size: 14px;">
                  <strong>Technology:</strong> ${TECHNOLOGY_LABELS[technology]}
                </p>
                <p style="margin: 0; font-size: 14px;">
                  <strong>Coverage Radius:</strong> ${(area.radius / 1000).toFixed(1)}km
                </p>
              </div>
            `);
            infoWindowRef.current.setPosition(event.latLng);
            infoWindowRef.current.open(googleMapRef.current);
          }
        });

        circlesRef.current.push(circle);
      });
    });
  }, [activeTechnologies, mapLoaded]);

  // Add result location marker
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add marker for the searched location
    const marker = new google.maps.Marker({
      position: { lat: result.coordinates.lat, lng: result.coordinates.lng },
      map: googleMapRef.current,
      title: result.address,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#F5831F"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 24)
      }
    });

    // Add click listener to marker
    marker.addListener('click', () => {
      if (infoWindowRef.current) {
        const providerList = result.providers
          .filter(p => p.hasConcentration)
          .map(p => `<li>${p.provider} - ${p.technologies.join(', ')}</li>`)
          .join('');

        infoWindowRef.current.setContent(`
          <div style="padding: 8px; min-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #F5831F; font-weight: 600;">
              ${result.overall.hasAnyConcentration ? '✅ Coverage Available' : '❌ No Coverage'}
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 14px;">
              <strong>Address:</strong><br>${result.address}
            </p>
            ${result.overall.hasAnyConcentration ? `
              <p style="margin: 0 0 4px 0; font-size: 14px;">
                <strong>Available Providers:</strong>
              </p>
              <ul style="margin: 0 0 8px 16px; font-size: 14px;">
                ${providerList}
              </ul>
              <p style="margin: 0; font-size: 14px;">
                <strong>Confidence:</strong> ${result.overall.confidence}%
              </p>
            ` : `
              <p style="margin: 0; font-size: 14px; color: #666;">
                No direct coverage found. Consider alternative solutions or join our waiting list.
              </p>
            `}
          </div>
        `);
        infoWindowRef.current.open(googleMapRef.current, marker);
      }
    });

    markersRef.current.push(marker);
  }, [result, mapLoaded]);

  const handleTechnologyToggle = useCallback(async (tech: TechnologyType) => {
    setIsToggling(true);
    try {
      onToggleTechnology(tech, !activeTechnologies[tech]);
    } finally {
      // Small delay to show visual feedback
      setTimeout(() => setIsToggling(false), 200);
    }
  }, [activeTechnologies, onToggleTechnology]);

  const handleResetView = useCallback(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setCenter({
        lat: result.coordinates.lat,
        lng: result.coordinates.lng
      });
      googleMapRef.current.setZoom(10);
    }
  }, [result.coordinates]);

  const handleToggleAllTechnologies = useCallback(() => {
    const allActive = Object.values(activeTechnologies).every(Boolean);
    Object.keys(activeTechnologies).forEach(tech => {
      onToggleTechnology(tech as TechnologyType, !allActive);
    });
  }, [activeTechnologies, onToggleTechnology]);

  return (
    <Card className={clsx('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-circleTel-orange" />
            <span>Coverage Map</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetView}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset View
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Technology Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 mr-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Show:</span>
            </div>

            {Object.entries(TECHNOLOGY_COLORS).map(([tech, color]) => {
              const technology = tech as TechnologyType;
              const isActive = activeTechnologies[technology];
              const label = TECHNOLOGY_LABELS[technology];

              return (
                <Button
                  key={tech}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTechnologyToggle(technology)}
                  disabled={isToggling}
                  className={clsx(
                    "flex items-center gap-1 transition-all",
                    isActive && "shadow-md"
                  )}
                  style={{
                    backgroundColor: isActive ? color : undefined,
                    borderColor: color,
                    color: isActive ? 'white' : color
                  }}
                >
                  {isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {label}
                </Button>
              );
            })}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleAllTechnologies}
              className="ml-2 text-xs"
            >
              {Object.values(activeTechnologies).every(Boolean) ? 'Hide All' : 'Show All'}
            </Button>
          </div>

          {/* Coverage Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg">
            {Object.entries(TECHNOLOGY_COLORS).map(([tech, color]) => {
              const technology = tech as TechnologyType;
              const label = TECHNOLOGY_LABELS[technology];
              const isActive = activeTechnologies[technology];

              return (
                <div
                  key={tech}
                  className={clsx(
                    "flex items-center gap-2 text-sm transition-opacity",
                    !isActive && "opacity-50"
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full border-2"
                    style={{
                      backgroundColor: `${color}30`,
                      borderColor: color
                    }}
                  />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>

          {/* Map Container */}
          <div
            ref={mapRef}
            style={{ height }}
            className="w-full rounded-lg border border-border overflow-hidden"
          >
            {!mapLoaded && (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-circleTel-orange mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}
          </div>

          {/* Map Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Click on coverage areas to see provider details</p>
            <p>• Click anywhere on the map to check coverage at that location</p>
            <p>• Use the filters above to show/hide different technology types</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};