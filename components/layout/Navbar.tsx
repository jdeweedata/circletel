'use client';
import { PiListBold, PiMagnifyingGlass } from 'react-icons/pi';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/navigation/Logo';
import { DesktopNavigationMenu } from '@/components/navigation/NavigationMenu';
import { MobileMenu } from '@/components/navigation/MobileMenu';
import { HelpBar } from '@/components/navigation/HelpBar';
import { SearchModal, useSearchShortcut } from '@/components/navigation/SearchModal';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isMobile = useIsMobile();

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  useSearchShortcut(openSearch);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Help Bar - Contact strip above main nav */}
      <HelpBar />

      <div className="border-y border-white/10 bg-circleTel-navy shadow-lg shadow-circleTel-navy/10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center"><Logo /></div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-2">
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
            {isMobile && (
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
          {isMobile && (
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
