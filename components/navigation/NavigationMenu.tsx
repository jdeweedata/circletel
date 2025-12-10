'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  managedITItems,
  connectivityItems,
  cloudHostingItems,
  resourcesItems,
  partnerItems
} from './NavigationData';

interface DesktopNavigationProps {
  className?: string;
}

export const DesktopNavigationMenu = ({ className }: DesktopNavigationProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname;

  // Helper function to determine if a path is active
  const isActive = (path: string) => {
    // Exact match or starts with path (for subpaths)
    return currentPath === path ||
           (path !== '/' && currentPath.startsWith(path));
  };

  // Handle navigation with router to ensure it works with Radix NavigationMenu
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <NavigationMenu className={cn("hidden md:flex", className)}>
      <NavigationMenuList>
        {/* Managed IT */}
        <NavigationMenuItem className="relative">
          <NavigationMenuTrigger
            className={cn(
              'text-base md:text-lg lg:text-xl',
              (isActive('/services') || isActive('/pricing') || isActive('/bundles')) && 'bg-accent text-accent-foreground'
            )}
          >
            Managed IT
          </NavigationMenuTrigger>
          <NavigationMenuContent forceMount className="data-[state=closed]:hidden absolute left-0 top-full mt-1.5 rounded-md border bg-white shadow-lg">
            <ul className="grid w-[320px] gap-1 p-2 md:w-[400px] md:grid-cols-2 lg:w-[500px] pointer-events-auto">
              {managedITItems.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={cn(
                      "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-circleTel-orange/10 focus:bg-circleTel-orange/10 cursor-pointer",
                      isActive(item.href) ? 'bg-circleTel-orange/10' : ''
                    )}
                  >
                    <div className="text-sm font-semibold text-circleTel-darkNeutral hover:text-circleTel-orange transition-colors">{item.name}</div>
                    <p className="line-clamp-2 text-xs leading-snug text-circleTel-secondaryNeutral mt-1">
                      {item.description}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Connectivity */}
        <NavigationMenuItem className="relative">
          <NavigationMenuTrigger
            className={cn(
              isActive('/connectivity') && 'bg-accent text-accent-foreground',
              'text-base md:text-lg lg:text-xl'
            )}
          >
            Connectivity
          </NavigationMenuTrigger>
          <NavigationMenuContent forceMount className="data-[state=closed]:hidden absolute left-0 top-full mt-1.5 rounded-md border bg-white shadow-lg">
            <ul className="grid w-[320px] gap-1 p-2 md:w-[400px] md:grid-cols-2 lg:w-[500px] pointer-events-auto">
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    href="/connectivity"
                    onClick={(e) => handleNavClick(e, '/connectivity')}
                    className={cn(
                      "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-circleTel-orange/10 focus:bg-circleTel-orange/10 cursor-pointer",
                      isActive('/connectivity') && !currentPath.includes('/connectivity/') ? 'bg-circleTel-orange/10' : ''
                    )}
                  >
                    <div className="text-sm font-semibold text-circleTel-darkNeutral hover:text-circleTel-orange transition-colors">Connectivity Overview</div>
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
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={cn(
                        "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-circleTel-orange/10 focus:bg-circleTel-orange/10 cursor-pointer",
                        isActive(item.href) ? 'bg-circleTel-orange/10' : ''
                      )}
                    >
                      <div className="text-sm font-semibold text-circleTel-darkNeutral hover:text-circleTel-orange transition-colors">{item.name}</div>
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
        <NavigationMenuItem className="relative">
          <NavigationMenuTrigger
            className={cn(
              isActive('/cloud') && 'bg-accent text-accent-foreground',
              'text-base md:text-lg lg:text-xl'
            )}
          >
            Cloud & Hosting
          </NavigationMenuTrigger>
          <NavigationMenuContent forceMount className="data-[state=closed]:hidden absolute left-0 top-full mt-1.5 rounded-md border bg-white shadow-lg">
            <ul className="grid w-[320px] gap-1 p-2 md:w-[400px] md:grid-cols-2 lg:w-[500px] pointer-events-auto">
              {cloudHostingItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={cn(
                        "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-circleTel-orange/10 focus:bg-circleTel-orange/10 cursor-pointer",
                        isActive(item.href) ? 'bg-circleTel-orange/10' : ''
                      )}
                    >
                      <div className="text-sm font-semibold text-circleTel-darkNeutral hover:text-circleTel-orange transition-colors">{item.name}</div>
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
        <NavigationMenuItem className="relative">
          <NavigationMenuTrigger
            className={cn(
              isActive('/resources') && 'bg-accent text-accent-foreground',
              'text-base md:text-lg lg:text-xl'
            )}
          >
            Resources
          </NavigationMenuTrigger>
          <NavigationMenuContent forceMount className="data-[state=closed]:hidden absolute left-0 top-full mt-1.5 rounded-md border bg-white shadow-lg">
            <ul className="grid w-[320px] gap-1 p-2 md:w-[400px] md:grid-cols-2 lg:w-[500px] pointer-events-auto">
              {resourcesItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={cn(
                        "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-circleTel-orange/10 focus:bg-circleTel-orange/10 cursor-pointer",
                        isActive(item.href) ? 'bg-circleTel-orange/10' : ''
                      )}
                    >
                      <div className="text-sm font-semibold text-circleTel-darkNeutral hover:text-circleTel-orange transition-colors">{item.name}</div>
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

        {/* Partners - uses forceMount for right-aligned dropdown */}
        <NavigationMenuItem className="relative">
          <NavigationMenuTrigger
            className={cn(
              (isActive('/partner') || isActive('/become-a-partner')) && 'bg-accent text-accent-foreground',
              'text-base md:text-lg lg:text-xl'
            )}
          >
            Partners
          </NavigationMenuTrigger>
          <NavigationMenuContent forceMount className="data-[state=closed]:hidden absolute right-0 left-auto top-full mt-1.5 w-[280px] rounded-md border bg-white shadow-lg">
            <ul className="grid gap-1 p-2 pointer-events-auto">
              {partnerItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={cn(
                        "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-circleTel-orange/10 focus:bg-circleTel-orange/10 cursor-pointer",
                        isActive(item.href) ? 'bg-circleTel-orange/10' : ''
                      )}
                    >
                      <div className="text-sm font-semibold text-circleTel-darkNeutral hover:text-circleTel-orange transition-colors">{item.name}</div>
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