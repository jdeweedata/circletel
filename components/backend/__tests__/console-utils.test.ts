import {
  flattenConsoleNavItems,
  getNextDataTableSort,
  isConsoleNavItemActive,
} from '@/components/backend/console-utils';
import type { ConsoleNavItem } from '@/components/backend/console-types';

const navItems: ConsoleNavItem[] = [
  { label: 'Dashboard', href: '/admin', exact: true },
  {
    label: 'Customers',
    href: '/admin/customers',
    children: [
      { label: 'All Customers', href: '/admin/customers', exact: true },
      { label: 'Billing', href: '/admin/customers/billing' },
    ],
  },
];

describe('console backend utilities', () => {
  it('treats exact nav items as exact matches only', () => {
    expect(isConsoleNavItemActive('/admin', navItems[0])).toBe(true);
    expect(isConsoleNavItemActive('/admin/dashboard', navItems[0])).toBe(false);
  });

  it('treats parent nav items as active when a child route matches', () => {
    expect(isConsoleNavItemActive('/admin/customers/billing/overdue', navItems[1])).toBe(true);
    expect(isConsoleNavItemActive('/admin/products', navItems[1])).toBe(false);
  });

  it('flattens nested nav items for command/search surfaces', () => {
    expect(flattenConsoleNavItems(navItems)).toEqual([
      expect.objectContaining({ label: 'Dashboard', href: '/admin' }),
      expect.objectContaining({ label: 'Customers', href: '/admin/customers' }),
      expect.objectContaining({ label: 'All Customers', href: '/admin/customers' }),
      expect.objectContaining({ label: 'Billing', href: '/admin/customers/billing' }),
    ]);
  });

  it('cycles sortable table state from desc to asc to cleared', () => {
    expect(getNextDataTableSort(null, 'created_at')).toEqual({
      columnId: 'created_at',
      direction: 'desc',
    });
    expect(getNextDataTableSort({ columnId: 'created_at', direction: 'desc' }, 'created_at')).toEqual({
      columnId: 'created_at',
      direction: 'asc',
    });
    expect(getNextDataTableSort({ columnId: 'created_at', direction: 'asc' }, 'created_at')).toBeNull();
  });
});
