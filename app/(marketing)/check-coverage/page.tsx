import { Suspense } from 'react';
import { type Metadata } from 'next';
import { CheckCoverageContent } from './CheckCoverageContent';

export const metadata: Metadata = {
  title: 'Check SkyFibre Coverage | CircleTel Business Internet',
  description:
    'Check if SkyFibre Business wireless broadband is available at your address. 100 Mbps uncapped from R1,299/mo. Free installation. No contract.',
  keywords: 'coverage check, SkyFibre, business internet, CircleTel, check availability',
  alternates: {
    canonical: 'https://circletel.co.za/check-coverage',
  },
  openGraph: {
    title: 'Check SkyFibre Coverage at Your Address',
    description:
      'Check if SkyFibre Business wireless broadband is available at your address. 100 Mbps uncapped from R1,299/mo.',
  },
};

function HeroSkeleton() {
  return (
    <div className="min-h-screen bg-[#13274A] animate-pulse">
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="h-8 bg-white/10 rounded-full w-40 mb-6" />
        <div className="h-12 bg-white/10 rounded w-3/4 mb-4" />
        <div className="h-6 bg-white/10 rounded w-1/2 mb-8" />
        <div className="h-14 bg-white/10 rounded-xl mb-4" />
        <div className="h-14 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}

export default function CheckCoveragePage() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <CheckCoverageContent />
    </Suspense>
  );
}
