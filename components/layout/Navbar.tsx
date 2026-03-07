'use client';
import { PiListBold, PiXBold } from 'react-icons/pi';

import React, { useState } from 'react';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';
import { Logo } from '@/components/navigation/Logo';
import { DesktopNavigationMenu } from '@/components/navigation/NavigationMenu';
import { MobileMenu } from '@/components/navigation/MobileMenu';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm w-full">
      <div className="container mx-auto px-4 py-2 lg:py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center"><Logo /></div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-3">
            <DesktopNavigationMenu />
            <Button asChild variant="outline" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
              <Link href="/quotes/request">Request Quote</Link>
            </Button>
            <Button asChild className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white">
              <Link href="/auth/login">Customer Login</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
              className="text-circleTel-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary p-[10px] min-w-[44px] min-h-[44px] rounded-md flex items-center justify-center"
            >
              {isMenuOpen ? <PiXBold size={24} /> : <PiListBold size={24} />}
            </button>
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
    </header>
  );
}