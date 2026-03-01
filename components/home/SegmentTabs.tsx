'use client';

import React from 'react';
import { Building2, Briefcase, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SegmentType = 'business' | 'wfh' | 'home';

interface Segment {
  id: SegmentType;
  label: string;
  icon: React.ElementType;
  shortLabel: string;
}

const SEGMENTS: Segment[] = [
  {
    id: 'business',
    label: 'Business',
    shortLabel: 'Business',
    icon: Building2,
  },
  {
    id: 'wfh',
    label: 'Work from Home',
    shortLabel: 'WFH',
    icon: Briefcase,
  },
  {
    id: 'home',
    label: 'Home',
    shortLabel: 'Home',
    icon: Home,
  },
];

interface SegmentTabsProps {
  activeSegment: SegmentType;
  onSegmentChange: (segment: SegmentType) => void;
  className?: string;
}

export function SegmentTabs({ activeSegment, onSegmentChange, className }: SegmentTabsProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="inline-flex gap-2 p-1">
        {SEGMENTS.map((segment) => {
          const Icon = segment.icon;
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
                // Base styles - rectangular with subtle rounded corners
                'flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200',
                // Focus state for accessibility
                'focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:ring-offset-2',
                isActive
                  ? 'bg-circleTel-orange text-white shadow-md'
                  : 'bg-circleTel-grey200 text-circleTel-navy hover:bg-[#FDF2E9]'
              )}
            >
              <Icon
                className={cn('h-4 w-4 sm:h-5 sm:w-5', isActive ? 'text-white' : 'text-circleTel-navy')}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{segment.label}</span>
              <span className="sm:hidden">{segment.shortLabel}</span>
            </button>
          );
        })}
      </div>
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
    subtitle: 'Dedicated lines · SLA guarantee · 24/7 support',
    tags: ['Dedicated lines', 'SLA guarantee', '24/7 support'],
    priceFrom: 1499,
    badge: '99.9% Uptime SLA',
    technologies: 'Fibre · 5G · LTE options available',
    placeholder: 'Enter your business address',
  },
  wfh: {
    title: 'Work from Home',
    subtitle: 'Reliable video calls · Fast uploads · Uninterrupted',
    tags: ['Video calls', 'Fast uploads', 'Business grade'],
    priceFrom: 449,
    badge: 'Zoom-ready',
    technologies: 'Fibre · 5G · LTE options available',
    placeholder: 'Enter your home office address',
  },
  home: {
    title: 'Home Connectivity',
    subtitle: 'Streaming · Gaming · Smart home · Family WiFi',
    tags: ['Streaming', 'Gaming', 'Smart home', 'Family WiFi'],
    priceFrom: 299,
    badge: 'Netflix-ready',
    technologies: 'Fibre · 5G · LTE options available',
    placeholder: 'Enter your home address',
  },
};
