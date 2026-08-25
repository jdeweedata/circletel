export const dynamic = 'force-dynamic';

import type { Viewport } from 'next';
import PortalLayoutClient from '@/components/portal/PortalLayoutClient';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#F5841E',
};

export default function UnjaniLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutClient variant="unjani">{children}</PortalLayoutClient>;
}
