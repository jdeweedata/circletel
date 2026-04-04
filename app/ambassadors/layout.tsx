export const dynamic = 'force-dynamic';

import AmbassadorsLayoutClient from './AmbassadorsLayoutClient';

export default function AmbassadorsLayout({ children }: { children: React.ReactNode }) {
  return <AmbassadorsLayoutClient>{children}</AmbassadorsLayoutClient>;
}
