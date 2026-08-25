import type { Metadata } from 'next';
import { FiveGDealsListing } from '@/components/products/five-g/FiveGDealsListing';
import { getFiveGDealsPackages } from '@/lib/products/five-g-deals';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '5G home internet, minus the runaround | CircleTel',
  description:
    'Promo to 30 Sep. Router included on 24-month 5G deals from R549/month. Check coverage. Ts&Cs apply.',
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
    title: '5G home internet, minus the runaround | CircleTel',
    description:
      'Promo to 30 Sep. Router included on 24-month 5G deals from R549/month. Check coverage. Ts&Cs apply.',
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
