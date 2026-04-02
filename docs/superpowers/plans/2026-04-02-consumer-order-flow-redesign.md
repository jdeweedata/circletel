# Consumer Order Flow Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 6-screen consumer order flow with a 3-step flow that fixes the OTP detour, wires real package data, eliminates duplicate order creation, and makes the confirmation page survive a page refresh.

**Architecture:** Three pages (`/order/coverage` → `/order/packages` → `/order/checkout`) replace six, with a new `/order/checkout` page combining account creation and payment. A new `GET /api/orders?reference=` endpoint backs the confirmation page so it fetches live data instead of reading stale state. Old pages (`/order/account`, `/order/service-address`, `/order/payment`) redirect to `/order/checkout`.

**Tech Stack:** Next.js 15, TypeScript, Supabase (server client), React Context (OrderContext), NetCash Pay Now, react-hook-form + zod, shadcn/ui, Tailwind CSS, Playwright (E2E)

**Spec:** `docs/superpowers/specs/2026-04-02-consumer-order-flow-redesign.md`

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `lib/order/types.ts` | Add `propertyType` to `CoverageData`; update stage constants to 3 steps |
| Modify | `components/order/CheckoutProgressBar.tsx` | Replace 5-step config with 3-step config |
| Modify | `app/order/coverage/page.tsx` | Add property type dropdown after address confirmed; fix redirect URL |
| Modify | `app/order/packages/page.tsx` | Replace mock packages with real API fetch; add loading + empty state |
| **Create** | `app/api/orders/route.ts` | `GET ?reference=` — fetch order by payment_reference for confirmation page |
| **Create** | `app/order/checkout/page.tsx` | New combined step 3 page |
| **Create** | `components/order/checkout/AccountSection.tsx` | New-user account creation form (name/email/password/phone) |
| **Create** | `components/order/checkout/OrderingAsCard.tsx` | Returning-user identity card ("Ordering as …") |
| **Create** | `components/order/checkout/PaymentSection.tsx` | R1.00 validation charge section + order creation on submit |
| **Create** | `components/order/checkout/OrderSummarySidebar.tsx` | Sticky package summary sidebar |
| Modify | `app/order/confirmation/page.tsx` | Replace fake setTimeout with real `GET /api/orders?reference=`; add phone verify CTA |
| Modify | `app/order/account/page.tsx` | Replace page content with redirect to `/order/checkout` |
| Modify | `app/order/service-address/page.tsx` | Replace page content with redirect to `/order/checkout` |
| Modify | `app/order/payment/page.tsx` | Replace page content with redirect to `/order/checkout` |
| Modify | `app/auth/login/page.tsx` | Fix open redirect: validate `?redirect=` against internal path allowlist |

---

## Task 1: Add `propertyType` to OrderData types + update stage constants

**Files:**
- Modify: `lib/order/types.ts`

- [ ] **Step 1: Add `propertyType` to `CoverageData` and update stage constants**

In `lib/order/types.ts`, make these changes:

```typescript
// In CoverageData interface, add after coverageType:
export interface CoverageData {
  address?: string;
  coordinates?: { lat: number; lng: number };
  leadId?: string;
  availableServices?: string[];
  locationType?: LocationType;
  coverageType?: string;
  propertyType?: string; // ← ADD THIS
  selectedPackage?: PackageDetails;
  selectedBundle?: BundleProduct;
}

// Replace the OrderStage, OrderStageId, STAGE_NAMES, TOTAL_STAGES block with:
export type OrderStage = 1 | 2 | 3;
export type OrderStageId = 'coverage' | 'packages' | 'checkout';

export const STAGE_NAMES = ['Location', 'Choose Plan', 'Account & Pay'] as const;
export const TOTAL_STAGES = 3;

export const STAGE_IDS: OrderStageId[] = ['coverage', 'packages', 'checkout'];

export const getStageId = (stage: OrderStage): OrderStageId => {
  const map: Record<OrderStage, OrderStageId> = {
    1: 'coverage',
    2: 'packages',
    3: 'checkout',
  };
  return map[stage];
};

export const getStageNumber = (stageId: OrderStageId): OrderStage => {
  const map: Record<OrderStageId, OrderStage> = {
    coverage: 1,
    packages: 2,
    checkout: 3,
  };
  return map[stageId];
};
```

Keep all legacy types (`LegacyOrderStage`, `KycData`, etc.) unchanged — other parts of the codebase still reference them.

- [ ] **Step 2: Type-check**

```bash
npm run type-check:memory 2>&1 | grep -E "error TS|Found [0-9]+ error" | head -20
```

Expected: zero new errors from `lib/order/types.ts`. If errors appear in files importing `OrderStage`, check that those files only use stage values 1, 2, or 3.

- [ ] **Step 3: Commit**

```bash
git add lib/order/types.ts
git commit -m "feat(order): add propertyType to CoverageData, simplify to 3 stages"
```

---

## Task 2: Update CheckoutProgressBar to 3 steps

**Files:**
- Modify: `components/order/CheckoutProgressBar.tsx`

- [ ] **Step 1: Update the steps array and stage type**

Replace the `CheckoutStage` type, `CHECKOUT_STEPS` array, and `STAGE_MAPPING` object:

