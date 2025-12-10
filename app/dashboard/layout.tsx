'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const { user, session, signOut, loading } = useCustomerAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPaymentReturn, setIsPaymentReturn] = useState(false);

  // Detect if this is a payment return (e.g., from NetCash)
  useEffect(() => {
    const paymentMethod = searchParams.get('payment_method');
    const paymentStatus = searchParams.get('payment_status');
    const sessionRecovery = searchParams.get('session_recovery');
    if (paymentMethod || paymentStatus || sessionRecovery) {
      setIsPaymentReturn(true);
      // Clear the flag after a longer delay to allow session to fully restore
      const clearFlagTimeout = setTimeout(() => {
        setIsPaymentReturn(false);
      }, 3000); // 3 second grace period for payment returns
      return () => clearTimeout(clearFlagTimeout);
    }
  }, [searchParams]);

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
  // Skip redirect during payment return flow to allow session to restore from cookies
  useEffect(() => {
    if (!loading && !user && !session && !isPaymentReturn) {
      // Extended delay to allow auth state to fully settle after external redirects
      // Payment returns especially need more time for session cookie restoration
      const timeoutId = setTimeout(() => {
        // Double-check isPaymentReturn hasn't been set during the timeout
        if (!isPaymentReturn) {
          router.push('/auth/login?redirect=/dashboard');
        }
      }, 500); // Increased from 100ms to 500ms for better session recovery
      return () => clearTimeout(timeoutId);
    }
  }, [user, session, loading, router, isPaymentReturn]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Loading state - also show during payment return while session recovers
  if (loading || (isPaymentReturn && !user && !session)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-circleTel-secondaryNeutral">
            {isPaymentReturn ? 'Completing payment...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated - check both user and session (but allow payment returns time to restore)
  if (!user && !session && !isPaymentReturn) {
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
