import type { ConsoleNavItem, DataTableSortState } from './console-types';

function hrefMatches(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isConsoleNavItemActive(pathname: string, item: ConsoleNavItem): boolean {
  const selfActive = item.href ? hrefMatches(pathname, item.href, item.exact) : false;
  const childActive = item.children?.some((child) => isConsoleNavItemActive(pathname, child)) ?? false;

  return selfActive || childActive;
}

export function flattenConsoleNavItems(items: ConsoleNavItem[]): ConsoleNavItem[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenConsoleNavItems(item.children) : [])]);
}

export function getNextDataTableSort(
  current: DataTableSortState | null,
  columnId: string
): DataTableSortState | null {
  if (!current || current.columnId !== columnId) {
    return { columnId, direction: 'desc' };
  }

  if (current.direction === 'desc') {
    return { columnId, direction: 'asc' };
  }

  return null;
}
