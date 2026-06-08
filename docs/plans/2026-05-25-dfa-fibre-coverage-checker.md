# DFA Fibre Coverage in Admin Checker — Implementation Plan

> **For Hermes:** Implement task-by-task. Each task is self-contained and type-checkable.

**Goal:** Add DFA fibre coverage checks to the admin coverage checker (`/admin/coverage/checker`) alongside the existing Tarana FWB check, so sales staff can check both wireless and fibre coverage from a single tool.

**Architecture:** Add a provider selector (Tarana FWB | DFA Fibre) at the top of the checker. DFA checks reuse the existing `POST /api/admin/coverage/dfa` endpoint — no new API needed. DFA results render via new provider-specific components for verdict, product tiers, and installation estimates. The map component is extended to support DFA building markers.

**Scope:** Broadband fibre only (BizFibreConnect). Dedicated fibre (DIA, layer 2) requires product catalog changes — noted as follow-up.

**Files (9 total):**
- `app/admin/coverage/checker/page.tsx` — add provider selector + DFA flow
- `app/admin/coverage/checker/components/ProviderSelector.tsx` — new
- `app/admin/coverage/checker/components/DFAVerdictCard.tsx` — new
- `app/admin/coverage/checker/components/DFAProductTiers.tsx` — new
- `app/admin/coverage/checker/components/DFAInstallationEstimate.tsx` — new
- `app/admin/coverage/checker/components/CoverageMap.tsx` — extend for DFA
- `app/admin/coverage/checker/components/CoverageResultPanel.tsx` — DFA branch
- `app/admin/coverage/checker/components/AddressInput.tsx` — no changes needed
- `app/admin/coverage/checker/components/TierEligibilityTable.tsx` — no changes

---

## DFA API Response Shape (for reference)

`POST /api/admin/coverage/dfa` already returns:

```typescript
{
  success: true,
  data: {
    provider: 'dfa',
    coordinates: { lat, lng },
    coverageType: 'connected' | 'near-net' | 'none',
    message: string,
    // If connected:
    connected?: {
      buildingId: string,
      status: string,
      ftth: string | null,
      broadband: string | null,
      precinct: string | null,
    },
    // If near-net:
    nearNet?: {
      distanceMeters: number,
      display: string,          // e.g. "~85m"
      timeline: string,          // e.g. "8–12 weeks"
      note: string,
    },
    // If has coverage:
    products: MappedProduct[],   // BizFibreConnect tiers
    recommendedProduct: MappedProduct | null,
    installationEstimate: {
      estimatedCost: string,     // e.g. "R0 - R1,500"
      estimatedDays: string,     // e.g. "5-10 business days"
      notes: string,
    },
    timestamp: string,
  }
}
```

---

### Task 1: Add provider state and selector to the checker page

**Objective:** The checker page currently only runs Tarana checks. Add a `provider` state (`'tarana' | 'dfa'`) and a selector component.

**File:** `app/admin/coverage/checker/page.tsx`

**Step 1:** Add `ProviderType` and state:

```typescript
type ProviderType = 'tarana' | 'dfa';

export default function CoverageCheckerPage() {
  const [provider, setProvider] = useState<ProviderType>('tarana');
  // ... existing state
```

**Step 2:** Add DFA result state alongside existing Tarana state:

```typescript
interface DFAResult {
  coverageType: 'connected' | 'near-net' | 'none';
  message: string;
  connected?: { buildingId: string; status: string; ftth: string | null; broadband: string | null; precinct: string | null; };
  nearNet?: { distanceMeters: number; display: string; timeline: string; note: string; };
  products: Array<{ id: string; name: string; download_speed: number; upload_speed: number; price: number; coverage_details: any; description?: string; }>;
  recommendedProduct: any | null;
  installationEstimate: { estimatedCost: string; estimatedDays: string; notes: string; };
  coordinates: { lat: number; lng: number };
  address: string;
}

const [dfaResult, setDfaResult] = useState<DFAResult | null>(null);
const [dfaLoading, setDfaLoading] = useState(false);
const [dfaError, setDfaError] = useState<string | null>(null);
```

**Step 3:** Add the DFA fetch handler:

```typescript
const handleDFACheck = useCallback(async (lat: number, lng: number, address: string) => {
  setDfaLoading(true);
  setDfaError(null);
  setDfaResult(null);
  setActiveTab('check');

  try {
    const res = await fetch('/api/admin/coverage/dfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: { lat, lng }, address }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error || data.message || 'DFA check failed');

    setDfaResult({ ...data.data, address });
  } catch (err) {
    setDfaError(err instanceof Error ? err.message : 'DFA coverage check failed');
  } finally {
    setDfaLoading(false);
  }
}, []);
```

