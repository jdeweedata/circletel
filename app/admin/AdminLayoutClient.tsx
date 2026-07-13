'use client';
import { PiSpinnerBold } from 'react-icons/pi';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/admin/layout/Sidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import { createClient } from '@/lib/supabase/client';
import { getAdminRouteMode } from './admin-route-policy';
import dynamic from 'next/dynamic';

// Agentation: Visual UI feedback for AI coding agents (dev-only)
const Agentation = dynamic(
  () => import('agentation').then((mod) => mod.Agentation),
  { ssr: false }
);

interface AdminUser {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role?: string;
}

interface AdminAuthState {
  pathname: string | null;
  status: 'idle' | 'checking' | 'authenticated' | 'unauthenticated';
  user: AdminUser | null;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authState, setAuthState] = useState<AdminAuthState>({
    pathname: null,
    status: 'checking',
    user: null,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const protectedPathname = pathname ?? '';
  const supabase = createClient();

  // Check if we're on the studio subdomain (for Sanity CMS)
  const isStudioSubdomain =
    typeof window !== 'undefined' &&
    window.location.hostname.startsWith('studio.');
  const routeMode = getAdminRouteMode(pathname, isStudioSubdomain);
  const skipsAdminAuth =
    routeMode === 'public' || routeMode === 'full-screen-unguarded';

  // DEV BYPASS: Skip auth for all admin routes on localhost in development
  const isDev = process.env.NODE_ENV === 'development';
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');
  const devBypass = isDev && isLocalhost;

  // Fetch admin user from API (server-side validates session from cookies)
  useEffect(() => {
    if (skipsAdminAuth) {
      setAuthState({ pathname: null, status: 'idle', user: null });
      return;
    }

    // DEV BYPASS: Use mock user on localhost in development
    if (devBypass) {
      setAuthState({
        pathname: protectedPathname,
        status: 'authenticated',
        user: {
          id: 'dev-user',
          email: 'dev@localhost',
          first_name: 'Dev',
          last_name: 'User',
          role: 'super_admin',
        },
      });
      return;
    }

    let isCurrentPath = true;
    setAuthState({
      pathname: protectedPathname,
      status: 'checking',
      user: null,
    });

    const redirectUnauthorized = async (
      message: string,
      error: unknown
    ) => {
      if (!isCurrentPath) return;

      console.error(message, error);
      setAuthState({
        pathname: protectedPathname,
        status: 'unauthenticated',
        user: null,
      });
      await supabase.auth.signOut();

      if (isCurrentPath) {
        window.location.href = '/admin/login?error=unauthorized';
      }
    };

    const checkAuth = async () => {
      try {
        // Call API endpoint which validates session server-side from cookies
        const response = await fetch('/api/admin/me');
        const result = await response.json();

        if (!isCurrentPath) return;

        if (!response.ok || !result.success || !result.user) {
          await redirectUnauthorized('Admin user fetch error:', result.error);
          return;
        }

        setAuthState({
          pathname: protectedPathname,
          status: 'authenticated',
          user: result.user,
        });

        // If user just logged in and is on /admin root, redirect to dashboard
        if (protectedPathname === '/admin') {
          window.location.href = '/admin/dashboard';
        }
      } catch (error) {
        await redirectUnauthorized('Error loading user:', error);
      }
    };

    checkAuth();

    return () => {
      isCurrentPath = false;
    };
  }, [skipsAdminAuth, devBypass, supabase, protectedPathname]);

  // Public routes and the CMS builder preserve their existing auth bypass.
  if (skipsAdminAuth) {
    return <>{children}</>;
  }

  const authIsCurrent = authState.pathname === protectedPathname;

  // Never reveal a protected route until that exact pathname is validated.
  if (
    !authIsCurrent ||
    authState.status === 'idle' ||
    authState.status === 'checking'
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PiSpinnerBold className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  // Redirects are initiated only by an explicit failed result for this path.
  if (authState.status !== 'authenticated' || !authState.user) {
    return null;
  }

  const user = authState.user;

  // Authenticated full-screen routes skip only the standard admin shell.
  if (routeMode === 'full-screen-authenticated') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row print:block">
      {/* Sidebar - Hidden on mobile when closed, overlay when open */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
      />

      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content - Full width on mobile, adjusted for sidebar on desktop */}
      <div className="flex-1 flex flex-col min-h-screen w-full lg:ml-0">
        <AdminHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          onLogout={handleLogout}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Agentation: Visual UI feedback for AI coding agents (dev-only) */}
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </div>
  );
}
