# CircleTel UI/UX Redesign - Design Document

**Date:** 2026-02-27
**Status:** Approved
**Approach:** Page-by-Purpose (JTBD-focused)
**Timeline:** 8-12 weeks estimated

---

## Context

CircleTel's platform has grown organically across multiple user types (Admin, Consumer, Partner, B2B, Public). This has resulted in:

- **Too many clicks** to complete common tasks
- **Inconsistent design** across sections (feels like different apps)
- **Information overload** on most pages
- **Poor mobile experience** (desktop-first design)
- **No location awareness** despite being location-dependent service

### Goal

Create a **minimalist, JTBD-focused** platform where every page serves one clear purpose, users can complete tasks with minimal friction, and the experience adapts to user context (location, role, state).

### Scope

All user-facing sections:
1. Public Website (marketing, services)
2. Order Flow (coverage → payment)
3. Consumer Dashboard (B2C customers)
4. Partner Portal (resellers)
5. Admin Panel (internal staff)

---

## Core Design Principles

### The "One Job" Framework

Every page follows this structure:

```
┌─────────────────────────────────────────────────┐
│  HEADER: Where am I? + Quick escape             │
├─────────────────────────────────────────────────┤
│  PRIMARY JOB: The ONE thing this page does      │
│  (Takes 70-80% of visual weight)                │
├─────────────────────────────────────────────────┤
│  SECONDARY: Related actions (collapsed/tabbed)  │
└─────────────────────────────────────────────────┘
```

### Design Tokens

Retain CircleTel brand, simplify application:

| Token | Value | Use |
|-------|-------|-----|
| **Primary** | `#F5841E` | CTAs, focus states, brand accents |
| **Background** | `#F9FAFB` | Page backgrounds |
| **Surface** | `#FFFFFF` | Cards, modals, inputs |
| **Text** | `#111827` | Primary text |
| **Muted** | `#6B7280` | Secondary/helper text |
| **Border** | `#E5E7EB` | Dividers, input borders |

### Spacing Scale (Mobile-First)

```
4px  → tight (icon padding)
8px  → compact (inline elements)
16px → default (card padding, gaps)
24px → section gaps
32px → major sections
```

### Typography (Poppins)

| Style | Size | Weight | Use |
|-------|------|--------|-----|
| **Page Title** | 24px | 600 | Page headers |
| **Section** | 18px | 600 | Section headers |
| **Body** | 14px | 400 | Default text |
| **Small** | 12px | 400 | Captions, metadata |

### Location-Aware Pattern

Auto-detect user location on entry and adapt content:

```typescript
const { region, city, coordinates } = useGeolocation();
// Show services available in user's area
// Pre-fill coverage check with detected location
// Display region-specific pricing/availability
```

---

## Section Designs

### 1. Public Website & Order Flow

#### Homepage

**Primary Job:** Start coverage check

- Location detection shown prominently ("Detecting: Johannesburg")
- Single address input as hero element
- Trust badges below fold
- "Or browse: Fibre | Wireless | Business" as secondary

#### Order Flow

**Reduce from 5+ steps to 3:**

| Current | Proposed |
|---------|----------|
| Coverage Check | Step 1: Coverage Check |
| Package Selection | Step 2: Select & Configure |
| Account Creation | (Combined into Step 2) |
| Service Address | (Pre-filled from Step 1) |
| Installation Scheduling | (Combined into Step 2) |
| Payment | Step 3: Pay (inline, no redirect) |

**Key changes:**
- Smart package recommendations based on coverage results
- Inline account creation + payment on same page
- Address captured once, never re-entered

#### Service Pages

Structure: Hero (benefit + CTA) → How It Works (3 steps) → Packages (2-3 options) → FAQ (3-4 questions)

---

### 2. Consumer Dashboard

#### Dashboard Home

**Primary Job:** See status & take action

- **One service card** as hero (most customers have 1 service)
- **Payment status** immediately visible
- **3 quick actions** max (Invoices, Settings, Support)
- **Contextual actions** on service card

#### Navigation

**Collapse by default:**
- Mobile: Hamburger menu
- Desktop: Horizontal nav (Dashboard | Services | Billing | Support)

#### Key Pages

| Page | Primary Job | Design |
|------|-------------|--------|
| Dashboard | See service status | Single service card + next payment |
| Services | Manage service | Service details + upgrade/downgrade |
| Billing | Pay or view history | Current balance + invoice list |
| Support | Get help | Ticket list + "Report issue" CTA |

---

### 3. Partner Portal

#### Dashboard

**Primary Job:** See performance & create quotes

