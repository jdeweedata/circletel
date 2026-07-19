import type { Metadata } from 'next';
import ServicesPageClient from './ServicesPageClient';

export const metadata: Metadata = {
  title: 'Managed IT Services | CircleTel South Africa',
  description:
    'CircleTel Managed IT Services for South African businesses — connectivity plus IT support from one provider. Save 30-40% vs separate vendors, with WhatsApp support and one simple bill.',
  openGraph: {
    title: 'Managed IT Services | CircleTel',
    description:
      'Connectivity plus managed IT support from one provider. Save 30-40% vs separate vendors, with WhatsApp support and one simple bill.',
    url: 'https://www.circletel.co.za/services',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/services',
  },
};

export default function ServicesPage() {
  return <ServicesPageClient />;
}
