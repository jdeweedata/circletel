import type { Metadata } from 'next';
import { FiveGDealsListing } from '@/components/products/five-g/FiveGDealsListing';
import { getFiveGDealsPackages } from '@/lib/products/five-g-deals';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '5G Home Internet Deals | Fast Wireless Packages | CircleTel',
  description:
    'Promo to 30 Sep: Uncapped 5G 60 + router R649 (MTN R699) and Uncapped 20 Mbps + router R549 (MTN R599). Month-to-month is SIM only.',
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
      'Promo: 5G 60 + router R649 vs MTN R699. 20 Mbps + router R549 vs MTN R599.',
    url: 'https://www.circletel.co.za/5g-deals',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/5g-deals',
  },
};

export default async function FiveGDealsPage() {
  const packages = await getFiveGDealsPackages();
  return <FiveGDealsListing packages={packages} />;
}
