// components/admin/marketing/ContractTerritoryMap.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface ContractRecord {
  account_number: string;
  package_name: string;
  monthly_fee: string;
  physical_address: string;
  source_filename: string;
  lat: number;
  lng: number;
  tier: 'under-300' | '300-500' | '500-800' | '800-plus' | 'unknown';
  province: string | null;
}

type CoverageResult = 'unchecked' | 'checking' | 'covered' | 'not-covered' | 'error';

const TIER_COLORS: Record<ContractRecord['tier'], string> = {
  'under-300': '#16a34a',
  '300-500': '#ca8a04',
  '500-800': '#ea580c',
  '800-plus': '#dc2626',
  'unknown': '#94a3b8',
};

const TIER_LABELS: Record<ContractRecord['tier'], string> = {
  'under-300': 'Under R300',
  '300-500': 'R300–500',
  '500-800': 'R500–800',
  '800-plus': 'R800+',
  'unknown': 'Unknown',
};

export function ContractTerritoryMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [records, setRecords] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter state
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [packageSearch, setPackageSearch] = useState('');

  // Coverage cache keyed by account_number
  const [coverageMap, setCoverageMap] = useState<Map<string, CoverageResult>>(new Map());

  // Derived: available provinces
  const provinces = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.province) set.add(r.province);
    }
    return Array.from(set).sort();
  }, [records]);

  // Derived: filtered records
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (tierFilter !== 'all' && r.tier !== tierFilter) return false;
      if (provinceFilter !== 'all' && r.province !== provinceFilter) return false;
      if (packageSearch && !r.package_name.toLowerCase().includes(packageSearch.toLowerCase())) return false;
      return true;
    });
  }, [records, tierFilter, provinceFilter, packageSearch]);

  // Tier stats from all records (not filtered)
  const tierStats = useMemo(() => {
    const counts: Record<ContractRecord['tier'], number> = {
      'under-300': 0, '300-500': 0, '500-800': 0, '800-plus': 0, 'unknown': 0,
    };
    for (const r of records) counts[r.tier]++;
    return counts;
  }, [records]);

  // Load records from API
  useEffect(() => {
    fetch('/api/admin/marketing/contracts')
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setRecords(Array.isArray(json.data) ? json.data : []);
      })
      .catch((err) => {
        console.error('[ContractTerritoryMap] fetch error:', err);
        setLoadError('Failed to load contract data. Please refresh.');
      })
      .finally(() => setLoading(false));
  }, []);

  function buildInfoContent(record: ContractRecord, coverageResult: CoverageResult): string {
    const color = TIER_COLORS[record.tier];
    const tierLabel = TIER_LABELS[record.tier];
    let coverageHtml = '';
    if (coverageResult === 'unchecked') {
      coverageHtml = `<div style="margin-top:8px;"><button id="ctm-check-btn" style="padding:4px 12px;background:#f97316;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">Check DFA Coverage</button></div>`;
    } else if (coverageResult === 'checking') {
      coverageHtml = `<div style="margin-top:8px;color:#6b7280;font-size:13px;">Checking coverage...</div>`;
    } else if (coverageResult === 'covered') {
      coverageHtml = `<div style="margin-top:8px;color:#16a34a;font-size:13px;font-weight:600;">✓ DFA Connected</div>`;
    } else if (coverageResult === 'not-covered') {
      coverageHtml = `<div style="margin-top:8px;color:#dc2626;font-size:13px;font-weight:600;">✗ No DFA Coverage</div>`;
    } else {
      coverageHtml = `<div style="margin-top:8px;color:#9a3412;font-size:13px;">Coverage check failed — try again</div>`;
    }
    return `
      <div style="font-family:sans-serif;font-size:14px;min-width:220px;padding:4px 0;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <span style="width:10px;height:10px;background:${color};border-radius:50%;display:inline-block;"></span>
          <strong>${record.account_number}</strong>
          <span style="color:#6b7280;font-size:12px;">(${tierLabel})</span>
        </div>
        <div><span style="color:#6b7280;">Package:</span> ${record.package_name || '—'}</div>
        <div><span style="color:#6b7280;">Monthly:</span> R${record.monthly_fee || '—'}</div>
        <div style="margin-top:4px;font-size:12px;color:#374151;">${record.physical_address}</div>
        ${coverageHtml}
      </div>
    `;
  }

  // Coverage check handler
  const checkCoverage = useCallback(
    async (record: ContractRecord) => {
      setCoverageMap((prev) => new Map(prev).set(record.account_number, 'checking'));
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(buildInfoContent(record, 'checking'));
      }
      try {
        const res = await fetch('/api/admin/coverage/dfa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coordinates: { lat: record.lat, lng: record.lng } }),
        });
        if (!res.ok) throw new Error(`Coverage API error ${res.status}`);
        const json = await res.json();
        const result: CoverageResult = json.available ? 'covered' : 'not-covered';
        setCoverageMap((prev) => new Map(prev).set(record.account_number, result));
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(buildInfoContent(record, result));
        }
      } catch {
        setCoverageMap((prev) => new Map(prev).set(record.account_number, 'error'));
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(buildInfoContent(record, 'error'));
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Init map
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: -33.9, lng: 18.5 },
      zoom: 7,
      mapTypeId: 'roadmap',
    });
    googleMapRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
    setMapLoaded(true);
  }, []);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapError('Google Maps API key not configured');
      return;
    }
    if (window.google && window.google.maps) {
      initMap();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    script.onerror = () => setMapError('Failed to load Google Maps');
    document.head.appendChild(script);
    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
    };
  }, [initMap]);

  // Update markers when filtered records or map readiness changes
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;
    const map = googleMapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (filtered.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    for (const record of filtered) {
      const position = { lat: record.lat, lng: record.lng };
      bounds.extend(position);
      const color = TIER_COLORS[record.tier];
      const marker = new google.maps.Marker({
        map,
        position,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: color,
          fillOpacity: 0.85,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
        },
        title: `${record.account_number} — ${record.physical_address}`,
      });

      marker.addListener('click', () => {
        const coverageResult = coverageMap.get(record.account_number) ?? 'unchecked';
        const content = buildInfoContent(record, coverageResult);
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(map, marker);

        // Attach click handler after InfoWindow renders (100ms delay for DOM)
        window.setTimeout(() => {
          const btn = document.getElementById('ctm-check-btn');
          if (btn) {
            btn.addEventListener('click', () => checkCoverage(record));
          }
        }, 100);
      });

      markersRef.current.push(marker);
    }

    map.fitBounds(bounds);
  }, [filtered, mapLoaded, coverageMap, checkCoverage]);

  const resetFilters = () => {
    setTierFilter('all');
    setProvinceFilter('all');
    setPackageSearch('');
  };

  const tierOrder: ContractRecord['tier'][] = ['under-300', '300-500', '500-800', '800-plus', 'unknown'];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3">
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="all">All Tiers</option>
          <option value="under-300">Under R300</option>
          <option value="300-500">R300–500</option>
          <option value="500-800">R500–800</option>
          <option value="800-plus">R800+</option>
          <option value="unknown">Unknown</option>
        </select>

        <select
          value={provinceFilter}
          onChange={(e) => setProvinceFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="all">All Provinces</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search package..."
          value={packageSearch}
          onChange={(e) => setPackageSearch(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
        />

        <button
          onClick={resetFilters}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Reset filters
        </button>

        <span className="ml-auto text-sm text-gray-500 font-medium">
          {filtered.length} / {records.length} addresses
        </span>
      </div>

      {/* Tier Stats Row */}
      <div className="flex flex-wrap gap-3">
        {tierOrder.map((tier) => (
          <button
            key={tier}
            onClick={() => setTierFilter(tier === tierFilter ? 'all' : tier)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              tierFilter === tier ? 'ring-2 ring-offset-1' : ''
            }`}
            style={{
              borderColor: TIER_COLORS[tier],
              color: TIER_COLORS[tier],
              backgroundColor: tierFilter === tier ? `${TIER_COLORS[tier]}18` : 'white',
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: TIER_COLORS[tier] }}
            />
            {tierStats[tier]} {TIER_LABELS[tier]}
          </button>
        ))}
      </div>

      {/* Load / Error States */}
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {loadError}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
          Loading contract data...
        </div>
      )}

      {/* Map */}
      <div className="relative rounded-xl border border-gray-200 overflow-hidden" style={{ minHeight: '500px', height: 'calc(100vh - 320px)' }}>
        {mapError ? (
          <div className="flex items-center justify-center h-full bg-gray-50 text-gray-500 text-sm">
            {mapError}
          </div>
        ) : filtered.length === 0 && !loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10 text-gray-500 text-sm pointer-events-none">
            No addresses match current filters
          </div>
        ) : null}
        <div ref={mapRef} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute bottom-6 left-3 bg-white/95 rounded-lg border border-gray-200 px-3 py-2 text-xs shadow-sm space-y-1">
          {tierOrder.map((tier) => (
            <div key={tier} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TIER_COLORS[tier] }} />
              <span className="text-gray-600">{TIER_LABELS[tier]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
