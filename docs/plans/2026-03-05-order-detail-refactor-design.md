# Order Detail Page Refactor Design

**Date:** 2026-03-05
**Status:** Approved
**Approach:** Component-by-Component Refactor (Approach A)

## Overview

Refactor the admin order detail page (`/admin/orders/[id]`) to match the new design with cleaner aesthetics, underline tabs, and improved 3-column layout.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Primary Color | CircleTel orange (#F77B00) |
| Tab Style | Underline tabs, text only (no icons) |
| Scope | Full page refactor |
| Header Actions | Grouped icon buttons + Export button |

## Files to Modify

1. `components/admin/orders/detail/OrderHeader.tsx`
2. `components/admin/orders/detail/OrderStatCards.tsx`
3. `components/admin/orders/detail/OrderOverviewTab.tsx`
4. `components/admin/orders/detail/OrderProgressTimeline.tsx`
5. `app/admin/orders/[id]/page.tsx`

---

## Section 1: Header

### Breadcrumbs
- Small text (text-xs), slate-500 color
- Chevron separators
- Current page in slate-900
- Format: `Orders > Active Orders > ORD-XXXXXXXX-XXXX`

### Title Row
- Order number: `text-3xl font-extrabold tracking-tight`
- Status badge inline with title
- Right side: Action buttons

### Action Buttons
```
[Suspend][Cancel][Email][Print]  [Export Order]
└── grouped in bordered box ──┘  └── primary btn ──┘
```

- Icon buttons: `p-2.5`, hover state, separated by subtle borders
- Grouped in `border border-slate-200 rounded-lg overflow-hidden`
- Export button: `bg-primary text-white px-5 py-2.5 rounded-lg font-bold`

---

## Section 2: Stat Cards

### Layout
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`

### Card Structure
```
┌─────────────────────┐
│ LABEL               │  text-xs uppercase tracking-wider text-slate-500
│ Value               │  text-lg font-bold text-slate-900
│ Subtitle            │  text-xs text-slate-500 or text-primary
└─────────────────────┘
```

### Four Cards
1. **Package** - Package name + speed icon subtitle
2. **Monthly Price** - Amount + "VAT Inclusive"
3. **Payment Status** - Status + pulsing dot for pending
4. **Lead Source** - Source name + campaign

### Styling
- `bg-white rounded-xl border border-slate-200 shadow-sm p-5`

---

## Section 3: Tabs

### Style
Simple underline tabs (not pills)

### Layout
```
Overview    Installation    Financials    History
────────
(orange underline on active)
```

### States
- **Active:** `text-primary border-b-2 border-primary font-bold`
- **Inactive:** `text-slate-500 border-transparent hover:text-slate-700`

### Implementation
- Container: `border-b border-slate-200`
- Nav: `flex gap-8`
- Buttons: `pb-4 border-b-2 text-sm font-medium`

---

## Section 4: Overview Tab Content

### Grid
`grid-cols-1 lg:grid-cols-3 gap-8 items-start`

### Left Column

**Customer Information Card:**
- Header with "Edit" link
- Avatar initials (size-12, rounded-full, bg-primary/10, text-primary)
- Name + Account number
- Contact info with small icons (mail, call, notifications)
- Preferences as small badges

**Installation Address Card:**
- Header with "View Map" link
- Location icon in gray box (size-16, bg-slate-100)
- Stacked address lines

### Middle Column

**Package Details Card:**
- Highlighted package box (bg-primary/5, border-primary/10, rounded-xl)
- Package name with HOT badge
- Speed and Price in 2-col grid
- Info rows: Router Status, Contract Term, Installation Fee

**Marketing & Attribution Card:**
- Icon in colored circle (bg-indigo-100, text-indigo-600)
- Lead type + conversion source

### Right Column

**Order Progress Card:**
- Vertical timeline with connecting line
- Full height (`h-full`)

---

## Section 5: Order Progress Timeline

### Step States

| State | Circle | Icon | Text |
|-------|--------|------|------|
| Completed | `bg-emerald-500` | White checkmark | `text-slate-900` |
| Active | `bg-primary ring-4 ring-white shadow-primary/40` | White icon, pulsing | `text-primary` |
| Pending | `bg-slate-200` | Gray icon | `text-slate-400` |

### Connector Line
- Position: `absolute left-[35px] top-10 bottom-10 w-0.5`
- Color: `bg-slate-200` (emerald section for completed not needed - simpler)

### Steps
1. Order Received
2. Payment Method Setup
3. Payment Confirmation
4. Installation Scheduled
5. Installation Complete
6. Service Active

### Footer
- "View Full History" button: full width, bordered, slate text

---

## Reference

- Screenshot: `.design/screenshots/image copy 24.png`
- Example HTML provided in conversation

---

## Success Criteria

- [ ] Header matches new design with grouped action buttons
- [ ] Stat cards are clean with consistent styling
- [ ] Tabs use underline style without icons
- [ ] Overview tab has proper 3-column layout
- [ ] Timeline has correct visual states
- [ ] Page remains fully functional (all existing features work)
- [ ] Responsive on mobile/tablet/desktop
