# B2B Feasibility Portal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the B2B Feasibility Portal by wiring up coverage APIs, creating bulk quote generation, and adding proper error handling.

**Architecture:** The UI page is created at `/admin/sales/feasibility`. It calls `/api/coverage/check` for each site, displays results with recommended packages, then calls a new `/api/quotes/business/bulk-create` endpoint to generate quotes. Reuses existing coverage aggregation service and quote generator.

**Tech Stack:** Next.js 15, TypeScript, Supabase, Framer Motion, existing coverage and quote libraries.

---

## Task 1: Fix Coverage API Integration

**Files:**
- Modify: `app/admin/sales/feasibility/page.tsx:185-220`
- Reference: `app/api/coverage/check/route.ts`

**Step 1: Read the existing coverage API**

Check the existing coverage API request format:

Run: `head -100 app/api/coverage/check/route.ts`

**Step 2: Update the API call in feasibility page**

The current code sends `coordinates` but the API expects a different format. Update to match:

```typescript
// In checkFeasibility function, update the fetch call:
const response = await fetch('/api/coverage/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...(coordinates
      ? { coordinates: { lat: coordinates.lat, lng: coordinates.lng } }
      : { address: site }),
    providers: ['mtn', 'dfa'],
    serviceTypes: ['fibre', 'uncapped_wireless', '5g', 'fixed_lte', 'lte']
  })
});
```

**Step 3: Test the coverage API call**

Run dev server and test with a known coordinate:

Run: `npm run dev:memory`

Then in browser, go to `/admin/sales/feasibility`, enter:
- Company: "Test Company"
- Sites: `-33.992024, 18.766900`
- Click "Check Feasibility"

Expected: Coverage results should display (or graceful error if no coverage)

**Step 4: Commit**

```bash
git add app/admin/sales/feasibility/page.tsx
git commit -m "fix(feasibility): correct coverage API request format"
```

---

## Task 2: Add Address Geocoding

**Files:**
- Modify: `app/admin/sales/feasibility/page.tsx:175-250`
- Reference: `lib/services/google-geocoding.ts`

**Step 1: Read the existing geocoding service**

Run: `head -80 lib/services/google-geocoding.ts`

**Step 2: Add geocoding for address inputs**

Before calling coverage API for addresses (non-GPS), geocode first:

```typescript
// Add import at top of file
import { geocodeAddress } from '@/lib/services/google-geocoding';

// In checkFeasibility, before the coverage API call:
if (!isGPS) {
  try {
    const geocodeResult = await geocodeAddress(site);
    if (geocodeResult.success && geocodeResult.coordinates) {
      coordinates = geocodeResult.coordinates;
      address = geocodeResult.formattedAddress || site;
    }
  } catch (geocodeError) {
    console.error('Geocoding failed:', geocodeError);
    // Continue with address-based coverage check
  }
}
```

**Step 3: Test geocoding integration**

In browser, test with an address:
- Sites: `5 Libertas Road, Karindal, Stellenbosch`

Expected: Address should be geocoded to coordinates before coverage check

**Step 4: Commit**

```bash
git add app/admin/sales/feasibility/page.tsx
git commit -m "feat(feasibility): add geocoding for address inputs"
```

---

## Task 3: Create Bulk Quote API Endpoint

**Files:**
- Create: `app/api/quotes/business/bulk-create/route.ts`
- Reference: `lib/quotes/quote-generator.ts`
- Reference: `lib/quotes/types.ts`

**Step 1: Create the API route file**