```typescript
// Replace CheckoutStage type:
export type CheckoutStage =
  | 'coverage'
  | 'packages'
  | 'checkout';

// Replace CHECKOUT_STEPS array:
const CHECKOUT_STEPS: Step[] = [
  { id: 'coverage', label: 'Location', shortLabel: 'Location' },
  { id: 'packages', label: 'Choose Plan', shortLabel: 'Plan' },
  { id: 'checkout', label: 'Account & Pay', shortLabel: 'Pay' },
];

// Replace STAGE_MAPPING:
const STAGE_MAPPING: Record<CheckoutStage, CheckoutStage> = {
  coverage: 'coverage',
  packages: 'packages',
  checkout: 'checkout',
};
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check:memory 2>&1 | grep -E "error TS|Found [0-9]+ error" | head -20
```

If any callers pass old stage values (`'account'`, `'address'`, `'payment'`, `'verify'`) to the progress bar, update those call sites to pass `'checkout'` instead.

- [ ] **Step 3: Commit**

```bash
git add components/order/CheckoutProgressBar.tsx
git commit -m "feat(order): update progress bar to 3 steps (Location, Choose Plan, Account & Pay)"
```

---

## Task 3: Add property type dropdown to coverage page + fix redirect URL

**Files:**
- Modify: `app/order/coverage/page.tsx`

- [ ] **Step 1: Add `propertyType` state and the dropdown options**

Add near the top of the component, after existing state declarations:

```typescript
const [propertyType, setPropertyType] = useState<string>('');

const RESIDENTIAL_PROPERTY_TYPES = [
  { value: 'freestanding_home', label: 'Freestanding Home (SDU)' },
  { value: 'gated_estate', label: 'Gated / Security Estate' },
  { value: 'apartment', label: 'Apartment / Flat Complex' },
  { value: 'townhouse', label: 'Townhouse' },
];

const BUSINESS_PROPERTY_TYPES = [
  { value: 'office_park', label: 'Office or Business Park' },
  { value: 'industrial', label: 'Industrial or Warehouse' },
  { value: 'educational', label: 'Educational Facility' },
  { value: 'healthcare', label: 'Healthcare Facility' },
  { value: 'freestanding_commercial', label: 'Free Standing Building' },
  { value: 'soho', label: 'SOHO (Small Office Home Office)' },
];

const propertyTypeOptions = coverageType === 'business'
  ? BUSINESS_PROPERTY_TYPES
  : RESIDENTIAL_PROPERTY_TYPES;
```

- [ ] **Step 2: Add validation and update `handleCheckCoverage`**

Update the submit handler to validate `propertyType` and store it in OrderContext:

```typescript
const handleCheckCoverage = async () => {
  if (!address.trim()) {
    toast.error('Please enter your address');
    return;
  }
  if (!propertyType) {
    toast.error('Please select your property type');
    return;
  }

  setIsChecking(true);

  try {
    sessionStorage.setItem('circletel_coverage_address', JSON.stringify({
      address: address.trim(),
      coordinates: coordinates,
      type: coverageType,
      propertyType: propertyType,          // ← ADD
      addressComponents: addressComponents || {},
      timestamp: new Date().toISOString()
    }));

    const response = await fetch('/api/coverage/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: address.trim(),
        coordinates,
        customer_type: coverageType === 'business' ? 'smme' : 'consumer',
      }),
    });
    const data = await response.json();

    actions.updateOrderData({
      coverage: {
        leadId: data.leadId,
        address: address.trim(),
        coordinates: coordinates || undefined,
        coverageType: coverageType,
        propertyType: propertyType,          // ← ADD
      }
    });

    actions.markStepComplete(1);

    if (bundleProduct) {
      router.push(`/order/bundle/${bundleProduct.slug}`);
    } else {
      // Fixed: was '/packages/' (wrong), now '/order/packages/'
      router.push(`/order/packages?leadId=${data.leadId}&type=${coverageType}`);
    }
  } catch (error) {
    toast.error('Something went wrong. Please try again.');
  } finally {
    setIsChecking(false);
  }
};
```

- [ ] **Step 3: Add the dropdown to the JSX**

Add after the address confirmation green box and before the submit button. The dropdown should only appear once an address has been confirmed (i.e., `coordinates` is set):

```tsx
{coordinates && (
  <div className="mt-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Property Type
    </label>
    <select
      value={propertyType}
      onChange={(e) => setPropertyType(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
    >
      <option value="">Select your property type...</option>
      {propertyTypeOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
)}
```

- [ ] **Step 4: Reset propertyType when coverageType changes**

Add this effect after the existing `useEffect` blocks:

```typescript
useEffect(() => {
  setPropertyType('');
}, [coverageType]);
```

- [ ] **Step 5: Type-check**

```bash
npm run type-check:memory 2>&1 | grep -E "error TS|Found [0-9]+ error" | head -20
```

- [ ] **Step 6: Manual smoke test**

```bash
npm run dev:memory
```

