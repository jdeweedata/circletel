# SkyFibre Campaign Coverage Validation — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** When a customer places an order from a SkyFibre campaign, validate coverage using live TCS Portal data (BN online status + RN connectivity) instead of just proximity to a base station.

**Architecture:** Three-phase approach — (1) fix the Inngest sync to capture all live status fields the DB already supports, (2) expose live status in the admin UI and API, (3) integrate live-status gating into the coverage check so orders only confirm "covered" when the nearest BN is online and has connected RNs.

**Tech Stack:** TypeScript, Next.js 15 API routes, Supabase/PostgreSQL, Tarana TCS Portal NQS v1 + TMQ v5 APIs, Inngest background jobs, React/shadcn UI.

---

## Phase 1: Fix the Sync Pipeline (the data problem)

### Task 1: Write `device_status`, hierarchy IDs, and RF metadata during sync

**Objective:** The Inngest sync function writes `active_connections` from RN counts but drops `device_status`, `height_m`, `azimuth_deg`, `band`, and all hierarchy ID columns — even though the DB has the columns and the TMQ v1 API returns the data.

**Files:**
- Modify: `lib/inngest/functions/tarana-sync.ts:243-253`

**Step 1: Extend the upsert record in `tarana-sync.ts`**

Replace the record object (lines 243-253) with the full field set:

```typescript
const record = {
  serial_number: bn.serialNumber,
  hostname: bn.deviceId || bn.serialNumber,
  site_name: bn.siteName || 'Unknown Site',
  active_connections: rnCountsBySite[bn.siteName ?? ''] ?? 0,
  market: bn.marketName || 'Unknown',
  lat: bn.latitude,
  lng: bn.longitude,
  region: bn.regionName || 'South Africa',
  // NEW: live status and RF metadata
  device_status: bn.deviceStatus ?? 0,
  height_m: bn.height ?? null,
  azimuth_deg: bn.azimuth ?? null,
  band: bn.band ?? null,
  // NEW: hierarchy IDs for future BN-RN matching
  region_id: bn.regionId ?? null,
  market_id: bn.marketId ?? null,
  site_id: bn.siteId ?? null,
  cell_id: bn.cellId ?? null,
  cell_name: bn.cellName ?? null,
  sector_id: bn.sectorId ?? null,
  sector_name: bn.sectorName ?? null,
  last_updated: new Date().toISOString(),
};
```

**Step 2: Verify** — run type-check to confirm `TaranaRadio` has all referenced fields (it does — see `lib/tarana/types.ts` lines 78-110).

Run: `npm run type-check`
Expected: PASS (no new errors)

**Step 3: Commit**

```bash
git add lib/inngest/functions/tarana-sync.ts
git commit -m "fix(sync): persist device_status, hierarchy IDs, and RF metadata from TCS API"
```

---

### Task 2: Sync network-wide device counts from TMQ v5

**Objective:** Call `getDeviceCounts()` during the sync and store the summary (connected/disconnected/spectrum-unassigned/new-installs per BN and RN) for dashboard display and coverage gating.

**Files:**
- Modify: `lib/inngest/functions/tarana-sync.ts` (add a new step between step 5 and step 6)
- Create: `supabase/migrations/20260525_add_tarana_device_counts.sql`

**Step 1: Create the `tarana_device_counts` table**

```sql
CREATE TABLE IF NOT EXISTS public.tarana_device_counts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_log_id uuid REFERENCES public.tarana_sync_logs(id),
  bn_connected integer NOT NULL DEFAULT 0,
  bn_disconnected integer NOT NULL DEFAULT 0,
  bn_spectrum_unassigned integer NOT NULL DEFAULT 0,
  bn_new_installs_30d integer NOT NULL DEFAULT 0,
  bn_total integer NOT NULL DEFAULT 0,
  rn_connected integer NOT NULL DEFAULT 0,
  rn_disconnected integer NOT NULL DEFAULT 0,
  rn_spectrum_unassigned integer NOT NULL DEFAULT 0,
  rn_new_installs_30d integer NOT NULL DEFAULT 0,
  rn_total integer NOT NULL DEFAULT 0,
  fetched_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.tarana_device_counts IS 'Network-wide device counts from TMQ v5 /radios/count, synced daily';
```

