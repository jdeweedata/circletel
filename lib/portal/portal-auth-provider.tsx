'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export interface PortalUser {
  id: string;
  auth_user_id: string;
  organisation_id: string;
  site_id: string | null;
  role: 'admin' | 'site_user';
  display_name: string;
  email: string;
  organisation_name: string;
  organisation_code: string;
  site_name: string | null;
}

interface PortalAuthContextType {
  user: PortalUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSiteUser: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isExcludedPath =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/partners') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/ambassadors');

  const fetchPortalUser = React.useCallback(async () => {
    try {
      const response = await fetch('/api/portal/me');
      if (!response.ok) {
        setUser(null);
        return;
      }
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isExcludedPath) {
      setLoading(false);
      return;
    }

    if (!pathname?.startsWith('/portal') || pathname === '/portal/login') {
      setLoading(false);
      return;
    }

    fetchPortalUser();
  }, [isExcludedPath, pathname, fetchPortalUser]);

  const signOut = React.useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/portal/login');
  }, [router]);

  const value: PortalAuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSiteUser: user?.role === 'site_user',
    signOut,
    refresh: fetchPortalUser,
  };

  return (
    <PortalAuthContext.Provider value={value}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);
  if (context === undefined) {
    throw new Error('usePortalAuth must be used within a PortalAuthProvider');
  }
  return context;
}
