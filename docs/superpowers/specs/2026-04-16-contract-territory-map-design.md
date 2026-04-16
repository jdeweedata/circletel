# Contract Territory Map — Design Spec

**Date**: 2026-04-16  
**Status**: Approved  
**Author**: Jeffrey (via Claude Code brainstorming)

---

## Purpose

Visualise 833 geocoded competitor customer addresses on an interactive admin map so the CircleTel team can assess locality, identify coverage gaps, and plan conversion campaigns. This is a read-only assessment tool — no campaign triggering in this phase.

---

## User Goal

> "I want the addresses mapped so I can assess the specific locality of these addresses and if there is coverage or not at the specific addresses."

---

## Scope

**In scope:**
- Map page showing all 833 contract address pins coloured by price tier
- Per-pin popup: account number, package name, monthly fee, address
- On-demand DFA coverage check per pin (lazy — user clicks "Check Coverage")
- Client-side filters: price tier, province, package name search
- Tier summary stats bar
- Navigation link from the Marketing dashboard Quick Actions

**Out of scope (future):**
- Bulk coverage check across all pins
- Campaign triggering / WhatsApp/SMS outreach
- Saving coverage results to database
- Export / territory brief generation

---

## Data Sources

### Static Files (no DB tables required)

| File | Contents |
|------|----------|
| `/home/circletel/contracts_extracted.json` | 1,470 records: `account_number`, `package_name`, `monthly_fee`, `physical_address`, `source_filename`, `drive_file_id` |
| `/home/circletel/contracts_geocode_cache.json` | 833 geocoded addresses: `"address string" → [lat, lng]` |

The API route merges these two files at request time. Only records that have both a `physical_address` with a digit (clean addresses) **and** a matching geocode cache entry are returned — 833 records total.

### Coverage API

`POST /api/admin/coverage/dfa`  
Request body: `{ coordinates: { lat: number, lng: number } }`  
Returns DFA coverage status for that coordinate. Called lazily on user action — not batched on page load.

---

## Architecture

```
app/admin/marketing/contract-map/page.tsx          ← Page shell
  └── components/admin/marketing/ContractTerritoryMap.tsx  ← Map + filters + popups

app/api/admin/marketing/contracts/route.ts          ← GET endpoint, merges JSON files
  reads: /home/circletel/contracts_extracted.json
  reads: /home/circletel/contracts_geocode_cache.json
  returns: ContractRecord[]

app/admin/marketing/page.tsx                        ← Add Quick Action link (minor edit)
```

### Data Types

```typescript
interface ContractRecord {
  account_number: string;
  package_name: string;
  monthly_fee: string;
  physical_address: string;
  source_filename: string;
  lat: number;
  lng: number;
  tier: 'under-300' | '300-500' | '500-800' | '800-plus' | 'unknown';
  province: string | null; // derived from geocode reverse or address string
}

type CoverageResult = 'unchecked' | 'checking' | 'covered' | 'not-covered' | 'error';
```

---

## Page Layout

```
┌─ Page Header ────────────────────────────────────────────────────────────┐
│  Contract Territory Map                          833 addresses            │
│  Competitor customer locations — assess coverage before targeting         │
├─ Filter Bar ─────────────────────────────────────────────────────────────┤
│  [All Tiers ▾]  [All Provinces ▾]  [Search package...]  [Reset filters]  │
├─ Tier Stats Row ──────────────────────────────────────────────────────────┤
│   ● 131 Under R300  ● 416 R300–500  ● 97 R500–800  ● 63 R800+  ● 126 ?  │
├─ Map (fills remaining viewport height, min 500px) ───────────────────────┤
│                                                                            │
│   Google Maps — SA bounds, pins coloured by tier                          │
│                                                                            │
│   ┌─ Pin Popup (on click) ──────────────────────────────┐                │
│   │ Account:   XAB001                                    │                │
│   │ Package:   MyChoice 10Mbps                           │                │
│   │ Monthly:   R349                                      │                │
│   │ Address:   12 Rietfontein Rd, Paternoster            │                │
│   │ Coverage:  [Check DFA Coverage]                      │                │
│   │            → ✓ DFA Connected  / ✗ No Coverage       │                │
│   └──────────────────────────────────────────────────────┘                │
│                                                                            │
│   ┌─ Legend (bottom-left) ──────────────────┐                            │
│   │ ● Under R300  ● R300–500  ● R500–800    │                            │
│   │ ● R800+       ● Unknown                 │                            │
│   └─────────────────────────────────────────┘                            │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Component: ContractTerritoryMap

**Responsibilities:**
- Loads contract data from `/api/admin/marketing/contracts` on mount
- Initialises Google Maps using the existing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Renders `AdvancedMarkerElement` pins (or circle markers as fallback) coloured by tier
- Applies client-side filter state to show/hide markers without re-fetching
- Opens an `InfoWindow` popup on pin click
- Calls `POST /api/admin/coverage/dfa` on "Check Coverage" button press inside popup
- Caches coverage results in a `Map<string, CoverageResult>` keyed by `account_number`

**Tier colours** (matching the KML):

| Tier | Colour | Hex |
|------|--------|-----|
| Under R300 | Green | `#16a34a` |
| R300–R500 | Amber | `#ca8a04` |
| R500–R800 | Orange | `#ea580c` |
| R800+ | Red | `#dc2626` |
| Unknown | Grey | `#94a3b8` |

---

## API Route: GET /api/admin/marketing/contracts

- Reads both JSON files from filesystem using `fs.readFileSync`
- Merges on `physical_address` string matching the geocode cache key
- Derives `tier` from `monthly_fee` string (same logic as `geocode_to_kml.py`)
- Does **not** write to database
- Returns `{ success: true, data: ContractRecord[], total: number }`
- Response cached with `Cache-Control: s-maxage=3600` (file changes rarely)

---

## Province Derivation

Province is derived from the geocoded address string using a simple keyword match against known SA province/city names. This is best-effort for filter UX — accuracy is sufficient for grouping, not billing.

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| JSON files missing | API returns 500 with message; page shows error alert |
| Google Maps fails to load | Map area shows "Map unavailable" with address list fallback |
| Coverage check fails | Popup shows "Coverage check failed — try again" |
| No records match filters | Map clears, shows "No addresses match current filters" |

---

## Navigation

Add a Quick Action card to `app/admin/marketing/page.tsx`:

```
Title: Contract Territory Map
Description: Assess competitor customer locations & coverage
Icon: PiMapPinBold
Href: /admin/marketing/contract-map
```

---

## Future Enhancements (not in scope)

- Bulk coverage check with progress bar
- "Mark as opportunity" flag saved to Supabase
- Export selected pins as CSV/PDF territory brief
- WhatsApp/SMS campaign trigger for a selected territory
- Overlay CircleTel coverage polygon on same map
