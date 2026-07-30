# CircleTel Operations Dashboard Prototype Design

## Objective

Build a standalone, responsive staff dashboard prototype at `/demo/dashboard`. The prototype combines daily operations management with executive-level commercial insight while leaving the production `/admin/dashboard` route and its data flows unchanged.

## Visual Direction

- Use the supplied Splynx dashboard screenshot as the structural reference: persistent navigation, a compact top bar, four headline metrics, a quick-actions surface, and a two-column analytical area.
- Apply CircleTel branding with the existing logo asset, CircleTel orange for the primary action and active state, navy for headings, white surfaces, and the neutral page background.
- Use Geist as the route-local interface font.
- Use a white sidebar with icon-led navigation, subtle dividers, grouped labels, and a soft orange active state.
- Use shadcn/ui composition and styling conventions. Avoid bespoke replacements for primitives that already exist.

## Information Architecture

The sidebar groups staff workflows into:

1. Dashboard
2. Customers: Customers, Sales Pipeline, Orders
3. Operations: Installations, Support Tickets, Network Health
4. Finance: Billing, Collections
5. System: Administration, Settings

The main workspace contains:

1. A top bar with search, help, notifications, and the current staff profile.
2. A welcome header with the reporting date and one primary “Create work item” action.
3. Four KPI cards: Active Customers, Monthly Revenue, Open Tickets, and Network Incidents.
4. A quick-actions card for common staff tasks.
5. A customer and revenue trend chart with a selectable reporting period.
6. A today’s-operations summary for installations, provisioning, and SLA breaches.
7. A collections-health table for collected revenue, overdue invoices, and collection rate.

## Component Architecture

- The route uses the existing demo layout and is implemented as an isolated client-side prototype.
- Existing shadcn components provide the dashboard shell and surfaces: `Sidebar`, `Sheet`, `Card`, `Button`, `Badge`, `Avatar`, `DropdownMenu`, `Tooltip`, `Chart`, and `Table`.
- The project’s installed icon library is used with a consistent outlined icon style. Icons are passed as components and are accessible through visible labels or `aria-label` text.
- Recharts renders the two-series trend visualization through the shadcn chart wrapper.
- Layout and page-specific composition remain local to the demo route so the production admin dashboard is not affected.

## Prototype Data and Interactions

- All metrics and chart values use typed, deterministic fixture data declared locally to the prototype.
- No Supabase queries, API calls, authentication checks, persistence, or production navigation changes are introduced.
- Working interactions include sidebar collapse, mobile navigation, reporting-period selection, the user menu, shortcut feedback, and chart tooltips.
- Links that represent unimplemented staff destinations remain inside the prototype and provide visible feedback instead of navigating into production workflows.

## Responsive Behavior

- Desktop: expanded white sidebar, four-column KPI row, and a wide chart beside stacked operational summaries.
- Tablet: collapsible sidebar, two-column KPI grid, and stacked analytical panels when space is constrained.
- Mobile: sidebar moves into a shadcn `Sheet`, KPI cards become a single column, quick actions wrap, and all tables remain horizontally usable without clipping primary actions.

## States and Error Handling

- Because the prototype has no remote data, network loading and API error states are outside scope.
- Operational urgency is still represented through semantic badges and concise supporting copy.
- Interactive controls expose hover, focus, selected, open, and collapsed states.
- Empty and loading states are not simulated because every prototype module uses deterministic fixture data.

## Accessibility

- Use semantic landmarks for navigation, header, main content, and complementary panels.
- All icon-only controls require accessible names and keyboard focus states.
- Color is never the only carrier of status; labels and values accompany semantic colors.
- Cards, chart labels, and tables maintain readable contrast against white and neutral surfaces.

## Verification

1. Run the project type check.
2. Open `/demo/dashboard` in a browser and inspect it at desktop and mobile widths.
3. Verify sidebar, period selector, menus, quick actions, and chart tooltips.
4. Check browser console output for runtime errors.
5. Compare the rendered desktop page against the supplied reference for hierarchy, density, alignment, and navigation proportions.

## Out of Scope

- Replacing or modifying `/admin/dashboard`.
- Real-time operational data, API integration, authentication, RBAC enforcement, or persistence.
- Implementing the sidebar destination pages.
- Changing global typography or redesigning shared production components.
