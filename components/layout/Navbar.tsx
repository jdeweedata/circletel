'use client';
import { PiListBold, PiMagnifyingGlass } from 'react-icons/pi';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/navigation/Logo';
import { DesktopNavigationMenu } from '@/components/navigation/NavigationMenu';
import { MobileMenu } from '@/components/navigation/MobileMenu';
import { HelpBar } from '@/components/navigation/HelpBar';
import { SearchModal, useSearchShortcut } from '@/components/navigation/SearchModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Compact mode engages at 96px but only releases near the very top. The compact
// header is ~56px shorter, and browser scroll anchoring shifts scrollY by that
// delta when the header resizes — a single threshold bounces scrollY back and
// forth across itself, looping the layout (header visibly vibrates at rest).
const COMPACT_NAV_SCROLL_ENTER = 96;
const COMPACT_NAV_SCROLL_EXIT = 24;
// Desktop nav + both CTA buttons only fit comfortably from lg (1024px) up;
// below that the row overflows and menu items slide under the logo.
const COMPACT_NAV_BREAKPOINT = 1024;

function useIsCompactNav() {
  const [isCompactNav, setIsCompactNav] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${COMPACT_NAV_BREAKPOINT - 1}px)`);
    const onChange = () => setIsCompactNav(window.innerWidth < COMPACT_NAV_BREAKPOINT);
    mql.addEventListener('change', onChange);
    setIsCompactNav(window.innerWidth < COMPACT_NAV_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isCompactNav;
}

export function getNavbarPresentation(hasScrolled: boolean, isMenuOpen: boolean) {
  const isCompact = hasScrolled && !isMenuOpen;

  return {
    isCompact,
    helpBarClassName: cn(
      'overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out',
      isCompact
        ? 'max-h-0 -translate-y-2 opacity-0 pointer-events-none'
        : 'max-h-12 translate-y-0 opacity-100'
    ),
    navFrameClassName: cn(
      'border-y border-white/10 bg-circleTel-navy transition-all duration-300 ease-out',
      isCompact
        ? 'bg-circleTel-navy/95 shadow-md shadow-circleTel-navy/15 backdrop-blur supports-[backdrop-filter]:bg-circleTel-navy/90'
        : 'shadow-lg shadow-circleTel-navy/10'
    ),
    navShellClassName: cn(
      'container mx-auto px-4 transition-[padding] duration-300 ease-out',
      isCompact ? 'py-1.5' : 'py-2'
    ),
    logoClassName: isCompact ? 'max-h-14 transition-all duration-300 ease-out' : '',
    desktopActionsClassName: cn(
      'hidden transition-all duration-300 ease-out lg:flex lg:items-center',
      isCompact ? 'lg:gap-1' : 'lg:gap-2'
    ),
  };
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const isCompactNav = useIsCompactNav();

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  useSearchShortcut(openSearch);

  useEffect(() => {
    const updateScrolledState = () => {
      const scrollY = window.scrollY;
      setHasScrolled((wasCompact) =>
        wasCompact ? scrollY > COMPACT_NAV_SCROLL_EXIT : scrollY > COMPACT_NAV_SCROLL_ENTER
      );
    };

    updateScrolledState();
    window.addEventListener('scroll', updateScrolledState, { passive: true });

    return () => window.removeEventListener('scroll', updateScrolledState);
  }, []);

  const presentation = getNavbarPresentation(hasScrolled, isMenuOpen);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Help Bar - Contact strip above main nav */}
      <HelpBar className={presentation.helpBarClassName} />

      <div className={presentation.navFrameClassName}>
        <div className={presentation.navShellClassName}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center"><Logo className={presentation.logoClassName} /></div>

            {/* Desktop Navigation */}
            <div className={presentation.desktopActionsClassName}>
              <DesktopNavigationMenu />

              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={openSearch}
                className="rounded-full text-white/85 hover:bg-white/10 hover:text-white focus-visible:ring-circleTel-orange focus-visible:ring-offset-circleTel-navy"
                aria-label="Search (Ctrl+K)"
              >
                <PiMagnifyingGlass className="w-5 h-5" />
              </Button>

              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/quotes/request">Request Quote</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-circleTel-orange text-white shadow-lg shadow-circleTel-orange/20 hover:bg-circleTel-orange-dark"
              >
                <Link href="/auth/login">Customer Login</Link>
              </Button>
            </div>

            {/* Mobile Actions */}
            {isCompactNav && (
              <div className="flex items-center gap-1">
                {/* Mobile Search Button */}
                <button
                  onClick={openSearch}
                  aria-label="Search"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-[10px] text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange focus-visible:ring-offset-2 focus-visible:ring-offset-circleTel-navy"
                >
                  <PiMagnifyingGlass size={22} />
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-expanded={isMenuOpen}
                  aria-label="Toggle menu"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-[10px] text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange focus-visible:ring-offset-2 focus-visible:ring-offset-circleTel-navy"
                >
                  <PiListBold size={24} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          {isCompactNav && (
            <MobileMenu
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
            />
          )}
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
}
