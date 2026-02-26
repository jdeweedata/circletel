# Partner Feasibility Package Display Pattern

**Date**: 2026-02-26
**Context**: Implementing business package display in Partner Feasibility Portal

## Pattern: Coverage-to-Packages Flow

When a coverage check completes for a site, fetch available packages using the `coverage_lead_id`:

```typescript
// After coverage check completes
const fetchPackagesForSite = async (site: PartnerFeasibilitySite) => {
  if (!site.coverage_lead_id) return;

  const response = await fetch(
    `/api/coverage/packages?leadId=${site.coverage_lead_id}&type=business`
  );
  const data = await response.json();

  if (data.packages && Array.isArray(data.packages)) {
    setPackagesPerSite((prev) => ({
      ...prev,
      [site.id]: data.packages,
    }));
  }
};
```

**Key points**:
- Use `type=business` for B2B packages, `type=residential` for consumer
- The `coverage_lead_id` links the feasibility site to the coverage_leads table
- Packages are fetched once per site when status becomes 'complete'

## Pattern: Multi-Site Selection State

When dealing with multiple sites, use a Record keyed by siteId:

```typescript
const [selectedPackages, setSelectedPackages] = useState<Record<string, ServicePackage[]>>({});

// Select handler
const handlePackageSelect = (siteId: string, pkg: ServicePackage) => {
  setSelectedPackages((prev) => ({
    ...prev,
    [siteId]: [...(prev[siteId] || []), pkg],
  }));
};

// Deselect handler
const handlePackageDeselect = (siteId: string, pkgId: string) => {
  setSelectedPackages((prev) => ({
    ...prev,
    [siteId]: (prev[siteId] || []).filter((p) => p.id !== pkgId),
  }));
};

// Calculate totals
const allSelected = Object.values(selectedPackages).flat();
const monthlyTotal = allSelected.reduce((sum, pkg) => sum + pkg.price, 0);
const vatAmount = monthlyTotal * 0.15; // South Africa VAT
const grandTotal = monthlyTotal + vatAmount;
```

## Pattern: Package Filter State with useMemo

```typescript
interface PackageFilters {
  technology: 'all' | 'fibre' | 'wireless' | 'lte' | '5g';
  minSpeed: number;
  sortBy: 'price' | 'speed' | 'name';
}

const [filters, setFilters] = useState<PackageFilters>({
  technology: 'all',
  minSpeed: 0,
  sortBy: 'price',
});

const filteredPackages = useMemo(() => {
  if (!packages) return [];

  return packages
    .filter((pkg) => {
      // Technology filter
      if (filters.technology !== 'all') {
        const type = pkg.service_type?.toLowerCase() || '';
        // Match based on technology keywords
      }
      // Speed filter
      if (filters.minSpeed > 0 && pkg.speed_down < filters.minSpeed) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price': return a.price - b.price;
        case 'speed': return b.speed_down - a.speed_down;
        case 'name': return a.name.localeCompare(b.name);
      }
    });
}, [packages, filters]);
```

## API Reference

**Endpoint**: `/api/coverage/packages`

| Parameter | Values | Description |
|-----------|--------|-------------|
| `leadId` | UUID | Required. The coverage_lead_id from the site |
| `type` | `business` \| `residential` | Optional. Defaults to `residential` |

**Response**:
```typescript
{
  available: boolean;
  services: string[];       // Available service types
  packages: ServicePackage[];
  leadId: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  metadata: CoverageMetadata | null;
}
```

## Related Files

- `app/partner/feasibility/page.tsx` - Main partner page with state management
- `components/partners/feasibility/CoverageResults.tsx` - Package grid and filters
- `components/partners/feasibility/BusinessPackageCard.tsx` - Selectable package card
- `app/api/coverage/packages/route.ts` - Shared packages API endpoint
- `lib/partners/feasibility-types.ts` - Type definitions

## Pitfall: service_packages.customer_type

The `service_packages` table has a `customer_type` column with values:
- `'business'` - B2B packages (BizFibre, SkyFibre Business, etc.)
- `'consumer'` - Residential packages (HomeFibre, etc.)

Always filter by the correct customer_type when fetching packages.