Navigate to `http://localhost:3000/order/coverage`. Verify:
1. Residential/Business toggle works
2. Address autocomplete shows confirmation box after selecting an address
3. Property type dropdown appears after address is confirmed
4. Dropdown options change when toggling between Residential and Business
5. Clicking "Check Coverage" without property type shows a toast error
6. With both address and property type filled, clicking "Check Coverage" redirects to `/order/packages?leadId=...&type=...`

- [ ] **Step 7: Commit**

```bash
git add app/order/coverage/page.tsx
git commit -m "feat(order): add property type dropdown to coverage step; fix packages redirect URL"
```

---

## Task 4: Wire real packages API to packages page

**Files:**
- Modify: `app/order/packages/page.tsx`

- [ ] **Step 1: Add API response types at top of file**

After the existing imports, replace the `Package` interface and add:

```typescript
// API response shape from /api/coverage/packages
interface ApiPackage {
  id: string;
  name: string;
  description?: string;
  price: number;
  promotion_price?: number;
  promotion_months?: number;
  speed_down?: number;
  speed_up?: number;
  service_type: string;
  product_category?: string;
  features: string[];
  provider: {
    code: string;
    name: string;
    logo_url?: string;
    logo_dark_url?: string;
    logo_light_url?: string;
  } | null;
}
```

- [ ] **Step 2: Replace the mock useEffect with a real API call**

Find the `useEffect` that sets `mockPackages` and replace it entirely:

```typescript
useEffect(() => {
  const fetchPackages = async () => {
    if (!leadId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const coverageType = searchParams.get('type') || 'residential';
      const res = await fetch(
        `/api/coverage/packages?leadId=${leadId}&type=${coverageType}`
      );
      if (!res.ok) throw new Error('Failed to fetch packages');
      const data = await res.json();
      setPackages(data.packages || []);
    } catch (err) {
      console.error('Failed to load packages:', err);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };
  fetchPackages();
}, [leadId, searchParams]);
```

- [ ] **Step 3: Update tab derivation to use real `service_type` / `product_category`**

The API returns `service_type` and `product_category`, not a `type: 'fibre' | 'wireless'` field. Update the tab filter logic:

```typescript
const WIRELESS_TYPES = ['wireless', 'lte', '5g', 'mobile', 'SkyFibre'];
const FIBRE_TYPES = ['fibre', 'fibre_consumer', 'fibre_business', 'BizFibreConnect', 'HomeFibreConnect'];

const isWireless = (pkg: ApiPackage) =>
  WIRELESS_TYPES.some(t =>
    pkg.service_type?.toLowerCase().includes(t.toLowerCase()) ||
    pkg.product_category?.toLowerCase().includes(t.toLowerCase())
  );

const fibrePackages = packages.filter((pkg) => !isWireless(pkg));
const wirelessPackages = packages.filter((pkg) => isWireless(pkg));
```

Use `fibrePackages` and `wirelessPackages` in the tab content instead of the old type filter.

- [ ] **Step 4: Add loading skeleton**

Replace the current loading check with:

