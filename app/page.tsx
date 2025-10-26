'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { HeroWithTabs } from '@/components/home/HeroWithTabs';
import { ValueProposition } from '@/components/home/ValueProposition';
import { ServicesSnapshot } from '@/components/home/ServicesSnapshot';
import { SuccessStories } from '@/components/home/SuccessStories';
import { LeadMagnet } from '@/components/home/LeadMagnet';
import { BlogPreview } from '@/components/home/BlogPreview';
import { Footer } from '@/components/layout/Footer';

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5831F] mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroWithTabs />
        <ValueProposition />
        <ServicesSnapshot />
        <SuccessStories />
        <LeadMagnet />
        <BlogPreview />
      </main>
      <Footer />
    </div>
  );
}