**Step 4:** Render the provider selector and conditional flows. Replace the check flow to branch on `provider`:

```typescript
{/* Provider Selector — above AddressInput */}
<ProviderSelector provider={provider} onChange={setProvider} />

{/* AddressInput — same for both, calls the appropriate handler */}
{mapsLoaded ? (
  <AddressInput
    onCheck={provider === 'tarana' ? handleCheck : handleDFACheck}
    isLoading={provider === 'tarana' ? isLoading : dfaLoading}
  />
) : (
  // loading skeleton
)}
```

**Step 5:** After results, branch rendering:

```typescript
{/* Tarana results (existing) */}
{provider === 'tarana' && result && !isLoading && (
  // ... existing Tarana result components
)}

{/* DFA results (new) */}
{provider === 'dfa' && dfaResult && !dfaLoading && (
  <div className="space-y-4">
    <DFAVerdictCard result={dfaResult} />
    {dfaResult.coverageType !== 'none' && (
      <DFAProductTiers products={dfaResult.products} recommended={dfaResult.recommendedProduct} />
    )}
    <DFAInstallationEstimate estimate={dfaResult.installationEstimate} />
    <CoverageMap
      targetLat={dfaResult.coordinates.lat}
      targetLng={dfaResult.coordinates.lng}
      targetAddress={dfaResult.address}
      mode="dfa"
      dfaCoverageType={dfaResult.coverageType}
    />
  </div>
)}
```

**Step 6:** Also add DFA loading, error, and empty states paralleling the existing Tarana states.

**Verify:** `npm run type-check` — expect errors only in components not yet created (Tasks 2-5).

---

### Task 2: Create `ProviderSelector` component

**Objective:** A clean tab-like selector letting the user pick between Tarana FWB and DFA Fibre before entering an address.

**File:** Create `app/admin/coverage/checker/components/ProviderSelector.tsx`

```typescript
'use client';

import { PiRadioBold, PiFiberSmartRecordBold } from 'react-icons/pi';

type ProviderType = 'tarana' | 'dfa';

interface ProviderSelectorProps {
  provider: ProviderType;
  onChange: (p: ProviderType) => void;
}

export default function ProviderSelector({ provider, onChange }: ProviderSelectorProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-1 flex gap-1 w-fit">
      <button
        type="button"
        onClick={() => onChange('tarana')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          provider === 'tarana'
            ? 'bg-orange-500 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
        }`}
      >
        <PiRadioBold className="h-4 w-4" />
        Tarana FWB
      </button>
      <button
        type="button"
        onClick={() => onChange('dfa')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          provider === 'dfa'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
        }`}
      >
        <PiFiberSmartRecordBold className="h-4 w-4" />
        DFA Fibre
      </button>
    </div>
  );
}
```

If `PiFiberSmartRecordBold` doesn't exist in react-icons/pi, use `PiGraphBold` or `PiNetworkBold` as fallback.

**Verify:** `npm run type-check`

---

### Task 3: Create `DFAVerdictCard` component

**Objective:** Shows the DFA coverage verdict with clear visual indicators for connected, near-net, and no coverage.

**File:** Create `app/admin/coverage/checker/components/DFAVerdictCard.tsx`

