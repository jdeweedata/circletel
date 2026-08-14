export const dynamic = 'force-dynamic';

import PortalLayoutClient from '@/components/portal/PortalLayoutClient';

export default function BusinessPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalLayoutClient variant="business">{children}</PortalLayoutClient>;
}
