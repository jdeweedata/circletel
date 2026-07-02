'use client';
import React from 'react';
import { PiHouseBold, PiBriefcaseBold, PiBuildingsBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import type { CoverageSegment } from '@/lib/coverage/customer-segments';

const SEGMENTS: Array<{
  value: CoverageSegment;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}> = [
  { value: 'residential', label: 'Home', shortLabel: 'Home', icon: PiHouseBold },
  { value: 'wfh', label: 'Work from Home', shortLabel: 'SOHO', icon: PiBriefcaseBold },
  { value: 'business', label: 'Business', shortLabel: 'Business', icon: PiBuildingsBold },
];

interface SegmentToggleProps {
  activeSegment: CoverageSegment;
  onSegmentChange: (segment: CoverageSegment) => void;
}

/**
 * Home / Work-from-home / Business switcher for the package results page.
 * Light-theme sibling of the homepage hero segment pills.
 */
export function SegmentToggle({ activeSegment, onSegmentChange }: SegmentToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1">
      {SEGMENTS.map((segment) => {
        const Icon = segment.icon;
        const isActive = activeSegment === segment.value;
        return (
          <button
            key={segment.value}
            type="button"
            onClick={() => onSegmentChange(segment.value)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              'focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:ring-offset-1',
              isActive
                ? 'bg-white text-circleTel-orange shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{segment.label}</span>
            <span className="sm:hidden">{segment.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