```tsx
if (loading) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <CheckoutProgressBar currentStage="packages" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
              <div className="h-3 bg-gray-200 rounded w-4/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add empty state**

After the loading check, add an empty state for when `packages.length === 0`:

```tsx
if (!loading && packages.length === 0) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <CheckoutProgressBar currentStage="packages" />
      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No packages available at your address yet
        </h2>
        <p className="text-gray-500 mb-6">
          We're expanding our network. Join the waitlist and we'll notify you when service is available.
        </p>
        <a
          href={`https://wa.me/27824873900?text=${encodeURIComponent('Hi, I checked coverage and no packages were available. I would like to be added to the waitlist.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
        >
          Join Waitlist via WhatsApp
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update package card to use API fields**

Update price display in the card to use `promotion_price` / `promotion_months` (snake_case from API):

```tsx
{/* Price */}
<div className="mb-4">
  {pkg.promotion_price ? (
    <>
      <span className="text-3xl font-bold text-orange-500">
        R{pkg.promotion_price}
      </span>
      <span className="text-gray-400 line-through ml-2">R{pkg.price}</span>
      <p className="text-xs text-gray-500 mt-1">
        per month for {pkg.promotion_months} months, then R{pkg.price}/month
      </p>
    </>
  ) : (
    <span className="text-3xl font-bold text-gray-900">R{pkg.price}</span>
  )}
  <span className="text-sm text-gray-500">/month</span>
</div>

{/* Speed */}
<div className="bg-gray-50 rounded-lg p-3 mb-4 text-center text-sm text-gray-700">
  Download {pkg.speed_down} Mbps / Upload {pkg.speed_up} Mbps
</div>
```

- [ ] **Step 7: Update "Continue" navigation to go to `/order/checkout`**

Find the button that navigates after package selection and update:

```typescript
// In handleSelectPackage or the continue button handler:
actions.updateOrderData({
  package: {
    selectedPackage: {
      id: selectedPkg.id,
      name: selectedPkg.name,
      monthlyPrice: selectedPkg.promotion_price ?? selectedPkg.price,
      speed: `${selectedPkg.speed_down}/${selectedPkg.speed_up} Mbps`,
      service_type: selectedPkg.service_type,
      product_category: selectedPkg.product_category,
      speed_down: selectedPkg.speed_down,
      speed_up: selectedPkg.speed_up,
      price: selectedPkg.price,
      promotion_price: selectedPkg.promotion_price,
      promotion_months: selectedPkg.promotion_months,
      features: selectedPkg.features,
    }
  }
});
actions.markStepComplete(2);
router.push('/order/checkout');
```

- [ ] **Step 8: Type-check**

```bash
npm run type-check:memory 2>&1 | grep -E "error TS|Found [0-9]+ error" | head -20
```

- [ ] **Step 9: Manual smoke test**

Navigate to `http://localhost:3000/order/coverage`, complete step 1, then verify:
1. Loading skeleton appears while packages fetch
2. Real packages from DB appear (not HomeFibre Basic mock data)
3. Fibre/Wireless tabs filter correctly
4. Selecting a package and clicking Continue navigates to `/order/checkout`
5. With no leadId in URL, empty state shows

- [ ] **Step 10: Commit**

```bash
git add app/order/packages/page.tsx
git commit -m "feat(order): wire real coverage packages API to packages page; add loading + empty states"
```

---

## Task 5: Create `GET /api/orders?reference=` endpoint

**Files:**
- Create: `app/api/orders/route.ts`

- [ ] **Step 1: Write the API route**

Create `app/api/orders/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ error: 'reference query param required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from('consumer_orders')
      .select(`
        id,
        order_number,
        payment_reference,
        status,
        payment_status,
        package_name,
        package_speed,
        package_price,
        installation_fee,
        installation_address,
        installation_location_type,
        account_type,
        first_name,
        last_name,
        email,
        phone,
        created_at
      `)
      .eq('payment_reference', reference)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error('[GET /api/orders] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify the `consumer_orders` columns exist**

Run this against your Supabase project to confirm column names match the SELECT above:

```bash
# From the project root:
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/consumer_orders?limit=1" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" | python3 -m json.tool | head -40
```

If any column names differ from the select list, update the column names in `route.ts`.

- [ ] **Step 3: Test the endpoint manually**

```bash
# First, get a real payment_reference from your DB:
# (use admin dashboard or Supabase table editor to find one)
# Then:
curl "http://localhost:3000/api/orders?reference=PAY-ORD-2024-000001" | python3 -m json.tool
```

Expected: `{ "order": { "id": "...", "order_number": "ORD-...", ... } }`  
With unknown reference: `{ "error": "Order not found" }` (404)  
With no reference param: `{ "error": "reference query param required" }` (400)

- [ ] **Step 4: Type-check**

```bash
npm run type-check:memory 2>&1 | grep "app/api/orders/route.ts" | head -10
```

- [ ] **Step 5: Commit**

```bash
git add app/api/orders/route.ts
git commit -m "feat(api): add GET /api/orders?reference= for confirmation page data fetch"
```

---

## Task 6: Create `/order/checkout` page (Account & Pay — Step 3)

**Files:**
- Create: `components/order/checkout/OrderSummarySidebar.tsx`
- Create: `components/order/checkout/OrderingAsCard.tsx`
- Create: `components/order/checkout/AccountSection.tsx`
- Create: `components/order/checkout/PaymentSection.tsx`
- Create: `app/order/checkout/page.tsx`

### Sub-task 6a: OrderSummarySidebar

- [ ] **Step 1: Create `components/order/checkout/OrderSummarySidebar.tsx`**

```typescript
'use client';

interface OrderSummarySidebarProps {
  packageName: string;
  speed: string;
  monthlyPrice: number;
  promotionPrice?: number;
  promotionMonths?: number;
  installationFee?: number;
}

export function OrderSummarySidebar({
  packageName,
  speed,
  monthlyPrice,
  promotionPrice,
  promotionMonths,
  installationFee = 0,
}: OrderSummarySidebarProps) {
  const displayPrice = promotionPrice ?? monthlyPrice;

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 sticky top-6">
      <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

      <div className="mb-4">
        <p className="font-medium text-gray-900">{packageName}</p>
        <p className="text-sm text-gray-500">{speed}</p>
      </div>

      <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Monthly subscription</span>
          <span className="text-gray-900">
            {promotionPrice ? (
              <>
                <span className="text-orange-500 font-medium">R{promotionPrice}</span>
                <span className="text-gray-400 line-through ml-1 text-xs">R{monthlyPrice}</span>
              </>
            ) : (
              `R${monthlyPrice}`
            )}
          </span>
        </div>
        {promotionMonths && (
          <p className="text-xs text-gray-400">
            Promo price for {promotionMonths} months, then R{monthlyPrice}/month
          </p>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Installation</span>
          <span className="text-gray-900">{installationFee > 0 ? `R${installationFee}` : 'FREE'}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-4 pt-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">Charged today</span>
          <span className="text-xl font-bold text-orange-500">R1.00</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Validation charge — credited to your account
        </p>
      </div>
    </div>
  );
}
```

### Sub-task 6b: OrderingAsCard (returning user)

- [ ] **Step 2: Create `components/order/checkout/OrderingAsCard.tsx`**

```typescript
'use client';

interface OrderingAsCardProps {
  fullName: string;
  email: string;
  onSignOut: () => void;
}

export function OrderingAsCard({ fullName, email, onSignOut }: OrderingAsCardProps) {
  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
          {fullName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Ordering as {fullName}</p>
          <p className="text-xs text-gray-500">{email}</p>
        </div>
      </div>
      <button
        onClick={onSignOut}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
      >
        Not you? Sign out
      </button>
    </div>
  );
}
```

### Sub-task 6c: AccountSection (new user)

- [ ] **Step 3: Create `components/order/checkout/AccountSection.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const accountSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z
    .string()
    .regex(/^[0-9+\s()-]{10,}$/, 'Please enter a valid phone number'),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms & Conditions' }),
  }),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountSectionProps {
  onSubmit: (values: AccountFormValues) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  isSubmitting: boolean;
}

