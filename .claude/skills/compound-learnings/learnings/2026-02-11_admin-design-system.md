# Admin "Sophisticated Enterprise" Design System

**Date:** 2026-02-11
**Category:** Frontend Design Pattern
**Impact:** High - Reduces admin page development time by ~30 min per page

## Overview

A cohesive design language for CircleTel admin detail pages featuring gradient backgrounds, color-coded sections, and consistent component patterns.

## Core Elements

### 1. Page Background

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 relative">
  {/* Subtle crosshatch pattern */}
  <div
    className="absolute inset-0 opacity-[0.015] pointer-events-none"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    }}
  />
  <div className="relative z-10 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
    {/* Content */}
  </div>
</div>
```

### 2. StatCard Component

```tsx
function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  trend,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  trend?: { label: string; positive?: boolean };
}) {
  return (
    <div className="group relative bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight truncate">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs flex items-center gap-1 mt-1", trend.positive ? "text-emerald-600" : "text-slate-500")}>
              {trend.positive && <TrendingUp className="w-3 h-3" />}
              {trend.label}
            </p>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 flex-shrink-0", iconBg)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
```

**Icon Background Options:**
- Orange: `bg-gradient-to-br from-orange-500 to-orange-600`
- Green: `bg-gradient-to-br from-emerald-500 to-green-600`
- Blue: `bg-gradient-to-br from-blue-500 to-indigo-600`
- Violet: `bg-gradient-to-br from-violet-500 to-purple-600`
- Amber: `bg-gradient-to-br from-amber-500 to-orange-500`

### 3. SectionCard Component

```tsx
function SectionCard({
  icon: Icon,
  title,
  subtitle,
  badge,
  action,
  children,
  headerGradient = "from-slate-50 to-white",
  iconGradient = "from-slate-600 to-slate-800",
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  headerGradient?: string;
  iconGradient?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className={cn("p-5 border-b border-slate-100 bg-gradient-to-r", headerGradient)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", iconGradient)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {action}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
```

### 4. Color-Coded Section Headers

| Section Type | Header Gradient | Icon Gradient |
|-------------|-----------------|---------------|
| Customer/User | `from-blue-50 to-white` | `from-blue-500 to-indigo-600` |
| KYC/Verified | `from-emerald-50 to-white` | `from-emerald-500 to-green-600` |
| Package/Product | `from-orange-50 to-white` | `from-orange-500 to-orange-600` |
| Analytics/Source | `from-violet-50 to-white` | `from-violet-500 to-purple-600` |
| Timeline/History | `from-cyan-50 to-white` | `from-cyan-500 to-blue-600` |
| Address/Location | `from-amber-50 to-white` | `from-amber-500 to-orange-500` |
| Payment/Financial | `from-green-50 to-white` | `from-green-500 to-emerald-600` |
| Default/Generic | `from-slate-50 to-white` | `from-slate-500 to-slate-700` |

### 5. InfoRow Component

```tsx
function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0", className)}>
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right">{value || '—'}</span>
    </div>
  );
}
```

### 6. Tab Styling

```tsx
<TabsList className="bg-white shadow-sm border border-slate-100 p-1 rounded-xl w-full grid grid-cols-4 gap-1">
  <TabsTrigger
    value="overview"
    className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-4 py-2.5 transition-all"
  >
    <Eye className="w-4 h-4 mr-2" />
    Overview
  </TabsTrigger>
  {/* More triggers... */}
</TabsList>
```

### 7. Header Pattern

```tsx
<div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
  <div className="flex items-start gap-4">
    <Link
      href="/admin/corporate"
      className="mt-1 p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-slate-900 hover:shadow-md transition-all"
    >
      <ArrowLeft size={20} />
    </Link>
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 font-serif tracking-tight">
          {title}
        </h1>
        <span className="font-mono text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
          {code}
        </span>
        <Badge className={cn(statusConfig.bg, statusConfig.text, "border-0 font-semibold")}>
          {statusConfig.label}
        </Badge>
      </div>
      <p className="text-slate-500">{subtitle}</p>
    </div>
  </div>
  {/* Action buttons */}
</div>
```

### 8. Loading State

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
        <Icon className="w-6 h-6 text-orange-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-slate-500 mt-6 font-medium">Loading...</p>
    </div>
  </div>
</div>
```

## Applied To

- `/admin/corporate` - List page
- `/admin/corporate/new` - Create page
- `/admin/corporate/[id]` - Detail page
- `/admin/corporate/[id]/sites/[siteId]` - Site edit page
- `/admin/orders/[id]` - Order detail page

## Future Extraction

These components should be extracted to shared files:
- `components/admin/shared/StatCard.tsx`
- `components/admin/shared/SectionCard.tsx`
- `components/admin/shared/InfoRow.tsx`
- `components/admin/shared/PageBackground.tsx`
- `components/admin/shared/LoadingState.tsx`

## Key Principles

1. **Consistent spacing**: Use `space-y-8` between major sections, `space-y-6` within sections
2. **Rounded corners**: Use `rounded-2xl` for cards, `rounded-xl` for inner elements
3. **Shadows**: `shadow-sm` default, `shadow-lg` on hover
4. **Transitions**: Always include `transition-all duration-300` for smooth interactions
5. **CircleTel Orange**: Use `#F5831F` / `orange-500` as primary accent
