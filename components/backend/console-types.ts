import type React from 'react';
import type { IconType } from 'react-icons';

export interface ConsoleNavItem {
  label: string;
  href?: string;
  icon?: IconType;
  badge?: string | number;
  disabled?: boolean;
  exact?: boolean;
  description?: string;
  children?: ConsoleNavItem[];
}

export interface ConsoleNavSection {
  label?: string | null;
  items: ConsoleNavItem[];
}

export type DataTableSortDirection = 'asc' | 'desc';

export interface DataTableSortState {
  columnId: string;
  direction: DataTableSortDirection;
}

export interface DataTableColumn<T> {
  id: string;
  header: React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
}
