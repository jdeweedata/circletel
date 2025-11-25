'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  NavigationItem,
  NavigationSection,
  managedITItems,
  connectivityItems,
  cloudHostingItems,
  resourcesItems,
  partnerItems
} from './NavigationData';

// ListItem component for dropdown content
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-base md:text-lg lg:text-xl",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

interface DesktopNavigationProps {
  className?: string;
}

export const DesktopNavigationMenu = ({ className }: DesktopNavigationProps) => {
  const pathname = usePathname();
  const currentPath = pathname;

  // Helper function to determine if a path is active
  const isActive = (path: string) => {
    // Exact match or starts with path (for subpaths)
    return currentPath === path ||
           (path !== '/' && currentPath.startsWith(path));
  };

  return (
    <NavigationMenu className={cn("hidden md:flex", className)}>
      <NavigationMenuList>
        {/* Managed IT */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              'text-base md:text-lg lg:text-xl',
              (isActive('/services') || isActive('/pricing') || isActive('/bundles')) && 'bg-accent text-accent-foreground'
            )}
          >
            Managed IT
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[320px] gap-1 p-2 md:w-[400px] md:grid-cols-2 lg:w-[500px]">
              {managedITItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-gray-100 focus:bg-gray-100",
                        isActive(item.href) ? 'bg-gray-100' : ''
                      )}
                    >
                      <div className="text-sm font-semibold text-circleTel-darkNeutral">{item.name}</div>
                      <p className="line-clamp-2 text-xs leading-snug text-circleTel-secondaryNeutral mt-1">
                        {item.description}
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Connectivity */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              isActive('/connectivity') && 'bg-accent text-accent-foreground',
              'text-base md:text-lg lg:text-xl'
            )}
          >
            Connectivity
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[320px] gap-1 p-2 md:w-[400px] md:grid-cols-2 lg:w-[500px]">
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    href="/connectivity"
                    className={cn(
                      "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-gray-100 focus:bg-gray-100",
                      isActive('/connectivity') && !currentPath.includes('/connectivity/') ? 'bg-gray-100' : ''
                    )}
                  >
                    <div className="text-sm font-semibold text-circleTel-darkNeutral">Connectivity Overview</div>
                    <p className="line-clamp-2 text-xs leading-snug text-circleTel-secondaryNeutral mt-1">
                      Explore all our connectivity solutions
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              {connectivityItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-gray-100 focus:bg-gray-100",
                        isActive(item.href) ? 'bg-gray-100' : ''
                      )}
                    >
                      <div className="text-sm font-semibold text-circleTel-darkNeutral">{item.name}</div>
                      <p className="line-clamp-2 text-xs leading-snug text-circleTel-secondaryNeutral mt-1">
                        {item.description}
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Cloud & Hosting */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              isActive('/cloud') && 'bg-accent text-accent-foreground',
              'text-base md:text-lg lg:text-xl'
            )}
          >
            Cloud & Hosting
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[320px] gap-1 p-2 md:w-[400px] md:grid-cols-2 lg:w-[500px]">
              {cloudHostingItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-gray-100 focus:bg-gray-100",
                        isActive(item.href) ? 'bg-gray-100' : ''
                      )}
                    >
                      <div className="text-sm font-semibold text-circleTel-darkNeutral">{item.name}</div>
                      <p className="line-clamp-2 text-xs leading-snug text-circleTel-secondaryNeutral mt-1">
                        {item.description}
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Resources */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              isActive('/resources') && 'bg-accent text-accent-foreground',
              'text-base md:text-lg lg:text-xl'
            )}
          >
            Resources
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[320px] gap-1 p-2 md:w-[400px] md:grid-cols-2 lg:w-[500px]">
              {resourcesItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-gray-100 focus:bg-gray-100",
                        isActive(item.href) ? 'bg-gray-100' : ''
                      )}
                    >
                      <div className="text-sm font-semibold text-circleTel-darkNeutral">{item.name}</div>
                      <p className="line-clamp-2 text-xs leading-snug text-circleTel-secondaryNeutral mt-1">
                        {item.description}
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Partners */}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              (isActive('/partner') || isActive('/become-a-partner')) && 'bg-accent text-accent-foreground',
              'text-base md:text-lg lg:text-xl'
            )}
          >
            Partners
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[280px] gap-1 p-2">
              {partnerItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-gray-100 focus:bg-gray-100",
                        isActive(item.href) ? 'bg-gray-100' : ''
                      )}
                    >
                      <div className="text-sm font-semibold text-circleTel-darkNeutral">{item.name}</div>
                      <p className="line-clamp-2 text-xs leading-snug text-circleTel-secondaryNeutral mt-1">
                        {item.description}
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};