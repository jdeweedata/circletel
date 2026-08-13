'use client';

import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import AdminDashboard from '@/components/portal/AdminDashboard';
import SiteUserDashboard from '@/components/portal/SiteUserDashboard';

export default function PortalDashboardPage() {
  const { user, isAdmin } = usePortalAuth();

  if (!user) return null;

  return isAdmin ? <AdminDashboard user={user} /> : <SiteUserDashboard user={user} />;
}
