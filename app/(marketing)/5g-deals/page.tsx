import type { Metadata } from 'next';
import FiveGDealsPageClient from './FiveGDealsPageClient';

export const metadata: Metadata = {
  title: '5G Home Internet Deals | Fast Wireless Packages | CircleTel',
  description:
    'Promo to 30 Sep: Uncapped 5G 60 + router R579 (MTN R699) and Uncapped 20 Mbps + router R499 (MTN R599). Month-to-month is SIM only.',
  keywords: [
    '5G deals South Africa',
    '5G home internet',
    '5G Wi-Fi packages',
    'wireless internet deals',
    'no landline internet',
    'CircleTel 5G',
    'month-to-month 5G',
    '5G contract with router',
  ],
  openGraph: {
    title: '5G Home Internet Deals | CircleTel',
    description:
      'Promo: 5G 60 + router R579 vs MTN R699. 20 Mbps + router R499 vs MTN R599.',
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
