# CircleTel Operations Prototype Navigation Design

**Date:** 2026-07-13  
**Status:** Approved for implementation  
**Route:** `/demo/dashboard`

## Purpose

Replace the prototype dashboard's small illustrative navigation with the complete visible production admin navigation, reorganized around how CircleTel operations staff work. The prototype must retain its white shadcn sidebar, actual CircleTel logo, Geist typography, orange active treatment, compact icons, and prototype-only interactions.

## Source of truth

The navigation must consume the production registry in `lib/admin/feature-registry.ts` rather than copying production labels, routes, icons, or child menus into a second static fixture.

The prototype will resolve the visible super-admin items from `featureSections` and `bottomSections` through `getVisibleSections(..., { isAdmin: true })`. A route-local taxonomy will reference those production items by their stable top-level names and place each item in exactly one operations category.

If a referenced production item is missing, the taxonomy builder must throw a descriptive error during development or tests instead of silently omitting it.

## Operations-first taxonomy

### Customer & Sales

- Customers
- B2B Customers
- Corporate Clients
- Sales Engine
- Quotes
- CPQ Builder
- Contracts
- Partners
- Competitor Analysis
- Marketing

### Orders & Delivery

- Products
- Orders
- Order Fulfillment
- Field Operations
- Suppliers
- Customer Devices

### Network Operations

- B2B Feasibility
- Coverage Checker
- Coverage
- Diagnostics
- Network Management

### Finance

- Billing & Revenue
- Payments

### Compliance

- Approvals
- KYC Review
- KYB Compliance
- Document Reviews

### Platform & Admin

- Notifications
- Integrations
- CMS Management
- Orchestrator
- Users
- Settings

Dashboard remains a dedicated active item above the categorized groups.

## Sidebar behavior

- Retain the existing `Sidebar`, `SidebarGroup`, and `SidebarMenu` composition.
- Production items with children render as collapsed shadcn `Collapsible` groups.
- Expanding a group reveals every production child route in its original order and with its production icon.
- Leaf production items remain directly clickable.
- Clicking any leaf item shows the existing prototype feedback message and does not navigate away from `/demo/dashboard`.
- Parent groups toggle open or closed without triggering prototype feedback.
- Opening one group does not close another; staff may compare related menus.
- The desktop icon-collapsed state shows a tooltip for each top-level production item. Nested items are hidden while the sidebar is icon-collapsed.
- The mobile sheet uses the same full taxonomy and remains vertically scrollable.
- Existing operational badges remain only where meaningful prototype counts exist; production items do not invent counts.

## Visual treatment

- Preserve the current white sidebar, CircleTel orange active state, navy text, subtle borders, real logo, and compact density.
- Category labels use the existing uppercase tracked treatment.
- Parent rows use a right-side caret that rotates when expanded.
- Child rows use the shadcn sidebar sub-menu indentation and a quieter text color so hierarchy remains readable.
- Long labels truncate rather than widening the sidebar.
- The sidebar width and dashboard content layout remain unchanged.

## Data boundaries

Create a route-local navigation module responsible for:

1. Reading the visible production registry items.
2. Indexing top-level items by production name.
3. Applying the approved operations taxonomy.
4. Exporting the categorized navigation model for the page and tests.
5. Exposing a flat production-item list for completeness assertions.

The dashboard page owns only rendering and prototype interaction state. Production registry definitions remain untouched.

## Testing

Focused tests must prove:

- The six approved operations category labels render in order.
- Every visible production super-admin top-level item appears exactly once in the prototype taxonomy.
- No taxonomy entry references a missing production item.
- Representative nested menus preserve their complete production child labels and routes, including B2B Customers, Sales Engine, Coverage, Billing & Revenue, Integrations, and Users.
- Existing dashboard KPI and trend-data tests continue to pass.

Browser verification must confirm:

- Desktop groups expand and collapse.
- Nested items show prototype feedback without navigation.
- Icon-collapse tooltips remain available.
- The mobile sheet contains the full scrollable navigation.
- The page has no horizontal overflow at 390 px.
- No new browser console errors appear.

## Out of scope

- Changing the production admin navigation or feature registry.
- Navigating the standalone prototype into authenticated admin routes.
- Adding role-specific filtering beyond the current super-admin-visible production set.
- Adding counts or live data to production menu items.
- Redesigning dashboard content outside the sidebar.