export function AccountSection({ onSubmit, onGoogleSignIn, isSubmitting }: AccountSectionProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
  });

  const termsAccepted = watch('termsAccepted');

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create your account</h2>

      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full mb-4"
        onClick={onGoogleSignIn}
        disabled={isSubmitting}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </Button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-400">Or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" placeholder="John" {...register('firstName')} />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" placeholder="Doe" {...register('lastName')} />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" {...register('email')} />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" type="tel" placeholder="0821234567" {...register('phone')} />
          <p className="text-xs text-gray-400 mt-1">
            We'll ask you to verify this after your order is placed.
          </p>
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="termsAccepted"
            checked={termsAccepted === true}
            onCheckedChange={(checked) =>
              setValue('termsAccepted', checked === true ? true : (undefined as unknown as true))
            }
          />
          <label htmlFor="termsAccepted" className="text-xs text-gray-600 leading-relaxed">
            I accept the{' '}
            <a href="/terms-of-service" target="_blank" className="text-orange-500 underline">
              Terms & Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy-policy" target="_blank" className="text-orange-500 underline">
              Privacy Policy
            </a>
          </label>
        </div>
        {errors.termsAccepted && (
          <p className="text-red-500 text-xs">{errors.termsAccepted.message}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account...' : 'Continue to Payment →'}
        </Button>
      </form>
    </div>
  );
}
```

### Sub-task 6d: PaymentSection

- [ ] **Step 4: Create `components/order/checkout/PaymentSection.tsx`**

```typescript
'use client';

import { Button } from '@/components/ui/button';

interface PaymentSectionProps {
  monthlyPrice: number;
  packageName: string;
  onProceed: () => Promise<void>;
  isProcessing: boolean;
  errorMessage?: string;
}

