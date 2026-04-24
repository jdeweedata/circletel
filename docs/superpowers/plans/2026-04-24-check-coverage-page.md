# /check-coverage Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone `/check-coverage` ad-landing page that captures a user's address, runs a coverage check, and redirects to `/packages/[leadId]` on success — with UTM attribution persisted to `coverage_leads`.

**Architecture:** Two new files in `app/(marketing)/check-coverage/` (server page + client content component) plus a 3-line addition to `/api/coverage/check/route.ts` to pass UTM fields through to the database. The client component uses `AddressAutocomplete` for address capture, posts to the existing coverage check API, and routes on the result.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Phosphor Icons (`react-icons/pi`), `lib/constants/contact.ts`, existing coverage components.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| MODIFY | `app/api/coverage/check/route.ts` | Read UTM fields from request body; include in `coverage_leads` insert |
| CREATE | `app/(marketing)/check-coverage/page.tsx` | Server component — exports `metadata`, wraps content in `<Suspense>` |
| CREATE | `app/(marketing)/check-coverage/CheckCoverageContent.tsx` | `'use client'` — UTM capture, address state, form submit, redirect/no-coverage logic, all page sections |

---

## Task 1: Add UTM passthrough to `/api/coverage/check`

**Files:**
- Modify: `app/api/coverage/check/route.ts`

- [ ] **Step 1: Read the current route**

Open `app/api/coverage/check/route.ts`. Confirm line ~16 reads:
```typescript
const { address, coordinates } = await request.json();
```
And line ~26 starts the `leadData` object with `address`, `customer_type`, `lead_source`, etc.

- [ ] **Step 2: Add UTM destructuring and spread**

Change the destructuring on line ~16 from:
```typescript
const { address, coordinates } = await request.json();
```
to:
```typescript
const { address, coordinates, utm_source, utm_medium, utm_campaign } = await request.json();
```

Then in the `leadData` object (after the `coordinates` spread, around line ~37), add:
```typescript
...(utm_source && { utm_source }),
...(utm_medium && { utm_medium }),
...(utm_campaign && { utm_campaign }),
```

The full `leadData` block should now look like:
```typescript
const leadData: any = {
  address,
  customer_type: 'consumer',
  lead_source: 'coverage_checker',
  status: 'new',
  first_name: 'Quote',
  last_name: 'Request',
  email: 'pending@quote.request',
  phone: '0000000000',
  ...(coordinates?.lat && coordinates?.lng && {
    coordinates: {
      type: 'Point',
      coordinates: [coordinates.lng, coordinates.lat]
    }
  }),
  ...(utm_source && { utm_source }),
  ...(utm_medium && { utm_medium }),
  ...(utm_campaign && { utm_campaign }),
};
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check:memory 2>&1 | grep -E "error|warning" | grep "coverage/check" | head -10
```

Expected: no errors on this file.

- [ ] **Step 4: Commit**

```bash
git add app/api/coverage/check/route.ts
git commit -m "feat(coverage): pass UTM params from request body to coverage_leads insert"
```

---

## Task 2: Create the server page with metadata

**Files:**
- Create: `app/(marketing)/check-coverage/page.tsx`

- [ ] **Step 1: Create the file**

Create `app/(marketing)/check-coverage/page.tsx` with this exact content:

```typescript
import { Suspense } from 'react';
import { type Metadata } from 'next';
import { CheckCoverageContent } from './CheckCoverageContent';

export const metadata: Metadata = {
  title: 'Check SkyFibre Coverage | CircleTel Business Internet',
  description:
    'Check if SkyFibre Business wireless broadband is available at your address. 100 Mbps uncapped from R1,299/mo. Free installation. No contract.',
  keywords: 'coverage check, SkyFibre, business internet, CircleTel, check availability',
  alternates: {
    canonical: 'https://circletel.co.za/check-coverage',
  },
  openGraph: {
    title: 'Check SkyFibre Coverage at Your Address',
    description:
      'Check if SkyFibre Business wireless broadband is available at your address. 100 Mbps uncapped from R1,299/mo.',
  },
};

function HeroSkeleton() {
  return (
    <div className="min-h-screen bg-[#13274A] animate-pulse">
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="h-8 bg-white/10 rounded-full w-40 mb-6" />
        <div className="h-12 bg-white/10 rounded w-3/4 mb-4" />
        <div className="h-6 bg-white/10 rounded w-1/2 mb-8" />
        <div className="h-14 bg-white/10 rounded-xl mb-4" />
        <div className="h-14 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}

export default function CheckCoveragePage() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <CheckCoverageContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check:memory 2>&1 | grep -E "error" | grep "check-coverage" | head -10
```

Expected: no errors. (The import of `CheckCoverageContent` will error until Task 3 — that's fine, it's a known forward reference.)

