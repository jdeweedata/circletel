'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewHero } from '@/components/home/NewHero';
import { PlanCards } from '@/components/home/PlanCards';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Testimonials } from '@/components/home/Testimonials';
import { FAQ } from '@/components/home/FAQ';

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = React.useState(false);

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
      <NewHero />
      <PlanCards />
      <HowItWorks />
      <Testimonials />
      <FAQ />
    </div>
  );
}
