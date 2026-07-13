import { hasChildren } from '@/lib/admin/feature-registry';
import {
  assertUniqueProductionNavigationItemNames,
  dashboardNavigation,
  visibleProductionNavigationItems,
} from '../navigation';

describe('CircleTel operations dashboard navigation', () => {
  it('groups production navigation into the approved operations taxonomy', () => {
    expect(
      dashboardNavigation.map((section) => ({
        label: section.label,
        itemNames: section.items.map((item) => item.name),
      }))
    ).toEqual([
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
    ]);
  });

  it('includes every visible production item exactly once', () => {
    const categorizedItemNames = dashboardNavigation.flatMap((section) =>
      section.items.map((item) => item.name)
    );
    const visibleItemNames = visibleProductionNavigationItems.map(
      (item) => item.name
    );

    expect([...categorizedItemNames].sort()).toEqual(
      [...visibleItemNames].sort()
    );
    expect(new Set(categorizedItemNames).size).toBe(categorizedItemNames.length);
  });

  it('rejects duplicate visible production item names before lookup construction', () => {
    expect(() =>
      assertUniqueProductionNavigationItemNames([
        { name: 'Customers' },
        { name: 'Orders' },
        { name: 'Customers' },
      ])
    ).toThrow(
      'Operations navigation has duplicate visible production item names: Customers'
    );
  });

  it.each([
    ['B2B Customers', 'Document Vetting', '/admin/b2b/vetting'],
    ['Sales Engine', 'Pipeline', '/admin/sales-engine/pipeline'],
    ['Coverage', 'Base Stations', '/admin/coverage/base-stations'],
    ['Billing & Revenue', 'Invoices', '/admin/billing/invoices'],
    ['Integrations', 'API Health', '/admin/integrations/apis'],
    ['Users', 'Roles & Permissions', '/admin/users/roles'],
  ])('keeps %s / %s routed to %s', (itemName, childName, href) => {
    const item = dashboardNavigation
      .flatMap((section) => section.items)
      .find((candidate) => candidate.name === itemName);
    const productionItem = visibleProductionNavigationItems.find(
      (candidate) => candidate.name === itemName
    );

    expect(item).toBeDefined();
    expect(productionItem).toBeDefined();
    expect(item).toBe(productionItem);
    expect(item && hasChildren(item)).toBe(true);

    if (!item || !hasChildren(item)) {
      throw new Error(`Expected ${itemName} to have children`);
    }

    expect(item.children.find((child) => child.name === childName)?.href).toBe(
      href
    );
  });
});