- [ ] **Step 3: Commit**

```bash
git add app/(marketing)/check-coverage/page.tsx
git commit -m "feat(check-coverage): add server page shell with SEO metadata"
```

---

## Task 3: Build CheckCoverageContent — hero section + form logic

**Files:**
- Create: `app/(marketing)/check-coverage/CheckCoverageContent.tsx`

This task builds the `'use client'` component with the hero section, form, and all interactive logic. Subsequent tasks add the static sections below the hero.

- [ ] **Step 1: Create the file with hero + form**

Create `app/(marketing)/check-coverage/CheckCoverageContent.tsx`:

```typescript
'use client';

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PiMapPinBold, PiArrowRightBold, PiSpinnerBold } from 'react-icons/pi';
import { toast } from 'sonner';
import { AddressAutocomplete } from '@/components/coverage/AddressAutocomplete';
import { NoCoverageLeadCapture } from '@/components/coverage/NoCoverageLeadCapture';
import { getWhatsAppLink } from '@/lib/constants/contact';
import { CONTACT } from '@/lib/constants/contact';

interface LocationState {
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export function CheckCoverageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Capture UTM params once on mount — stored in ref to avoid re-renders
  const utmRef = useRef({
    utm_source: searchParams.get('utm_source') ?? undefined,
    utm_medium: searchParams.get('utm_medium') ?? undefined,
    utm_campaign: searchParams.get('utm_campaign') ?? undefined,
  });

  const [location, setLocation] = useState<LocationState>({
    address: '',
    latitude: null,
    longitude: null,
  });
  const [isChecking, setIsChecking] = useState(false);
  const [noCoverage, setNoCoverage] = useState(false);

  function handleLocationSelect(data: {
    address: string;
    latitude?: number;
    longitude?: number;
  }) {
    setLocation({
      address: data.address,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    });
    // Reset no-coverage state when address changes
    setNoCoverage(false);
  }

  async function handleCheckCoverage() {
    if (!location.address) {
      toast.error('Please enter your address first');
      return;
    }

    setIsChecking(true);

    try {
      const body: Record<string, unknown> = {
        address: location.address,
        ...(location.latitude && location.longitude && {
          coordinates: { lat: location.latitude, lng: location.longitude },
        }),
        ...utmRef.current,
      };

      const response = await fetch('/api/coverage/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Coverage check failed');
      }

      if (data.available && data.lead_id) {
        router.push(`/packages/${data.lead_id}`);
      } else {
        setNoCoverage(true);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="bg-[#13274A] text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-[#F5841E] text-white text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            SkyFibre Coverage
          </span>

          <h1 className="font-poppins text-3xl md:text-5xl font-bold leading-tight mb-4">
            Check If SkyFibre Covers Your Address
          </h1>

          <p className="text-white/70 text-lg md:text-xl mb-10 max-w-xl mx-auto">
            Enter your address below. We&apos;ll show you available packages in 30 seconds.
          </p>

          {noCoverage ? (
            <div className="text-left">
              <NoCoverageLeadCapture
                address={location.address}
                latitude={location.latitude ?? undefined}
                longitude={location.longitude ?? undefined}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-xl mx-auto">
              <AddressAutocomplete
                value={location.address}
                onLocationSelect={handleLocationSelect}
                placeholder="Enter your street address"
                variant="hero"
                showMapButton={false}
                showLocationButton
              />

              <button
                onClick={handleCheckCoverage}
                disabled={isChecking || !location.address}
                className="w-full flex items-center justify-center gap-2 bg-[#F5841E] hover:bg-[#e07318] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-lg px-6 py-4 rounded-xl transition-colors min-h-[56px]"
              >
                {isChecking ? (
                  <>
                    <PiSpinnerBold className="animate-spin h-5 w-5" />
                    Checking coverage...
                  </>
                ) : (
                  <>
                    <PiMapPinBold className="h-5 w-5" />
                    Check Coverage
                    <PiArrowRightBold className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Remaining sections added in Tasks 4–6 */}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check:memory 2>&1 | grep -E "error" | grep "check-coverage\|CheckCoverage" | head -10
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify the page renders**

```bash
npm run dev:memory &
```

Navigate to `http://localhost:3000/check-coverage`. You should see:
- Navy hero with orange badge
- H1 heading
- Address input with Google Places autocomplete
- Orange "Check Coverage" button (disabled until address entered)

- [ ] **Step 4: Commit**

```bash
git add app/(marketing)/check-coverage/CheckCoverageContent.tsx
git commit -m "feat(check-coverage): add hero section with coverage form and submit logic"
```

---

## Task 4: Add Trust Badges section

**Files:**
- Modify: `app/(marketing)/check-coverage/CheckCoverageContent.tsx`

