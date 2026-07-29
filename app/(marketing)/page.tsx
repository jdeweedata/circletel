import { Suspense } from 'react';
import { type Metadata } from 'next';
import { HomePageClient } from '@/components/home/HomePageClient';

// Consumer-first metadata for the homepage — overrides the B2B default in app/layout.tsx.
// Message match: SEO/ad traffic landing on `/` is predominantly residential + WFH intent.
export const metadata: Metadata = {
  title: 'CircleTel — Uncapped Fibre & Wireless Internet from R899/mo',
  description:
    'Fast, uncapped internet for homes, remote workers and small businesses. No contracts, R0 setup, professional installation. Check coverage at your address in 30 seconds.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CircleTel — Uncapped Fibre & Wireless Internet from R899/mo',
    description:
      'Fast, uncapped internet for homes, remote workers and small businesses. No contracts, R0 setup. Check coverage at your address in 30 seconds.',
    url: 'https://www.circletel.co.za',
    siteName: 'CircleTel',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CircleTel — Uncapped Fibre & Wireless Internet',
      },
    ],
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CircleTel — Uncapped Fibre & Wireless Internet from R899/mo',
    description:
      'Fast, uncapped internet for homes, remote workers and small businesses. No contracts, R0 setup. Check coverage at your address in 30 seconds.',
    images: ['/og-image.jpg'],
  },
};

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomePageClient />
    </Suspense>
  );
}
