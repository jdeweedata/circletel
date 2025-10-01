# MTN-Style Home Internet Page Implementation Guide

## Overview
This guide documents how to implement an MTN-style home internet packages page in the CircleTel application using Strapi CMS and the .bmad-core methodology.

**Reference URL**: https://www.mtn.co.za/shop/deals/plans/data-only/uncapped-home-internet

## Page Analysis

### Key Functionality Identified

1. **Coverage Checker Widget**
   - Address input field with search functionality
   - Validates connectivity options available in user's area
   - Uses geocoding/location services

2. **Package Categories**
   - Uncapped Shesh@ packages (200GB, 600GB)
   - Capped Shesh@ packages (80GB, 200GB)
   - Uncapped Home Internet tiers (Starter, Pro, Premium, Infinite)

3. **Filtering System**
   - Filter by Payment Type: All, Contract, Month-to-Month
   - Filter by Usage Limit: All, Capped, Uncapped

4. **Package Card Design**
   - Product image/icon
   - Package name and branding
   - Speed/data allocation display
   - Pricing with contract period
   - Special badges (HERO DEAL, promotional offers)
   - "Add to cart" or navigation arrow

5. **Interactive Elements**
   - Hover effects on package cards
   - Filter toggle interface
   - Contact/support dropdowns in footer
   - Social media links

## Strapi CMS Implementation

### Content Types Required

#### 1. Internet Package (Collection Type)

```json
{
  "name": "internet-package",
  "displayName": "Internet Package",
  "attributes": {
    "package_name": {
      "type": "string",
      "required": true
    },
    "package_type": {
      "type": "enumeration",
      "enum": ["uncapped_shesha", "capped_shesha", "uncapped_home", "capped_home"],
      "required": true
    },
    "data_allocation": {
      "type": "string",
      "description": "e.g., '200 GB', '600 GB', 'Unlimited'"
    },
    "speed": {
      "type": "string",
      "description": "e.g., '10 Mbps', '20 Mbps', '35 Mbps', 'Unlimited Speed'"
    },
    "price": {
      "type": "decimal",
      "required": true
    },
    "contract_period": {
      "type": "enumeration",
      "enum": ["month_to_month", "12_months", "24_months"],
      "default": "month_to_month"
    },
    "is_hero_deal": {
      "type": "boolean",
      "default": false
    },
    "usage_limit": {
      "type": "enumeration",
      "enum": ["capped", "uncapped"],
      "required": true
    },
    "package_image": {
      "type": "media",
      "allowedTypes": ["images"],
      "required": true
    },
    "features": {
      "type": "component",
      "repeatable": true,
      "component": "package.feature"
    },
    "promotional_text": {
      "type": "text"
    },
    "fine_print": {
      "type": "richtext"
    },
    "display_order": {
      "type": "integer",
      "default": 0
    },
    "is_active": {
      "type": "boolean",
      "default": true
    }
  }
}
```

#### 2. Package Feature (Component)

```json
{
  "name": "feature",
  "category": "package",
  "attributes": {
    "feature_text": {
      "type": "string",
      "required": true
    },
    "feature_icon": {
      "type": "enumeration",
      "enum": ["data", "speed", "router", "delivery", "gift", "star"]
    }
  }
}
```

#### 3. Page Settings (Single Type)

```json
{
  "name": "home-internet-settings",
  "displayName": "Home Internet Page Settings",
  "attributes": {
    "page_title": {
      "type": "string",
      "default": "CircleTel Home Internet Packages"
    },
    "hero_text": {
      "type": "text",
      "default": "Check if you are covered for super-fast home internet."
    },
    "coverage_checker_enabled": {
      "type": "boolean",
      "default": true
    },
    "show_filters": {
      "type": "boolean",
      "default": true
    },
    "available_filters": {
      "type": "component",
      "repeatable": true,
      "component": "filters.filter-option"
    }
  }
}
```

### Frontend Implementation (.bmad-core Method)

The .bmad-core approach emphasizes:
- **B**uild with modular components
- **M**anage state effectively
- **A**PI-driven content
- **D**esign system consistency

#### Step 1: Create Page Component

```typescript
// app/home-internet/page.tsx
import { HomeInternetPackages } from "@/components/home-internet/HomeInternetPackages"
import { CoverageChecker } from "@/components/coverage/CoverageChecker"

export default function HomeInternetPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <CoverageChecker />
      <HomeInternetPackages />
    </div>
  )
}
```

#### Step 2: Create Package Display Component