- [ ] **Step 1: Add imports for trust badge icons**

At the top of `CheckCoverageContent.tsx`, extend the Phosphor icon import line from:
```typescript
import { PiMapPinBold, PiArrowRightBold, PiSpinnerBold } from 'react-icons/pi';
```
to:
```typescript
import {
  PiMapPinBold,
  PiArrowRightBold,
  PiSpinnerBold,
  PiHouseLineBold,
  PiCalendarCheckBold,
  PiHandshakeBold,
} from 'react-icons/pi';
```

- [ ] **Step 2: Replace the `{/* Remaining sections */}` comment**

Find the comment `{/* Remaining sections added in Tasks 4–6 */}` and replace it with the trust badges section plus the comment for tasks 5–6:

```tsx
      {/* ── Trust Badges ── */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: PiHouseLineBold,
              headline: '6 Million+ Homes Covered',
              sub: 'Across South Africa',
            },
            {
              icon: PiCalendarCheckBold,
              headline: 'Installed in 3–5 Days',
              sub: 'Fast professional setup',
            },
            {
              icon: PiHandshakeBold,
              headline: 'No Contract Required',
              sub: 'Cancel anytime',
            },
          ].map(({ icon: Icon, headline, sub }) => (
            <div key={headline} className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
                <Icon className="w-7 h-7 text-[#F5841E]" />
              </div>
              <p className="font-poppins font-semibold text-[#13274A] text-lg">{headline}</p>
              <p className="text-[#747474] text-sm">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Remaining sections added in Tasks 5–6 */}
```

- [ ] **Step 3: Verify in browser**

Reload `http://localhost:3000/check-coverage`. Below the hero you should see 3 trust badges in a row (desktop) stacking to 1 column on narrow viewport.

- [ ] **Step 4: Commit**

```bash
git add app/(marketing)/check-coverage/CheckCoverageContent.tsx
git commit -m "feat(check-coverage): add trust badges section"
```

---

## Task 5: Add What Happens Next section

**Files:**
- Modify: `app/(marketing)/check-coverage/CheckCoverageContent.tsx`

- [ ] **Step 1: Replace `{/* Remaining sections added in Tasks 5–6 */}` comment**

Find that comment and replace it with:

```tsx
      {/* ── What Happens Next ── */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-poppins text-2xl md:text-3xl font-bold text-[#13274A] text-center mb-12">
            What Happens Next
          </h2>

          <div className="relative flex flex-col md:flex-row gap-8 md:gap-0">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-[#F5841E]/30" />

            {[
              {
                number: '01',
                title: 'Coverage Check',
                body: "We check your address against MTN's Tarana G1 coverage map",
              },
              {
                number: '02',
                title: 'See Your Options',
                body: 'You'll see available speed tiers and pricing within 30 seconds',
              },
              {
                number: '03',
                title: 'Book Installation',
                body: 'Choose your plan and we'll schedule installation within 5 business days',
              },
            ].map(({ number, title, body }) => (
              <div key={number} className="relative flex-1 flex flex-col items-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-[#F5841E] text-white flex items-center justify-center font-poppins font-bold text-lg mb-4 z-10">
                  {number}
                </div>
                <p className="font-poppins font-semibold text-[#13274A] text-lg mb-2">{title}</p>
                <p className="text-[#747474] text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Remaining sections added in Task 6 */}
```

- [ ] **Step 2: Verify in browser**

Reload `http://localhost:3000/check-coverage`. You should see numbered steps 01 → 02 → 03 with a faint orange connector line on desktop, stacked vertically on mobile.

- [ ] **Step 3: Commit**

```bash
git add app/(marketing)/check-coverage/CheckCoverageContent.tsx
git commit -m "feat(check-coverage): add what happens next steps section"
```

---

## Task 6: Add Fallback CTA and Footer CTA sections

**Files:**
- Modify: `app/(marketing)/check-coverage/CheckCoverageContent.tsx`

- [ ] **Step 1: Verify contact constants are importable**

Confirm `lib/constants/contact.ts` exports both `CONTACT` and `getWhatsAppLink`. They are already imported at the top of the file from Task 3.

Run:
```bash
grep -n "getWhatsAppLink\|CONTACT" /home/circletel/lib/constants/contact.ts | head -10
```

Expected: lines showing `export const CONTACT` and `export function getWhatsAppLink`.

- [ ] **Step 2: Replace `{/* Remaining sections added in Task 6 */}`**

Find that comment and replace it with:

