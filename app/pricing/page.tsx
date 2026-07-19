import type { Metadata } from 'next';
import PricingPageClient from './PricingPageClient';

export const metadata: Metadata = {
  title: 'IT Pricing & Service Plans | CircleTel South Africa',
  description:
    'Transparent monthly IT service pricing for South African businesses. Managed IT plans from R2,500/month — help desk support, security, cloud, and backups with no hidden fees.',
  openGraph: {
    title: 'IT Pricing & Service Plans | CircleTel South Africa',
    description:
      'Transparent monthly IT service pricing for South African businesses. Managed IT plans from R2,500/month with no hidden fees.',
    url: 'https://www.circletel.co.za/pricing',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/pricing',
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
