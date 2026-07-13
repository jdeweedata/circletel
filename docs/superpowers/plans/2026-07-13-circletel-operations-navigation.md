# CircleTel Operations Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the prototype's static sidebar menu with the complete visible production admin navigation, reorganized into six operations-first categories with working nested shadcn groups.

**Architecture:** Add a route-local adapter that reads `lib/admin/feature-registry.ts`, indexes visible super-admin items, and applies the approved category assignments without duplicating production labels, routes, icons, or children. Keep `page.tsx` responsible for rendering and prototype interaction state, using shadcn Collapsible and Sidebar sub-menu primitives.

**Tech Stack:** Next.js 15 App Router, React, TypeScript, Tailwind CSS, shadcn/ui Sidebar and Collapsible, react-icons/Phosphor, Jest, agent-browser.

---

## File Structure

- Create `app/demo/dashboard/navigation.ts`: production-registry adapter and approved operations taxonomy.
- Create `app/demo/dashboard/__tests__/navigation.test.ts`: completeness, uniqueness, ordering, and representative nested-route tests.
- Modify `app/demo/dashboard/__tests__/page.test.ts`: keep page-data tests focused on KPIs and trends.
- Modify `app/demo/dashboard/page.tsx`: render full nested navigation.
- Modify `design-qa.md`: record desktop/mobile navigation verification.

### Task 1: Add failing navigation contract tests

**Files:**
- Create: `app/demo/dashboard/__tests__/navigation.test.ts`
- Modify: `app/demo/dashboard/__tests__/page.test.ts`

- [ ] **Step 1: Remove the old static-navigation assertion**

Change the page test import to:

```ts
import { dashboardKpis, getDashboardTrendData } from '../page';
```

Delete the test named `groups the approved staff navigation areas`. Keep the KPI and trend tests unchanged.

- [ ] **Step 2: Write the failing adapter tests**

Create `app/demo/dashboard/__tests__/navigation.test.ts`:

```ts
import { hasChildren } from '@/lib/admin/feature-registry';
import {
  dashboardNavigation,
  visibleProductionNavigationItems,
} from '../navigation';

describe('CircleTel operations navigation taxonomy', () => {
  it('uses the approved categories in order', () => {
    expect(dashboardNavigation.map((section) => section.label)).toEqual([
      'Customer & Sales',
      'Orders & Delivery',
      'Network Operations',
      'Finance',
      'Compliance',
      'Platform & Admin',
    ]);
  });

  it('includes every visible production item exactly once', () => {
    const categorizedNames = dashboardNavigation.flatMap((section) =>
      section.items.map((item) => item.name)
    );
    const productionNames = visibleProductionNavigationItems.map(
      (item) => item.name
    );

    expect(new Set(categorizedNames).size).toBe(categorizedNames.length);
    expect(categorizedNames.toSorted()).toEqual(productionNames.toSorted());
  });

  it.each([
    ['B2B Customers', 'Document Vetting', '/admin/b2b/vetting'],
    ['Sales Engine', 'Pipeline', '/admin/sales-engine/pipeline'],
    ['Coverage', 'Base Stations', '/admin/coverage/base-stations'],
    ['Billing & Revenue', 'Invoices', '/admin/billing/invoices'],
    ['Integrations', 'API Health', '/admin/integrations/apis'],
    ['Users', 'Roles & Permissions', '/admin/users/roles'],
  ])('preserves the %s child %s', (parentName, childName, href) => {
    const item = dashboardNavigation
      .flatMap((section) => section.items)
      .find((candidate) => candidate.name === parentName);

    expect(item).toBeDefined();
    expect(item && hasChildren(item) ? item.children : []).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: childName, href }),
      ])
    );
  });
});
```

- [ ] **Step 3: Run the tests and verify the expected failure**

Run:

```bash
npm test -- app/demo/dashboard/__tests__/page.test.ts app/demo/dashboard/__tests__/navigation.test.ts --runInBand
```

Expected: `navigation.test.ts` fails with `Cannot find module '../navigation'`; the remaining page tests pass.

- [ ] **Step 4: Commit the red tests**

