# Contract Territory Map — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive admin map at `/admin/marketing/contract-map` showing 833 geocoded competitor customer addresses colour-coded by price tier, with per-pin popups and on-demand DFA coverage checks.

**Architecture:** A dedicated Next.js page hosts a client-side Google Maps component that fetches contract data from a new API route. The route merges two static JSON files on the server (`contracts_extracted.json` + `contracts_geocode_cache.json`) — no database writes. Coverage checks are lazy (user-triggered per pin) via the existing `POST /api/admin/coverage/dfa` endpoint.

**Tech Stack:** Next.js 15, TypeScript, React hooks, Google Maps JavaScript API (same pattern as `ZoneHeatMap.tsx`), `fs.readFileSync` on server, Jest for API unit tests.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/api/admin/marketing/contracts/route.ts` | GET endpoint — merges JSON files, derives tier + province, returns `ContractRecord[]` |
| Create | `app/api/admin/marketing/contracts/__tests__/contracts.test.ts` | Unit tests for merge logic and tier derivation |
| Create | `components/admin/marketing/ContractTerritoryMap.tsx` | Client component — Google Maps with tier pins, filter state, InfoWindow, lazy coverage check |
| Create | `app/admin/marketing/contract-map/page.tsx` | Server page shell — metadata + component mount |
| Modify | `app/admin/marketing/page.tsx` | Add "Contract Territory Map" Quick Action card |

---

## Task 1: API route — GET /api/admin/marketing/contracts

**Files:**
- Create: `app/api/admin/marketing/contracts/__tests__/contracts.test.ts`
- Create: `app/api/admin/marketing/contracts/route.ts`

- [ ] **Step 1.1: Write the failing test**

```typescript
// app/api/admin/marketing/contracts/__tests__/contracts.test.ts
import { tierFor, provinceFor, mergeContracts } from '../route';

describe('tierFor', () => {
  it('returns under-300 for fee below 300', () => {
    expect(tierFor('250')).toBe('under-300');
    expect(tierFor('R 299.00')).toBe('under-300');
  });

  it('returns 300-500 for fee between 300 and 499', () => {
    expect(tierFor('350')).toBe('300-500');
    expect(tierFor('R499.00')).toBe('300-500');
  });

  it('returns 500-800 for fee between 500 and 799', () => {
    expect(tierFor('500')).toBe('500-800');
    expect(tierFor('750')).toBe('500-800');
  });

  it('returns 800-plus for fee 800 and above', () => {
    expect(tierFor('800')).toBe('800-plus');
    expect(tierFor('1200')).toBe('800-plus');
  });

  it('returns unknown for empty or unparseable fee', () => {
    expect(tierFor('')).toBe('unknown');
    expect(tierFor('N/A')).toBe('unknown');
    expect(tierFor(undefined as unknown as string)).toBe('unknown');
  });
});

describe('provinceFor', () => {
  it('detects Western Cape from address', () => {
    expect(provinceFor('12 Main Rd, Cape Town, 8001')).toBe('Western Cape');
  });
  it('detects Gauteng from address', () => {
    expect(provinceFor('55 Voortrekker, Pretoria, 0001')).toBe('Gauteng');
  });
  it('returns null for unknown', () => {
    expect(provinceFor('Unknown place')).toBeNull();
  });
});

