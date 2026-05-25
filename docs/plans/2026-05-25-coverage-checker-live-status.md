# Coverage Checker — Live TCS Portal Status Integration

> **For Hermes:** Implement task-by-task. Each task is self-contained and type-checkable.

**Goal:** Add live operational context (BN online/offline, RN connectivity, network health) to the admin coverage checker so sales staff can see whether a technically-covered address is actually serviceable *right now*.

**Architecture:** Extend `POST /api/admin/tarana/predict` to include live status data alongside the terrain prediction. Add a `NetworkStatusCard` component and update `SalesRecommendationCard` to gate recommendations on live BN status. The terrain `CoveragePrediction` type stays unchanged — live data arrives as a separate response field.

**Files (6 total):**
- `app/api/admin/tarana/predict/route.ts` — extend API response
- `lib/coverage/prediction/types.ts` — add `LiveNetworkStatus` type
- `app/admin/coverage/checker/page.tsx` — wire new data through
- `app/admin/coverage/checker/components/NetworkStatusCard.tsx` — new component
- `app/admin/coverage/checker/components/CoverageVerdictCard.tsx` — show live status in verdict
- `app/admin/coverage/checker/components/SalesRecommendationCard.tsx` — gate on live status

---

### Task 1: Add `LiveNetworkStatus` type

**Objective:** Define the shape of live status data returned alongside terrain predictions.

**File:** `lib/coverage/prediction/types.ts`

Add after the `CoveragePrediction` interface:

```typescript
// ============================================================================
// Live Network Status (from TCS Portal)
// ============================================================================

export interface LiveNetworkStatus {
  /** Whether the nearest BN is currently online (1=online, 0=offline) */
  bnOnline: boolean;
  /** Active customer connections on the nearest BN's site */
  bnActiveConnections: number;
  /** Network-wide BN summary */
  networkSummary: {
    totalBNs: number;
    onlineBNs: number;
    totalRNs: number;
    onlineRNs: number;
    fetchedAt: string | null;
  } | null;
}
```

**Verify:** `npx tsc --noEmit 2>&1 | grep "prediction/types"` — expect zero output.

---

### Task 2: Extend predict API to include live status

**Objective:** `POST /api/admin/tarana/predict` currently fetches BN coordinates + hierarchy. Add `device_status`, `active_connections`, and the latest device counts to the response.

**File:** `app/api/admin/tarana/predict/route.ts`

**Step 1:** Extend the BN query to include `device_status` and `active_connections`.

Change line 30-34 from:
```typescript
    const { data: bn } = await supabase
      .from('tarana_base_stations')
      .select('lat, lng, cell_name, sector_name, market_id, site_id')
      .eq('serial_number', prediction.nearestBnSerial)
      .single();
```
To:
```typescript
    const { data: bn } = await supabase
      .from('tarana_base_stations')
      .select('lat, lng, cell_name, sector_name, market_id, site_id, device_status, active_connections')
      .eq('serial_number', prediction.nearestBnSerial)
      .single();
```

**Step 2:** Fetch latest device counts (in parallel with BN query):

```typescript
    // Fetch latest device counts for network-wide context
    const { data: deviceCounts } = await supabase
      .from('tarana_device_counts')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();
```

**Step 3:** Build the `liveStatus` object and add to response. Replace the return statement (lines 36-46) with:

```typescript
    const liveStatus = {
      bnOnline: (bn?.device_status ?? 0) === 1,
      bnActiveConnections: bn?.active_connections ?? 0,
      networkSummary: deviceCounts ? {
        totalBNs: deviceCounts.bn_total,
        onlineBNs: deviceCounts.bn_connected,
        totalRNs: deviceCounts.rn_total,
        onlineRNs: deviceCounts.rn_connected,
        fetchedAt: deviceCounts.fetched_at,
      } : null,
    };

    return NextResponse.json({
      prediction,
      baseStation: bn ? { lat: Number(bn.lat), lng: Number(bn.lng) } : null,
      networkInfo: bn ? {
        regionName: 'South Africa',
        marketId: bn.market_id ?? null,
        siteName: prediction.nearestBnSiteName,
        cellName: bn.cell_name ?? null,
        sectorName: bn.sector_name ?? null,
      } : null,
      liveStatus,
    });
```

**Step 4:** Import `LiveNetworkStatus` in the page (will be done in Task 3).

**Verify:** `npm run type-check` — filter for `predict/route`.

---

### Task 3: Update checker page to capture and pass live status

**Objective:** The checker page fetches from `/api/admin/tarana/predict` and renders results. Add `liveStatus` to the state and pass it down to components.

**File:** `app/admin/coverage/checker/page.tsx`

**Step 1:** Import the type:
```typescript
import type { LiveNetworkStatus } from '@/lib/coverage/prediction/types';
```

