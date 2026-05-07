'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import { PiBuildings } from 'react-icons/pi';
import SiteListTable from '@/components/portal/SiteListTable';

export default function PortalSitesPage() {
  const { user, isAdmin, isSiteUser } = usePortalAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSiteUser && user?.site_id) {
      router.replace(`/portal/sites/${user.site_id}`);
    }
  }, [isSiteUser, user?.site_id, router]);

  if (!user) return null;

  if (isSiteUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PiBuildings className="w-7 h-7 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <p className="text-gray-500 mt-0.5">All sites for {user.organisation_name}</p>
        </div>
      </div>
      <SiteListTable />
    </div>
  );
}
