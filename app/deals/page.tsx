import { Suspense } from 'react';
import type { Metadata } from 'next';
import DealsPageClient from './DealsPageClient';

export const metadata: Metadata = {
  title: 'Business Mobile Deals | CircleTel South Africa',
  description:
    'Browse CircleTel business mobile deals — smartphone contracts and SIM-only options on LTE and 5G. Flexible terms, generous data bundles, and competitive monthly pricing.',
  openGraph: {
    title: 'Business Mobile Deals | CircleTel South Africa',
    description:
      'Smartphone contracts and SIM-only mobile deals for South African businesses on LTE and 5G, with flexible terms and competitive pricing.',
    url: 'https://www.circletel.co.za/deals',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/deals',
  },
};

export default function DealsPage() {
  // DealsPageClient calls useSearchParams(); the Suspense boundary keeps the
  // route buildable if the root layout's force-dynamic is ever narrowed.
  return (
    <Suspense fallback={null}>
      <DealsPageClient />
    </Suspense>
  );
}
