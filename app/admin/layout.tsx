'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/admin/layout/Sidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
  const publicRoutes = ['/admin/login', '/admin/signup', '/admin/forgot-password', '/admin/reset-password', '/admin/cms'];
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route)) || isStudioSubdomain;

  // Fetch admin user from API (server-side validates session from cookies)
  useEffect(() => {
    if (isPublicRoute) {
      setIsLoading(false);
      return;
    }

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
  }, [isPublicRoute, supabase, pathname]); // Added pathname

  // For public routes (login/signup), render without authentication check
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
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
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
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
    </div>
  );
}