**Step 2: Add sync step between step 5 (fetch-rn-counts) and step 6 (upsert-records)**

Insert a new step in the Inngest function after line 223:

```typescript
// Step 5b: Fetch network-wide device counts (dashboard data)
const deviceCounts = await step.run('fetch-device-counts', async () => {
  try {
    const { getDeviceCounts } = await import('@/lib/tarana/client');
    console.log('[TaranaSync] Fetching device counts from TMQ v5...');
    const counts = await getDeviceCounts();
    console.log(`[TaranaSync] BN: ${counts.bn.connected}C/${counts.bn.disconnected}D/${counts.bn.total}T | RN: ${counts.rn.connected}C/${counts.rn.disconnected}D/${counts.rn.total}T`);
    return counts;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[TaranaSync] Failed to fetch device counts (continuing):', message);
    return null;
  }
});
```

**Step 3: Store device counts after upsert**

Add a step after step 6 (upsert-records) to persist counts:

```typescript
// Step 6b: Store device counts
if (deviceCounts) {
  await step.run('store-device-counts', async () => {
    const supabase = await createClient();
    const { error } = await supabase
      .from('tarana_device_counts')
      .insert({
        sync_log_id: syncLogId,
        bn_connected: deviceCounts.bn.connected,
        bn_disconnected: deviceCounts.bn.disconnected,
        bn_spectrum_unassigned: deviceCounts.bn.spectrumUnassigned,
        bn_new_installs_30d: deviceCounts.bn.newInstalls30Days,
        bn_total: deviceCounts.bn.total,
        rn_connected: deviceCounts.rn.connected,
        rn_disconnected: deviceCounts.rn.disconnected,
        rn_spectrum_unassigned: deviceCounts.rn.spectrumUnassigned,
        rn_new_installs_30d: deviceCounts.rn.newInstalls30Days,
        rn_total: deviceCounts.rn.total,
      });

    if (error) {
      console.error('[TaranaSync] Failed to store device counts:', error.message);
    }
  });
}
```

**Step 4: Verify**

```bash
npm run type-check
```

**Step 5: Commit**

```bash
git add supabase/migrations/20260525_add_tarana_device_counts.sql lib/inngest/functions/tarana-sync.ts
git commit -m "feat(sync): capture network-wide device counts from TMQ v5 /radios/count"
```

---

## Phase 2: Expose Live Status in UI and API

### Task 3: Include `device_status` in base station API responses

**Objective:** The GET `/api/admin/coverage/base-stations` endpoint returns station data but drops `device_status`. Add it so the UI can show online/offline badges.

**Files:**
- Modify: `app/api/admin/coverage/base-stations/route.ts:102-115`

**Step 1: Add `deviceStatus` to the transformed stations**

```typescript
const transformedStations = stations?.map((station) => ({
  id: station.id,
  serialNumber: station.serial_number,
  hostname: station.hostname,
  siteName: station.site_name,
  activeConnections: station.active_connections,
  market: station.market,
  lat: parseFloat(station.lat),
  lng: parseFloat(station.lng),
  region: station.region,
  // NEW
  deviceStatus: station.device_status ?? 0,
  band: station.band ?? null,
  lastUpdated: station.last_updated,
  createdAt: station.created_at,
})) || [];
```

**Step 2: Add connected/disconnected counts to stats**

After line 88, add:

```typescript
const onlineStations = statsData?.filter(s => s.device_status === 1).length || 0;
const offlineStations = totalStations - onlineStations;
```

Include in the stats response at line 118:

```typescript
stats: {
  totalStations,
  totalConnections,
  avgConnections: parseFloat(avgConnections.toFixed(1)),
  marketCount: markets.length,
  markets,
  // NEW
  onlineStations,
  offlineStations,
},
```

**Step 3: Verify**

```bash
npm run type-check
```

**Step 4: Commit**

```bash
git add app/api/admin/coverage/base-stations/route.ts
git commit -m "feat(api): expose device_status and online/offline counts in base station API"
```

---

### Task 4: Add online/offline badges and stats to the admin UI

**Objective:** Show connected/disconnected status in the base stations table and summary cards so the team can see at a glance which BNs are online.

**Files:**
- Modify: `app/admin/coverage/base-stations/page.tsx` (interface + fetch + rendering)
- Modify: `components/admin/coverage/BaseStationStats.tsx` (add online/offline cards)
- Modify: `components/admin/coverage/BaseStationTable.tsx` (show status badge)

**Step 1: Update the `BaseStation` interface in page.tsx**

```typescript
interface BaseStation {
  id: string;
  serialNumber: string;
  hostname: string;
  siteName: string;
  activeConnections: number;
  market: string;
  lat: number;
  lng: number;
  region: string;
  deviceStatus: number;   // NEW: 1=online, 0=offline
  band: string | null;     // NEW
  lastUpdated: string;
}
```

**Step 2: Update the `Stats` interface**

```typescript
interface Stats {
  totalStations: number;
  totalConnections: number;
  avgConnections: number;
  marketCount: number;
  markets: Market[];
  onlineStations: number;    // NEW
  offlineStations: number;   // NEW
}
```

**Step 3: Pass new props to `BaseStationStats`**

```typescript
<BaseStationStats
  totalStations={stats.totalStations}
  totalConnections={stats.totalConnections}
  avgConnections={stats.avgConnections}
  marketCount={stats.marketCount}
  onlineStations={stats.onlineStations}
  offlineStations={stats.offlineStations}
  loading={loading && stations.length === 0}
/>
```

**Step 4: Update `BaseStationStats` to show online/offline cards**

Replace the 4-card grid with a 6-card grid or replace "Avg Connections" and "Markets" with "Online BNs" and "Offline BNs". Keep Total Stations and Total Connections. Add:

```typescript
// Online card (green)
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Online BNs</CardTitle>
    <PiCheckCircleBold className="h-4 w-4 text-green-600" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-green-600">{onlineStations.toLocaleString()}</div>
    <p className="text-xs text-muted-foreground">
      {totalStations > 0 ? ((onlineStations / totalStations) * 100).toFixed(1) : 0}% of base stations
    </p>
  </CardContent>
</Card>

// Offline card (red)
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Offline BNs</CardTitle>
    <PiWarningCircleBold className="h-4 w-4 text-red-600" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-red-600">{offlineStations.toLocaleString()}</div>
    <p className="text-xs text-muted-foreground">Require attention</p>
  </CardContent>
</Card>
```

Needs import: `PiCheckCircleBold, PiWarningCircleBold` from `react-icons/pi`.

**Step 5: Add status badge column to `BaseStationTable`**

Find the table component and add a "Status" column that renders:
- Green badge "Online" when `deviceStatus === 1`
- Red badge "Offline" when `deviceStatus === 0`