export function PaymentSection({
  monthlyPrice,
  packageName,
  onProceed,
  isProcessing,
  errorMessage,
}: PaymentSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>

      {/* Validation banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-amber-600 text-lg">✓</span>
          <div>
            <p className="font-semibold text-amber-800">VALIDATION ONLY — R1.00</p>
            <p className="text-sm text-amber-700">
              Your first bill of R{monthlyPrice}/month will be processed after activation.
            </p>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="border-2 border-orange-500 bg-orange-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">💳</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Credit or Debit Card</p>
              <p className="text-xs text-gray-500">Visa, Mastercard — 3D Secure</p>
            </div>
          </div>
          <div className="text-green-500">✓</div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6 text-xs text-blue-700">
        Clicking "Proceed to Payment" will redirect you to NetCash's secure payment gateway
        to complete the R1.00 validation charge.
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          {errorMessage}
          <a
            href="https://wa.me/27824873900"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 underline"
          >
            Contact support via WhatsApp
          </a>
        </div>
      )}

      <Button
        onClick={onProceed}
        disabled={isProcessing}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        size="lg"
      >
        {isProcessing ? 'Processing...' : 'Proceed to Payment →'}
      </Button>

      <p className="text-center text-xs text-gray-400 mt-3">
        By proceeding, you agree to our{' '}
        <a href="/terms-of-service" className="underline">Terms & Conditions</a> and{' '}
        <a href="/privacy-policy" className="underline">Privacy Policy</a>.
      </p>

      <p className="text-center text-xs text-gray-400 mt-1">
        * R{monthlyPrice}/month billed after service activation
      </p>
    </div>
  );
}
```

### Sub-task 6e: Checkout page assembly

- [ ] **Step 5: Create `app/order/checkout/page.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckoutProgressBar } from '@/components/order/CheckoutProgressBar';
import { useOrderContext } from '@/components/order/context/OrderContext';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { AccountSection, AccountFormValues } from '@/components/order/checkout/AccountSection';
import { OrderingAsCard } from '@/components/order/checkout/OrderingAsCard';
import { PaymentSection } from '@/components/order/checkout/PaymentSection';
import { OrderSummarySidebar } from '@/components/order/checkout/OrderSummarySidebar';

export default function CheckoutPage() {
  const router = useRouter();
  const { state: orderState, actions } = useOrderContext();
  const { isAuthenticated, customer, user, signOut, signUp, signInWithGoogle } = useCustomerAuth();

  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | undefined>();
  const [accountCreated, setAccountCreated] = useState(false);

  const pkg = orderState.orderData.package?.selectedPackage;
  const coverage = orderState.orderData.coverage;

  // Guard: require package selection
  useEffect(() => {
    if (!pkg && !orderState.orderData.coverage?.leadId) {
      router.replace('/order/coverage');
    }
  }, [pkg, orderState.orderData.coverage?.leadId, router]);

  const handleAccountSubmit = async (values: AccountFormValues) => {
    setIsCreatingAccount(true);
    try {
      await signUp(values.email, values.password, {
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phone,
      });
      actions.updateOrderData({
        account: {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          isAuthenticated: true,
          accountType: coverage?.coverageType === 'business' ? 'business' : 'personal',
          termsAccepted: true,
        },
      });
      setAccountCreated(true);
      toast.success('Account created! Proceeding to payment...');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Account creation failed';
      toast.error(message);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    // Google OAuth redirects away and back — auth state will update on return
  };

  const handleSignOut = async () => {
    await signOut();
    toast.info('Signed out. Please create an account to continue.');
  };

  const handleProceedToPayment = async () => {
    // Require account before payment
    const email = customer?.email || user?.email;
    const phone = customer?.phone || orderState.orderData.account?.phone;
    const firstName = customer?.first_name || orderState.orderData.account?.firstName || '';
    const lastName = customer?.last_name || orderState.orderData.account?.lastName || '';

    if (!email) {
      toast.error('Please create an account or sign in first.');
      return;
    }
    if (!pkg) {
      toast.error('No package selected. Please go back and choose a plan.');
      return;
    }
    if (!coverage?.address) {
      toast.error('No service address found. Please start from the coverage check.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(undefined);

    try {
      // Step 1: Create order (once, here only)
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || '',
          service_package_id: pkg.id,
          package_name: pkg.name,
          package_speed: pkg.speed,
          package_price: pkg.monthlyPrice,
          installation_fee: pkg.installation_fee ?? 0,
          payment_amount: 1.00,
          is_validation_charge: true,
          installation_address: coverage.address,
          coordinates: coverage.coordinates,
          installation_location_type: coverage.propertyType,
          account_type: coverage.coverageType === 'business' ? 'business' : 'personal',
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }
      const { order } = await orderRes.json();
      toast.success(`Order ${order.order_number} created`);

      // Step 2: Initiate payment
      const paymentRes = await fetch('/api/payment/netcash/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: 1.00,
          customerEmail: email,
          customerName: `${firstName} ${lastName}`.trim(),
          paymentReference: order.payment_reference,
        }),
      });

      if (!paymentRes.ok) {
        throw new Error('Failed to initiate payment');
      }
      const { paymentUrl } = await paymentRes.json();

      // Step 3: Redirect to NetCash
      window.location.href = paymentUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setPaymentError(message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const showAccountSection = !isAuthenticated && !accountCreated;
  const showPaymentSection = isAuthenticated || accountCreated;

  const fullName = customer
    ? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
    : `${orderState.orderData.account?.firstName ?? ''} ${orderState.orderData.account?.lastName ?? ''}`.trim();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <CheckoutProgressBar currentStage="checkout" />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2">
          {isAuthenticated && (
            <OrderingAsCard
              fullName={fullName || 'You'}
              email={customer?.email || user?.email || ''}
              onSignOut={handleSignOut}
            />
          )}

          {showAccountSection && (
            <AccountSection
              onSubmit={handleAccountSubmit}
              onGoogleSignIn={handleGoogleSignIn}
              isSubmitting={isCreatingAccount}
            />
          )}

          {showPaymentSection && pkg && (
            <PaymentSection
              monthlyPrice={pkg.monthlyPrice}
              packageName={pkg.name}
              onProceed={handleProceedToPayment}
              isProcessing={isProcessingPayment}
              errorMessage={paymentError}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {pkg && (
            <OrderSummarySidebar
              packageName={pkg.name}
              speed={pkg.speed}
              monthlyPrice={pkg.monthlyPrice}
              promotionPrice={typeof pkg.promotion_price === 'number' ? pkg.promotion_price : undefined}
              promotionMonths={pkg.promotion_months ?? undefined}
              installationFee={pkg.installation_fee ?? 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Type-check**

```bash
npm run type-check:memory 2>&1 | grep -E "error TS|Found [0-9]+ error" | head -20
```

Common errors and fixes:
- `signUp` signature mismatch → check `customer-auth-service.ts` for exact parameter shape; adjust the `signUp` call to match
- `signOut` not on `useCustomerAuth` return → check the hook and use the correct method name
- `customer.first_name` vs `customer.firstName` → check the `Customer` type in `lib/types/`

- [ ] **Step 7: Smoke test the checkout page**

Navigate from Coverage → Packages → Checkout and verify:
1. Not logged in: account creation form appears
2. Log in via Google: form disappears, "Ordering as" card appears
3. Create account via email: form disappears, "Proceed to Payment" appears
4. Order summary sidebar shows correct package details
5. "Proceed to Payment" calls `/api/orders/create` then `/api/payment/netcash/initiate` then redirects to NetCash
6. Payment failure shows error with WhatsApp link

- [ ] **Step 8: Commit**

```bash
git add components/order/checkout/ app/order/checkout/
git commit -m "feat(order): add /order/checkout page — combined account + payment step 3"
```

---

## Task 7: Fix confirmation page — fetch live order from API

**Files:**
- Modify: `app/order/confirmation/page.tsx`

- [ ] **Step 1: Replace the fake setTimeout with a real API fetch**

Replace the `ConfirmationContent` component entirely:

```typescript
'use client';

import { PiCheckCircleBold, PiSpinnerBold, PiWarningBold, PiPhoneBold } from 'react-icons/pi';
import React, { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface OrderDetails {
  id: string;
  order_number: string;
  payment_reference: string;
  status: string;
  payment_status: string;
  package_name: string;
  package_speed: string;
  package_price: number;
  installation_fee: number;
  installation_address: string;
  installation_location_type: string;
  account_type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
}

function ConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paymentReference = searchParams.get('Reference') || searchParams.get('reference');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!paymentReference) {
        setError('No payment reference found.');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders?reference=${encodeURIComponent(paymentReference)}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        setError('We could not load your order details. Your payment was still processed.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [paymentReference]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <PiSpinnerBold className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming your order...</h1>
          <p className="text-gray-600">Please wait while we verify your payment</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <PiWarningBold className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Order submitted</h1>
          <p className="text-gray-500 mb-2">
            Payment Reference: <span className="font-mono font-semibold">{paymentReference}</span>
          </p>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <a
            href="https://wa.me/27824873900"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            <PiPhoneBold /> Contact us on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const phoneUnverified = order && !order.phone?.startsWith('verified:');

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Success header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <PiCheckCircleBold className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600">Thank you for choosing CircleTel.</p>
        {order && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-500 text-left space-y-1">
            <div className="flex justify-between">
              <span>Order number</span>
              <span className="font-mono font-semibold">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Package</span>
              <span>{order.package_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Address</span>
              <span className="text-right max-w-xs">{order.installation_address}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly fee</span>
              <span>R{order.package_price}/month</span>
            </div>
          </div>
        )}
      </div>

      {/* What happens next */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h2>
        <div className="space-y-4">
          {/* Phone verification — shown when phone not yet verified */}
          {phoneUnverified && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
              <div>
                <p className="font-medium text-amber-900">Verify your phone number</p>
                <p className="text-sm text-amber-700 mt-1">
                  We need to verify {order?.phone || 'your number'} before we can schedule installation.
                </p>
                <Link
                  href="/dashboard/profile?verify=phone"
                  className="inline-block mt-2 text-sm bg-amber-500 text-white px-4 py-1.5 rounded-lg hover:bg-amber-600"
                >
                  Verify Now →
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {phoneUnverified ? '2' : '1'}
            </span>
            <p className="text-gray-700">You'll receive an order confirmation email shortly.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {phoneUnverified ? '3' : '2'}
            </span>
            <p className="text-gray-700">
              Our team will contact you within 24 hours to schedule installation.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {phoneUnverified ? '4' : '3'}
            </span>
            <p className="text-gray-700">Professional installation — we'll get you connected.</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
          Return to Home
        </Button>
        <Button
          onClick={() => router.push('/dashboard')}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto p-8 text-center">
        <PiSpinnerBold className="w-12 h-12 text-orange-500 mx-auto animate-spin" />
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check:memory 2>&1 | grep "confirmation" | head -10
```

- [ ] **Step 3: Smoke test**

Simulate a NetCash return by navigating to:
```
http://localhost:3000/order/confirmation?Reference=PAY-ORD-2024-000001
```
(Use a real `payment_reference` from your `consumer_orders` table.)

Verify:
1. Loading spinner appears briefly
2. Order details render from the DB (not mock data)
3. Page works after browser refresh
4. With unknown reference: error state + WhatsApp link
5. "Go to Dashboard" button navigates to `/dashboard`

- [ ] **Step 4: Commit**

```bash
git add app/order/confirmation/page.tsx
git commit -m "fix(order): confirmation page fetches live order from API; adds phone verify CTA"
```

---

## Task 8: Retire old pages (redirect to /order/checkout)

**Files:**
- Modify: `app/order/account/page.tsx`
- Modify: `app/order/service-address/page.tsx`
- Modify: `app/order/payment/page.tsx`

- [ ] **Step 1: Replace `/order/account` with a redirect**

Replace the entire contents of `app/order/account/page.tsx`:

```typescript
import { redirect } from 'next/navigation';

export default function OrderAccountPage() {
  redirect('/order/checkout');
}
```

- [ ] **Step 2: Replace `/order/service-address` with a redirect**

Replace the entire contents of `app/order/service-address/page.tsx`:

```typescript
import { redirect } from 'next/navigation';

export default function ServiceAddressPage() {
  redirect('/order/checkout');
}
```

- [ ] **Step 3: Replace `/order/payment` with a redirect**

Replace the entire contents of `app/order/payment/page.tsx`:

```typescript
import { redirect } from 'next/navigation';

export default function OrderPaymentPage() {
  redirect('/order/checkout');
}
```

- [ ] **Step 4: Verify old URLs redirect**

```bash
npm run dev:memory
```

Navigate to each of:
- `http://localhost:3000/order/account` → should immediately redirect to `/order/checkout`
- `http://localhost:3000/order/service-address` → should immediately redirect to `/order/checkout`
- `http://localhost:3000/order/payment` → should immediately redirect to `/order/checkout`

- [ ] **Step 5: Commit**

```bash
git add app/order/account/page.tsx app/order/service-address/page.tsx app/order/payment/page.tsx
git commit -m "feat(order): redirect retired order pages to /order/checkout"
```

---

## Task 9: Fix open redirect vulnerability on login page

**Files:**
- Modify: `app/auth/login/page.tsx`

- [ ] **Step 1: Add redirect URL validation**

Find where `redirectPath` is set (currently `searchParams.get('redirect') || '/dashboard'`) and replace with:

```typescript
const ALLOWED_REDIRECT_PATHS = [
  '/dashboard',
  '/order/checkout',
  '/order/coverage',
  '/order/packages',
  '/partners',
];

function safeRedirectPath(raw: string | null): string {
  if (!raw) return '/dashboard';
  // Must be a relative path starting with /
  if (!raw.startsWith('/')) return '/dashboard';
  // Must not be a protocol-relative URL (//evil.com)
  if (raw.startsWith('//')) return '/dashboard';
  // Must start with an allowed prefix
  const isAllowed = ALLOWED_REDIRECT_PATHS.some((allowed) => raw.startsWith(allowed));
  return isAllowed ? raw : '/dashboard';
}

const redirectPath = safeRedirectPath(searchParams.get('redirect'));
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check:memory 2>&1 | grep "login" | head -10
```

- [ ] **Step 3: Verify fix**

Navigate to:
- `http://localhost:3000/auth/login?redirect=/order/checkout` → after login, should go to `/order/checkout` ✓
- `http://localhost:3000/auth/login?redirect=https://evil.com` → after login, should go to `/dashboard` (not evil.com)
- `http://localhost:3000/auth/login?redirect=//evil.com` → after login, should go to `/dashboard`

- [ ] **Step 4: Commit**

```bash
git add app/auth/login/page.tsx
git commit -m "fix(security): validate redirect param against allowlist to prevent open redirect"
```

---

## Task 10: Update inbound links + E2E test

**Files:**
- Search product/marketing pages for old order URLs
- Modify: `tests/e2e/customer-order-journey.spec.ts`

- [ ] **Step 1: Find all inbound links to old pages**

```bash
grep -r "order/account\|order/service-address\|order/payment" \
  /home/circletel/app \
  /home/circletel/components \
  --include="*.tsx" --include="*.ts" -l
```

For each file found, update links from the old path to `/order/checkout` (or `/order/coverage` if the link was meant to start the order flow).

- [ ] **Step 2: Update the E2E journey test**

Open `tests/e2e/customer-order-journey.spec.ts` and update the flow to match the new 3-step structure:

```typescript
test('consumer order journey — new 3-step flow', async ({ page }) => {
  // Step 1: Coverage
  await page.goto('/order/coverage');
  await page.fill('[placeholder="Start typing your address..."]', '1 Example Street, Johannesburg');
  // Wait for autocomplete + select first result
  await page.waitForSelector('[data-testid="address-suggestion"]');
  await page.click('[data-testid="address-suggestion"]:first-child');
  // Select property type
  await page.selectOption('select', 'freestanding_home');
  await page.click('button:has-text("Check Coverage")');

  // Step 2: Packages
  await page.waitForURL(/\/order\/packages/);
  await expect(page.locator('[data-testid="package-card"]').first()).toBeVisible();
  await page.click('[data-testid="package-card"]:first-child');
  await page.click('button:has-text("Continue")');

  // Step 3: Checkout
  await page.waitForURL('/order/checkout');
  await expect(page.locator('text=Create your account')).toBeVisible();

  // Fill account form
  await page.fill('#firstName', 'Test');
  await page.fill('#lastName', 'User');
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'password123');
  await page.fill('#phone', '0821234567');
  await page.click('#termsAccepted');
  await page.click('button:has-text("Continue to Payment")');

  // Payment section appears
  await expect(page.locator('text=VALIDATION ONLY — R1.00')).toBeVisible();
});
```

- [ ] **Step 3: Final type-check and build**

```bash
npm run type-check:memory 2>&1 | grep -E "Found [0-9]+ error"
```

Expected: `Found 0 errors`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(order): update inbound links and E2E test for new 3-step flow"
```

---

## Self-Review Notes

- Task 1 updates `lib/order/types.ts` stage constants. Any file importing `TOTAL_STAGES`, `STAGE_NAMES`, or `getStageId`/`getStageNumber` will need to handle the new 3-stage values — Task 2 and Task 3 cover the two main consumers (progress bar, coverage page).
- Task 5 creates `app/api/orders/route.ts` — verify no conflicting route exists (`app/api/orders/consumer/`, `app/api/orders/create/` etc. are sub-routes and won't conflict).
- Task 6 step 6 notes type-check issues to watch for in `useCustomerAuth` — the exact method names (`signUp`, `signOut`, `signInWithGoogle`) must match what the hook exports. Fix inline if they differ.
- Task 7 uses a `phoneUnverified` heuristic — this is a placeholder until a proper `phone_verified` column or flag exists on the customer or order record. Replace the check with the real field once it exists.
