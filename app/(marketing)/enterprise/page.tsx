import type { Metadata } from 'next';
import EnterprisePageClient from './EnterprisePageClient';

export const metadata: Metadata = {
  title: 'Enterprise Connectivity Solutions | Office Parks & Venue Wi-Fi | CircleTel',
  description:
    'High-capacity connectivity for office parks, commercial venues and enterprise campuses. ParkConnect 60GHz mmWave backhaul and managed CloudWiFi WaaS with 99.99% uptime SLA.',
  keywords: [
    'enterprise connectivity South Africa',
    'office park internet',
    'venue Wi-Fi',
    'Wi-Fi as a Service',
    'mmWave wireless backhaul',
    'managed Wi-Fi enterprise',
  ],
  openGraph: {
    title: 'Enterprise Connectivity Solutions | CircleTel',
    description:
      'High-capacity connectivity for office parks, commercial venues and enterprise campuses — 99.99% uptime SLA and dedicated NOC monitoring.',
    url: 'https://www.circletel.co.za/enterprise',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/enterprise',
  },
};

export default function EnterprisePage() {
  return <EnterprisePageClient />;
}
