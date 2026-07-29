import type { Metadata } from 'next';
import ConnectivityPageClient from './ConnectivityPageClient';

export const metadata: Metadata = {
  title: 'Business Connectivity | Wi-Fi as a Service, Fixed Wireless & Fibre | CircleTel',
  description:
    'Enterprise-grade Wi-Fi as a Service, fixed wireless and fibre connectivity for South African businesses. Managed, monitored and maintained by CircleTel — no capital expense.',
  keywords: [
    'Wi-Fi as a Service',
    'business connectivity South Africa',
    'fixed wireless internet',
    'business fibre',
    'managed Wi-Fi',
    'ISP South Africa',
  ],
  openGraph: {
    title: 'Business Connectivity | Wi-Fi as a Service, Fixed Wireless & Fibre | CircleTel',
    description:
      'Enterprise-grade Wi-Fi as a Service, fixed wireless and fibre connectivity for South African businesses — managed, monitored and maintained.',
    url: 'https://www.circletel.co.za/connectivity',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/connectivity',
  },
};

export default function ConnectivityPage() {
  return <ConnectivityPageClient />;
}