(The exact implementation depends on the table component's column definition pattern — read the component first.)

**Step 6: Verify**

```bash
npm run type-check
```

**Step 7: Commit**

```bash
git add app/admin/coverage/base-stations/page.tsx \
        components/admin/coverage/BaseStationStats.tsx \
        components/admin/coverage/BaseStationTable.tsx
git commit -m "feat(ui): add online/offline badges and stats to base stations page"
```

---

### Task 5: Add device-count dashboard API endpoint

**Objective:** Create a simple API that returns the latest device counts so the admin UI can show the full dashboard-level summary (BN connected/disconnected, RN connected/disconnected, new installs).

**Files:**
- Create: `app/api/admin/tarana/device-counts/route.ts`

**Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tarana_device_counts')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({
      success: false,
      error: 'No device count data available yet. Run a sync first.',
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      bn: {
        connected: data.bn_connected,
        disconnected: data.bn_disconnected,
        spectrumUnassigned: data.bn_spectrum_unassigned,
        newInstalls30d: data.bn_new_installs_30d,
        total: data.bn_total,
      },
      rn: {
        connected: data.rn_connected,
        disconnected: data.rn_disconnected,
        spectrumUnassigned: data.rn_spectrum_unassigned,
        newInstalls30d: data.rn_new_installs_30d,
        total: data.rn_total,
      },
      fetchedAt: data.fetched_at,
    },
  });
}
```

**Step 2: Verify**

```bash
npm run type-check
```

**Step 3: Commit**

```bash
git add app/api/admin/tarana/device-counts/route.ts
git commit -m "feat(api): add device-counts endpoint for dashboard summary"
```

---

## Phase 3: Coverage Validation with Live Status

### Task 6: Add live-status gating to coverage check

**Objective:** Modify `checkBaseStationProximity()` to filter out offline BNs and flag when the nearest online BN has zero connected RNs on its site.

**Files:**
- Modify: `lib/coverage/mtn/base-station-service.ts`

**Step 1: Add `device_status` filter to the PostGIS proximity query**

The current query uses `find_nearest_tarana_base_station` RPC. Check whether a `device_status` filter exists or needs adding. If the RPC doesn't filter by status, add a WHERE clause or create a new RPC. Simpler approach: filter in TypeScript.

After fetching stations (line 92), add:

```typescript
// Filter out offline base stations — they can't serve customers
const onlineStations = stations.filter((s: any) => s.device_status === 1);

