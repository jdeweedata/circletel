'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PiSquaresFourBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  managedITItems,
  connectivityItems,
  cloudHostingItems,
  resourcesItems,
  partnerItems,
  type NavigationItem,
} from './NavigationData';

interface MobileMenuProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

type MobileSection = {
  value: string;
  label: string;
  items: NavigationItem[];
};

const overviewItem = (name: string, href: string, description: string): NavigationItem => ({
  name,
  href,
  description,
  icon: PiSquaresFourBold,
});

const getMobileSections = (): MobileSection[] => [
  {
    value: 'managed-it',
    label: 'Managed IT',
    items: [
      overviewItem('Services Overview', '/services', 'Managed IT, security and support services'),
      ...managedITItems,
    ],
  },
  {
    value: 'connectivity',
    label: 'Connectivity',
    items: [
      overviewItem('Connectivity Overview', '/connectivity', 'Business internet, fibre and Wi-Fi options'),
      ...connectivityItems,
    ],
  },
  {
    value: 'cloud-hosting',
    label: 'Cloud & Hosting',
    items: [
      overviewItem('Cloud Overview', '/cloud', 'Cloud, hosting and backup solutions'),
      ...cloudHostingItems,
    ],
  },
  {
    value: 'resources',
    label: 'Resources',
    items: [
      overviewItem('Resources Overview', '/resources', 'Guides, tools and support resources'),
      ...resourcesItems,
    ],
  },
  {
    value: 'partners',
    label: 'Partners',
    items: partnerItems,
  },
];

const getDefaultSections = (currentPath: string): string[] => {
  const sectionRules = [
    {
      value: 'managed-it',
      paths: ['/services/', '/services', '/pricing', '/bundles'],
    },
    {
      value: 'connectivity',
      paths: ['/connectivity/', '/connectivity', '/products/'],
    },
    {
      value: 'cloud-hosting',
      paths: ['/cloud/', '/cloud'],
    },
    {
      value: 'resources',
      paths: ['/resources/', '/resources', '/blog', '/forms'],
    },
    {
      value: 'partners',
      paths: ['/partner/', '/partner', '/become-a-partner'],
    },
  ];

  return sectionRules
    .filter(({ paths }) =>
      paths.some((path) => (path.endsWith('/') ? currentPath.includes(path) : currentPath === path))
    )
    .map(({ value }) => value);
};

const mobileItemClass = (active: boolean) =>
  cn(
    'group flex min-h-[64px] gap-3 rounded-lg px-3 py-2.5 transition-colors',
    active ? 'bg-circleTel-orange-light text-circleTel-navy' : 'hover:bg-circleTel-orange-light'
  );

export const MobileMenu = ({ isMenuOpen, setIsMenuOpen }: MobileMenuProps) => {
  const pathname = usePathname();
  const currentPath = pathname;

  const isActive = (path: string) => {
    return currentPath === path || (path !== '/' && currentPath.startsWith(path));
  };

  const sections = getMobileSections();

  return (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <SheetContent
        side="right"
        className="flex w-[88vw] max-w-sm flex-col gap-0 overflow-y-auto bg-white p-0 [&>button]:text-white [&>button]:hover:text-white [&>button]:focus:ring-circleTel-orange"
      >
        <SheetHeader className="border-b border-circleTel-lightNeutral bg-circleTel-navy px-5 py-5 text-left text-white">
          <SheetTitle className="font-heading text-xl font-bold text-white">CircleTel</SheetTitle>
          <SheetDescription className="text-sm text-white/75">
            Business connectivity, IT support and partner tools.
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-1 flex-col px-4 py-4">
          <Accordion type="multiple" defaultValue={getDefaultSections(currentPath)} className="w-full">
            {sections.map((section) => (
              <AccordionItem key={section.value} value={section.value} className="border-circleTel-lightNeutral">
                <AccordionTrigger className="min-h-[52px] rounded-lg px-2 font-heading text-sm font-bold text-circleTel-navy hover:bg-circleTel-orange-light hover:no-underline">
                  {section.label}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-1 pb-2">
                    {section.items.map((item) => {
                      const Icon = item.icon || PiSquaresFourBold;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={mobileItemClass(isActive(item.href))}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-circleTel-navy text-white transition-colors group-hover:bg-circleTel-orange">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-heading text-sm font-bold leading-tight text-circleTel-navy">
                              {item.name}
                            </span>
                            {item.description && (
                              <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-circleTel-navy/70">
                                {item.description}
                              </span>
                            )}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-auto grid gap-2 border-t border-circleTel-lightNeutral pt-4">
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-circleTel-navy text-circleTel-navy hover:bg-circleTel-navy hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              <Link href="/quotes/request">Request Quote</Link>
            </Button>
            <Button
              asChild
              className="h-11 rounded-full bg-circleTel-orange text-white hover:bg-circleTel-orange-dark"
              onClick={() => setIsMenuOpen(false)}
            >
              <Link href="/auth/login">Customer Login</Link>
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
