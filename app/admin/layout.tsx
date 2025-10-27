'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/admin/layout/Sidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, validateSession } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ['/admin/login', '/admin/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Skip validation for public routes
    if (!isPublicRoute) {
      validateSession();
    }
  }, [isPublicRoute, validateSession]);

  // For public routes (login/signup), render without authentication check
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/admin/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
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
