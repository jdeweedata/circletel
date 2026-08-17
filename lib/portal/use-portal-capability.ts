'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalAuth } from '@/lib/portal/portal-auth-provider';
import { usePortalApp } from '@/lib/portal/portal-app-context';
import type { PortalCapability } from '@/lib/portal/access-templates';

export function usePortalCapability(capability: PortalCapability) {
  const { user, loading, canAccess } = usePortalAuth();
  const { href } = usePortalApp();
  const router = useRouter();
  const allowed = !!user && canAccess(capability);

  useEffect(() => {
    if (loading) return;
    if (!allowed) router.replace(href('/'));
  }, [allowed, href, loading, router]);

  return { user, loading, allowed };
}
