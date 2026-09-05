'use client';
import { PiListBold, PiMagnifyingGlass, PiWhatsappLogo, PiEnvelope } from 'react-icons/pi';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/navigation/Logo';
import { DesktopNavigationMenu } from '@/components/navigation/NavigationMenu';
import { MobileMenu } from '@/components/navigation/MobileMenu';
import { CONTACT, getWhatsAppLink } from '@/lib/constants/contact';
import { AudienceSelector } from '@/components/navigation/AudienceSelector';
import { SearchModal, useSearchShortcut } from '@/components/navigation/SearchModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Separate thresholds prevent scroll anchoring from repeatedly toggling compact mode.
const COMPACT_NAV_SCROLL_ENTER = 96;
const COMPACT_NAV_SCROLL_EXIT = 24;

export function getNavbarPresentation(hasScrolled: boolean, isMenuOpen: boolean) {
  const isCompact = hasScrolled && !isMenuOpen;

  return {
    isCompact,
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
    logoClassName: cn('transition-all duration-300 ease-out', isCompact ? 'max-h-12' : 'max-h-14 lg:max-h-16'),
  };
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

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

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeMobileMenu = () => {
      if (desktop.matches) setIsMenuOpen(false);
    };
    desktop.addEventListener('change', closeMobileMenu);
    return () => desktop.removeEventListener('change', closeMobileMenu);
  }, []);

  const presentation = getNavbarPresentation(hasScrolled, isMenuOpen);

  return (
    <header className="sticky top-0 z-50 w-full bg-circleTel-navy">
      {/* Brand, audience and utility navigation share the upper row. */}
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-3 sm:gap-6">
          <Logo className={presentation.logoClassName} />
          <div className="hidden lg:block">
            <AudienceSelector />
          </div>
        </div>
        <div className="hidden items-center gap-4 text-sm text-white lg:flex">
          <Link
            href={getWhatsAppLink('Hi, I need help with my CircleTel service.')}
            target="_blank"
            rel="noopener noreferrer"
            title={CONTACT.SUPPORT_HOURS}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <PiWhatsappLogo className="h-4 w-4" />
            {CONTACT.WHATSAPP_NUMBER}
          </Link>
          <Link
            href={`mailto:${CONTACT.EMAIL_SALES}`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <PiEnvelope className="h-4 w-4" />
            <span className="hidden xl:inline">{CONTACT.EMAIL_SALES}</span>
            <span className="xl:hidden">Email</span>
          </Link>
          <Button asChild className="min-h-[44px] rounded-full bg-circleTel-orange text-circleTel-navy hover:bg-circleTel-orange hover:underline">
            <Link href="/auth/login">Customer Login</Link>
          </Button>
        </div>
            {/* Mobile Actions */}
              <div className="flex items-center gap-1 lg:hidden">
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
      </div>

      <div className={cn(presentation.navFrameClassName, 'hidden lg:block')}>
        <div className={presentation.navShellClassName}>
          <div className="flex items-center justify-between gap-4">
            {/* Desktop Navigation */}
            <div className="hidden min-w-0 lg:block">
              <DesktopNavigationMenu />
            </div>
            <div className="hidden items-center gap-2 lg:flex">
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
            </div>
          </div>
        </div>
      </div>

      <MobileMenu isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Search Modal */}
      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  );
}
