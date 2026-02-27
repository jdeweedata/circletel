# UI/UX Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform CircleTel platform into a minimalist, JTBD-focused experience where each page serves one clear purpose.

**Architecture:** Page-by-Purpose redesign - each page has ONE primary job, collapsed secondary actions, location-aware context, and mobile-first responsive layouts. Retain CircleTel orange brand identity while stripping complexity.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Shadcn/ui, Supabase, Framer Motion

**Design Doc:** `docs/plans/2026-02-27-ui-ux-redesign-design.md`

---

## Phase 1: Foundation (Week 1-2)

### Task 1.1: Update Design Tokens

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Step 1: Update Tailwind tokens**

Add simplified spacing and verify existing colors:

```typescript
// In tailwind.config.ts theme.extend
spacing: {
  'tight': '4px',
  'compact': '8px',
  'default': '16px',
  'section': '24px',
  'major': '32px',
},
fontSize: {
  'page-title': ['24px', { lineHeight: '32px', fontWeight: '600' }],
  'section': ['18px', { lineHeight: '28px', fontWeight: '600' }],
  'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
  'small': ['12px', { lineHeight: '16px', fontWeight: '400' }],
},
```

**Step 2: Verify changes compile**

Run: `npm run type-check:memory`
Expected: No errors

**Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(design): add simplified spacing and typography tokens"
```

---

### Task 1.2: Create Shared Layout Components

**Files:**
- Create: `components/shared/PageLayout.tsx`
- Create: `components/shared/PageHeader.tsx`
- Create: `components/shared/QuickActions.tsx`

**Step 1: Create PageLayout component**

```typescript
// components/shared/PageLayout.tsx
'use client'

