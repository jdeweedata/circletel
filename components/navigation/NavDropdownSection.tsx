'use client';

import { cn } from '@/lib/utils';
import { NavDropdownItem, type NavItem } from './NavDropdownItem';

interface NavDropdownSectionProps {
  items: NavItem[];
  columns?: 1 | 2;
  align?: 'left' | 'right';
  isActive: (path: string) => boolean;
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  /** Optional: Extra items to prepend (like "Overview" links) */
  prependItems?: NavItem[];
}

export function NavDropdownSection({
  items,
  columns = 2,
  align = 'left',
  isActive,
  onNavigate,
  prependItems,
}: NavDropdownSectionProps) {
  const widthClass = columns === 2
    ? 'w-[320px] md:w-[400px] lg:w-[500px]'
    : 'w-[280px]';

  const gridClass = columns === 2
    ? 'md:grid-cols-2'
    : '';

  const allItems = [...(prependItems || []), ...items];

  return (
    <ul
      className={cn(
        'grid gap-1 p-2 pointer-events-auto',
        widthClass,
        gridClass
      )}
    >
      {allItems.map((item) => (
        <NavDropdownItem
          key={item.href}
          item={item}
          isActive={isActive(item.href)}
          onClick={(e) => onNavigate(e, item.href)}
        />
      ))}
    </ul>
  );
}
