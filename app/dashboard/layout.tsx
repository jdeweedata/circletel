'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { DashboardErrorBoundary } from '@/components/dashboard/ErrorBoundary';
import {
  DashboardHeader,
  DashboardSidebar,
  MobileBottomNav,
  DashboardNavProvider,
} from '@/components/dashboard/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, session, signOut, loading } = useCustomerAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize sidebar state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dashboard-sidebar-collapsed');
      if (stored) {
        setSidebarCollapsed(JSON.parse(stored));
      }
    }
  }, []);

  // Persist sidebar state
  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'dashboard-sidebar-collapsed',
          JSON.stringify(newValue)
        );
      }
      return newValue;
    });
  };

  // Auth redirect - with race condition protection
  // Check both user AND session to prevent premature redirects during auth initialization
  useEffect(() => {
    if (!loading && !user && !session) {
      // Small delay to allow auth state to fully settle after provider initialization
      const timeoutId = setTimeout(() => {
        router.push('/auth/login?redirect=/dashboard');
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [user, session, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-circleTel-secondaryNeutral">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - check both user and session
  if (!user && !session) {
    return null;
  }

  // Get user from state or session as fallback
  const currentUser = user || session?.user;

  // Get user display name
  const displayName =
    [currentUser?.user_metadata?.firstName, currentUser?.user_metadata?.lastName]
      .filter(Boolean)
      .join(' ') ||
    (currentUser?.user_metadata as any)?.full_name ||
    (currentUser?.user_metadata as any)?.name ||
    (currentUser?.email ? currentUser.email.split('@')[0] : '') ||
    'User';

  return (
    <DashboardNavProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header with tabs (desktop) */}
        <DashboardHeader
          displayName={displayName}
          email={currentUser?.email || ''}
          onSignOut={handleSignOut}
        />

        {/* Main content area */}
        <div className="flex flex-1">
          {/* Context-aware sidebar - desktop only */}
          <DashboardSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
          />

          {/* Page content */}
          <main className="flex-1 min-w-0">
            <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
              <DashboardErrorBoundary>{children}</DashboardErrorBoundary>
            </div>
          </main>
        </div>

        {/* Footer - hidden on mobile to avoid overlap with bottom nav */}
        <footer className="hidden lg:block border-t bg-white/80 backdrop-blur-sm mt-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-circleTel-secondaryNeutral">
              <p>&copy; 2025 CircleTel. All rights reserved.</p>
              <div className="flex gap-6">
                <Link
                  href="/privacy-policy"
                  className="hover:text-circleTel-orange transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-circleTel-orange transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-circleTel-orange transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </footer>

        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>
    </DashboardNavProvider>
  );
}
