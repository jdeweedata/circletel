# Admin Design Patterns

Layout patterns and conventions for admin detail pages.

---

## Detail Page Layout

Standard layout for order/quote/partner detail pages.

```
+--------------------------------------------------+
| DetailPageHeader                                 |
|  [Breadcrumb] / [Breadcrumb] / Current           |
|  Title                              [Status]     |
|                              [Actions ...]       |
+--------------------------------------------------+
| StatCard | StatCard | StatCard | StatCard        |
+--------------------------------------------------+
| [Tab] [Tab] [Tab] [Tab]                          |
+--------------------------------------------------+
| Tab Content (3-column grid)                      |
| +------------+ +------------+ +------------+     |
| | SectionCard| | SectionCard| | Timeline   |     |
| +------------+ +------------+ +------------+     |
| +------------+ +------------+                    |
| | SectionCard| | SectionCard|                    |
| +------------+ +------------+                    |
+--------------------------------------------------+
```

### Implementation

```tsx
export default function DetailPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-50">
      <DetailPageHeader
        breadcrumbs={[...]}
        title="..."
        status={{ label: '...', variant: '...' }}
        actions={<>...</>}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="..." value="..." />
          <StatCard label="..." value="..." />
          <StatCard label="..." value="..." />
          <StatCard label="..." value="..." />
        </div>

        {/* Tabs */}
        <UnderlineTabs
          tabs={TAB_CONFIG}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        <TabPanel id="overview" activeTab={activeTab}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            ...
          </div>
        </TabPanel>
      </div>
    </div>
  );
}
```

---

## Responsive Grid Rules

Always include intermediate breakpoints for smooth responsive behavior.

### 3-Column Layout

```tsx
// ❌ WRONG: Jumps from 1 to 3 columns
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

// ✅ CORRECT: Progressive 1 → 2 → 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
```

### 4-Column Stat Cards

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard ... />
  <StatCard ... />
  <StatCard ... />
  <StatCard ... />
</div>
```

### Column Spanning for Timeline

The timeline component typically spans full height in the right column:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
  <div className="space-y-8">
    <SectionCard>...</SectionCard>
    <SectionCard>...</SectionCard>
  </div>

  <div className="space-y-8">
    <SectionCard>...</SectionCard>
    <SectionCard>...</SectionCard>
  </div>

  <div className="h-full">
    <ProgressTimeline ... />
  </div>
</div>
```

---

## Status Color Mapping

Consistent status colors across the admin interface.

### Order Status

| Status | Variant | Color |
|--------|---------|-------|
| `active` | `success` | Emerald |
| `completed` | `success` | Emerald |
| `installation_completed` | `success` | Emerald |
| `installation_scheduled` | `info` | Blue |
| `installation_in_progress` | `info` | Blue |
| `payment_method_registered` | `info` | Cyan |
| `payment_method_pending` | `warning` | Amber |
| `pending` | `warning` | Amber |
| `cancelled` | `error` | Red |
| `failed` | `error` | Red |
| `suspended` | `neutral` | Slate |

### Payment Status

| Status | Variant | Color |
|--------|---------|-------|
| `paid` | `success` | Emerald |
| `pending` | `warning` | Amber |
| `partial` | `info` | Blue |
| `failed` | `error` | Red |
| `refunded` | `neutral` | Slate |

---

## Typography Tokens

| Element | Class | Font |
|---------|-------|------|
| Page Title | `text-3xl font-extrabold tracking-tight` | 30px, 800 |
| Section Title | `font-bold text-slate-900` | 14px, 700 |
| Stat Label | `text-xs font-semibold uppercase tracking-wider` | 12px, 600 |
| Stat Value | `text-lg font-bold` | 18px, 700 |
| Info Label | `text-sm text-slate-500` | 14px, 400 |
| Info Value | `text-sm font-medium text-slate-900` | 14px, 500 |

---

## Spacing Conventions

| Context | Value | Class |
|---------|-------|-------|
| Page horizontal padding | 16/24/32px | `px-4 sm:px-6 lg:px-8` |
| Page vertical padding | 16/24px | `py-4 sm:py-6` |
| Section spacing | 32px | `space-y-8` or `gap-8` |
| Card internal padding | 24px | `p-6` |
| Card header padding | 24px / 16px | `px-6 py-4` |
| Stat card padding | 20px | `p-5` |
| InfoRow vertical padding | 12px | `py-3` |

---

## Icon Usage

Use Phosphor Icons (Bold weight) consistently:

```tsx
import { PiPackageBold, PiUserBold, PiMapPinBold } from 'react-icons/pi';
```

### Common Admin Icons

| Concept | Icon |
|---------|------|
| Orders | `PiPackageBold` |
| Customer | `PiUserBold` |
| Location | `PiMapPinBold` |
| Email | `PiEnvelopeBold` |
| Phone | `PiPhoneBold` |
| Payment | `PiCreditCardBold` |
| Calendar | `PiCalendarBold` |
| Settings | `PiGearBold` |
| Export | `PiDownloadSimpleBold` |
| Print | `PiPrinterBold` |

---

## Loading States

Standard loading spinner for detail pages:

```tsx
<div className="flex items-center justify-center min-h-[60vh]">
  <div className="text-center">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      <PiPackageBold className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    </div>
    <p className="text-slate-500 mt-6 font-medium">Loading...</p>
  </div>
</div>
```

---

## Error States

Standard error display for not found:

```tsx
<div className="flex items-center justify-center min-h-[60vh]">
  <div className="text-center">
    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
      <PiWarningCircleBold className="h-10 w-10 text-red-400" />
    </div>
    <h2 className="text-xl font-bold text-slate-900 mb-2">Not Found</h2>
    <p className="text-slate-500 mb-6">Description...</p>
    <Link href="/admin/...">
      <Button>
        <PiArrowLeftBold className="h-4 w-4 mr-2" />
        Go Back
      </Button>
    </Link>
  </div>
</div>
```
