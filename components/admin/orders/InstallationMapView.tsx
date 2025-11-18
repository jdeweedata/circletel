'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Navigation, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Installation {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  installation_address: string;
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  status: string;
  technician_name: string | null;
  package_name: string;
  package_speed: string;
}

interface InstallationMapViewProps {
  installations: Installation[];
}

export function InstallationMapView({ installations }: InstallationMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geocodedCount, setGeocodedCount] = useState(0);

  const statusColors: Record<string, string> = {
    kyc_approved: '#EAB308', // yellow
    payment_method_registered: '#3B82F6', // blue
    installation_scheduled: '#A855F7', // purple
    installation_in_progress: '#F97316', // orange
    installation_completed: '#22C55E', // green
    active: '#22C55E', // green
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      kyc_approved: 'Pending',
      payment_method_registered: 'Ready',
      installation_scheduled: 'Scheduled',
      installation_in_progress: 'In Progress',
      installation_completed: 'Completed',
      active: 'Active',
    };
    return labels[status] || status;
  };

  useEffect(() => {
    loadMap();

    return () => {
      // Cleanup markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers();
    }
  }, [installations]);

  const loadMap = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setLoading(false);
      return;
    }

    try {
      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry'],
      });

      await loader.load();

      if (!mapRef.current) return;

      // Center map on South Africa (Johannesburg)
      const center = { lat: -26.2041, lng: 28.0473 };

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 11,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();

      await updateMarkers();
      setLoading(false);
    } catch (err) {
      console.error('Error loading Google Maps:', err);
      setError('Failed to load map. Please refresh the page.');
      setLoading(false);
    }
  };

  const updateMarkers = async () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();
    let geocoded = 0;

    for (const installation of installations) {
      try {
        const result = await geocoder.geocode({
          address: installation.installation_address + ', South Africa',
        });

        if (result.results && result.results[0]) {
          const position = result.results[0].geometry.location;
          const color = statusColors[installation.status] || '#6B7280';

          // Create marker
          const marker = new google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: installation.customer_name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: color,
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          // Add click listener
          marker.addListener('click', () => {
            if (!infoWindowRef.current) return;

            const contentString = `
              <div style="padding: 8px; max-width: 300px;">
                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #1F2937;">
                  ${installation.customer_name}
                </h3>
                <div style="margin-bottom: 4px;">
                  <span style="font-weight: 600; color: #4B5563;">Order:</span>
                  <span style="color: #6B7280; margin-left: 4px;">${installation.order_number}</span>
                </div>
                <div style="margin-bottom: 4px;">
                  <span style="font-weight: 600; color: #4B5563;">Package:</span>
                  <span style="color: #6B7280; margin-left: 4px;">${installation.package_name} (${installation.package_speed})</span>
                </div>
                <div style="margin-bottom: 4px;">
                  <span style="font-weight: 600; color: #4B5563;">Status:</span>
                  <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 4px;">
                    ${getStatusLabel(installation.status)}
                  </span>
                </div>
                ${
                  installation.scheduled_date
                    ? `
                  <div style="margin-bottom: 4px;">
                    <span style="font-weight: 600; color: #4B5563;">Scheduled:</span>
                    <span style="color: #6B7280; margin-left: 4px;">${new Date(installation.scheduled_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                `
                    : ''
                }
                ${
                  installation.technician_name
                    ? `
                  <div style="margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #4B5563;">Technician:</span>
                    <span style="color: #6B7280; margin-left: 4px;">${installation.technician_name}</span>
                  </div>
                `
                    : ''
                }
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
                  <span style="font-size: 13px; color: #6B7280;">📍 ${installation.installation_address}</span>
                </div>
                <a
                  href="/admin/orders/${installation.order_id}"
                  target="_blank"
                  style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #F5831F; color: white; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 500;"
                >
                  View Order Details
                </a>
              </div>
            `;

            infoWindowRef.current.setContent(contentString);
            infoWindowRef.current.open(mapInstanceRef.current, marker);
          });

          markersRef.current.push(marker);
          bounds.extend(position);
          geocoded++;
        }
      } catch (err) {
        console.warn(`Failed to geocode address: ${installation.installation_address}`, err);
      }
    }

    setGeocodedCount(geocoded);

    // Fit map to markers
    if (markersRef.current.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);

      // Adjust zoom if only one marker
      if (markersRef.current.length === 1) {
        mapInstanceRef.current.setZoom(15);
      }
    }
  };

  const centerOnMarkers = () => {
    if (!mapInstanceRef.current || markersRef.current.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    markersRef.current.forEach((marker) => {
      const position = marker.getPosition();
      if (position) bounds.extend(position);
    });

    mapInstanceRef.current.fitBounds(bounds);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-circleTel-orange" />
            <CardTitle>Installation Map</CardTitle>
            <Badge variant="secondary">
              {geocodedCount} of {installations.length} locations
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={centerOnMarkers}>
            <Navigation className="h-4 w-4 mr-2" />
            Center Map
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
            </div>
          )}
          <div
            ref={mapRef}
            className="w-full rounded-lg border border-gray-200"
            style={{ height: '600px' }}
          />
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: statusColors.kyc_approved }}
            />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: statusColors.payment_method_registered }}
            />
            <span className="text-sm text-gray-600">Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: statusColors.installation_scheduled }}
            />
            <span className="text-sm text-gray-600">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: statusColors.installation_in_progress }}
            />
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: statusColors.installation_completed }}
            />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
