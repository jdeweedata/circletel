'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NewHero, type SegmentType } from '@/components/home/NewHero';
import { QuickActions } from '@/components/home/QuickActions';
import { PlanCards } from '@/components/home/PlanCards';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Testimonials } from '@/components/home/Testimonials';
import { FAQ } from '@/components/home/FAQ';

// Valid segment values
const VALID_SEGMENTS: SegmentType[] = ['business', 'wfh', 'home'];

function isValidSegment(value: string | null): value is SegmentType {
  return value !== null && VALID_SEGMENTS.includes(value as SegmentType);
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Get initial segment from URL or default to 'home'
  const urlSegment = searchParams.get('segment');
  const initialSegment: SegmentType = isValidSegment(urlSegment) ? urlSegment : 'home';
  const [activeSegment, setActiveSegment] = useState<SegmentType>(initialSegment);

  // Sync segment state with URL param on mount
  useEffect(() => {
    const urlSegment = searchParams.get('segment');
    if (isValidSegment(urlSegment) && urlSegment !== activeSegment) {
      setActiveSegment(urlSegment);
    }
  }, [searchParams, activeSegment]);

  // Update URL when segment changes
  const handleSegmentChange = useCallback((segment: SegmentType) => {
    setActiveSegment(segment);

    // Update URL without full page reload
    const url = new URL(window.location.href);
    if (segment === 'home') {
      // Remove param for default segment to keep URL clean
      url.searchParams.delete('segment');
    } else {
      url.searchParams.set('segment', segment);
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Detect OAuth redirect and forward to callback page
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');

      if (accessToken && !isRedirecting) {
        console.log('[Home] Detected OAuth redirect, forwarding to callback...');
        setIsRedirecting(true);
        // Forward to callback with hash and add next parameter for order flow
        window.location.href = `/auth/callback?next=/order/service-address${window.location.hash}`;
      }
    }
  }, [isRedirecting]);

  // Show loading state while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-circleTel-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NewHero
        activeSegment={activeSegment}
        onSegmentChange={handleSegmentChange}
      />
      <QuickActions />
      <PlanCards activeSegment={activeSegment} />
      <HowItWorks />
      <Testimonials activeSegment={activeSegment} />
      <FAQ />
    </div>
  );
}
