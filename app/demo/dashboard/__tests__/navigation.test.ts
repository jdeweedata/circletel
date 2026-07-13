import { hasChildren } from '@/lib/admin/feature-registry';
import {
  dashboardNavigation,
  visibleProductionNavigationItems,
} from '../navigation';

describe('CircleTel operations dashboard navigation', () => {
  it('groups production navigation into the approved operations taxonomy', () => {
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

    expect(item).toBeDefined();
    expect(item && hasChildren(item)).toBe(true);

    if (!item || !hasChildren(item)) {
      throw new Error(`Expected ${itemName} to have children`);
    }

    expect(item.children.find((child) => child.name === childName)?.href).toBe(
      href
    );
  });
});
