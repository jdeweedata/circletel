# Admin Detail Page Design System

**Date**: 2026-03-08
**Source**: `/admin/orders/[id]` page pattern
**Applies to**: All admin detail pages (orders, devices, customers, partners, etc.)

## Overview

A consistent design system for admin detail pages featuring:
- Full-page slate background layout
- White header with breadcrumbs
- Stat cards row for key metrics
- Tabbed content sections
- Reusable section cards

## Page Structure

```
+--------------------------------------------------+
| HEADER (white bg, border-bottom)                 |
| - Breadcrumbs                                    |
| - Title + Status Badge                           |
| - Action Buttons                                 |
+--------------------------------------------------+
| STAT CARDS (4-column grid)                       |
| [Card 1] [Card 2] [Card 3] [Card 4]              |
+--------------------------------------------------+
| TABS (underline style)                           |
| Overview | Tab 2 | Tab 3 | History               |
+--------------------------------------------------+
| TAB CONTENT                                      |
| - 2-column grid of SectionCards                  |
+--------------------------------------------------+
```

## Required Imports

```typescript
import { UnderlineTabs, TabPanel, SectionCard, StatCard, StatusBadge } from '@/components/admin/shared';
```

## Components Reference

### 1. Page Layout

```tsx
<div className="min-h-screen bg-slate-50 overflow-x-hidden">
  {/* Header */}
  <YourHeader />

  {/* Main Content */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
    {/* Stat Cards */}
    <YourStatCards />

    {/* Tabs */}
    <UnderlineTabs tabs={TAB_CONFIG} activeTab={activeTab} onTabChange={setActiveTab} />

    {/* Tab Panels */}
    <TabPanel id="overview" activeTab={activeTab} className="mt-6">
      {/* Content */}
    </TabPanel>
  </div>
</div>
```

### 2. Header Component

**Location**: `components/admin/[domain]/detail/[Domain]Header.tsx`

```tsx
<div className="bg-white border-b border-slate-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
    {/* Breadcrumbs */}
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
      <Link href="/admin/[section]" className="hover:text-primary">[Section]</Link>
      <PiCaretRightBold className="w-3 h-3" />
      <span className="text-slate-900">{itemName}</span>
    </div>

    {/* Title Row */}
    <div className="flex flex-wrap items-center justify-between gap-6 mt-4">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          {title}
        </h2>
        <StatusBadge status={statusLabel} className={statusClassName} />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Grouped icon buttons */}
        <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
          <button className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors">
            <PiIconBold className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200">
            <PiIcon2Bold className="w-5 h-5" />
          </button>
        </div>

        {/* Primary action */}
        <Button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
          <PiIconBold className="w-5 h-5" />
          Primary Action
        </Button>
      </div>
    </div>
  </div>
</div>
```

### 3. StatCard Component

**Simple variant** (no icon):
```tsx
<StatCard
  label="Package"
  value="SkyFibre 100"
  subtitle="100 Mbps"
  subtitleIcon={<PiLightningBold className="w-3 h-3 text-primary" />}
/>
```

**Icon variant** (with colored icon):
```tsx
<StatCard
  label="Status"
  value="Online"
  subtitle="Config Synced"
  icon={<PiWifiHighBold className="w-5 h-5" />}
  iconBgColor="bg-emerald-100"
  iconColor="text-emerald-600"
/>
```

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `label` | string | Small uppercase label |
| `value` | string/number | Main display value |
| `subtitle` | string | Optional secondary text |
| `subtitleIcon` | ReactNode | Icon before subtitle |
| `icon` | ReactNode | Enables icon variant |
| `iconBgColor` | string | e.g., `bg-blue-100` |
| `iconColor` | string | e.g., `text-blue-600` |
| `indicator` | 'pulse' / 'none' | Animated indicator |
| `trend` | `{ value: number, isPositive: boolean }` | Trend arrow |
| `onClick` | function | Makes card clickable |
| `href` | string | Makes card a link |
| `isActive` | boolean | Highlighted state |

### 4. UnderlineTabs Component

