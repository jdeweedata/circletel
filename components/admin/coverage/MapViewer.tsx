'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface MapViewerProps {
  mapId: string;
  mapName: string;
  provider: string;
  type: 'kml' | 'kmz' | 'geojson';
  filePath?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function MapViewer({ mapId, mapName, provider, type, filePath }: MapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonsRef = useRef<any[]>([]);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Only load script if not already loading/loaded
    if (scriptLoadedRef.current) {
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      scriptLoadedRef.current = true;
      // Wait for it to load
      if (window.google && window.google.maps) {
        initializeMap();
      } else {
        existingScript.addEventListener('load', initializeMap);
      }
      return;
    }

    // Load Google Maps script
    scriptLoadedRef.current = true;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeMap();
    };
    script.onerror = () => {
      setError('Failed to load Google Maps');
      setIsLoading(false);
      scriptLoadedRef.current = false;
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup polygons
      polygonsRef.current.forEach(polygon => {
        if (polygon && polygon.setMap) {
          polygon.setMap(null);
        }
      });
      polygonsRef.current = [];

      // Keep map instance for potential reuse
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [mapId]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    try {
      // Initialize map centered on South Africa
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: -30.5595, lng: 22.9375 }, // South Africa center
        zoom: 6,
        mapTypeId: 'roadmap',
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Load KML/KMZ file if available, otherwise show sample data
      if (filePath) {
        loadKMLLayer(map, filePath);
      } else {
        addSampleCoverageOverlay(map);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }
  };

  const loadKMLLayer = async (map: any, kmlPath: string) => {
    try {
      // Extract filename from path and use API route
      const filename = kmlPath.split('/').pop();
      const apiUrl = `/api/uploads/coverage-maps/${filename}`;

      // Fetch the KML/KMZ file from the API
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error('Failed to fetch KML file:', response.status);
        addSampleCoverageOverlay(map);
        return;
      }

      const fileType = kmlPath.toLowerCase();
      let kmlText: string;

      if (fileType.endsWith('.kmz')) {
        // For KMZ files, we need to extract the KML
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        // Use JSZip to extract KML from KMZ
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Find the KML file in the archive
        const kmlFile = Object.keys(zip.files).find(name =>
          name.toLowerCase().endsWith('.kml')
        );

        if (!kmlFile) {
          throw new Error('No KML file found in KMZ archive');
        }

        kmlText = await zip.files[kmlFile].async('string');
      } else {
        // For KML files, just get the text
        kmlText = await response.text();
      }

      // Parse and render the KML
      parseAndRenderKML(map, kmlText);
    } catch (err) {
      console.error('Error loading KML file:', err);
      addSampleCoverageOverlay(map);
    }
  };

  const parseAndRenderKML = (map: any, kmlText: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(kmlText, 'text/xml');

      // Extract placemarks
      const placemarks = xmlDoc.getElementsByTagName('Placemark');

      if (placemarks.length === 0) {
        console.warn('No placemarks found in KML');
        addSampleCoverageOverlay(map);
        return;
      }

      const bounds = new window.google.maps.LatLngBounds();
      let featuresAdded = 0;
      let hasValidBounds = false;

      // Clear existing polygons
      polygonsRef.current.forEach(polygon => {
        if (polygon && polygon.setMap) {
          polygon.setMap(null);
        }
      });
      polygonsRef.current = [];

      // Process each placemark
      for (let i = 0; i < placemarks.length; i++) {
        const placemark = placemarks[i];

        // Check if this is a Point or Polygon
        const pointElement = placemark.getElementsByTagName('Point')[0];
        const polygonElement = placemark.getElementsByTagName('Polygon')[0];

        if (pointElement) {
          // Handle Point (tower/station location)
          const coordinatesElement = pointElement.getElementsByTagName('coordinates')[0];
          if (!coordinatesElement) continue;

          const coordsText = coordinatesElement.textContent?.trim();
          if (!coordsText) continue;

          const parts = coordsText.split(',');
          const lon = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);

          if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            const latLng = new window.google.maps.LatLng(lat, lon);
            bounds.extend(latLng);
            hasValidBounds = true;

            // Create a circle to represent coverage area around the point
            try {
              const circle = new window.google.maps.Circle({
                center: { lat, lng: lon },
                radius: 500, // 500m radius for visualization
                strokeColor: '#F5831F',
                strokeOpacity: 0.6,
                strokeWeight: 1,
                fillColor: '#F5831F',
                fillOpacity: 0.2,
                map: mapInstanceRef.current
              });

              // Store circle reference
              polygonsRef.current.push(circle);

              // Add click listener
              const infoWindow = new window.google.maps.InfoWindow();
              circle.addListener('click', (event: any) => {
                const name = placemark.getElementsByTagName('name')[0]?.textContent || 'Coverage Point';
                const description = placemark.getElementsByTagName('description')[0]?.textContent || '';
                infoWindow.setContent(`
                  <div style="padding: 8px; max-width: 250px;">
                    <strong>${name}</strong><br/>
                    <span style="color: #666;">Provider: ${provider}</span><br/>
                    ${description ? `<div style="margin-top: 4px; font-size: 11px; color: #888;">${description.substring(0, 150)}...</div>` : ''}
                  </div>
                `);
                infoWindow.setPosition(event.latLng);
                infoWindow.open(mapInstanceRef.current);
              });

              featuresAdded++;
            } catch (err) {
              console.error('Error creating coverage circle:', err);
            }
          }
        } else if (polygonElement) {
          // Handle Polygon
          const coordinatesElement = polygonElement.getElementsByTagName('coordinates')[0];
          if (!coordinatesElement) continue;

          const coordsText = coordinatesElement.textContent?.trim();
          if (!coordsText) continue;

          // Parse coordinates (format: lon,lat,alt lon,lat,alt ...)
          const coordPairs = coordsText.split(/\s+/).filter(Boolean);
          const path: Array<{lat: number, lng: number}> = [];

          coordPairs.forEach(pair => {
            const parts = pair.split(',');
            const lon = parseFloat(parts[0]);
            const lat = parseFloat(parts[1]);

            if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
              const latLng = new window.google.maps.LatLng(lat, lon);
              path.push({ lat, lng: lon });
              bounds.extend(latLng);
              hasValidBounds = true;
            }
          });

          if (path.length >= 3) {
            // Create polygon (need at least 3 points)
            try {
              const polygon = new window.google.maps.Polygon({
                paths: path,
                strokeColor: '#F5831F',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#F5831F',
                fillOpacity: 0.35,
                map: mapInstanceRef.current
              });

              // Store polygon reference
              polygonsRef.current.push(polygon);

              // Add click listener
              const infoWindow = new window.google.maps.InfoWindow();
              polygon.addListener('click', (event: any) => {
                const name = placemark.getElementsByTagName('name')[0]?.textContent || 'Coverage Area';
                infoWindow.setContent(`
                  <div style="padding: 8px;">
                    <strong>${name}</strong><br/>
                    <span style="color: #666;">Provider: ${provider}</span>
                  </div>
                `);
                infoWindow.setPosition(event.latLng);
                infoWindow.open(mapInstanceRef.current);
              });

              featuresAdded++;
            } catch (polygonErr) {
              console.error('Error creating polygon:', polygonErr);
            }
          }
        }
      }

      console.log(`Rendered ${featuresAdded} features from ${placemarks.length} placemarks`);

      if (featuresAdded > 0 && hasValidBounds) {
        // Fit map to bounds with padding
        try {
          mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
        } catch (boundsErr) {
          console.error('Error fitting bounds:', boundsErr);
        }
      } else {
        console.warn('No valid features rendered');
        addSampleCoverageOverlay(map);
      }
    } catch (err) {
      console.error('Error parsing KML:', err);
      addSampleCoverageOverlay(map);
    }
  };

  const addSampleCoverageOverlay = (map: any) => {
    // Clear existing polygons
    polygonsRef.current.forEach(polygon => {
      if (polygon && polygon.setMap) {
        polygon.setMap(null);
      }
    });
    polygonsRef.current = [];

    // Sample coverage area polygons (these would come from your KML/KMZ file)
    const coverageAreas = [
      // Cape Town area
      {
        coords: [
          { lat: -33.9249, lng: 18.4241 },
          { lat: -33.9249, lng: 18.5241 },
          { lat: -34.0249, lng: 18.5241 },
          { lat: -34.0249, lng: 18.4241 },
        ],
        color: '#4CAF50',
      },
      // Johannesburg area
      {
        coords: [
          { lat: -26.2041, lng: 28.0473 },
          { lat: -26.2041, lng: 28.1473 },
          { lat: -26.3041, lng: 28.1473 },
          { lat: -26.3041, lng: 28.0473 },
        ],
        color: '#2196F3',
      },
      // Durban area
      {
        coords: [
          { lat: -29.8587, lng: 31.0218 },
          { lat: -29.8587, lng: 31.1218 },
          { lat: -29.9587, lng: 31.1218 },
          { lat: -29.9587, lng: 31.0218 },
        ],
        color: '#FF9800',
      },
    ];

    coverageAreas.forEach((area, index) => {
      const polygon = new window.google.maps.Polygon({
        paths: area.coords,
        strokeColor: area.color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: area.color,
        fillOpacity: 0.35,
        map: mapInstanceRef.current,
      });

      // Store polygon reference
      polygonsRef.current.push(polygon);

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow();

      polygon.addListener('click', (event: any) => {
        infoWindow.setContent(`
          <div style="padding: 8px;">
            <strong>${mapName}</strong><br/>
            <span style="color: #666;">Provider: ${provider}</span><br/>
            <span style="color: #666;">Coverage Area ${index + 1}</span>
          </div>
        `);
        infoWindow.setPosition(event.latLng);
        infoWindow.open(mapInstanceRef.current);
      });
    });

    // Add markers for major cities
    const cities = [
      { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
      { name: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
      { name: 'Durban', lat: -29.8587, lng: 31.0218 },
    ];

    cities.forEach(city => {
      new window.google.maps.Marker({
        position: { lat: city.lat, lng: city.lng },
        map: mapInstanceRef.current,
        title: city.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#F5831F',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
    });
  };

  if (error) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center space-y-2">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-gray-600">Unable to load map visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] rounded-lg overflow-hidden border border-gray-300">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 text-circleTel-orange animate-spin mx-auto" />
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}