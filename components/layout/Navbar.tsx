'use client';
import { PiListBold, PiXBold, PiMagnifyingGlass } from 'react-icons/pi';

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

      {/* Main Navigation */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-2 lg:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center"><Logo /></div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-3">
              <DesktopNavigationMenu />

              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={openSearch}
                className="text-circleTel-navy hover:text-circleTel-orange"
                aria-label="Search (Ctrl+K)"
              >
                <PiMagnifyingGlass className="w-5 h-5" />
              </Button>

              <Button asChild variant="outline" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
                <Link href="/quotes/request">Request Quote</Link>
              </Button>
              <Button asChild className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white">
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
                  className="text-circleTel-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary p-[10px] min-w-[44px] min-h-[44px] rounded-md flex items-center justify-center"
                >
                  <PiMagnifyingGlass size={22} />
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-expanded={isMenuOpen}
                  aria-label="Toggle menu"
                  className="text-circleTel-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary p-[10px] min-w-[44px] min-h-[44px] rounded-md flex items-center justify-center"
                >
                  {isMenuOpen ? <PiXBold size={24} /> : <PiListBold size={24} />}
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