```typescript
'use client';

import { SectionCard } from '@/components/admin/shared';
import { StatusBadge } from '@/components/admin/shared';
import { PiCheckCircleBold, PiLightningBold, PiXBold, PiBuildingBold } from 'react-icons/pi';

interface DFAVerdictCardProps {
  result: {
    coverageType: 'connected' | 'near-net' | 'none';
    message: string;
    connected?: { buildingId: string; status: string; ftth: string | null; broadband: string | null; precinct: string | null; };
    nearNet?: { distanceMeters: number; display: string; timeline: string; note: string; };
  };
}

const CONFIG = {
  connected: {
    icon: PiCheckCircleBold,
    color: 'text-emerald-500',
    bgClass: 'bg-emerald-50 border-emerald-400',
    badge: 'success' as const,
    label: 'Connected — Active Fibre',
  },
  'near-net': {
    icon: PiLightningBold,
    color: 'text-amber-500',
    bgClass: 'bg-amber-50 border-amber-400',
    badge: 'warning' as const,
    label: 'Near-Net — Extension Required',
  },
  none: {
    icon: PiXBold,
    color: 'text-red-500',
    bgClass: 'bg-red-50 border-red-400',
    badge: 'error' as const,
    label: 'No DFA Coverage',
  },
};

export default function DFAVerdictCard({ result }: DFAVerdictCardProps) {
  const cfg = CONFIG[result.coverageType];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border-l-4 ${cfg.bgClass} p-5`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Icon className={`h-8 w-8 ${cfg.color}`} />
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-1">
              DFA Fibre Status
            </p>
            <StatusBadge variant={cfg.badge} status={cfg.label} />
          </div>
        </div>
        <p className="text-sm text-slate-500 max-w-md text-right">{result.message}</p>
      </div>

      {/* Connected building details */}
      {result.coverageType === 'connected' && result.connected && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-white/60 rounded-lg p-3">
          <div>
            <span className="text-slate-500">Building ID</span>
            <p className="font-mono font-semibold text-slate-700">{result.connected.buildingId}</p>
          </div>
          <div>
            <span className="text-slate-500">Status</span>
            <p className="font-semibold text-emerald-700">{result.connected.status}</p>
          </div>
          {result.connected.precinct && (
            <div>
              <span className="text-slate-500">Precinct</span>
              <p className="font-semibold text-slate-700">{result.connected.precinct}</p>
            </div>
          )}
          {result.connected.ftth && (
            <div>
              <span className="text-slate-500">FTTH</span>
              <p className="font-semibold text-slate-700">{result.connected.ftth}</p>
            </div>
          )}
        </div>
      )}

      {/* Near-net details */}
      {result.coverageType === 'near-net' && result.nearNet && (
        <div className="mt-3 bg-amber-100/60 rounded-lg p-3 flex items-center gap-3">
          <PiBuildingBold className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              ~{result.nearNet.display} from nearest fibre point
            </p>
            <p className="text-xs text-amber-700 mt-0.5">{result.nearNet.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Verify:** `npm run type-check`

---

### Task 4: Create `DFAProductTiers` component

**Objective:** Shows available BizFibreConnect tiers with pricing, highlighting the recommended product.

**File:** Create `app/admin/coverage/checker/components/DFAProductTiers.tsx`

Reuses the tier card layout from `SalesRecommendationCard` but simplified — no customer type toggle, no signal-quality logic. Just shows all available DFA products with the recommended one highlighted.

```typescript
'use client';

import { SectionCard } from '@/components/admin/shared';
import { PiCheckCircleBold, PiPackageBold } from 'react-icons/pi';

interface DFAProduct {
  id: string;
  name: string;
  download_speed: number;
  upload_speed: number;
  price: number;
  description?: string;
}

interface DFAProductTiersProps {
  products: DFAProduct[];
  recommended: DFAProduct | null;
}

function formatPrice(price: number): string {
  return `R${price.toLocaleString()}/mo`;
}

function formatSpeed(dl: number, ul: number): string {
  return `${dl}/${ul} Mbps`;
}

export default function DFAProductTiers({ products, recommended }: DFAProductTiersProps) {
  if (products.length === 0) return null;

  return (
    <SectionCard title="Available BizFibreConnect Tiers" icon={PiPackageBold}>
      <div className={`grid gap-3 ${products.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {products.map(product => {
          const isRecommended = recommended?.id === product.id;
          return (
            <div
              key={product.id}
              className={`relative rounded-lg border-2 p-3 transition-all ${
                isRecommended
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {isRecommended && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                  Recommended
                </span>
              )}
              <p className="text-xs font-semibold text-slate-500 mb-0.5">
                {formatSpeed(product.download_speed, product.upload_speed)}
              </p>
              <p className="text-sm font-bold text-slate-900 leading-tight">{product.name}</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{formatPrice(product.price)}</p>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <PiCheckCircleBold className="text-emerald-500" />
                Business · Symmetrical
              </p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
```

**Verify:** `npm run type-check`

---

### Task 5: Create `DFAInstallationEstimate` component

**Objective:** Shows installation cost estimate, timeline, and notes from `dfaProductMapper.getInstallationEstimate()`.

**File:** Create `app/admin/coverage/checker/components/DFAInstallationEstimate.tsx`

```typescript
'use client';

import { SectionCard } from '@/components/admin/shared';
import { PiClockBold, PiCurrencyDollarBold, PiNoteBold } from 'react-icons/pi';

interface DFAInstallationEstimateProps {
  estimate: {
    estimatedCost: string;
    estimatedDays: string;
    notes: string;
  };
}

export default function DFAInstallationEstimate({ estimate }: DFAInstallationEstimateProps) {
  return (
    <SectionCard title="Installation Estimate" icon={PiClockBold}>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <PiCurrencyDollarBold className="h-5 w-5 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Estimated Cost</p>
            <p className="text-sm font-semibold text-slate-900">{estimate.estimatedCost}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <PiClockBold className="h-5 w-5 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Timeline</p>
            <p className="text-sm font-semibold text-slate-900">{estimate.estimatedDays}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2">
        <PiNoteBold className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600">{estimate.notes}</p>
      </div>
    </SectionCard>
  );
}
```

**Verify:** `npm run type-check`

---

### Task 6: Extend `CoverageMap` for DFA mode

**Objective:** The existing map only shows Tarana BN markers and link paths. Add a `mode` prop — when `'dfa'`, show a green building marker if connected, or a yellow near-net indicator.

**File:** `app/admin/coverage/checker/components/CoverageMap.tsx`

**Step 1:** Add `mode` and DFA props to interface:

```typescript
interface CoverageMapProps {
  targetLat: number;
  targetLng: number;
  targetAddress: string;
  // Tarana mode
  bnLat?: number | null;
  bnLng?: number | null;
  bnSiteName?: string;
  // DFA mode
  mode?: 'tarana' | 'dfa';
  dfaCoverageType?: 'connected' | 'near-net' | 'none';
}
```

**Step 2:** At the top of the effect, after adding the target marker, branch on mode:

```typescript
// DFA mode: show building marker based on coverage type
if (mode === 'dfa' && dfaCoverageType && dfaCoverageType !== 'none') {
  const dfaColor = dfaCoverageType === 'connected' ? '#10B981' : '#F59E0B';
  const dfaLabel = dfaCoverageType === 'connected' ? 'DFA Connected' : 'DFA Near-Net';

  // Add a second marker at target location with DFA styling
  // (DFA building location comes from the target itself since we're checking a point)
  const dfaInfo = new google.maps.InfoWindow({
    content: `<div style="font-size:12px;font-weight:600;padding:2px 4px">🔌 ${dfaLabel}</div>`,
  });
  // Info window opens on marker click
}
```

For a simpler initial approach, just update the legend at the bottom to show DFA-appropriate labels instead of "Base Node" / "Link Path" when in DFA mode.

**Step 3:** Update the legend:

```typescript
<div className="flex items-center gap-5 mt-3 text-xs text-slate-500">
  <span className="flex items-center gap-1.5">
    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
    Target Address
  </span>
  {mode === 'dfa' ? (
    <span className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
      DFA {dfaCoverageType === 'connected' ? 'Connected' : 'Near-Net'} Zone
    </span>
  ) : (
    <>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
        Base Node ({bnSiteName})
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-6 border-t-2 border-dashed border-orange-400 inline-block" />
        Link Path
      </span>
    </>
  )}
</div>
```

**Verify:** `npm run type-check`

---

### Task 7: Update `CoverageResultPanel` (if used)

**Objective:** `CoverageResultPanel` is a wrapper component that renders Tarana results. Add a DFA branch or confirm it's not used by the main page (the main page renders components directly).

Check whether `CoverageResultPanel` is imported by `page.tsx`. Based on the current code read, it is NOT imported — the page renders components inline. If so, skip this task.

**Verify:** `grep -r "CoverageResultPanel" app/admin/coverage/checker/page.tsx` — if no match, skip.

---

### Task 8: Full type-check pass

```bash
npm run type-check 2>&1 | grep -E "(checker|coverage/dfa)" | head -20
```

Expected: zero output.

Fix any type errors before considering the plan complete.

---

## Summary

| # | File | Action |
|---|---|---|
| 1 | `app/admin/coverage/checker/page.tsx` | Add provider state + DFA fetch handler + conditional rendering |
| 2 | `app/admin/coverage/checker/components/ProviderSelector.tsx` | Create — Tarana/DFA toggle |
| 3 | `app/admin/coverage/checker/components/DFAVerdictCard.tsx` | Create — Connected/Near-Net/None verdict with building details |
| 4 | `app/admin/coverage/checker/components/DFAProductTiers.tsx` | Create — BizFibreConnect tier cards |
| 5 | `app/admin/coverage/checker/components/DFAInstallationEstimate.tsx` | Create — Cost + timeline |
| 6 | `app/admin/coverage/checker/components/CoverageMap.tsx` | Extend — add DFA mode + legend |
| 7 | `app/admin/coverage/checker/components/CoverageResultPanel.tsx` | Confirm skipped (not used by page) |
| 8 | — | Type-check all changes |

**No new API endpoints needed.** The existing `POST /api/admin/coverage/dfa` returns everything required.

**Follow-up:** Dedicated fibre (DIA, layer 2) needs separate products in `service_packages` with `service_type: 'DedicatedFibre'` or similar, plus a dedicated-fibre mapper in the DFA provider. Out of scope for this plan — broadband only.