**Step 2:** Add `liveStatus` to the `CheckResult` interface:
```typescript
interface CheckResult {
  prediction: CoveragePrediction | null;
  baseStation: { lat: number; lng: number } | null;
  networkInfo: NetworkInfo | null;
  liveStatus: LiveNetworkStatus | null;  // NEW
  address: string;
  lat: number;
  lng: number;
}
```

**Step 3:** Destructure `liveStatus` from the API response (line 87-92):
```typescript
      const data = await res.json() as {
        prediction: CoveragePrediction | null;
        baseStation: { lat: number; lng: number } | null;
        networkInfo: NetworkInfo | null;
        liveStatus: LiveNetworkStatus | null;
        message?: string;
      };
```

**Step 4:** Include it in the `checkResult` (line 94-101):
```typescript
      const checkResult: CheckResult = {
        prediction: data.prediction,
        baseStation: data.baseStation ?? null,
        networkInfo: data.networkInfo ?? null,
        liveStatus: data.liveStatus ?? null,
        address,
        lat,
        lng,
      };
```

**Step 5:** Pass `liveStatus` to components. The page currently renders:
- `CoverageVerdictCard prediction={result.prediction}` → add `liveStatus`
- `SalesRecommendationCard prediction={result.prediction}` → add `liveStatus`

```typescript
<CoverageVerdictCard prediction={result.prediction} liveStatus={result.liveStatus} />
<SalesRecommendationCard prediction={result.prediction} liveStatus={result.liveStatus} />
```

**Step 6:** Add `NetworkStatusCard` above the sales recommendation:
```typescript
{result.liveStatus && (
  <NetworkStatusCard liveStatus={result.liveStatus} />
)}
```

**Verify:** `npm run type-check` — expect errors only in components not yet updated (Tasks 4-6).

---

### Task 4: Create `NetworkStatusCard` component

**Objective:** A compact card showing BN online/offline status, active connections, and network-wide summary.

**File:** Create `app/admin/coverage/checker/components/NetworkStatusCard.tsx`

```typescript
'use client';

import type { LiveNetworkStatus } from '@/lib/coverage/prediction/types';
import { SectionCard } from '@/components/admin/shared';
import { Badge } from '@/components/ui/badge';
import {
  PiCheckCircleBold,
  PiWarningCircleBold,
  PiUsersBold,
  PiRadioBold,
} from 'react-icons/pi';

interface NetworkStatusCardProps {
  liveStatus: LiveNetworkStatus;
}

export default function NetworkStatusCard({ liveStatus }: NetworkStatusCardProps) {
  const { bnOnline, bnActiveConnections, networkSummary } = liveStatus;

  return (
    <SectionCard title="Live Network Status" icon={PiRadioBold}>
      <div className="space-y-3">
        {/* BN Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Base Station Status</span>
          {bnOnline ? (
            <Badge className="bg-green-500 hover:bg-green-600 gap-1">
              <PiCheckCircleBold className="h-3 w-3" />
              Online
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <PiWarningCircleBold className="h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>

        {/* Active Connections */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Active Connections</span>
          <span className="text-sm font-semibold flex items-center gap-1">
            <PiUsersBold className="h-3.5 w-3.5 text-slate-400" />
            {bnActiveConnections}
          </span>
        </div>

        {/* Network Summary */}
        {networkSummary && (
          <div className="border-t border-slate-100 pt-3 mt-1">
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
              Network Overview
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 rounded px-2 py-1.5">
                <span className="text-slate-500">BNs</span>
                <span className="float-right font-semibold">
                  {networkSummary.onlineBNs}/{networkSummary.totalBNs}
                </span>
              </div>
              <div className="bg-slate-50 rounded px-2 py-1.5">
                <span className="text-slate-500">RNs</span>
                <span className="float-right font-semibold">
                  {networkSummary.onlineRNs}/{networkSummary.totalRNs}
                </span>
              </div>
            </div>
            {networkSummary.fetchedAt && (
              <p className="text-xs text-slate-400 mt-1.5">
                Last synced: {new Date(networkSummary.fetchedAt).toLocaleString('en-ZA')}
              </p>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
```

**Verify:** `npm run type-check` — expect errors only in components not yet updated.

---

### Task 5: Update `CoverageVerdictCard` with live status override

**Objective:** If the terrain says "Excellent" but the BN is offline, the verdict card should show a prominent warning. Don't change the signal quality display — add a separate warning banner when BN is down.

**File:** `app/admin/coverage/checker/components/CoverageVerdictCard.tsx`

**Step 1:** Add `liveStatus` prop:
```typescript
import type { LiveNetworkStatus } from '@/lib/coverage/prediction/types';

interface CoverageVerdictCardProps {
  prediction: CoveragePrediction | null;
  liveStatus?: LiveNetworkStatus | null;
}
```