```tsx
      {/* ── Fallback CTA ── */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-poppins font-semibold text-[#13274A] text-xl mb-2">
            Can&apos;t find your address?
          </p>
          <p className="text-[#747474] mb-6">
            WhatsApp us and we&apos;ll check manually.
          </p>
          <a
            href={getWhatsAppLink('Hi CircleTel, please check coverage at my address: ')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            WhatsApp Us
          </a>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="bg-[#13274A] py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-poppins text-2xl md:text-3xl font-bold text-white mb-2">
            Not sure which plan is right?
          </h2>
          <p className="text-white/70 text-lg mb-8">Talk to our team.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/products"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-[#13274A] font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              View Packages
            </a>
            <a
              href={CONTACT.WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#F5841E] hover:bg-[#e07318] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              WhatsApp Sales
            </a>
          </div>
        </div>
      </section>
```

- [ ] **Step 3: Verify in browser**

Reload `http://localhost:3000/check-coverage`. Full page should now show all 5 sections. On mobile, buttons should stack vertically.

- [ ] **Step 4: Type-check the full file**

```bash
npm run type-check:memory 2>&1 | grep -E "error" | grep "check-coverage\|CheckCoverage" | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/(marketing)/check-coverage/CheckCoverageContent.tsx
git commit -m "feat(check-coverage): add fallback CTA and footer CTA sections"
```

---

## Task 7: End-to-end verification

**Files:** no changes — verification only

- [ ] **Step 1: Test happy path — coverage found**

With dev server running, navigate to:
```
http://localhost:3000/check-coverage?utm_source=google&utm_medium=cpc&utm_campaign=test
```

1. Type a Johannesburg address (e.g. "1 Sandton Drive, Sandton") — autocomplete should fire
2. Select the address from the dropdown
3. Click "Check Coverage"
4. Button should show spinner + "Checking coverage..."
5. On response: browser should redirect to `/packages/[leadId]`

- [ ] **Step 2: Verify UTM fields saved in DB**

After the happy path above, check Supabase:
```sql
SELECT id, address, utm_source, utm_medium, utm_campaign, lead_source, created_at
FROM coverage_leads
ORDER BY created_at DESC
LIMIT 1;
```

Expected: row with `utm_source = 'google'`, `utm_medium = 'cpc'`, `utm_campaign = 'test'`.

- [ ] **Step 3: Test no-coverage path**

Use an address outside the coverage area (e.g. a rural address like "Farm Road, Limpopo"). After submitting:

- "Checking coverage..." spinner shows
- `NoCoverageLeadCapture` form appears inside the hero section
- Navy background maintained around it

- [ ] **Step 4: Test error path**

Temporarily break the API call by changing the fetch URL to `/api/coverage/check-BROKEN` in `CheckCoverageContent.tsx`. Submit a valid address:

- Button re-enables after the call
- `toast.error` appears with error message
- Page does not navigate away

Revert the URL change immediately.

- [ ] **Step 5: Test mobile layout**

In browser DevTools, set viewport to 390×844 (iPhone 14). Verify:
- Address input is full width
- "Check Coverage" button is full width
- Trust badges stack to 1 column
- Steps stack vertically (no connector line)
- Footer CTA buttons stack vertically

- [ ] **Step 6: Test that `/coverage-check` redirect still works**

Navigate to `http://localhost:3000/coverage-check?plan=plus`. Should redirect to `/packages?plan=skyfibre-home-plus` (existing behaviour, not affected).

- [ ] **Step 7: Final type-check and build check**

```bash
npm run type-check:memory 2>&1 | tail -5
```

Expected: `Found 0 errors.`

- [ ] **Step 8: Commit verification note**

```bash
git add -A
git commit -m "feat(check-coverage): complete standalone coverage landing page with UTM tracking" --allow-empty
```

---

## Self-Review Notes

**Spec coverage:**
- ✅ Hero section with navy bg, badge, H1, subhead, form, orange button
- ✅ Google Places via `AddressAutocomplete`
- ✅ Redirect to `/packages/[leadId]` on coverage found
- ✅ `NoCoverageLeadCapture` inline on no-coverage
- ✅ Trust badges (3 items, specified text)
- ✅ What Happens Next (3 steps, specified text)
- ✅ Fallback WhatsApp CTA with pre-filled message
- ✅ Footer CTA with View Packages + WhatsApp Sales
- ✅ SEO metadata (title, description, keywords, og:title, canonical)
- ✅ UTM capture + passthrough to `coverage_leads`
- ✅ Mobile responsive (grid-cols-1→3, flex-col→row, full-width buttons)
- ✅ Brand colours (#F5841E, #13274A, #747474)
- ✅ Contact constants via `lib/constants/contact.ts`

**Type consistency:**
- `lead_id` (snake_case) — matches actual API response from `route.ts` line 83
- `NoCoverageLeadCapture` props: `address` (string), `latitude?` (number), `longitude?` (number) — matches component interface
- `AddressAutocomplete` props: `value`, `onLocationSelect`, `placeholder`, `variant`, `showMapButton`, `showLocationButton` — all verified against interface
