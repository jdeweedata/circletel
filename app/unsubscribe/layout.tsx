import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Preferences | CircleTel',
  description: 'Manage your marketing email subscriptions. Unsubscribe from promotional emails while continuing to receive important service notifications.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function UnsubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
