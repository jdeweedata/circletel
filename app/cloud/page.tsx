import type { Metadata } from 'next';
import CloudPageClient from './CloudPageClient';

export const metadata: Metadata = {
  title: 'Cloud & Hosting Solutions | Web Hosting, Backup & Virtual Desktops | CircleTel',
  description:
    'CircleCloud business web hosting from R199/mo, cloud backup, migration services and virtual desktops for South African businesses. 99.9% uptime SLA with local support.',
  keywords: [
    'cloud hosting South Africa',
    'business web hosting',
    'cloud backup',
    'cloud migration',
    'virtual desktops',
    'CircleCloud',
  ],
  openGraph: {
    title: 'Cloud & Hosting Solutions | CircleTel',
    description:
      'Business-grade web hosting, cloud backup, migration services and virtual desktops for South African businesses — 99.9% uptime SLA with local support.',
    url: 'https://www.circletel.co.za/cloud',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/cloud',
  },
};

export default function CloudPage() {
  return <CloudPageClient />;
}
