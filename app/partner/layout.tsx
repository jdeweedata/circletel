export const dynamic = 'force-dynamic';

import PartnerLayoutClient from './PartnerLayoutClient';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <PartnerLayoutClient>{children}</PartnerLayoutClient>;
}
