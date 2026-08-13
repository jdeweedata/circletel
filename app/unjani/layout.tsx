export const dynamic = 'force-dynamic';

import PortalLayoutClient from './PortalLayoutClient';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalLayoutClient>{children}</PortalLayoutClient>;
}
