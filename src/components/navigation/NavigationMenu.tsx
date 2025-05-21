
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  itSolutionsItems,
  connectivityItems,
  aboutItems,
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
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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

const DesktopNavigationMenu = ({ className }: DesktopNavigationProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Helper function to determine if a path is active
  const isActive = (path: string) => {
    // Exact match or starts with path (for subpaths)
    return currentPath === path || 
           (path !== '/' && currentPath.startsWith(path));
  };

  return (
    <NavigationMenu className={cn("hidden md:flex", className)}>
      <NavigationMenuList>
        {/* Home */}
        <NavigationMenuItem>
          <Link to="/">
            <NavigationMenuLink 
              className={cn(
                navigationMenuTriggerStyle(),
                isActive('/') && 'bg-accent text-accent-foreground'
              )}
            >
              Home
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* Managed IT */}
        <NavigationMenuItem>
          <Link to="/services">
            <NavigationMenuLink 
              className={cn(
                navigationMenuTriggerStyle(),
                isActive('/services') && !currentPath.includes('/services/') && 'bg-accent text-accent-foreground'
              )}
            >
              Managed IT
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* IT Solutions */}
        <NavigationMenuItem>
          <NavigationMenuTrigger 
            className={cn(
              isActive('/services/small-business') || 
              isActive('/services/mid-size') || 
              isActive('/services/growth-ready') || 
              isActive('/pricing') && 'bg-accent text-accent-foreground'
            )}
          >
            IT Solutions
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {itSolutionsItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link 
                      to={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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
              isActive('/connectivity') && !currentPath.includes('/connectivity/') && 'bg-accent text-accent-foreground'
            )}
          >
            Connectivity
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li>
                <NavigationMenuLink asChild>
                  <Link
                    to="/connectivity"
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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
                      to={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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
              (isActive('/resources') || 
               isActive('/resources/it-health') || 
               isActive('/blog')) && 'bg-accent text-accent-foreground'
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
                      to={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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

        {/* About */}
        <NavigationMenuItem>
          <NavigationMenuTrigger 
            className={cn(
              isActive('/about') && 'bg-accent text-accent-foreground'
            )}
          >
            About
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {aboutItems.map((item) => (
                <li key={item.name}>
                  <NavigationMenuLink asChild>
                    <Link 
                      to={item.href}
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
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

        {/* Case Studies */}
        <NavigationMenuItem>
          <Link to="/case-studies">
            <NavigationMenuLink 
              className={cn(
                navigationMenuTriggerStyle(),
                isActive('/case-studies') && 'bg-accent text-accent-foreground'
              )}
            >
              Case Studies
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default DesktopNavigationMenu;
