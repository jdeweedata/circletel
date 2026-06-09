'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PiCaretDownBold, PiSquaresFourBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

const overviewItem = (name: string, href: string, description: string): NavigationItem => ({
  name,
  href,
  description,
  icon: PiSquaresFourBold,
});

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
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-11 min-h-[44px] items-center justify-center rounded-full px-4 py-2 font-body text-sm font-semibold text-white/85 transition-colors',
          'hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white focus:outline-none',
          'data-[state=open]:bg-white/10 data-[state=open]:text-white',
          isActive && 'bg-white/10 text-circleTel-orange'
        )}
      >
        {label}
        <PiCaretDownBold
          className="relative top-[1px] ml-1 h-3 w-3 transition-transform duration-200"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn(
          'rounded-xl border-circleTel-lightNeutral bg-white p-3 shadow-2xl shadow-circleTel-navy/20',
          columns === 2 ? 'w-[520px]' : 'w-[320px]'
        )}
        align={align === 'right' ? 'end' : 'start'}
        sideOffset={10}
      >
        <div className={cn('grid gap-2', columns === 2 && 'md:grid-cols-2')}>
          {allItems.map((item) => {
            const Icon = item.icon || PiSquaresFourBold;

            return (
              <DropdownMenuItem key={item.href} asChild className="p-0">
                <Link
                  href={item.href}
                  className={cn(
                    'group flex min-h-[76px] select-none gap-3 rounded-lg p-3 no-underline outline-none transition-colors',
                    'hover:bg-circleTel-orange-light focus:bg-circleTel-orange-light',
                    checkActive(item.href) && 'bg-circleTel-orange-light'
                  )}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-circleTel-navy text-white transition-colors group-hover:bg-circleTel-orange">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-heading text-sm font-bold leading-tight text-circleTel-navy transition-colors group-hover:text-circleTel-orange-accessible">
                      {item.name}
                    </span>
                    {item.description && (
                      <span className="mt-1 block line-clamp-2 font-body text-xs leading-relaxed text-circleTel-navy/70">
                        {item.description}
                      </span>
                    )}
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
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
          overviewItem('Services Overview', '/services', 'Explore managed IT, security and support services'),
        ]}
      />

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
          overviewItem('Connectivity Overview', '/connectivity', 'Compare business internet, fibre and Wi-Fi options'),
        ]}
      />

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
          overviewItem('Cloud Overview', '/cloud', 'Explore cloud, hosting and backup solutions'),
        ]}
      />

      <NavDropdown
        label="Resources"
        items={resourcesItems}
        isActive={isActive('/resources') || isActive('/blog') || isActive('/forms')}
        checkActive={(path) =>
          path === '/resources'
            ? isActive('/resources') && !currentPath.includes('/resources/')
            : isActive(path)
        }
        prependItems={[
          overviewItem('Resources Overview', '/resources', 'Guides, tools and support resources'),
        ]}
      />

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
