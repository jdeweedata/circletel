'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero section (roughly 600px)
      const shouldShow = window.scrollY > 600;
      setIsVisible(shouldShow && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl transform transition-transform duration-300 ease-out">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left - Message */}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              Ready to partner? <span className="text-circleTel-orange">Up to 30% recurring commission</span>
            </p>
          </div>

          {/* Right - CTAs */}
          <div className="flex items-center gap-3 flex-1 sm:flex-none justify-end">
            <Link href="/partner/onboarding" className="flex-1 sm:flex-none">
              <Button
                size="sm"
                className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white font-semibold w-full sm:w-auto"
              >
                Start Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#commission-calculator" className="hidden md:inline-flex">
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Calculate Earnings
              </Button>
            </a>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