```tsx
const TAB_CONFIG = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Details' },
  { id: 'history', label: 'History' },
] as const;

type TabId = typeof TAB_CONFIG[number]['id'];

const [activeTab, setActiveTab] = useState<TabId>('overview');

<UnderlineTabs
  tabs={TAB_CONFIG}
  activeTab={activeTab}
  onTabChange={(id) => setActiveTab(id as TabId)}
/>

<TabPanel id="overview" activeTab={activeTab} className="mt-6">
  {/* Tab content */}
</TabPanel>
```

### 5. SectionCard Component

```tsx
<SectionCard
  icon={PiInfoBold}
  title="Section Title"
  action={<Badge>Status</Badge>}
  compact
>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Label</p>
      <p className="text-sm font-medium">Value</p>
    </div>
  </div>
</SectionCard>
```

**Props**:
| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Card header title |
| `icon` | ElementType | Icon component (not instance) |
| `action` | ReactNode | Right-side header content |
| `compact` | boolean | Reduced padding |
| `className` | string | Additional classes |

## Color Conventions

### Status Colors
| Status | Background | Text |
|--------|------------|------|
| Success/Active/Online | `bg-emerald-50` | `text-emerald-700` |
| Warning/Pending | `bg-amber-50` | `text-amber-700` |
| Error/Failed/Offline | `bg-red-50` | `text-red-700` |
| Info/In Progress | `bg-blue-50` | `text-blue-700` |
| Neutral/Suspended | `bg-slate-100` | `text-slate-600` |

### Icon Background Colors (StatCard)
| Context | Background | Icon Color |
|---------|------------|------------|
| Status/Health | `bg-emerald-100` | `text-emerald-600` |
| Users/Clients | `bg-blue-100` | `text-blue-600` |
| Performance/CPU | `bg-purple-100` | `text-purple-600` |
| Time/Duration | `bg-amber-100` | `text-amber-600` |
| Money/Financial | `bg-green-100` | `text-green-600` |
| Alerts/Warnings | `bg-red-100` | `text-red-600` |

## Typography Patterns

### Labels
```tsx
<p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
  Label Text
</p>
```

### Values
```tsx
<p className="text-sm font-medium">Regular value</p>
<p className="font-mono text-sm">Monospace value (IPs, codes)</p>
<p className="font-mono text-sm bg-slate-100 px-2 py-1 rounded inline-block">Highlighted code</p>
```

### Page Title
```tsx
<h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
  Title
</h2>
```

## Loading State

```tsx
<div className="min-h-screen bg-slate-50">
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        <PiContextIcon className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-slate-500 mt-6 font-medium">Loading [item] details...</p>
    </div>
  </div>
</div>
```

## Error/Not Found State

```tsx
<div className="min-h-screen bg-slate-50">
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <PiWarningCircleBold className="h-10 w-10 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">[Item] Not Found</h2>
      <p className="text-slate-500 mb-6">{error || 'Default message'}</p>
      <Link href="/admin/[section]">
        <Button className="bg-primary hover:bg-primary/90">
          <PiArrowLeftBold className="h-4 w-4 mr-2" />
          Back to [Section]
        </Button>
      </Link>
    </div>
  </div>
</div>
```

## File Structure

```
components/admin/[domain]/detail/
├── [Domain]Header.tsx      # Header with breadcrumbs, title, actions
├── [Domain]StatCards.tsx   # 4-column stat cards
├── [Domain]OverviewTab.tsx # Optional: complex tab content
└── index.ts                # Barrel export
```

## Existing Implementations

| Page | Components |
|------|------------|
| `/admin/orders/[id]` | `OrderHeader`, `OrderStatCards`, `OrderOverviewTab` |
| `/admin/network/devices/[sn]` | `DeviceHeader`, `DeviceStatCards` |

## Quick Checklist

- [ ] Page uses `min-h-screen bg-slate-50`
- [ ] Header component with breadcrumbs
- [ ] StatusBadge for primary status
- [ ] 4 StatCards in grid (2 cols mobile, 4 cols desktop)
- [ ] UnderlineTabs with at least Overview + History
- [ ] SectionCards with icons and `compact` prop
- [ ] Loading spinner with context icon
- [ ] Error state with back button
- [ ] Consistent color usage per conventions