import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-ui-bg p-section', className)}>
      <div className="mx-auto max-w-7xl space-y-section">
        {children}
      </div>
    </div>
  )
}
```

**Step 2: Create PageHeader component**

```typescript
// components/shared/PageHeader.tsx
'use client'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between', className)}>
      <div>
        <h1 className="text-page-title text-ui-text-primary">{title}</h1>
        {subtitle && (
          <p className="mt-compact text-body text-ui-text-muted">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
```

**Step 3: Create QuickActions component**

```typescript
// components/shared/QuickActions.tsx
'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'outline'
}

interface QuickActionsProps {
  actions: QuickAction[]
  className?: string
}

export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <div className={cn('flex flex-wrap gap-compact', className)}>
      {actions.map((action, i) => (
        <Button
          key={i}
          variant={action.variant || 'outline'}
          size="sm"
          onClick={action.onClick}
          className="gap-compact"
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  )
}
```

**Step 4: Export from index**

```typescript
// components/shared/index.ts
export { PageLayout } from './PageLayout'
export { PageHeader } from './PageHeader'
export { QuickActions } from './QuickActions'
```

**Step 5: Verify compilation**

Run: `npm run type-check:memory`
Expected: No errors

**Step 6: Commit**

```bash
git add components/shared/
git commit -m "feat(ui): add shared PageLayout, PageHeader, QuickActions components"
```

---

### Task 1.3: Create Command Palette for Admin

**Files:**
- Create: `components/admin/CommandPalette.tsx`
- Create: `hooks/use-command-palette.ts`
- Modify: `app/admin/layout.tsx`

**Step 1: Create command palette hook**

```typescript
// hooks/use-command-palette.ts
'use client'

import { useEffect, useState, useCallback } from 'react'

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => setIsOpen(prev => !prev), [])
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape' && isOpen) {
        close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, toggle, close])

  return { isOpen, open, close, toggle }
}
```

**Step 2: Create CommandPalette component**

```typescript
// components/admin/CommandPalette.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, User, Package, FileText, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SearchResult {
  type: 'customer' | 'order' | 'quote' | 'product'
  id: string
  title: string
  subtitle: string
  href: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const search = async () => {
      setLoading(true)
      const supabase = createClient()
      const searchResults: SearchResult[] = []

      // Search customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, account_number')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,account_number.ilike.%${query}%`)
        .limit(3)

      customers?.forEach(c => {
        searchResults.push({
          type: 'customer',
          id: c.id,
          title: `${c.first_name} ${c.last_name}`,
          subtitle: c.account_number || c.email,
          href: `/admin/customers/${c.id}`
        })
      })

      // Search orders
      const { data: orders } = await supabase
        .from('consumer_orders')
        .select('id, order_number, customer_id, status')
        .ilike('order_number', `%${query}%`)
        .limit(3)

      orders?.forEach(o => {
        searchResults.push({
          type: 'order',
          id: o.id,
          title: o.order_number,
          subtitle: o.status,
          href: `/admin/orders/${o.id}`
        })
      })

      setResults(searchResults)
      setLoading(false)
    }

    const debounce = setTimeout(search, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    router.push(result.href)
    onClose()
    setQuery('')
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'customer': return <User className="h-4 w-4" />
      case 'order': return <ShoppingCart className="h-4 w-4" />
      case 'quote': return <FileText className="h-4 w-4" />
      case 'product': return <Package className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0">
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search customers, orders, quotes..."
            className="border-0 focus-visible:ring-0 text-body"
            autoFocus
          />
          <kbd className="text-small text-muted-foreground">Esc</kbd>
        </div>

        {results.length > 0 && (
          <div className="max-h-80 overflow-auto p-2">
            {results.map(result => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
              >
                {getIcon(result.type)}
                <div>
                  <div className="text-body font-medium">{result.title}</div>
                  <div className="text-small text-muted-foreground">{result.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {query && results.length === 0 && !loading && (
          <div className="p-8 text-center text-muted-foreground">
            No results found for "{query}"
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**Step 3: Add to admin layout**

```typescript
// In app/admin/layout.tsx - add to the layout component
import { CommandPalette } from '@/components/admin/CommandPalette'
import { useCommandPalette } from '@/hooks/use-command-palette'

// Inside the component:
const { isOpen, close } = useCommandPalette()

// In the JSX, add before closing tag:
<CommandPalette isOpen={isOpen} onClose={close} />
```

**Step 4: Verify compilation**

Run: `npm run type-check:memory`
Expected: No errors

**Step 5: Test manually**

Run: `npm run dev:memory`
Navigate to `/admin`, press Cmd+K (or Ctrl+K)
Expected: Command palette opens, search works

**Step 6: Commit**

```bash
git add components/admin/CommandPalette.tsx hooks/use-command-palette.ts app/admin/layout.tsx
git commit -m "feat(admin): add global command palette (Cmd+K)"
```

---

### Task 1.4: Create Mobile Bottom Navigation Component

**Files:**
- Create: `components/shared/BottomNav.tsx`

**Step 1: Create BottomNav component**

```typescript
// components/shared/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface BottomNavProps {
  items: NavItem[]
  className?: string
}

export function BottomNav({ items, className }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-safe md:hidden',
      className
    )}>
      <div className="flex items-center justify-around">
        {items.map(item => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-3 text-small',
                isActive
                  ? 'text-circleTel-orange'
                  : 'text-ui-text-muted hover:text-ui-text-primary'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**Step 2: Export from shared index**

Add to `components/shared/index.ts`:
```typescript
export { BottomNav } from './BottomNav'
```

**Step 3: Verify compilation**

Run: `npm run type-check:memory`
Expected: No errors

**Step 4: Commit**

```bash
git add components/shared/BottomNav.tsx components/shared/index.ts
git commit -m "feat(ui): add mobile BottomNav component"
```

---

### Task 1.5: Create Geolocation Hook

**Files:**
- Create: `hooks/use-geolocation.ts`

**Step 1: Create geolocation hook**

```typescript
// hooks/use-geolocation.ts
'use client'

import { useState, useEffect } from 'react'

interface GeolocationState {
  loading: boolean
  error: string | null
  coordinates: { lat: number; lng: number } | null
  city: string | null
  region: string | null
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    error: null,
    coordinates: null,
    city: null,
    region: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation not supported',
      }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        // Reverse geocode using Google Maps
        try {
          const response = await fetch(
            `/api/geocode/reverse?lat=${coords.lat}&lng=${coords.lng}`
          )
          const data = await response.json()

          setState({
            loading: false,
            error: null,
            coordinates: coords,
            city: data.city || null,
            region: data.region || null,
          })
        } catch {
          // Still use coordinates even if reverse geocode fails
          setState({
            loading: false,
            error: null,
            coordinates: coords,
            city: null,
            region: null,
          })
        }
      },
      (error) => {
        setState({
          loading: false,
          error: error.message,
          coordinates: null,
          city: null,
          region: null,
        })
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    )
  }, [])

  return state
}
```

**Step 2: Create reverse geocode API route**

```typescript
// app/api/geocode/reverse/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    )
    const data = await response.json()

    if (data.results?.[0]) {
      const components = data.results[0].address_components
      const city = components.find((c: any) =>
        c.types.includes('locality') || c.types.includes('sublocality')
      )?.long_name
      const region = components.find((c: any) =>
        c.types.includes('administrative_area_level_1')
      )?.long_name

      return NextResponse.json({ city, region })
    }

    return NextResponse.json({ city: null, region: null })
  } catch (error) {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 })
  }
}
```

**Step 3: Verify compilation**

Run: `npm run type-check:memory`
Expected: No errors

**Step 4: Commit**

```bash
git add hooks/use-geolocation.ts app/api/geocode/reverse/route.ts
git commit -m "feat(geo): add useGeolocation hook with reverse geocoding"
```

---

## Phase 2: Public Site & Order Flow (Week 3-5)

### Task 2.1: Redesign Homepage Hero

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/home/Hero.tsx` (or create if different structure)

