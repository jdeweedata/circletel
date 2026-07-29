import type { Metadata } from 'next';
import WirelessPageClient from './WirelessPageClient';

export const metadata: Metadata = {
  title: 'Wireless Internet — MTN 5G & LTE Packages | CircleTel South Africa',
  description:
    'Fast wireless internet on the MTN 5G and LTE network from CircleTel. Check coverage at your address, compare uncapped packages, and get connected in days — no phone line needed.',
  openGraph: {
    title: 'Wireless Internet — MTN 5G & LTE Packages | CircleTel',
    description:
      'Fast wireless internet on the MTN 5G and LTE network. Check coverage at your address, compare uncapped packages, and get connected in days.',
    url: 'https://www.circletel.co.za/wireless',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/wireless',
  },
};

export default function WirelessPage() {
  return <WirelessPageClient />;
}