- **"Create Quote" CTA** always visible (top-right)
- **3 metrics only:** Quotes Sent, Revenue, Converted
- **Recent quotes** with quick actions
- **Compliance status** collapsed but visible

#### Quote Creation

**3-step wizard:**
1. Customer Info (company, contact, email, phone)
2. Coverage Check (add sites, check availability)
3. Package Selection & Send (recommend packages, preview, send)

#### Navigation

**4 items only:**
- Dashboard
- Quotes
- Customers
- Commissions

(Resources moved to footer, Compliance moved to profile)

---

### 4. Admin Panel

#### Dashboard

**Primary Job:** See what needs attention

- **"Needs attention" queue** (orders pending payment, installations to schedule, partner approvals)
- **4 key metrics** (Orders, Revenue, Installations, Support tickets)
- **Quick actions** (New Order, New Quote, Customer Lookup, Reports)
- **Role-aware:** Different users see relevant queues

#### Navigation

**Collapse 26 items into 6 sections:**

| Section | Contains |
|---------|----------|
| Dashboard | Overview, action queue |
| Orders | List, Installations, Technicians |
| Customers | B2C, B2B, Corporate |
| Billing | Invoices, Payments, Cron Logs |
| Quotes & CPQ | Quotes, CPQ, Products |
| Coverage | Maps, Base Stations, Analytics |
| Settings | Users, Integrations, System |

Each section expands on click to reveal sub-items.

#### Command Palette (New)

Global search (Cmd+K / Ctrl+K) to find:
- Customers by name, account number, email
- Orders by number
- Quotes by number
- Products by name

**One search finds everything** - no navigating to different sections.

#### Order Detail

**Tab-based interface:**
- Overview (customer, package, source)
- Installation (technician, schedule, address)
- Billing (payment, invoice, method)
- History (timeline, notes)

Persistent header with order summary always visible.

---

## Mobile Considerations

### All Sections

- Touch targets minimum 44x44px
- Single-column layouts on mobile
- Bottom sheet modals instead of center modals
- Sticky headers with back navigation
- Pull-to-refresh on lists

### Consumer Dashboard

- Bottom navigation bar (Dashboard | Services | Billing | Support)
- Swipe actions on list items

### Admin Panel

- Hamburger menu for navigation
- Collapsible tables → card view on mobile
- Simplified command palette (tap search icon)

---

## Implementation Phases

### Phase 1: Foundation (2 weeks)
- Update design tokens in Tailwind
- Create shared layout components
- Implement command palette for admin
- Mobile navigation patterns

### Phase 2: Public Site & Order Flow (3 weeks)
- Redesign homepage with location detection
- Consolidate order flow to 3 steps
- Service page templates

### Phase 3: Consumer Dashboard (2 weeks)
- Dashboard home redesign
- Billing page simplification
- Mobile bottom nav

### Phase 4: Partner Portal (2 weeks)
- Dashboard with quote focus
- 3-step quote wizard
- Simplified navigation

### Phase 5: Admin Panel (3 weeks)
- Action-queue dashboard
- Collapsed navigation
- Order detail tabs
- Role-based views

### Phase 6: Polish & Testing (2 weeks)
- Cross-browser testing
- Mobile device testing
- Performance optimization
- A11y audit

---

## Files to Modify

### Design System
- `tailwind.config.ts` - Update tokens
- `app/globals.css` - Typography classes
- `lib/design-system/` - Create if not exists

### Shared Components
- `components/ui/` - Update base components
- `components/shared/CommandPalette.tsx` - New
- `components/shared/BottomNav.tsx` - New

### Public Site
- `app/page.tsx` - Homepage redesign
- `app/order/` - Consolidate order flow
- `components/order/` - Simplify components

### Consumer Dashboard
- `app/dashboard/` - All pages
- `components/dashboard/navigation/` - Simplify

### Partner Portal
- `app/partner/` - All pages
- `components/partners/` - Simplify

### Admin Panel
- `app/admin/` - All pages
- `components/admin/layout/` - New sidebar
- `components/admin/dashboard/` - Action queue

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Order completion rate | TBD | +20% |
| Avg clicks to complete order | ~12 | <6 |
| Mobile bounce rate | TBD | -30% |
| Admin task completion time | TBD | -40% |
| Customer support tickets (UI confusion) | TBD | -50% |

---

## Next Steps

1. Create detailed implementation plan (use writing-plans skill)
2. Design mockups for key pages (Figma/code prototypes)
3. User testing with current customers
4. Phased rollout starting with public site

---

**Approved by:** User (2026-02-27)
**Design approach:** Page-by-Purpose, JTBD-focused, minimalist
