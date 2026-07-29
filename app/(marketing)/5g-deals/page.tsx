import type { Metadata } from 'next';
import FiveGDealsPageClient from './FiveGDealsPageClient';

export const metadata: Metadata = {
  title: '5G Home Internet Deals | Fast Wireless Packages | CircleTel',
  description:
    'Browse CircleTel 5G home internet deals in South Africa. Speeds up to 100Mbps, free router, no landline required — just plug in and connect.',
  keywords: [
    '5G deals South Africa',
    '5G home internet',
    '5G Wi-Fi packages',
    'wireless internet deals',
    'no landline internet',
    'CircleTel 5G',
  ],
  openGraph: {
    title: '5G Home Internet Deals | CircleTel',
    description:
      '5G home internet deals in South Africa — speeds up to 100Mbps, free router, no landline required.',
    url: 'https://www.circletel.co.za/5g-deals',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/5g-deals',
  },
};

export default function FiveGDealsPage() {
  return <FiveGDealsPageClient />;
}