```typescript
// components/home-internet/HomeInternetPackages.tsx
"use client"

import { useState, useEffect } from "react"
import { useHomeInternetPackages } from "@/hooks/use-home-internet-packages"
import { PackageCard } from "./PackageCard"
import { PackageFilters } from "./PackageFilters"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function HomeInternetPackages() {
  const [activeTab, setActiveTab] = useState("all")
  const [filters, setFilters] = useState({
    paymentType: "all",
    usageLimit: "all"
  })

  const { packages, loading, error } = useHomeInternetPackages()

  const filteredPackages = packages.filter(pkg => {
    if (filters.paymentType !== "all" && pkg.contract_period !== filters.paymentType) {
      return false
    }
    if (filters.usageLimit !== "all" && pkg.usage_limit !== filters.usageLimit) {
      return false
    }
    if (activeTab !== "all" && pkg.package_type !== activeTab) {
      return false
    }
    return pkg.is_active
  })

  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden p-8">
      <h2 className="text-3xl font-bold mb-6">All CircleTel Home Internet Packages</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="uncapped_shesha">Uncapped Shesh@</TabsTrigger>
          <TabsTrigger value="capped_shesha">Capped Shesh@</TabsTrigger>
          <TabsTrigger value="uncapped_home">Home Internet</TabsTrigger>
        </TabsList>

        <PackageFilters filters={filters} onChange={setFilters} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {loading ? (
            <PackagesSkeleton />
          ) : (
            filteredPackages.map(pkg => (
              <PackageCard key={pkg.id} package={pkg} />
            ))
          )}
        </div>
      </Tabs>
    </div>
  )
}
```

#### Step 3: Create Package Card Component

```typescript
// components/home-internet/PackageCard.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Star } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface PackageCardProps {
  package: {
    id: string
    package_name: string
    data_allocation: string
    speed: string
    price: number
    contract_period: string
    is_hero_deal: boolean
    package_image: any
    features: Array<{ feature_text: string; feature_icon?: string }>
    promotional_text?: string
  }
}

export function PackageCard({ package: pkg }: PackageCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  const handleSelect = () => {
    router.push(`/home-internet/order?package=${pkg.id}`)
  }

  return (
    <div
      className={`
        relative bg-white rounded-xl p-6 border-2 transition-all duration-300
        ${isHovered ? 'border-circleTel-orange shadow-xl transform -translate-y-1' : 'border-gray-100'}
        ${pkg.is_hero_deal ? 'ring-2 ring-circleTel-orange ring-offset-2' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {pkg.is_hero_deal && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-circleTel-orange text-white text-xs font-bold px-3 py-1 rounded-full">
            HERO DEAL
          </span>
        </div>
      )}

      <div className="text-center mb-4">
        {pkg.package_image?.url && (
          <Image
            src={pkg.package_image.url}
            alt={pkg.package_name}
            width={120}
            height={120}
            className="mx-auto mb-4"
          />
        )}
        <h3 className="text-xl font-bold mb-2">{pkg.package_name}</h3>
        <div className="text-orange-600 font-semibold mb-1">{pkg.speed}</div>
        {pkg.data_allocation && (
          <div className="text-sm text-gray-600">{pkg.data_allocation}</div>
        )}
      </div>

      {pkg.features && pkg.features.length > 0 && (
        <div className="mb-4 space-y-2">
          {pkg.features.map((feature, idx) => (
            <div key={idx} className="text-sm text-gray-600 flex items-center">
              <div className="w-1.5 h-1.5 bg-circleTel-orange rounded-full mr-2" />
              {feature.feature_text}
            </div>
          ))}
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-baseline justify-center">
          <span className="text-lg font-semibold">R</span>
          <span className="text-3xl font-bold">{pkg.price}</span>
          <span className="text-sm text-gray-500 ml-1">
            {pkg.contract_period === "month_to_month" ? "Month-to-Month" : `PM×${pkg.contract_period}`}
          </span>
        </div>
      </div>

      {pkg.promotional_text && (
        <p className="text-xs text-gray-500 mb-4 text-center">{pkg.promotional_text}</p>
      )}

      <Button
        onClick={handleSelect}
        className="w-full bg-circleTel-orange hover:bg-orange-600 text-white"
      >
        Select Package
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  )
}
```

#### Step 4: Create React Hook for Data Fetching

```typescript
// hooks/use-home-internet-packages.ts
import { useQuery } from "@tanstack/react-query"
import { strapiClient } from "@/lib/strapi-client"
import type { StrapiCollectionResponse } from "@/lib/types/strapi"

interface InternetPackage {
  id: string
  package_name: string
  package_type: string
  data_allocation: string
  speed: string
  price: number
  contract_period: string
  usage_limit: string
  is_hero_deal: boolean
  package_image: any
  features: Array<{ feature_text: string; feature_icon?: string }>
  promotional_text?: string
  fine_print?: string
  display_order: number
  is_active: boolean
}