**Step 2:** After the elevated install warning (line 98-102), add a BN-offline warning that overrides everything:

```typescript
      {/* BN offline warning — overrides terrain prediction */}
      {liveStatus && !liveStatus.bnOnline && (
        <div className="mt-3 flex items-start gap-2 bg-red-100 border border-red-300 rounded-lg px-3 py-2.5">
          <PiWarningCircleBold className="text-red-600 mt-0.5 shrink-0 h-4 w-4" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Base Station Offline — Do Not Sell
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              The nearest base station ({prediction?.nearestBnSiteName ?? 'unknown'}) is currently offline.
              This address is not serviceable until the base station is restored.
            </p>
          </div>
        </div>
      )}

      {/* BN online but zero connections warning */}
      {liveStatus && liveStatus.bnOnline && liveStatus.bnActiveConnections === 0 && prediction && prediction.signalQuality !== 'none' && (
        <div className="mt-3 flex items-start gap-2 bg-amber-100 border border-amber-300 rounded-lg px-3 py-2.5">
          <PiWarningCircleBold className="text-amber-600 mt-0.5 shrink-0 h-4 w-4" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Unverified Coverage — No Active Customers
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              This base station is online but has zero active customer connections.
              Coverage is unverified — a site survey is strongly recommended before selling.
            </p>
          </div>
        </div>
      )}
```

Add import: `PiWarningCircleBold` from `react-icons/pi`.

**Step 3:** Destructure `liveStatus` in the component signature:
```typescript
export default function CoverageVerdictCard({ prediction, liveStatus }: CoverageVerdictCardProps) {
```

**Verify:** `npm run type-check`

---

### Task 6: Update `SalesRecommendationCard` with live status gate

**Objective:** When the BN is offline, override the recommendation text regardless of signal quality.

**File:** `app/admin/coverage/checker/components/SalesRecommendationCard.tsx`

**Step 1:** Add `liveStatus` prop:
```typescript
import type { LiveNetworkStatus } from '@/lib/coverage/prediction/types';

interface SalesRecommendationCardProps {
  prediction: CoveragePrediction | null;
  liveStatus?: LiveNetworkStatus | null;
}
```

**Step 2:** In `getRecommendation()`, add an early return when BN is offline:

At the top of `getRecommendation` (line 37), add before the first `if`:

```typescript
function getRecommendation(
  prediction: CoveragePrediction | null,
  customerType: CustomerType,
  liveStatus: LiveNetworkStatus | null,
): { text: string; tiers: Tier[]; warning: string | null } {
  const baseTiers = customerType === 'residential' ? RESIDENTIAL_TIERS : SMB_TIERS;
  const allUnavailable = baseTiers.map(t => ({ ...t, available: false, recommended: false }));

  // Gate: BN is offline — nothing can be sold
  if (liveStatus && !liveStatus.bnOnline) {
    return {
      text: 'The nearest base station is currently offline. SkyFibre cannot be sold at this address until the base station is restored. Check back after the next sync or contact operations.',
      tiers: allUnavailable,
      warning: 'Do not create an order — installation will fail. Monitor base station status and re-check coverage when the BN is back online.',
    };
  }

  if (!prediction || prediction.signalQuality === 'none') {
    ...
```

**Step 3:** Update the call site. In the component body (line 108):
```typescript
  const { text, tiers, warning } = getRecommendation(prediction, customerType, liveStatus);
```

**Step 4:** Update component signature:
```typescript
export default function SalesRecommendationCard({ prediction, liveStatus }: SalesRecommendationCardProps) {
```

**Verify:** `npm run type-check`

---

### Task 7: Full type-check pass

```bash
npm run type-check 2>&1 | grep -E "(checker|prediction/types|predict/route)" | head -20
```

Expected: zero output (no errors from changed files).

---

## Summary

| # | File | Action |
|---|---|---|
| 1 | `lib/coverage/prediction/types.ts` | Add `LiveNetworkStatus` type |
| 2 | `app/api/admin/tarana/predict/route.ts` | Extend BN query + fetch device counts + return `liveStatus` |
| 3 | `app/admin/coverage/checker/page.tsx` | Capture `liveStatus`, pass to components, add `NetworkStatusCard` |
| 4 | `app/admin/coverage/checker/components/NetworkStatusCard.tsx` | Create — BN status + connections + network summary |
| 5 | `app/admin/coverage/checker/components/CoverageVerdictCard.tsx` | BN offline warning + zero-connections warning |
| 6 | `app/admin/coverage/checker/components/SalesRecommendationCard.tsx` | Gate recommendations on live BN status |
| 7 | — | Type-check all changes |

**No new dependencies. No DB changes.** The `tarana_device_counts` table and `device_status` column already exist from the previous implementation.