```typescript
/**
 * Bulk Quote Creation API
 * Creates multiple B2B quotes from feasibility results
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBusinessQuote } from '@/lib/quotes/quote-generator';
import { CreateQuoteRequest } from '@/lib/quotes/types';
import { apiLogger } from '@/lib/logging';

interface BulkQuoteRequest {
  clientDetails: {
    companyName: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  requirements: {
    speedRequirement: '100' | '200' | '500' | '1000';
    contention: 'best-effort' | '10:1' | 'dia';
    contractTerm?: 12 | 24 | 36;
  };
  sites: Array<{
    address: string;
    coordinates?: { lat: number; lng: number };
    packages: Array<{
      packageId: string;
      itemType: 'primary' | 'secondary' | 'additional';
    }>;
  }>;
}

interface BulkQuoteResult {
  success: boolean;
  quotes: Array<{
    siteAddress: string;
    quoteId?: string;
    quoteNumber?: string;
    error?: string;
  }>;
  summary: {
    total: number;
    created: number;
    failed: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<BulkQuoteResult>> {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, quotes: [], summary: { total: 0, created: 0, failed: 0 } },
        { status: 401 }
      );
    }

    const body: BulkQuoteRequest = await request.json();
    const { clientDetails, requirements, sites } = body;

    if (!sites || sites.length === 0) {
      return NextResponse.json(
        { success: false, quotes: [], summary: { total: 0, created: 0, failed: 0 } },
        { status: 400 }
      );
    }

    apiLogger.info('Creating bulk quotes', {
      siteCount: sites.length,
      company: clientDetails.companyName
    });

    const results: BulkQuoteResult['quotes'] = [];
    let created = 0;
    let failed = 0;

    for (const site of sites) {
      try {
        // Map packages to quote items
        const items = site.packages.map(pkg => ({
          package_id: pkg.packageId,
          item_type: pkg.itemType,
          quantity: 1
        }));

        // Skip if no packages
        if (items.length === 0) {
          results.push({
            siteAddress: site.address,
            error: 'No packages selected'
          });
          failed++;
          continue;
        }

        const quoteRequest: CreateQuoteRequest = {
          lead_id: '', // Will be created or linked
          customer_type: 'enterprise',
          company_name: clientDetails.companyName,
          contact_name: clientDetails.contactName || '',
          contact_email: clientDetails.contactEmail || '',
          contact_phone: clientDetails.contactPhone || '',
          service_address: site.address,
          coordinates: site.coordinates,
          contract_term: requirements.contractTerm || 24,
          items: items,
          customer_notes: `Source: Feasibility Portal | Contention: ${requirements.contention} | Speed: ${requirements.speedRequirement}Mbps`
        };

        const quote = await createBusinessQuote(quoteRequest, user.id);

        results.push({
          siteAddress: site.address,
          quoteId: quote.id,
          quoteNumber: quote.quote_number
        });
        created++;

      } catch (error) {
        apiLogger.error('Failed to create quote for site', {
          site: site.address,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.push({
          siteAddress: site.address,
          error: error instanceof Error ? error.message : 'Failed to create quote'
        });
        failed++;
      }
    }

    apiLogger.info('Bulk quote creation complete', {
      total: sites.length,
      created,
      failed
    });

    return NextResponse.json({
      success: created > 0,
      quotes: results,
      summary: {
        total: sites.length,
        created,
        failed
      }
    });

  } catch (error) {
    apiLogger.error('Bulk quote creation failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      {
        success: false,
        quotes: [],
        summary: { total: 0, created: 0, failed: 0 }
      },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify the file compiles**

Run: `npm run type-check 2>&1 | grep bulk-create`

Expected: No errors for the new file

**Step 3: Commit**

```bash
git add app/api/quotes/business/bulk-create/route.ts
git commit -m "feat(api): add bulk quote creation endpoint for feasibility"
```

---

## Task 4: Wire Up Quote Generation in UI

**Files:**
- Modify: `app/admin/sales/feasibility/page.tsx:380-420`

**Step 1: Update the generateQuotes function**

Replace the placeholder with actual API call:

```typescript
// Replace the generateQuotes function:
const generateQuotes = async () => {
  const selectedResults = siteResults.filter(r => selectedSites.has(r.id) && r.status === 'complete');

  if (selectedResults.length === 0) return;

  try {
    const response = await fetch('/api/quotes/business/bulk-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientDetails: {
          companyName: formData.companyName,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone
        },
        requirements: {
          speedRequirement: formData.speedRequirement,
          contention: formData.contention,
          contractTerm: 24
        },
        sites: selectedResults.map(result => ({
          address: result.address || result.input,
          coordinates: result.coordinates,
          packages: result.recommendedPackages.slice(0, 1).map(pkg => ({
            packageId: pkg.id,
            itemType: 'primary' as const
          }))
        }))
      })
    });

    const data = await response.json();

    if (data.success) {
      // Show success message and redirect
      alert(`Created ${data.summary.created} quote(s). Redirecting to quotes list...`);
      window.location.href = '/admin/quotes/business';
    } else {
      alert(`Failed to create quotes. ${data.summary.failed} errors.`);
    }
  } catch (error) {
    console.error('Quote generation failed:', error);
    alert('Failed to generate quotes. Please try again.');
  }
};
```

**Step 2: Test quote generation flow**

In browser:
1. Enter company and sites
2. Run feasibility check
3. Select sites with coverage
4. Click "Generate Quotes"

Expected: Quotes created and redirected to quotes list

**Step 3: Commit**

```bash
git add app/admin/sales/feasibility/page.tsx
git commit -m "feat(feasibility): wire up bulk quote generation"
```

---

## Task 5: Add Package ID Mapping

**Files:**
- Modify: `app/admin/sales/feasibility/page.tsx:300-350`

**Step 1: Fetch real package IDs from database**

The current recommendations use fake IDs like 'fibre-100'. We need real package IDs:

```typescript
// Add this function after the imports:
async function fetchPackagesByTechnology(technology: string, minSpeed: number): Promise<Array<{
  id: string;
  name: string;
  speed_down: number;
  price: number;
}>> {
  try {
    const response = await fetch(`/api/products?service_type=${technology}&min_speed=${minSpeed}&status=active&limit=5`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.products || [];
  } catch {
    return [];
  }
}

// Update generatePackageRecommendations to use real packages:
const generatePackageRecommendations = async (
  coverage: SiteResult['coverage'],
  form: FormData
): Promise<SiteResult['recommendedPackages']> => {
  if (!coverage) return [];

  const packages: SiteResult['recommendedPackages'] = [];
  const speedMap: Record<string, number> = { '100': 100, '200': 200, '500': 500, '1000': 1000 };
  const targetSpeed = speedMap[form.speedRequirement];
  const budget = form.budget ? parseFloat(form.budget) : Infinity;

  // Fetch real packages based on coverage
  if (coverage.fibre.available) {
    const fibrePackages = await fetchPackagesByTechnology('fibre', targetSpeed);
    fibrePackages
      .filter(p => p.price <= budget)
      .forEach(p => packages.push({
        id: p.id,
        name: p.name,
        speed: `${p.speed_down}/${p.speed_down} Mbps`,
        price: p.price,
        technology: 'Fibre'
      }));
  }

  if (coverage.tarana.available) {
    const taranaPackages = await fetchPackagesByTechnology('wireless', targetSpeed);
    taranaPackages
      .filter(p => p.price <= budget)
      .forEach(p => packages.push({
        id: p.id,
        name: p.name,
        speed: `${p.speed_down}/${p.speed_down} Mbps`,
        price: p.price,
        technology: 'Tarana'
      }));
  }

  // Limit to 4 recommendations
  return packages.slice(0, 4);
};
```

**Step 2: Make the function async and update call site**

Update the coverage check to await package recommendations.

**Step 3: Commit**

```bash
git add app/admin/sales/feasibility/page.tsx
git commit -m "feat(feasibility): fetch real package IDs for recommendations"
```

---

## Task 6: Add Error States and Loading Improvements

**Files:**
- Modify: `app/admin/sales/feasibility/page.tsx`

**Step 1: Add toast notifications**

Replace `alert()` with proper toast notifications:

```typescript
// Add import
import { toast } from 'sonner';

// Replace alerts with toasts:
// Success:
toast.success(`Created ${data.summary.created} quote(s)`, {
  description: 'Redirecting to quotes list...'
});

// Error:
toast.error('Failed to generate quotes', {
  description: `${data.summary.failed} errors occurred`
});
```

**Step 2: Add retry logic for failed coverage checks**

Add a retry button for sites that failed:

```typescript
// In the results section, add retry button for error state:
{result.status === 'error' && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => retrySite(result.id)}
    className="ml-auto"
  >
    <RotateCcw className="w-4 h-4 mr-1" />
    Retry
  </Button>
)}
```

**Step 3: Commit**

```bash
git add app/admin/sales/feasibility/page.tsx
git commit -m "feat(feasibility): improve error handling with toasts and retry"
```

---

## Task 7: Final Testing and Documentation

**Files:**
- No new files

**Step 1: Full end-to-end test**

Test the complete flow:
1. Go to `/admin/sales/feasibility`
2. Enter: Company "Test Corp", Contact "John"
3. Paste sites from original email:
   ```
   -33.992024, 18.766900
   -33.793678, 18.979570
   5 Libertas Road, Karindal, Stellenbosch
   ```
4. Set speed to 200Mbps, contention to 10:1
5. Click "Check Feasibility"
6. Verify coverage results display
7. Select sites with coverage
8. Click "Generate Quotes"
9. Verify quotes appear in `/admin/quotes/business`

**Step 2: Update CLAUDE.md with new feature**

Add to Recent Updates section:

```markdown
### B2B Feasibility Portal (COMPLETE)
✅ Sales Quick Entry at `/admin/sales/feasibility`
✅ Multi-site paste (addresses + GPS coordinates)
✅ Auto coverage checks (MTN, DFA, Tarana, 5G, LTE)
✅ Smart package recommendations
✅ Bulk quote generation
```

**Step 3: Final commit**

```bash
git add -A
git commit -m "docs: update CLAUDE.md with B2B Feasibility Portal feature"
```

---

## Summary

| Task | Description | Effort |
|------|-------------|--------|
| 1 | Fix coverage API integration | 15 min |
| 2 | Add address geocoding | 20 min |
| 3 | Create bulk quote API | 30 min |
| 4 | Wire up quote generation | 15 min |
| 5 | Add real package ID mapping | 30 min |
| 6 | Error handling improvements | 20 min |
| 7 | Testing and documentation | 30 min |

**Total estimated time:** ~2.5 hours

**Dependencies:**
- Existing coverage API must be working
- Existing quote generator must be working
- Products must exist in database for package recommendations
