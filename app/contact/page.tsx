import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

// Re-exported so existing imports from '@/app/contact/page' (e.g. tests) keep working
export { offerEnquiryPrefix } from './ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact CircleTel | Sales & Support South Africa',
  description:
    'Get in touch with CircleTel for connectivity, managed IT, cloud, and security solutions. Call 082 487 3900, email contactus@circletel.co.za, or send us a message — we respond within 24 hours.',
  openGraph: {
    title: 'Contact CircleTel | Sales & Support South Africa',
    description:
      'Get in touch with CircleTel for connectivity, managed IT, cloud, and security solutions. We respond within 24 hours.',
    url: 'https://www.circletel.co.za/contact',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/contact',
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
