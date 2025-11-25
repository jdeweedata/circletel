'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  managedITItems,
  connectivityItems,
  cloudHostingItems,
  resourcesItems,
  partnerItems
} from './NavigationData';

interface MobileMenuProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

export const MobileMenu = ({ isMenuOpen, setIsMenuOpen }: MobileMenuProps) => {
  const pathname = usePathname();
  const currentPath = pathname;

  // Helper to check if a path is currently active
  const isActive = (path: string) => {
    return currentPath === path ||
           (path !== '/' && currentPath.startsWith(path));
  };

  // Helper to determine which accordion items should be defaultOpen
  const getDefaultValue = (): string[] => {
    const openSections = [];

    if (currentPath.includes('/services/') || currentPath === '/services' ||
        currentPath === '/pricing' || currentPath === '/bundles') {
      openSections.push('managed-it');
    }

    if (currentPath.includes('/connectivity/') || currentPath === '/connectivity') {
      openSections.push('connectivity');
    }

    if (currentPath.includes('/cloud/') || currentPath === '/cloud') {
      openSections.push('cloud-hosting');
    }

    if (currentPath.includes('/resources/') || currentPath === '/resources') {
      openSections.push('resources');
    }

    if (currentPath.includes('/partner') || currentPath === '/become-a-partner') {
      openSections.push('partners');
    }

    return openSections;
  };

  if (!isMenuOpen) return null;

  return (
    <nav className="mt-4 bg-white animate-fade-in px-1">
      <div className="flex flex-col gap-2">
        {/* Single links */}
        <Link
          href="/services"
          className={`py-2.5 px-3 font-medium rounded-md text-base md:text-lg lg:text-xl ${isActive('/services') && !currentPath.includes('/services/') ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
          onClick={() => setIsMenuOpen(false)}
        >
          Managed IT
        </Link>

        {/* Accordion menus */}
        <Accordion type="multiple" defaultValue={getDefaultValue()} className="w-full">
          <AccordionItem value="managed-it" className="border-0">
            <AccordionTrigger className="py-2.5 px-3 font-medium hover:bg-muted/50 hover:no-underline rounded-md text-base md:text-lg lg:text-xl">
              IT Solutions
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col space-y-1 pl-4">
                {managedITItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`py-2 px-3 rounded-md text-sm ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="connectivity" className="border-0">
            <AccordionTrigger className="py-2.5 px-3 font-medium hover:bg-muted/50 hover:no-underline rounded-md text-base md:text-lg lg:text-xl">
              Connectivity
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col space-y-1 pl-4">
                <Link
                  href="/connectivity"
                  className={`py-2 px-3 rounded-md text-sm ${isActive('/connectivity') && !currentPath.includes('/connectivity/') ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Connectivity Overview
                </Link>
                {connectivityItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`py-2 px-3 rounded-md text-sm ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cloud-hosting" className="border-0">
            <AccordionTrigger className="py-2.5 px-3 font-medium hover:bg-muted/50 hover:no-underline rounded-md text-base md:text-lg lg:text-xl">
              Cloud & Hosting
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col space-y-1 pl-4">
                {cloudHostingItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`py-2 px-3 rounded-md text-sm ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="resources" className="border-0">
            <AccordionTrigger className="py-2.5 px-3 font-medium hover:bg-muted/50 hover:no-underline rounded-md text-base md:text-lg lg:text-xl">
              Resources
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col space-y-1 pl-4">
                {resourcesItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`py-2 px-3 rounded-md text-sm ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="partners" className="border-0">
            <AccordionTrigger className="py-2.5 px-3 font-medium hover:bg-muted/50 hover:no-underline rounded-md text-base md:text-lg lg:text-xl">
              Partners
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col space-y-1 pl-4">
                {partnerItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`py-2 px-3 rounded-md text-sm ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="pt-2 flex flex-col gap-2">
          <Button asChild variant="outline" className="w-full border-circleTel-orange text-circleTel-orange" onClick={() => setIsMenuOpen(false)}>
            <Link href="/quotes/request">Request Quote</Link>
          </Button>
          <Button asChild className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90" onClick={() => setIsMenuOpen(false)}>
            <Link href="/auth/login">Customer Login</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};