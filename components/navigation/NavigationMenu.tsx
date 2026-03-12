'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PiCaretDownBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import {
  managedITItems,
  connectivityItems,
  cloudHostingItems,
  resourcesItems,
  partnerItems,
  type NavigationItem,
} from './NavigationData';

interface DesktopNavigationProps {
  className?: string;
}

interface NavDropdownProps {
  label: string;
  items: NavigationItem[];
  prependItems?: NavigationItem[];
  isActive: boolean;
  columns?: 1 | 2;
  align?: 'left' | 'right';
  checkActive: (path: string) => boolean;
}

function NavDropdown({
  label,
  items,
  prependItems,
  isActive,
  columns = 2,
  align = 'left',
  checkActive,
}: NavDropdownProps) {
  const allItems = [...(prependItems || []), ...items];

  return (
    <div className="relative group">
      {/* Trigger */}
      <button
        className={cn(
          'nav-trigger inline-flex h-11 min-h-[44px] items-center justify-center rounded-md px-4 py-2 transition-colors',
          'hover:bg-circleTel-orange/10 focus:bg-circleTel-orange/10 focus:outline-none',
          'group-hover:bg-circleTel-orange/10',
          isActive && 'bg-circleTel-orange/10 text-circleTel-navy'
        )}
      >
        {label}
        <PiCaretDownBold
          className="relative top-[1px] ml-1 h-3 w-3 transition-transform duration-200 group-hover:rotate-180"
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Content */}
      <div
        className={cn(
          'absolute top-full mt-1.5 rounded-md border bg-white shadow-lg',
          'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
          'transition-all duration-150 z-50',
          align === 'right' ? 'right-0 left-auto' : 'left-0',
          columns === 2 ? 'w-[320px] md:w-[400px] lg:w-[500px]' : 'w-[280px]'
        )}
      >
        <ul
          className={cn(
            'grid gap-1 p-2',
            columns === 2 && 'md:grid-cols-2'
          )}
        >
          {allItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150',
                  'hover:bg-circleTel-orange/10 focus:bg-circleTel-orange/10',
                  checkActive(item.href) && 'bg-circleTel-orange/10'
                )}
              >
                <div className="nav-item-title hover:text-circleTel-orange transition-colors">
                  {item.name}
                </div>
                {item.description && (
                  <p className="nav-item-description line-clamp-2 mt-1">
                    {item.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export const DesktopNavigationMenu = ({ className }: DesktopNavigationProps) => {
  const pathname = usePathname();
  const currentPath = pathname;

  const isActive = (path: string) => {
    return currentPath === path || (path !== '/' && currentPath.startsWith(path));
  };

  return (
    <nav className={cn('hidden md:flex items-center gap-1', className)}>
      {/* Managed IT */}
      <NavDropdown
        label="Managed IT"
        items={managedITItems}
        isActive={isActive('/services') || isActive('/pricing') || isActive('/bundles')}
        checkActive={(path) =>
          path === '/services'
            ? isActive('/services') && !currentPath.includes('/services/')
            : isActive(path)
        }
        prependItems={[
          {
            name: 'Services Overview',
            href: '/services',
            description: 'Explore all our managed IT services',
          },
        ]}
      />

      {/* Connectivity */}
      <NavDropdown
        label="Connectivity"
        items={connectivityItems}
        isActive={isActive('/connectivity') || isActive('/products')}
        checkActive={(path) =>
          path === '/connectivity'
            ? isActive('/connectivity') && !currentPath.includes('/connectivity/')
            : isActive(path)
        }
        prependItems={[
          {
            name: 'Connectivity Overview',
            href: '/connectivity',
            description: 'Explore all our connectivity solutions',
          },
        ]}
      />

      {/* Cloud & Hosting */}
      <NavDropdown
        label="Cloud & Hosting"
        items={cloudHostingItems}
        isActive={isActive('/cloud')}
        checkActive={(path) =>
          path === '/cloud'
            ? isActive('/cloud') && !currentPath.includes('/cloud/')
            : isActive(path)
        }
        prependItems={[
          {
            name: 'Cloud Overview',
            href: '/cloud',
            description: 'Explore all our cloud & hosting solutions',
          },
        ]}
      />

      {/* Resources */}
      <NavDropdown
        label="Resources"
        items={resourcesItems}
        isActive={isActive('/resources')}
        checkActive={(path) =>
          path === '/resources'
            ? isActive('/resources') && !currentPath.includes('/resources/')
            : isActive(path)
        }
        prependItems={[
          {
            name: 'Resources Overview',
            href: '/resources',
            description: 'Guides, tools and support resources',
          },
        ]}
      />

      {/* Partners */}
      <NavDropdown
        label="Partners"
        items={partnerItems}
        isActive={isActive('/partner') || isActive('/become-a-partner')}
        checkActive={isActive}
        columns={1}
        align="right"
      />
    </nav>
  );
};
