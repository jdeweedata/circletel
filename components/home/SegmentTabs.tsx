'use client';
import { PiCaretLeftBold, PiCaretRightBold } from 'react-icons/pi';

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type SegmentType = 'business' | 'wfh' | 'home';

interface Segment {
  id: SegmentType;
  label: string;
  badge: string;
  shortLabel: string;
  priceFrom: string;
  valueProp: string;
  description: string;
}

const SEGMENTS: Segment[] = [
  {
    id: 'business',
    label: 'Business',
    shortLabel: 'Business',
    badge: 'SME',
    priceFrom: 'R1,299+',
    valueProp: 'Always on',
    description: 'Zero downtime guarantee',
  },
  {
    id: 'wfh',
    label: 'Work from Home',
    shortLabel: 'SOHO',
    badge: 'SOHO',
    priceFrom: 'R799+',
    valueProp: 'Zoom-ready',
    description: 'Reliable for remote work',
  },
  {
    id: 'home',
    label: 'Home',
    shortLabel: 'Home',
    badge: 'HOME',
    priceFrom: 'R799+',
    valueProp: 'Netflix-ready',
    description: 'Stream, game & connect',
  },
];

interface SegmentTabsProps {
  activeSegment: SegmentType;
  onSegmentChange: (segment: SegmentType) => void;
  className?: string;
  variant?: 'light' | 'dark';
}

export function SegmentTabs({ activeSegment, onSegmentChange, className, variant = 'light' }: SegmentTabsProps) {
  const isDark = variant === 'dark';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile and update scroll indicators
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update scroll indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile) return;

    const updateScrollIndicators = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    };

    updateScrollIndicators();
    container.addEventListener('scroll', updateScrollIndicators);
    return () => container.removeEventListener('scroll', updateScrollIndicators);
  }, [isMobile]);

  // Scroll to active segment on mobile
  useEffect(() => {
    if (!isMobile || !scrollContainerRef.current) return;
    const activeIndex = SEGMENTS.findIndex(s => s.id === activeSegment);
    const container = scrollContainerRef.current;
    const cardWidth = container.scrollWidth / SEGMENTS.length;
    container.scrollTo({
      left: activeIndex * cardWidth - (container.clientWidth - cardWidth) / 2,
      behavior: 'smooth',
    });
  }, [activeSegment, isMobile]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className={cn('relative', className)}>
      {/* Mobile scroll buttons */}
      {isMobile && canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 shadow-md rounded-full flex items-center justify-center text-circleTel-navy"
          aria-label="Scroll left"
        >
          <PiCaretLeftBold className="w-5 h-5" />
        </button>
      )}
      {isMobile && canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 shadow-md rounded-full flex items-center justify-center text-circleTel-navy"
          aria-label="Scroll right"
        >
          <PiCaretRightBold className="w-5 h-5" />
        </button>
      )}

      {/* Segment Cards Container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex justify-center gap-3 sm:gap-4',
          // Mobile: horizontal scroll
          'sm:flex-wrap',
          isMobile && 'overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 -mx-4'
        )}
        role="tablist"
        aria-label="Select your connectivity needs"
      >
        {SEGMENTS.map((segment) => {
          const isActive = activeSegment === segment.id;

          return (
            <button
              key={segment.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${segment.id}`}
              onClick={() => onSegmentChange(segment.id)}
              className={cn(
                // Base styles - larger card format
                'flex-shrink-0 flex flex-col items-center p-4 sm:p-5 rounded-xl transition-all duration-200',
                'w-[140px] sm:w-[180px] md:w-[200px]',
                // Focus state for accessibility
                'focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:ring-offset-2',
                // Mobile snap
                isMobile && 'snap-center',
                // Active/Inactive states - support dark variant
                isActive
                  ? 'bg-circleTel-orange text-white shadow-lg scale-105'
                  : isDark
                    ? 'bg-white/10 backdrop-blur-sm text-white shadow-md hover:bg-white/20 hover:scale-[1.02] border border-white/20'
                    : 'bg-white text-circleTel-navy shadow-md hover:shadow-lg hover:scale-[1.02] border border-gray-100'
              )}
            >
              {/* Text Badge instead of Icon */}
              <div
                className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2 sm:mb-3',
                  isActive ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-circleTel-orange/10'
                )}
              >
                <span
                  className={cn(
                    'font-data text-sm sm:text-base font-bold',
                    isActive ? 'text-white' : isDark ? 'text-white' : 'text-circleTel-orange'
                  )}
                  aria-hidden="true"
                >
                  {segment.badge}
                </span>
              </div>

              {/* Label */}
              <span className="font-heading font-semibold text-sm sm:text-base mb-1">
                <span className="hidden sm:inline">{segment.label}</span>
                <span className="sm:hidden">{segment.shortLabel}</span>
              </span>

              {/* Price */}
              <span
                className={cn(
                  'font-heading font-bold text-lg sm:text-xl',
                  isActive ? 'text-white' : isDark ? 'text-white' : 'text-circleTel-navy'
                )}
              >
                {segment.priceFrom}
              </span>

              {/* Value Prop Badge */}
              <span
                className={cn(
                  'mt-2 px-2 py-0.5 rounded-full text-xs font-medium',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-circleTel-orange/10 text-circleTel-orange'
                )}
              >
                {segment.valueProp}
              </span>

              {/* Description - hidden on mobile */}
              <span
                className={cn(
                  'hidden sm:block mt-2 text-xs text-center',
                  isActive ? 'text-white/80' : 'text-circleTel-grey600'
                )}
              >
                {segment.description}
              </span>

              {/* Selected indicator */}
              {isActive && (
                <span className="mt-2 text-xs font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile scroll indicator dots */}
      {isMobile && (
        <div className="flex justify-center gap-2 mt-3">
          {SEGMENTS.map((segment) => (
            <button
              key={segment.id}
              onClick={() => onSegmentChange(segment.id)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                activeSegment === segment.id
                  ? 'bg-circleTel-orange w-4'
                  : 'bg-gray-300 hover:bg-gray-400'
              )}
              aria-label={`Select ${segment.label}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Export segment data for use in other components
export const SEGMENT_DATA: Record<SegmentType, {
  title: string;
  subtitle: string;
  tags: string[];
  priceFrom: number;
  badge: string;
  technologies: string;
  placeholder: string;
}> = {
  business: {
    title: 'Enterprise Solutions',
    subtitle: 'Always on · Zero downtime · Local support',
    tags: ['Always on', 'Zero downtime', 'Local support'],
    priceFrom: 1499,
    badge: 'Zero downtime',
    technologies: 'Fibre · 5G · LTE options available',
    placeholder: 'Enter your business address',
  },
  wfh: {
    title: 'Work from Home',
    subtitle: 'Reliable video calls · Fast uploads · Uninterrupted',
    tags: ['Video calls', 'Fast uploads', 'Business grade'],
    priceFrom: 799,
    badge: 'Zoom-ready',
    technologies: 'SkyFibre · MTN Tarana G1 Fixed Wireless',
    placeholder: 'Enter your home office address',
  },
  home: {
    title: 'Home Connectivity',
    subtitle: 'Streaming · Gaming · Smart home · Family WiFi',
    tags: ['Streaming', 'Gaming', 'Smart home', 'Family WiFi'],
    priceFrom: 799,
    badge: 'Netflix-ready',
    technologies: 'SkyFibre · MTN Tarana G1 Fixed Wireless',
    placeholder: 'Enter your home address',
  },
};