export function useHomeInternetPackages() {
  return useQuery({
    queryKey: ["home-internet-packages"],
    queryFn: async () => {
      const response = await strapiClient.get<StrapiCollectionResponse<InternetPackage>>(
        "/api/internet-packages?populate=*&sort=display_order:asc"
      )
      return response.data.data.map(item => ({
        id: item.id,
        ...item.attributes
      }))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

#### Step 5: Integrate Coverage Checker

The existing coverage checker at `/components/coverage/CoverageChecker.tsx` can be reused. Add a hero section wrapper:

```typescript
// components/home-internet/CoverageHero.tsx
import { CoverageChecker } from "@/components/coverage/CoverageChecker"

export function CoverageHero() {
  return (
    <div className="bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-3xl p-8 mb-8 text-white">
      <div className="max-w-2xl mx-auto text-center mb-6">
        <h1 className="text-3xl font-bold mb-4">
          Check if you are covered for super-fast home internet.
        </h1>
        <p className="text-orange-100">
          Enter your address to discover what speeds are available.
        </p>
      </div>
      <CoverageChecker variant="hero" />
    </div>
  )
}
```

## Implementation Benefits

### Using Strapi CMS

✅ **Advantages:**
1. **Content Flexibility**: Marketing team can update packages, pricing, and features without developer involvement
2. **Multi-channel**: Same content can be used for website, mobile app, and API integrations
3. **Version Control**: Track changes to packages over time
4. **Media Management**: Upload and manage package images centrally
5. **Permissions**: Role-based access control for content editors

✅ **What CAN be managed in CMS:**
- Package names, descriptions, and marketing copy
- Pricing and contract terms
- Package images and icons
- Feature lists and benefits
- Promotional badges and hero deals
- Display order and visibility

❌ **What CANNOT be managed in CMS:**
- Complex business logic (coverage checking, eligibility)
- Real-time inventory or availability
- Payment processing
- User authentication
- Order fulfillment workflows

### .bmad-core Methodology Applied

1. **Build (Modular)**: Components are isolated and reusable
2. **Manage (State)**: React Query manages server state, useState for UI state
3. **API-driven**: All content comes from Strapi API
4. **Design Consistency**: Uses existing shadcn/ui components and brand colors

## Comparison: Current vs. Proposed

| Feature | Current (/wireless) | Proposed (MTN-style) |
|---------|---------------------|----------------------|
| Data Source | Supabase products table | Strapi CMS |
| Coverage Check | Separate page | Integrated hero section |
| Filtering | Tab-based only | Tabs + multi-filter |
| Package Types | Generic wireless | Specific tiers (Shesh@, Home) |
| CMS Editable | No | Yes |
| Card Design | Simple feature list | Rich features + badges |

## Migration Path

### Phase 1: Strapi Setup (1-2 hours)
1. Create internet-package content type in Strapi
2. Create component for package features
3. Migrate existing wireless packages to new structure
4. Add sample MTN-style packages

### Phase 2: Component Development (3-4 hours)
1. Build HomeInternetPackages component
2. Build PackageCard with MTN styling
3. Build PackageFilters component
4. Create data fetching hooks

### Phase 3: Integration (2-3 hours)
1. Create new route `/home-internet`
2. Integrate coverage checker as hero
3. Connect to Strapi API
4. Test filtering and selection flow

### Phase 4: Polish (1-2 hours)
1. Add animations and transitions
2. Implement loading states
3. Add error handling
4. Mobile responsiveness testing

## Existing Resources to Leverage

Your project already has:
- ✅ Strapi CMS fully configured (`/strapi-cms`)
- ✅ Coverage checker component with Maps integration
- ✅ Package card design patterns in `ImprovedWirelessPackages.tsx`
- ✅ Filtering and tabs UI components (shadcn/ui)
- ✅ React Query hooks pattern (`use-promotions.ts`, `use-strapi.ts`)
- ✅ Brand design system (colors, typography)

## Next Steps

1. **Review this implementation plan** with your team
2. **Set up Strapi content types** using the JSON schemas provided
3. **Implement components** following the code examples
4. **Migrate or create package data** in Strapi admin panel
5. **Test the complete flow** from coverage check to package selection

## Additional Considerations

### SEO & Performance
- Use Next.js ISR (Incremental Static Regeneration) for package pages
- Implement proper meta tags and Open Graph data
- Optimize package images with Next.js Image component
- Add structured data (JSON-LD) for rich snippets

### Analytics
- Track package views and selections
- Monitor filter usage patterns
- A/B test different package presentations
- Measure conversion from coverage check to package selection

### Accessibility
- Ensure keyboard navigation for filters and cards
- Add proper ARIA labels
- Test with screen readers
- Maintain color contrast ratios

---

**Conclusion**: Yes, you can absolutely create a page with MTN-style functionality using your existing Strapi CMS. The .bmad-core approach provides a solid framework for building modular, maintainable, and CMS-driven package pages. Your existing components and infrastructure make this implementation straightforward.