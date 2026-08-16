'use client';

import { useEffect, useRef, useState } from 'react';
import { PiMagnifyingGlassBold, PiXBold } from 'react-icons/pi';
import { loadGoogleMapsService } from '@/lib/googleMapsLoader';
import {
  PORTAL_COVERAGE_WMS,
  portalWmsProxyPath,
  type PortalCoverageLayer,
} from '@/lib/portal/coverage-wms';

export type CoverageLayer = PortalCoverageLayer;

export interface MapClinic {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

interface PortalCoverageMapProps {
  selected: MapClinic | null;
  clinics: MapClinic[];
  activeLayer: CoverageLayer;
  onLayerChange: (layer: CoverageLayer) => void;
  onSelectClinic: (id: string) => void;
  onPickLocation: (coords: { lat: number; lng: number }, address: string) => void;
  height?: string;
}

const DEFAULT_CENTER = { lat: -26.2041, lng: 28.0473 };

const LAYERS: Array<{
  id: CoverageLayer;
  label: string;
  idle: string;
  active: string;
  text: string;
}> = [
  { id: 'fixed_wireless', label: 'Fixed wireless', idle: '#FFFFFF', active: '#2563C9', text: '#FFFFFF' },
  { id: '5g', label: '5G', idle: '#FFFFFF', active: '#0F766E', text: '#FFFFFF' },
  { id: '4g', label: '4G', idle: '#FFFFFF', active: '#DC2626', text: '#FFFFFF' },
  { id: 'all', label: 'All', idle: '#FFFFFF', active: '#EAB308', text: '#13274A' },
];

const SA_BOUNDS = {
  north: -22.0,
  south: -35.0,
  east: 33.0,
  west: 16.0,
};

function enabledLayers(active: CoverageLayer): Array<Exclude<CoverageLayer, 'all'>> {
  if (active === 'all') return ['fixed_wireless', '5g', '4g'];
  return [active];
}

export default function PortalCoverageMap({
  selected,
  clinics,
  activeLayer,
  onLayerChange,
  onSelectClinic,
  onPickLocation,
  height,
}: PortalCoverageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const overlaysRef = useRef<google.maps.ImageMapType[]>([]);
  const onPickRef = useRef(onPickLocation);
  const onSelectRef = useRef(onSelectClinic);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  onPickRef.current = onPickLocation;
  onSelectRef.current = onSelectClinic;

  useEffect(() => {
    let cancelled = false;

    loadGoogleMapsService()
      .then((service) => service.loadGoogleMaps())
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.maps) return;

        const map = new window.google.maps.Map(containerRef.current, {
          center: selected
            ? { lat: selected.lat, lng: selected.lng }
            : DEFAULT_CENTER,
          zoom: selected ? 16 : 6,
          restriction: { latLngBounds: SA_BOUNDS, strictBounds: true },
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });
        mapRef.current = map;

        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          const coords = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: coords }, (results, status) => {
            const address =
              status === 'OK' && results?.[0]?.formatted_address
                ? results[0].formatted_address
                : `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
            setSearch(address);
            onPickRef.current(coords, address);
          });
        });

        setReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Map could not load');
        }
      });

    return () => {
      cancelled = true;
    };
    // Create the map once. Later selected/clinic changes pan via other effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || !window.google?.maps?.places) return;
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'za' },
      fields: ['formatted_address', 'geometry', 'name'],
    });
    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const loc = place.geometry?.location;
      if (!loc) return;
      const coords = { lat: loc.lat(), lng: loc.lng() };
      const address = place.formatted_address || place.name || '';
      setSearch(address);
      onPickRef.current(coords, address);
      mapRef.current?.panTo(coords);
      mapRef.current?.setZoom(16);
    });
    return () => listener.remove();
  }, [ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    map.panTo({ lat: selected.lat, lng: selected.lng });
    map.setZoom(16);
  }, [selected]);

  useEffect(() => {
    const map = mapRef.current;
    const el = containerRef.current;
    if (!map || !ready || !el || !window.google?.maps) return;
    const triggerResize = () => {
      window.google.maps.event.trigger(map, 'resize');
    };
    const observer = new ResizeObserver(triggerResize);
    observer.observe(el);
    triggerResize();
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = clinics.map((clinic) => {
      const marker = new window.google.maps.Marker({
        map,
        position: { lat: clinic.lat, lng: clinic.lng },
        title: clinic.label,
        opacity: selected?.id === clinic.id ? 1 : 0.7,
      });
      marker.addListener('click', () => onSelectRef.current(clinic.id));
      return marker;
    });

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [clinics, selected, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !window.google?.maps) return;

    const applyOverlays = () => {
      const existing = overlaysRef.current.length;
      for (let i = 0; i < existing; i++) {
        const last = map.overlayMapTypes.getLength() - 1;
        if (last >= 0) map.overlayMapTypes.removeAt(last);
      }
      overlaysRef.current = [];

      const projection = map.getProjection();
      if (!projection) return;

      enabledLayers(activeLayer).forEach((id) => {
        const spec = PORTAL_COVERAGE_WMS[id];
        const wmsUrl = portalWmsProxyPath(spec);
        const imageMapType = new window.google.maps.ImageMapType({
          getTileUrl: (coord, zoom) => {
            const scale = 1 << zoom;
            const topLeft = projection.fromPointToLatLng(
              new window.google.maps.Point((coord.x / scale) * 256, (coord.y / scale) * 256)
            );
            const bottomRight = projection.fromPointToLatLng(
              new window.google.maps.Point(((coord.x + 1) / scale) * 256, ((coord.y + 1) / scale) * 256)
            );
            if (!topLeft || !bottomRight) return '';
            const bbox = `${topLeft.lng()},${bottomRight.lat()},${bottomRight.lng()},${topLeft.lat()}`;
            return wmsUrl.replace('{bbox}', bbox);
          },
          tileSize: new window.google.maps.Size(256, 256),
          opacity: 0.55,
          name: id,
        });
        map.overlayMapTypes.push(imageMapType);
        overlaysRef.current.push(imageMapType);
      });
    };

    applyOverlays();
    const listener = map.addListener('projection_changed', applyOverlays);
    return () => listener.remove();
  }, [activeLayer, ready]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center text-sm h-[min(55dvh,380px)] sm:h-[480px] lg:h-[520px]"
        style={{ height, color: 'var(--pm-body)' }}
      >
        Map could not load. You can still use the clinic list.
      </div>
    );
  }

  const layerButtons = (placement: 'mobile' | 'desktop') =>
    LAYERS.map((layer) => {
      const on = activeLayer === layer.id;
      return (
        <button
          key={`${placement}-${layer.id}`}
          type="button"
          onClick={() => onLayerChange(layer.id)}
          className={
            placement === 'mobile'
              ? 'min-h-11 shrink-0 rounded-md px-3 py-2 text-xs font-extrabold shadow-sm ring-1 ring-black/[0.08]'
              : 'rounded-md px-3 py-1.5 text-xs font-extrabold shadow-sm ring-1 ring-black/[0.08]'
          }
          style={{
            background: on ? layer.active : layer.idle,
            color: on ? layer.text : '#2563C9',
          }}
        >
          {layer.label}
        </button>
      );
    });

  return (
    <div>
      <div
        className="relative h-[min(55dvh,380px)] sm:h-[480px] lg:h-[520px]"
        style={height ? { height } : undefined}
      >
        <div ref={containerRef} className="h-full w-full" />
        {!ready && (
          <div
            className="absolute inset-0 flex items-center justify-center text-sm bg-white/80"
            style={{ color: 'var(--pm-body)' }}
          >
            Loading map…
          </div>
        )}

        <div className="absolute left-3 top-3 right-3 z-10 sm:right-28">
          <div className="flex min-h-11 items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-black/[0.08]">
            <PiMagnifyingGlassBold className="h-4 w-4 shrink-0" style={{ color: '#6B7280' }} />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for a clinic or new address"
              className="w-full min-w-0 bg-transparent text-sm outline-none"
              style={{ color: 'var(--pm-navy)' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center"
                aria-label="Clear search"
              >
                <PiXBold className="h-4 w-4" style={{ color: '#6B7280' }} />
              </button>
            )}
          </div>
        </div>

        <div className="absolute right-3 top-3 z-10 hidden flex-col gap-1 sm:flex">
          {layerButtons('desktop')}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto px-3 py-2 sm:hidden">
        {layerButtons('mobile')}
      </div>
    </div>
  );
}