if (onlineStations.length === 0) {
  // All nearby BNs are offline
  return {
    hasCoverage: false,
    confidence: 'none',
    requiresElevatedInstall: false,
    installationNote: 'Nearest base station is currently offline',
    nearestStation: stations[0] ? {
      siteName: stations[0].site_name,
      hostname: stations[0].hostname,
      distanceKm: Number(stations[0].distance_km),
      activeConnections: stations[0].active_connections,
      market: stations[0].market,
    } : null,
    allNearbyStations: stations.map(mapStation), // keep all for debugging
    metadata: {
      checkedAt: new Date().toISOString(),
      coordinatesUsed: coordinates,
      stationsChecked: stations.length,
    },
  };
}
```

**Step 2: Add zero-RN warning for online BNs**

After confidence calculation, if the nearest online BN has `active_connections === 0`:

```typescript
if (nearest.active_connections === 0 && confidence !== 'none') {
  // BN is online but has no connected RNs — degraded coverage
  result.installationNote = (result.installationNote || '') +
    ' Note: Base station is online but has no active customer connections. Coverage unverified.';
  if (confidence === 'high') {
    result.confidence = 'medium';
  }
}
```

**Step 3: Verify**

```bash
npm run type-check
```

**Step 4: Commit**

```bash
git add lib/coverage/mtn/base-station-service.ts
git commit -m "feat(coverage): gate coverage on BN online status and RN connectivity"
```

---

### Task 7: Add a pre-order coverage validation endpoint

**Objective:** Create a dedicated API endpoint for campaign order validation that returns a clear yes/no/maybe answer with reasons, combining proximity + live status + device counts.

**Files:**
- Create: `app/api/coverage/campaign-validate/route.ts`

**Step 1: Create the endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkBaseStationProximity } from '@/lib/coverage/mtn/base-station-service';
import type { Coordinates } from '@/lib/coverage/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, address } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Coordinates (lat, lng) are required' },
        { status: 400 }
      );
    }

    const coordinates: Coordinates = { lat, lng };

    // 1. Check base station proximity (now with live-status gating)
    const proximity = await checkBaseStationProximity(coordinates, { limit: 3 });

    // 2. Get latest device counts for context
    const supabase = await createClient();
    const { data: deviceCounts } = await supabase
      .from('tarana_device_counts')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    // 3. Determine coverage verdict
    let verdict: 'covered' | 'degraded' | 'uncovered' | 'unknown' = 'unknown';
    let reason = '';

    if (!proximity.hasCoverage) {
      verdict = 'uncovered';
      reason = proximity.installationNote || 'No base station within range';
    } else if (proximity.confidence === 'high') {
      verdict = 'covered';
      reason = `Strong coverage: ${proximity.nearestStation?.siteName} (${proximity.nearestStation?.distanceKm}km, ${proximity.nearestStation?.activeConnections} connections)`;
    } else if (proximity.confidence === 'medium') {
      verdict = 'degraded';
      reason = proximity.installationNote || 'Moderate coverage — install may need verification';
    } else if (proximity.confidence === 'low') {
      verdict = 'degraded';
      reason = proximity.installationNote || 'Weak coverage — elevated install likely required';
    }

    return NextResponse.json({
      success: true,
      data: {
        verdict,
        reason,
        confidence: proximity.confidence,
        nearestStation: proximity.nearestStation,
        networkSummary: deviceCounts ? {
          totalBNs: deviceCounts.bn_total,
          onlineBNs: deviceCounts.bn_connected,
          totalRNs: deviceCounts.rn_total,
          onlineRNs: deviceCounts.rn_connected,
          fetchedAt: deviceCounts.fetched_at,
        } : null,
        address: address || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify**

```bash
npm run type-check
```

**Step 3: Commit**

```bash
git add app/api/coverage/campaign-validate/route.ts
git commit -m "feat(api): add campaign-validate endpoint for pre-order coverage checks"
```

---

### Task 8: Run type-check across all changes

```bash
npm run type-check
```

Expected: PASS with no new errors. Fix any issues before considering the plan complete.

---

## Verification Checklist

After all tasks are complete:

1. **Sync data quality** — trigger a manual sync and verify:
   - `tarana_base_stations.device_status` is populated (not all 0)
   - `tarana_device_counts` has a row with actual numbers
   - `height_m`, `band`, `site_id` etc. are populated where available

2. **UI rendering** — open `/admin/coverage/base-stations`:
   - Online/Offline BN cards show correct counts
   - Table has a Status column with green/red badges

3. **Coverage check** — call `POST /api/coverage/campaign-validate` with coordinates near an offline BN:
   - Should return `verdict: "uncovered"` with reason mentioning offline BN
   - Call with coordinates near an online BN with connections:
   - Should return `verdict: "covered"` or `"degraded"`

4. **No regression** — run existing test suite:
   ```bash
   npm test
   ```

---

## Summary of Changes

| File | Action | Phase |
|---|---|---|
| `lib/inngest/functions/tarana-sync.ts` | Modify — extend upsert record + add device-counts step | 1 |
| `supabase/migrations/20260525_add_tarana_device_counts.sql` | Create — new table | 1 |
| `app/api/admin/coverage/base-stations/route.ts` | Modify — add deviceStatus + online/offline stats | 2 |
| `app/admin/coverage/base-stations/page.tsx` | Modify — new props + interfaces | 2 |
| `components/admin/coverage/BaseStationStats.tsx` | Modify — online/offline cards | 2 |
| `components/admin/coverage/BaseStationTable.tsx` | Modify — status badge column | 2 |
| `app/api/admin/tarana/device-counts/route.ts` | Create — dashboard summary endpoint | 2 |
| `lib/coverage/mtn/base-station-service.ts` | Modify — filter offline BNs, zero-RN warning | 3 |
| `app/api/coverage/campaign-validate/route.ts` | Create — pre-order validation endpoint | 3 |

**No new dependencies required.** All APIs already exist in the codebase.
