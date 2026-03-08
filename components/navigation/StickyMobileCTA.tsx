'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PiMapPin, PiX } from 'react-icons/pi';
import { useIsMobile } from '@/hooks/use-mobile';

// Pages where sticky CTA should NOT appear
const EXCLUDED_PATHS = [
  '/coverage',           // Already on coverage page
  '/order',              // In order flow
  '/checkout',           // In checkout
  '/auth',               // Auth pages
  '/admin',              // Admin pages
  '/partners',           // Partner portal
  '/dashboard',          // Customer dashboard
];

export function StickyMobileCTA() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Check if we should show on this page
  const shouldShowOnPage = !EXCLUDED_PATHS.some((path) => pathname?.startsWith(path));

  // Show after slight scroll to avoid immediate popup
  useEffect(() => {
    if (!isMobile || !shouldShowOnPage) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      // Show after scrolling 200px
      setIsVisible(window.scrollY > 200);
    };

    // Check initial position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, shouldShowOnPage]);

  // Don't render if not mobile, dismissed, or excluded page
  if (!isMobile || isDismissed || !shouldShowOnPage || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-gradient-to-t from-white via-white to-transparent pb-safe">
      <div className="relative">
        {/* Dismiss button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -right-1 p-1.5 bg-white rounded-full shadow-md border text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <PiX className="w-4 h-4" />
        </button>

        {/* CTA Button */}
        <Link
          href="/coverage"
          className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-circleTel-orange hover:bg-circleTel-orange-dark text-white font-semibold rounded-lg shadow-lg transition-colors"
        >
          <PiMapPin className="w-5 h-5" />
          <span>Check Coverage in Your Area</span>
        </Link>
      </div>
    </div>
  );
}