**Step 1: Create location-aware hero section**

Replace existing hero with location-first design:

```typescript
// components/home/HeroSection.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGeolocation } from '@/hooks/use-geolocation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'

export function HeroSection() {
  const { city, loading: geoLoading } = useGeolocation()
  const [address, setAddress] = useState('')
  const router = useRouter()

  const handleCheckCoverage = () => {
    if (address.trim()) {
      router.push(`/order/coverage?address=${encodeURIComponent(address)}`)
    }
  }

  return (
    <section className="relative bg-gradient-to-b from-ui-bg to-white py-major">
      <div className="mx-auto max-w-3xl px-default text-center">
        {/* Location indicator */}
        <div className="mb-section flex items-center justify-center gap-compact text-body text-ui-text-muted">
          <MapPin className="h-4 w-4" />
          {geoLoading ? (
            <span className="flex items-center gap-compact">
              <Loader2 className="h-3 w-3 animate-spin" />
              Detecting your location...
            </span>
          ) : city ? (
            <span>You're in <strong className="text-ui-text-primary">{city}</strong></span>
          ) : (
            <span>Enter your address to check coverage</span>
          )}
        </div>

        {/* Main heading */}
        <h1 className="text-[40px] font-bold leading-tight text-ui-text-primary">
          Fast, reliable internet
          <br />
          <span className="text-circleTel-orange">for your home or business</span>
        </h1>

        {/* Address input */}
        <div className="mx-auto mt-section max-w-xl">
          <div className="flex gap-compact rounded-lg border bg-white p-tight shadow-lg">
            <Input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Enter your address to check coverage"
              className="flex-1 border-0 text-body focus-visible:ring-0"
              onKeyDown={e => e.key === 'Enter' && handleCheckCoverage()}
            />
            <Button
              onClick={handleCheckCoverage}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              Check Coverage
            </Button>
          </div>
        </div>

        {/* Service type links */}
        <div className="mt-section flex items-center justify-center gap-section text-body">
          <span className="text-ui-text-muted">Or browse:</span>
          <a href="/connectivity/fibre" className="text-circleTel-orange hover:underline">Fibre</a>
          <a href="/connectivity/fixed-wireless" className="text-circleTel-orange hover:underline">Wireless</a>
          <a href="/connectivity/business" className="text-circleTel-orange hover:underline">Business</a>
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Verify compilation**

Run: `npm run type-check:memory`
Expected: No errors

**Step 3: Test visually**

Run: `npm run dev:memory`
Navigate to `/`
Expected: See location-aware hero with single address input

**Step 4: Commit**

```bash
git add components/home/HeroSection.tsx app/page.tsx
git commit -m "feat(home): redesign hero with location-aware address input"
```

---

### Task 2.2: Consolidate Order Flow (3-Step Wizard)

**Files:**
- Modify: `app/order/` directory
- Create: `components/order/OrderWizard.tsx`
- Create: `components/order/steps/CoverageStep.tsx`
- Create: `components/order/steps/ConfigureStep.tsx`
- Create: `components/order/steps/PaymentStep.tsx`

(Detailed implementation for each step - continues in same pattern)

---

## Phase 3: Consumer Dashboard (Week 6-7)

### Task 3.1: Redesign Dashboard Home

**Files:**
- Modify: `app/dashboard/page.tsx`
- Create: `components/dashboard/ServiceCard.tsx`
- Create: `components/dashboard/PaymentCard.tsx`

(Detailed implementation continues...)

---

## Phase 4: Partner Portal (Week 8-9)

### Task 4.1: Redesign Partner Dashboard

**Files:**
- Modify: `app/partner/dashboard/page.tsx`
- Create: `components/partners/dashboard/QuotesList.tsx`
- Create: `components/partners/dashboard/MetricsCards.tsx`

(Detailed implementation continues...)

---

## Phase 5: Admin Panel (Week 10-12)

### Task 5.1: Create Action Queue Dashboard

**Files:**
- Modify: `app/admin/dashboard/page.tsx`
- Create: `components/admin/dashboard/ActionQueue.tsx`
- Create: `components/admin/dashboard/QuickMetrics.tsx`

(Detailed implementation continues...)

### Task 5.2: Implement Collapsed Navigation

**Files:**
- Modify: `components/admin/layout/Sidebar.tsx`
- Create: `components/admin/layout/CollapsibleNavSection.tsx`

(Detailed implementation continues...)

---

## Phase 6: Polish & Testing (Week 13-14)

### Task 6.1: Cross-Browser Testing

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Task 6.2: Mobile Device Testing

- iPhone 12/13/14 (Safari)
- Samsung Galaxy S21+ (Chrome)
- iPad Pro (Safari)

### Task 6.3: Performance Audit

Run: Lighthouse audit on all major pages
Target: Performance > 90, Accessibility > 95

### Task 6.4: A11y Audit

Check: Color contrast, keyboard navigation, screen reader compatibility

---

## Verification

After each phase:

1. **Type check:** `npm run type-check:memory`
2. **Build:** `npm run build:memory`
3. **Visual review:** Test on desktop and mobile
4. **Cross-browser:** Test in Chrome, Firefox, Safari
5. **Staging deploy:** Push to staging branch

---

## Critical Files Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| Design tokens | `tailwind.config.ts` | Colors, spacing, typography |
| Global styles | `app/globals.css` | Base styles |
| Shared layouts | `components/shared/` | PageLayout, PageHeader, QuickActions |
| Admin layout | `components/admin/layout/` | Sidebar, CommandPalette |
| Consumer nav | `components/dashboard/navigation/` | DashboardHeader, MobileBottomNav |
| Partner nav | `components/partners/navigation/` | PartnerHeader, PartnerSidebar |

---

## Existing Utilities to Reuse

- `cn()` from `lib/utils` - Class name merging
- `createClient()` from `lib/supabase/client` - Browser Supabase client
- `Button`, `Input`, `Dialog` from `components/ui/` - Shadcn components
- `useGeolocation()` from `hooks/use-geolocation.ts` - Location detection

---

**Total Estimated Time:** 8-12 weeks
**Tasks per Phase:** 4-8 tasks
**Task Granularity:** 15-30 min each
