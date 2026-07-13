import {
  bottomSections,
  featureSections,
  getVisibleSections,
  type NavItem,
} from '@/lib/admin/feature-registry';

export interface OperationsNavigationSection {
  label: string;
  items: NavItem[];
}

const categoryAssignments = [
  {
    label: 'Customer & Sales',
    itemNames: [
      'Customers',
      'B2B Customers',
      'Corporate Clients',
      'Sales Engine',
      'Quotes',
      'CPQ Builder',
      'Contracts',
      'Partners',
      'Competitor Analysis',
      'Marketing',
    ],
  },
  {
    label: 'Orders & Delivery',
    itemNames: [
      'Products',
      'Orders',
      'Order Fulfillment',
      'Field Operations',
      'Suppliers',
      'Customer Devices',
    ],
  },
  {
    label: 'Network Operations',
    itemNames: [
      'B2B Feasibility',
      'Coverage Checker',
      'Coverage',
      'Diagnostics',
      'Network Management',
    ],
  },
  {
    label: 'Finance',
    itemNames: ['Billing & Revenue', 'Payments'],
  },
  {
    label: 'Compliance',
    itemNames: [
      'Approvals',
      'KYC Review',
      'KYB Compliance',
      'Document Reviews',
    ],
  },
  {
    label: 'Platform & Admin',
    itemNames: [
      'Notifications',
      'Integrations',
      'CMS Management',
      'Orchestrator',
      'Users',
      'Settings',
    ],
  },
];

export const visibleProductionNavigationItems = getVisibleSections(
  [...featureSections, ...bottomSections],
  { isAdmin: true }
)
  .flatMap((section) => section.items)
  .filter((item) => item.name !== 'Dashboard');

export function assertUniqueProductionNavigationItemNames(
  items: ReadonlyArray<Pick<NavItem, 'name'>>
): void {
  const seenNames = new Set<string>();
  const duplicateNames = new Set<string>();

  for (const item of items) {
    if (seenNames.has(item.name)) {
      duplicateNames.add(item.name);
    }

    seenNames.add(item.name);
  }

  if (duplicateNames.size > 0) {
    throw new Error(
      `Operations navigation has duplicate visible production item names: ${[
        ...duplicateNames,
      ].join(', ')}`
    );
  }
}

assertUniqueProductionNavigationItemNames(visibleProductionNavigationItems);

const assignedProductionItemNames = categoryAssignments.flatMap(
  (section) => section.itemNames
);
const seenAssignmentNames = new Set<string>();
const duplicateAssignmentNames = new Set<string>();

for (const name of assignedProductionItemNames) {
  if (seenAssignmentNames.has(name)) {
    duplicateAssignmentNames.add(name);
  }

  seenAssignmentNames.add(name);
}

if (duplicateAssignmentNames.size > 0) {
  throw new Error(
    `Operations navigation assigns production items more than once: ${[
      ...duplicateAssignmentNames,
    ].join(', ')}`
  );
}

const unassignedProductionItemNames = visibleProductionNavigationItems
  .map((item) => item.name)
  .filter((name) => !seenAssignmentNames.has(name));

if (unassignedProductionItemNames.length > 0) {
  throw new Error(
    `Operations navigation has unassigned visible production items: ${unassignedProductionItemNames.join(
      ', '
    )}`
  );
}

const productionItemsByName = new Map(
  visibleProductionNavigationItems.map((item) => [item.name, item])
);

function requireProductionItem(name: string): NavItem {
  const item = productionItemsByName.get(name);

  if (!item) {
    throw new Error(
      `Operations navigation references missing production item: ${name}`
    );
  }

  return item;
}

export const dashboardNavigation: OperationsNavigationSection[] =
  categoryAssignments.map(({ label, itemNames }) => ({
    label,
    items: itemNames.map(requireProductionItem),
  }));
