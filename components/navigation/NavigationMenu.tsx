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
  resourcesItems
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
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {managedITItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-base md:text-lg lg:text-xl",
                        isActive(item.href) ? 'bg-accent' : ''
                      )}
                    >
                      <div className="text-sm font-medium leading-none">{item.name}</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
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
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    href="/connectivity"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-base md:text-lg lg:text-xl",
                      isActive('/connectivity') && !currentPath.includes('/connectivity/') ? 'bg-accent' : ''
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Wi-Fi as a Service</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Enterprise-grade Wi-Fi connectivity solutions
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
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-base md:text-lg lg:text-xl",
                        isActive(item.href) ? 'bg-accent' : ''
                      )}
                    >
                      <div className="text-sm font-medium leading-none">{item.name}</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
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
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {cloudHostingItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-base md:text-lg lg:text-xl",
                        isActive(item.href) ? 'bg-accent' : ''
                      )}
                    >
                      <div className="text-sm font-medium leading-none">{item.name}</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
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
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {resourcesItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-base md:text-lg lg:text-xl",
                        isActive(item.href) ? 'bg-accent' : ''
                      )}
                    >
                      <div className="text-sm font-medium leading-none">{item.name}</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
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