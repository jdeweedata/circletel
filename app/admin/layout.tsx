export const dynamic = 'force-dynamic';

import AdminLayoutClient from './AdminLayoutClient';
import './admin-theme.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
