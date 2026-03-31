'use client';

import { useEffect, useRef } from 'react';
import { SectionCard } from '@/components/admin/shared';
import { PiMapPinBold } from 'react-icons/pi';

interface CoverageMapProps {
  targetLat: number;
  targetLng: number;
  targetAddress: string;
  bnLat: number | null;
  bnLng: number | null;
  bnSiteName: string;
}

export default function CoverageMap({
  targetLat, targetLng, targetAddress,
  bnLat, bnLng, bnSiteName,
}: CoverageMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || typeof google === 'undefined') return;

    const map = new google.maps.Map(mapRef.current, {
      zoom: 13,
      center: { lat: targetLat, lng: targetLng },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });
    mapInstanceRef.current = map;

    const bounds = new google.maps.LatLngBounds();

    // Target address marker (blue)
    const targetMarker = new google.maps.Marker({
      position: { lat: targetLat, lng: targetLng },
      map,
      title: targetAddress,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2.5,
      },
      zIndex: 10,
    });
    bounds.extend({ lat: targetLat, lng: targetLng });

    const targetInfo = new google.maps.InfoWindow({
      content: `<div style="font-size:12px;font-weight:600;padding:2px 4px;max-width:220px">${targetAddress}</div>`,
    });
    targetMarker.addListener('click', () => targetInfo.open(map, targetMarker));

    // BN marker (orange) if available
    if (bnLat !== null && bnLng !== null) {
      const bnMarker = new google.maps.Marker({
        position: { lat: bnLat, lng: bnLng },
        map,
        title: bnSiteName,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#F5831F',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2.5,
        },
        zIndex: 9,
        label: { text: 'BN', color: '#FFFFFF', fontSize: '9px', fontWeight: 'bold' },
      });
      bounds.extend({ lat: bnLat, lng: bnLng });

      const bnInfo = new google.maps.InfoWindow({
        content: `<div style="font-size:12px;font-weight:600;padding:2px 4px">📡 ${bnSiteName}</div>`,
      });
      bnMarker.addListener('click', () => bnInfo.open(map, bnMarker));

      // Dashed polyline connecting target to BN
      new google.maps.Polyline({
        path: [
          { lat: targetLat, lng: targetLng },
          { lat: bnLat, lng: bnLng },
        ],
        map,
        strokeColor: '#F5831F',
        strokeOpacity: 0,
        strokeWeight: 2,
        icons: [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
          offset: '0',
          repeat: '12px',
        }],
      });

      map.fitBounds(bounds, 80);
    }
  }, [targetLat, targetLng, bnLat, bnLng, targetAddress, bnSiteName]);

  return (
    <SectionCard title="Coverage Map" icon={PiMapPinBold}>
      <div ref={mapRef} className="w-full rounded-lg overflow-hidden" style={{ height: 320 }} />
      <div className="flex items-center gap-5 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          Target Address
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
          Base Node ({bnSiteName})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 border-t-2 border-dashed border-orange-400 inline-block" />
          Link Path
        </span>
      </div>
    </SectionCard>
  );
}
