import type { Metadata } from 'next';
import { FiveGDealsListing } from '@/components/products/five-g/FiveGDealsListing';
import { getFiveGDealsPackages } from '@/lib/products/five-g-deals';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '5G 60 + router at R649/month | CircleTel',
  description:
    'Uncapped 5G 60 + router R649/month until 30 Sep, R50 under MTN shop. Uncapped 20 Mbps + router R549. Check coverage. Ts&Cs apply.',
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
    title: '5G 60 + router at R649/month | CircleTel',
    description:
      'Uncapped 5G 60 + router R649/month until 30 Sep, R50 under MTN shop. Uncapped 20 Mbps + router R549. Ts&Cs apply.',
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
