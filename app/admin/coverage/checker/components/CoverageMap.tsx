'use client';

import { useEffect, useRef } from 'react';
import { SectionCard } from '@/components/admin/shared';
import { PiMapPinBold } from 'react-icons/pi';

interface CoverageMapProps {
  targetLat: number;
  targetLng: number;
  targetAddress: string;
  // Tarana mode
  bnLat?: number | null;
  bnLng?: number | null;
  bnSiteName?: string;
  // DFA mode
  mode?: 'tarana' | 'dfa' | 'mtn';
  dfaCoverageType?: 'connected' | 'near-net' | 'none';
  // MTN mode
  mtnAvailable?: boolean;
}

export default function CoverageMap({
  targetLat, targetLng, targetAddress,
  bnLat, bnLng, bnSiteName,
  mode = 'tarana',
  dfaCoverageType,
  mtnAvailable,
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

    // BN marker (orange) — Tarana mode only
    if (mode === 'tarana' && bnLat !== null && bnLat !== undefined && bnLng !== null && bnLng !== undefined) {
      const bnMarker = new google.maps.Marker({
        position: { lat: bnLat, lng: bnLng },
        map,
        title: bnSiteName || 'Base Node',
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
        content: `<div style="font-size:12px;font-weight:600;padding:2px 4px">📡 ${bnSiteName || 'Base Node'}</div>`,
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
    }

    // DFA mode — add a coverage zone indicator
    if (mode === 'dfa' && dfaCoverageType && dfaCoverageType !== 'none') {
      const dfaColor = dfaCoverageType === 'connected' ? '#10B981' : '#F59E0B';
      // Circle overlay around target showing coverage zone
      new google.maps.Circle({
        map,
        center: { lat: targetLat, lng: targetLng },
        radius: dfaCoverageType === 'connected' ? 100 : 200,
        fillColor: dfaColor,
        fillOpacity: 0.15,
        strokeColor: dfaColor,
        strokeWeight: 2,
        strokeOpacity: 0.6,
      });

      const dfaLabel = dfaCoverageType === 'connected' ? 'DFA Connected Zone' : 'DFA Near-Net Zone';
      const dfaInfo = new google.maps.InfoWindow({
        content: `<div style="font-size:12px;font-weight:600;padding:2px 4px">🔌 ${dfaLabel}</div>`,
      });
      targetMarker.addListener('click', () => dfaInfo.open(map, targetMarker));
    }

    // MTN mode — signal-area indicator around target (no base-station data from WMS)
    if (mode === 'mtn') {
      const mtnColor = mtnAvailable ? '#10B981' : '#EF4444';
      new google.maps.Circle({
        map,
        center: { lat: targetLat, lng: targetLng },
        radius: 600,
        fillColor: mtnColor,
        fillOpacity: 0.12,
        strokeColor: mtnColor,
        strokeWeight: 2,
        strokeOpacity: 0.6,
      });

      const mtnInfo = new google.maps.InfoWindow({
        content: `<div style="font-size:12px;font-weight:600;padding:2px 4px">📱 MTN ${mtnAvailable ? 'coverage area' : 'no coverage'}</div>`,
      });
      targetMarker.addListener('click', () => mtnInfo.open(map, targetMarker));
    }

    map.fitBounds(bounds, 80);
  }, [targetLat, targetLng, bnLat, bnLng, targetAddress, bnSiteName, mode, dfaCoverageType, mtnAvailable]);

  return (
    <SectionCard title="Coverage Map" icon={PiMapPinBold}>
      <div ref={mapRef} className="w-full rounded-lg overflow-hidden" style={{ height: 320 }} />
      <div className="flex items-center gap-5 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          Target Address
        </span>
        {mode === 'dfa' ? (
          <span className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full inline-block ${
              dfaCoverageType === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />
            DFA {dfaCoverageType === 'connected' ? 'Connected' : 'Near-Net'} Zone
          </span>
        ) : mode === 'mtn' ? (
          <span className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full inline-block ${mtnAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
            MTN {mtnAvailable ? 'Coverage Area' : 'No Coverage'}
          </span>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
              Base Node ({bnSiteName || 'Unknown'})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-6 border-t-2 border-dashed border-orange-400 inline-block" />
              Link Path
            </span>
          </>
        )}
      </div>
    </SectionCard>
  );
}