```bash
git add app/demo/dashboard/__tests__/page.test.ts app/demo/dashboard/__tests__/navigation.test.ts
git commit -m "test: define operations navigation contract"
```

### Task 2: Build the production registry adapter

**Files:**
- Create: `app/demo/dashboard/navigation.ts`
- Test: `app/demo/dashboard/__tests__/navigation.test.ts`

- [ ] **Step 1: Implement the approved category map**

Create `app/demo/dashboard/navigation.ts`:

```ts
import {
  bottomSections,
  featureSections,
  getVisibleSections,
  type NavItem,
} from '@/lib/admin/feature-registry';

interface OperationsNavigationSection {
  label: string;
  items: NavItem[];
}

const categoryAssignments = [
  {
    label: 'Customer & Sales',
    itemNames: [
      'Customers', 'B2B Customers', 'Corporate Clients', 'Sales Engine',
      'Quotes', 'CPQ Builder', 'Contracts', 'Partners',
      'Competitor Analysis', 'Marketing',
    ],
  },
  {
    label: 'Orders & Delivery',
    itemNames: [
      'Products', 'Orders', 'Order Fulfillment', 'Field Operations',
      'Suppliers', 'Customer Devices',
    ],
  },
  {
    label: 'Network Operations',
    itemNames: [
      'B2B Feasibility', 'Coverage Checker', 'Coverage', 'Diagnostics',
      'Network Management',
    ],
  },
  { label: 'Finance', itemNames: ['Billing & Revenue', 'Payments'] },
  {
    label: 'Compliance',
    itemNames: [
      'Approvals', 'KYC Review', 'KYB Compliance', 'Document Reviews',
    ],
  },
  {
    label: 'Platform & Admin',
    itemNames: [
      'Notifications', 'Integrations', 'CMS Management', 'Orchestrator',
      'Users', 'Settings',
    ],
  },
] as const;

const visibleSections = getVisibleSections(
  [...featureSections, ...bottomSections],
  { isAdmin: true }
);

export const visibleProductionNavigationItems = visibleSections.flatMap(
  (section) => section.items
);

const productionItemByName = new Map(
  visibleProductionNavigationItems.map((item) => [item.name, item])
);

function requireProductionItem(name: string): NavItem {
  const item = productionItemByName.get(name);
  if (!item) {
    throw new Error(
      `Operations navigation references missing production item: ${name}`
    );
  }
  return item;
}

export const dashboardNavigation: OperationsNavigationSection[] =
  categoryAssignments.map((section) => ({
    label: section.label,
    items: section.itemNames.map(requireProductionItem),
  }));
```

- [ ] **Step 2: Run the focused tests**

Run:

```bash
npm test -- app/demo/dashboard/__tests__/page.test.ts app/demo/dashboard/__tests__/navigation.test.ts --runInBand
```

Expected: both suites pass; every visible production top-level item is present once and representative children retain production routes.

- [ ] **Step 3: Run scoped TypeScript validation**

Ensure `/tmp/circletel-dashboard-tsconfig.json` includes `navigation.ts`, `page.tsx`, and `layout.tsx`, then run:

```bash
node --max-old-space-size=4096 ../../node_modules/typescript/bin/tsc -p /tmp/circletel-dashboard-tsconfig.json
```

Expected: exit 0 with no diagnostics.

- [ ] **Step 4: Commit the adapter**

```bash
git add app/demo/dashboard/navigation.ts
git commit -m "feat: map production admin navigation for operations"
```

### Task 3: Render complete nested shadcn navigation

**Files:**
- Modify: `app/demo/dashboard/page.tsx`

- [ ] **Step 1: Replace static navigation imports and types**

Remove `NavigationItem`, `NavigationSection`, and the static `dashboardNavigation` fixture. Import:

```tsx
import { PiCaretRightBold } from 'react-icons/pi';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { hasChildren } from '@/lib/admin/feature-registry';
import { dashboardNavigation } from './navigation';
```

- [ ] **Step 2: Add independent expansion state**

At the start of `OperationsSidebar`, add:

```tsx
const [expandedItems, setExpandedItems] = useState<string[]>([]);

const setItemExpanded = (name: string, expanded: boolean) => {
  setExpandedItems((current) =>
    expanded
      ? [...new Set([...current, name])]
      : current.filter((itemName) => itemName !== name)
  );
};
```

