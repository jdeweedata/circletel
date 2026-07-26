'use client';
import { PiSpinnerBold } from 'react-icons/pi';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/admin/layout/Sidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import { ConsoleShell } from '@/components/backend';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';

// Agentation: Visual UI feedback for AI coding agents (dev-only)
const Agentation = dynamic(
  () => import('agentation').then((mod) => mod.Agentation),
  { ssr: false }
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  // Check if we're on the studio subdomain (for Sanity CMS)
  const isStudioSubdomain = typeof window !== 'undefined' && window.location.hostname.startsWith('studio.');

  // Public routes that don't require authentication
  const publicRoutes = ['/admin/login', '/admin/signup', '/admin/forgot-password', '/admin/reset-password', '/admin/sales/feasibility/designs'];
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route)) || isStudioSubdomain;

  // DEV BYPASS: Skip auth for all admin routes on localhost in development
  const isDev = process.env.NODE_ENV === 'development';
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const devBypass = isDev && isLocalhost;

  // Full-screen routes that use their own layout (no admin sidebar/header)
  const fullScreenRoutes = ['/admin/cms/builder'];
  const isFullScreenRoute = fullScreenRoutes.some(route => pathname?.startsWith(route));

  // Fetch admin user from API (server-side validates session from cookies)
  useEffect(() => {
    if (isPublicRoute) {
      setIsLoading(false);
      return;
    }

    // DEV BYPASS: Use mock user on localhost in development
    if (devBypass) {
      setUser({
        id: 'dev-user',
        email: 'dev@localhost',
        first_name: 'Dev',
        last_name: 'User',
        role: 'super_admin',
      });
      setIsLoading(false);
      return;
    }

    // For full-screen routes, still check auth but don't set user state
    // (the page will handle its own loading state)

    let isMounted = true;
    const checkAuth = async () => {
      try {
        // Call API endpoint which validates session server-side from cookies
        const response = await fetch('/api/admin/me');
        const result = await response.json();

        if (!isMounted) return;

        if (!response.ok || !result.success || !result.user) {
          // Not authenticated or not an admin user
          console.error('Admin user fetch error:', result.error);
          await supabase.auth.signOut(); // Clear any client-side session
          window.location.href = '/admin/login?error=unauthorized';
          return;
        }

        // Set user from API response
        setUser(result.user);

        // If user just logged in and is on /admin root, redirect to dashboard
        if (pathname === '/admin') {
          window.location.href = '/admin/dashboard';
        }
      } catch (error) {
        console.error('Error loading user:', error);
        if (isMounted) {
          await supabase.auth.signOut();
          window.location.href = '/admin/login?error=unauthorized';
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [isPublicRoute, devBypass, supabase, pathname]);

  // For public routes (login/signup), render without authentication check
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For full-screen routes (like CMS builder), render without admin wrapper
  // These routes handle their own auth and layout
  if (isFullScreenRoute) {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PiSpinnerBold className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  // If no user after loading completes, middleware should have redirected
  // This is a safety check
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login?error=unauthorized';
    }
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  return (
    <>
      <ConsoleShell
        sidebar={
          <>
            <Sidebar
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              user={user}
            />
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </>
        }
        topbar={
          <AdminHeader
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            user={user}
            onLogout={handleLogout}
            sidebarOpen={sidebarOpen}
          />
        }
        mainClassName="w-full"
        contentClassName="w-full"
      >
        <div className="mx-auto max-w-full">{children}</div>
      </ConsoleShell>

      {/* Agentation: Visual UI feedback for AI coding agents (dev-only) */}
      {process.env.NODE_ENV === 'development' && <Agentation />}
    </>
  );
}