describe('mergeContracts', () => {
  const contracts = [
    { account_number: 'ABC001', package_name: 'Fibre 10', monthly_fee: '349', physical_address: '12 Main Rd, Cape Town', source_filename: 'f.pdf', drive_file_id: 'xxx' },
    { account_number: 'ABC002', package_name: 'Fibre 20', monthly_fee: '', physical_address: 'No number here', source_filename: 'g.pdf', drive_file_id: 'yyy' },
  ];
  const geocache: Record<string, [number, number] | null> = {
    '12 Main Rd, Cape Town': [-33.9249, 18.4241],
  };

  it('returns only records that have a digit in address AND exist in geocache', () => {
    const result = mergeContracts(contracts, geocache);
    expect(result).toHaveLength(1);
    expect(result[0].account_number).toBe('ABC001');
  });

  it('attaches lat, lng, tier, province to each record', () => {
    const result = mergeContracts(contracts, geocache);
    expect(result[0].lat).toBe(-33.9249);
    expect(result[0].lng).toBe(18.4241);
    expect(result[0].tier).toBe('300-500');
    expect(result[0].province).toBe('Western Cape');
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

```bash
cd /home/circletel && npx jest app/api/admin/marketing/contracts/__tests__/contracts.test.ts --no-coverage 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module '../route'`

- [ ] **Step 1.3: Write the implementation**

```typescript
// app/api/admin/marketing/contracts/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export interface ContractRecord {
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

interface RawContract {
  account_number: string;
  package_name: string;
  monthly_fee: string;
  physical_address: string;
  source_filename: string;
  drive_file_id: string;
}

const PROVINCE_KEYWORDS: [string, string][] = [
  ['Cape Town', 'Western Cape'],
  ['Stellenbosch', 'Western Cape'],
  ['Paarl', 'Western Cape'],
  ['George', 'Western Cape'],
  ['Klawer', 'Western Cape'],
  ['Lambertsbay', 'Western Cape'],
  ['Clanwilliam', 'Western Cape'],
  ['Vredendal', 'Western Cape'],
  ['Mossel Bay', 'Western Cape'],
  ['Knysna', 'Western Cape'],
  ['Oudtshoorn', 'Western Cape'],
  ['Paternoster', 'Western Cape'],
  ['Langebaan', 'Western Cape'],
  ['Saldanha', 'Western Cape'],
  ['Hermanus', 'Western Cape'],
  ['Johannesburg', 'Gauteng'],
  ['Sandton', 'Gauteng'],
  ['Pretoria', 'Gauteng'],
  ['Centurion', 'Gauteng'],
  ['Midrand', 'Gauteng'],
  ['Durban', 'KwaZulu-Natal'],
  ['Pietermaritzburg', 'KwaZulu-Natal'],
  ['Port Elizabeth', 'Eastern Cape'],
  ['Gqeberha', 'Eastern Cape'],
  ['East London', 'Eastern Cape'],
  ['Bloemfontein', 'Free State'],
  ['Kimberley', 'Northern Cape'],
  ['Upington', 'Northern Cape'],
  ['Polokwane', 'Limpopo'],
  ['Nelspruit', 'Mpumalanga'],
  ['Mbombela', 'Mpumalanga'],
  ['Rustenburg', 'North West'],
  ['Mahikeng', 'North West'],
  ['Richards Bay', 'KwaZulu-Natal'],
];

export function tierFor(fee: string | undefined): ContractRecord['tier'] {
  if (!fee) return 'unknown';
  const m = fee.replace(/\s/g, '').match(/[\d,]+\.?\d*/);
  if (!m) return 'unknown';
  const val = parseFloat(m[0].replace(',', ''));
  if (isNaN(val)) return 'unknown';
  if (val < 300) return 'under-300';
  if (val < 500) return '300-500';
  if (val < 800) return '500-800';
  return '800-plus';
}

export function provinceFor(address: string): string | null {
  const upper = address.toUpperCase();
  for (const [keyword, province] of PROVINCE_KEYWORDS) {
    if (upper.includes(keyword.toUpperCase())) return province;
  }
  return null;
}

export function mergeContracts(
  contracts: RawContract[],
  geocache: Record<string, [number, number] | null>
): ContractRecord[] {
  const result: ContractRecord[] = [];
  for (const rec of contracts) {
    const addr = (rec.physical_address || '').trim();
    // Skip records without a digit in the address (unclean)
    if (!/\d/.test(addr)) continue;
    const coords = geocache[addr];
    if (!coords) continue;
    result.push({
      account_number: rec.account_number,
      package_name: rec.package_name,
      monthly_fee: rec.monthly_fee,
      physical_address: addr,
      source_filename: rec.source_filename,
      lat: coords[0],
      lng: coords[1],
      tier: tierFor(rec.monthly_fee),
      province: provinceFor(addr),
    });
  }
  return result;
}

const CONTRACTS_PATH = path.join('/home/circletel', 'contracts_extracted.json');
const GEOCACHE_PATH = path.join('/home/circletel', 'contracts_geocode_cache.json');

export async function GET() {
  try {
    const contracts: RawContract[] = JSON.parse(fs.readFileSync(CONTRACTS_PATH, 'utf-8'));
    const geocache: Record<string, [number, number] | null> = JSON.parse(
      fs.readFileSync(GEOCACHE_PATH, 'utf-8')
    );
    const data = mergeContracts(contracts, geocache);
    return NextResponse.json(
      { success: true, data, total: data.length },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' } }
    );
  } catch (err) {
    console.error('[contracts route] Failed to load data files:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load contract data' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

```bash
cd /home/circletel && npx jest app/api/admin/marketing/contracts/__tests__/contracts.test.ts --no-coverage 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 1.5: Type check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | grep -E "error|warning|contracts" | head -20
```

Expected: No errors in the new file.

- [ ] **Step 1.6: Commit**

```bash
cd /home/circletel && git add app/api/admin/marketing/contracts/route.ts app/api/admin/marketing/contracts/__tests__/contracts.test.ts && git commit -m "feat(contract-map): add GET /api/admin/marketing/contracts endpoint"
```

---

## Task 2: ContractTerritoryMap component

**Files:**
- Create: `components/admin/marketing/ContractTerritoryMap.tsx`

- [ ] **Step 2.1: Write the component**

```typescript
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

function CoverageButton({
  result,
  onCheck,
}: {
  result: CoverageResult;
  onCheck: () => void;
}) {
  if (result === 'unchecked') {
    return (
      `<button onclick="window._checkCoverage()" style="margin-top:8px;padding:4px 12px;background:#f97316;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">Check DFA Coverage</button>`
    );
  }
  if (result === 'checking') return `<span style="color:#6b7280;font-size:13px;">Checking...</span>`;
  if (result === 'covered') return `<span style="color:#16a34a;font-size:13px;font-weight:600;">✓ DFA Connected</span>`;
  if (result === 'not-covered') return `<span style="color:#dc2626;font-size:13px;font-weight:600;">✗ No DFA Coverage</span>`;
  return `<span style="color:#9a3412;font-size:13px;">Coverage check failed — try again</span>`;
}

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

  // Coverage check handler — exposed on window so InfoWindow HTML button can call it
  const checkCoverage = useCallback(
    async (record: ContractRecord) => {
      setCoverageMap((prev) => new Map(prev).set(record.account_number, 'checking'));
      // Re-render the current InfoWindow content
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
    []
  );

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

  // Init map
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: -33.9, lng: 18.5 }, // Cape West Coast — majority of records
      zoom: 7,
      mapTypeId: 'roadmap',
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
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

        // Attach click handler after InfoWindow renders
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

  // Tier stats display order
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
```

- [ ] **Step 2.2: Type check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | grep -E "error TS|ContractTerritoryMap" | head -20
```

Expected: No TypeScript errors.

- [ ] **Step 2.3: Commit**

```bash
cd /home/circletel && git add components/admin/marketing/ContractTerritoryMap.tsx && git commit -m "feat(contract-map): add ContractTerritoryMap component with tier pins and coverage check"
```

---

## Task 3: Page shell

**Files:**
- Create: `app/admin/marketing/contract-map/page.tsx`

- [ ] **Step 3.1: Write the page**

```typescript
// app/admin/marketing/contract-map/page.tsx
import { Metadata } from 'next';
import { ContractTerritoryMap } from '@/components/admin/marketing/ContractTerritoryMap';

export const metadata: Metadata = {
  title: 'Contract Territory Map | Marketing | CircleTel Admin',
  description: 'Competitor customer locations — assess DFA coverage before targeting',
};

export default function ContractTerritoryMapPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Contract Territory Map</h1>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">
            833 addresses
          </span>
        </div>
        <p className="text-gray-500 mt-1 text-sm">
          Competitor customer locations — assess coverage before targeting
        </p>
      </div>

      <ContractTerritoryMap />
    </div>
  );
}
```

- [ ] **Step 3.2: Type check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | grep -E "error TS|contract-map" | head -20
```

Expected: No TypeScript errors.

- [ ] **Step 3.3: Commit**

```bash
cd /home/circletel && git add app/admin/marketing/contract-map/page.tsx && git commit -m "feat(contract-map): add contract-map page shell"
```

---

## Task 4: Add Quick Action link to Marketing dashboard

**Files:**
- Modify: `app/admin/marketing/page.tsx`

- [ ] **Step 4.1: Add the import and Quick Action**

In `app/admin/marketing/page.tsx`, add `PiMapPinBold` to the existing `react-icons/pi` import at line 1, then add a new `<QuickAction>` entry after the existing four.

Edit line 1 — add `PiMapPinBold` to the import:

```typescript
import { PiArrowRightBold, PiArrowsClockwiseBold, PiCalendarBold, PiChartBarBold, PiGiftBold, PiMapPinBold, PiMegaphoneBold, PiPercentBold, PiPlusBold, PiSpinnerBold, PiTargetBold, PiTrendUpBold, PiUsersBold } from 'react-icons/pi';
```

Then in the Quick Actions section (after the Campaign Analytics QuickAction, around line 270), add:

```tsx
<QuickAction
  title="Contract Territory Map"
  description="Assess competitor customer locations & coverage"
  icon={PiMapPinBold}
  href="/admin/marketing/contract-map"
/>
```

- [ ] **Step 4.2: Type check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | grep -E "error TS|marketing/page" | head -20
```

Expected: No TypeScript errors.

- [ ] **Step 4.3: Commit**

```bash
cd /home/circletel && git add app/admin/marketing/page.tsx && git commit -m "feat(contract-map): add Quick Action link on Marketing dashboard"
```

---

## Task 5: Smoke test in browser

- [ ] **Step 5.1: Start dev server**

```bash
cd /home/circletel && npm run dev:memory
```

- [ ] **Step 5.2: Verify API route returns data**

Open: `http://localhost:3000/api/admin/marketing/contracts`

Expected response:
```json
{
  "success": true,
  "total": 833,
  "data": [{ "account_number": "...", "lat": ..., "lng": ..., "tier": "300-500", ... }]
}
```

- [ ] **Step 5.3: Verify map page loads**

Navigate to: `http://localhost:3000/admin/marketing/contract-map`

Check:
- [ ] Filter bar renders with tier/province selects and package search
- [ ] Tier stats row shows 5 coloured pill buttons with counts
- [ ] Map renders and shows pins (may take a few seconds to load)
- [ ] Click a pin → InfoWindow opens with account, package, monthly fee, address
- [ ] "Check DFA Coverage" button in popup fires a request and shows result
- [ ] Filter by tier → markers update without page reload

- [ ] **Step 5.4: Verify Quick Action link on Marketing dashboard**

Navigate to: `http://localhost:3000/admin/marketing`

Check:
- [ ] "Contract Territory Map" Quick Action card visible
- [ ] Clicking it navigates to `/admin/marketing/contract-map`

- [ ] **Step 5.5: Invoke verification-before-completion skill**

```
/skill superpowers:verification-before-completion
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Map page at `/admin/marketing/contract-map` — Task 3
- ✅ 833 pins coloured by tier — Task 2 (marker rendering with TIER_COLORS)
- ✅ Per-pin popup: account, package, monthly fee, address — Task 2 (buildInfoContent)
- ✅ On-demand DFA coverage check (lazy) — Task 2 (checkCoverage + button)
- ✅ Client-side filters: tier, province, package search — Task 2 (filter state + useMemo)
- ✅ Tier summary stats bar — Task 2 (tierStats + tier pill buttons)
- ✅ Quick Action link on Marketing dashboard — Task 4
- ✅ API route merges JSON files — Task 1
- ✅ Province derivation from address string — Task 1 (provinceFor)
- ✅ Error handling: JSON files missing → 500 + error alert — Task 1 + Task 2
- ✅ Error handling: Maps fails → "Map unavailable" — Task 2 (mapError state)
- ✅ Error handling: Coverage check fails → "try again" — Task 2 (error CoverageResult)
- ✅ Error handling: No records match filters → empty state message — Task 2

**Type consistency:**
- `ContractRecord` interface defined in both `route.ts` (exported) and `ContractTerritoryMap.tsx` (local). They are consistent.
- `CoverageResult` type consistent between definition and all usages.
- `TIER_COLORS` and `TIER_LABELS` keyed by `ContractRecord['tier']` — TypeScript will flag any missing key.