- [ ] **Step 3: Render nested production groups**

Replace the existing `section.items.map` body with:

```tsx
{section.items.map((item) =>
  hasChildren(item) ? (
    <Collapsible
      key={item.name}
      asChild
      open={expandedItems.includes(item.name)}
      onOpenChange={(expanded) => setItemExpanded(item.name, expanded)}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.name}
            className="h-9 text-ui-text-secondary hover:text-circleTel-navy"
          >
            <item.icon />
            <span className="truncate">{item.name}</span>
            <PiCaretRightBold className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => (
              <SidebarMenuSubItem key={`${child.name}-${child.href}`}>
                <SidebarMenuSubButton
                  href={child.href}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(child.name);
                  }}
                  className="text-ui-text-secondary hover:text-circleTel-navy"
                >
                  <child.icon />
                  <span>{child.name}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  ) : (
    <SidebarMenuItem key={item.name}>
      <SidebarMenuButton
        tooltip={item.name}
        onClick={() => onNavigate(item.name)}
        className="h-9 text-ui-text-secondary hover:text-circleTel-navy"
      >
        <item.icon />
        <span className="truncate">{item.name}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
)}
```

Remove the illustrative count badges from the old fixture.

- [ ] **Step 4: Run tests and TypeScript validation**

Run:

```bash
npm test -- app/demo/dashboard/__tests__/page.test.ts app/demo/dashboard/__tests__/navigation.test.ts --runInBand
node --max-old-space-size=4096 ../../node_modules/typescript/bin/tsc -p /tmp/circletel-dashboard-tsconfig.json
```

Expected: both suites pass and TypeScript exits 0.

- [ ] **Step 5: Commit the nested UI**

```bash
git add app/demo/dashboard/page.tsx
git commit -m "feat: render full operations navigation hierarchy"
```

### Task 4: Browser verification and design QA

**Files:**
- Modify: `design-qa.md`

- [ ] **Step 1: Verify desktop behavior**

At 1440 × 1000, confirm the six categories appear in order; B2B Customers, Sales Engine, Coverage, Billing & Revenue, Integrations, and Users expand independently; child labels match production; child clicks keep `/demo/dashboard` active and show prototype feedback; icon collapse hides children and preserves top-level tooltips.

- [ ] **Step 2: Verify mobile behavior**

At 390 × 844, open the sheet, expand B2B Customers and Integrations, scroll through Platform & Admin, and confirm the full menu remains reachable. Evaluate:

```js
({
  clientWidth: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
  overflow:
    document.documentElement.scrollWidth >
    document.documentElement.clientWidth,
})
```

Expected: `clientWidth` and `scrollWidth` are 390 and `overflow` is false.

- [ ] **Step 3: Check browser errors and capture evidence**

Clear the console, repeat one desktop and mobile expansion, then inspect page errors and console output. Expected: no route-specific runtime or accessibility errors.

Capture:

```text
/root/.codex/visualizations/2026/07/13/019f5a1d-0ac3-79c1-9666-907b9757a42e/circletel-operations-navigation-desktop.png
/root/.codex/visualizations/2026/07/13/019f5a1d-0ac3-79c1-9666-907b9757a42e/circletel-operations-navigation-mobile.png
```

- [ ] **Step 4: Update design QA**

Append a `Navigation refinement` section to `design-qa.md` with the production registry source, six categories, completeness test result, screenshot paths, P0/P1/P2 findings and fixes, and `final result: passed` only when no P0/P1/P2 issue remains.

- [ ] **Step 5: Run final verification**

```bash
npm test -- app/demo/dashboard/__tests__/page.test.ts app/demo/dashboard/__tests__/navigation.test.ts --runInBand
node --max-old-space-size=4096 ../../node_modules/typescript/bin/tsc -p /tmp/circletel-dashboard-tsconfig.json
git diff --check
```

Expected: two test suites pass, scoped TypeScript exits 0, and `git diff --check` exits 0.

- [ ] **Step 6: Commit QA documentation**

```bash
git add design-qa.md
git commit -m "docs: verify operations navigation refinement"
```
