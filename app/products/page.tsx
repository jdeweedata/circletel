import type { Metadata } from 'next';
import ProductsPageClient from './ProductsPageClient';

export const metadata: Metadata = {
  title: 'Connectivity Products & Packages | CircleTel South Africa',
  description:
    'Browse CircleTel internet packages for home, work-from-home, and business in South Africa. Fibre, 5G, and LTE with automatic failover, WhatsApp support, and one simple bill.',
  openGraph: {
    title: 'Connectivity Products & Packages | CircleTel',
    description:
      'Browse CircleTel internet packages for home, work-from-home, and business in South Africa. Fibre, 5G, and LTE with automatic failover and WhatsApp support.',
    url: 'https://www.circletel.co.za/products',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/products',
  },
};

export default function ProductsPage() {
  return <ProductsPageClient />;
}
