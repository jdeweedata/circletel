'use client';

import { usePathname } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { NavDropdownSection } from './NavDropdownSection';
import {
  managedITItems,
  connectivityItems,
  cloudHostingItems,
  resourcesItems,
  partnerItems,
} from './NavigationData';

interface DesktopNavigationProps {
  className?: string;
}

export const DesktopNavigationMenu = ({ className }: DesktopNavigationProps) => {
  const pathname = usePathname();
  const currentPath = pathname;

  const isActive = (path: string) => {
    return currentPath === path || (path !== '/' && currentPath.startsWith(path));
  };

  const dropdownContentClass =
    'data-[state=closed]:hidden absolute left-0 top-full mt-1.5 rounded-md border bg-white shadow-lg';

  return (
    <NavigationMenu className={cn('hidden md:flex', className)}>
      <NavigationMenuList>
        {/* Managed IT */}
        <NavigationMenuItem className="relative">
          <NavigationMenuTrigger
            className={cn(
              'nav-trigger',
              (isActive('/services') || isActive('/pricing') || isActive('/bundles')) &&
                'bg-circleTel-orange/10 text-circleTel-navy'
            )}
          >
            Managed IT
          </NavigationMenuTrigger>
          <NavigationMenuContent forceMount className={dropdownContentClass}>
            <NavDropdownSection
              items={managedITItems}
              columns={2}
              isActive={(path) =>
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
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Connectivity */}
        <NavigationMenuItem className="relative">
          <NavigationMenuTrigger
            className={cn(
              'nav-trigger',
              isActive('/connectivity') && 'bg-circleTel-orange/10 text-circleTel-navy'
            )}
          >
            Connectivity
          </NavigationMenuTrigger>
          <NavigationMenuContent forceMount className={dropdownContentClass}>
            <NavDropdownSection
              items={connectivityItems}
              columns={2}
              isActive={(path) =>
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
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Cloud & Hosting */}
        <NavigationMenuItem className="relative">
          <NavigationMenuTrigger
            className={cn(
              'nav-trigger',
              isActive('/cloud') && 'bg-circleTel-orange/10 text-circleTel-navy'
            )}
          >
            Cloud & Hosting
          </NavigationMenuTrigger>
          <NavigationMenuContent forceMount className={dropdownContentClass}>
            <NavDropdownSection
              items={cloudHostingItems}
              columns={2}
              isActive={isActive}
            />
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Resources */}
        <NavigationMenuItem className="relative">
          <NavigationMenuTrigger
            className={cn(
              'nav-trigger',
              isActive('/resources') && 'bg-circleTel-orange/10 text-circleTel-navy'
            )}
          >
            Resources
          </NavigationMenuTrigger>
          <NavigationMenuContent forceMount className={dropdownContentClass}>
            <NavDropdownSection
              items={resourcesItems}
              columns={2}
              isActive={(path) =>
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
              ]}/>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Partners - right-aligned dropdown */}
        <NavigationMenuItem className="relative">
          <NavigationMenuTrigger
            className={cn(
              'nav-trigger',
              (isActive('/partner') || isActive('/become-a-partner')) &&
                'bg-circleTel-orange/10 text-circleTel-navy'
            )}
          >
            Partners
          </NavigationMenuTrigger>
          <NavigationMenuContent
            forceMount
            className="data-[state=closed]:hidden absolute right-0 left-auto top-full mt-1.5 rounded-md border bg-white shadow-lg"
          >
            <NavDropdownSection
              items={partnerItems}
              columns={1}
              align="right"
              isActive={isActive}
            />
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
