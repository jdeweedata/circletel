export const dynamic = 'force-dynamic';

import PortalLayoutClient from '@/components/portal/PortalLayoutClient';

export default function UnjaniLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutClient variant="unjani">{children}</PortalLayoutClient>;
}
