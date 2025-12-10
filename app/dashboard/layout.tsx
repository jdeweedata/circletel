'use client';

import { useEffect, useState, useMemo } from 'react';
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

  // CRITICAL: Detect payment return SYNCHRONOUSLY to prevent race condition
  // This must be computed immediately, not via useEffect, to prevent redirect before detection
  const isPaymentReturnFromUrl = useMemo(() => {
    const paymentMethod = searchParams.get('payment_method');
    const paymentStatus = searchParams.get('payment_status');
    const sessionRecovery = searchParams.get('session_recovery');
    return !!(paymentMethod || paymentStatus || sessionRecovery);
  }, [searchParams]);

  // Track when we can safely redirect (after grace period for session restoration)
  const [paymentReturnGracePeriodActive, setPaymentReturnGracePeriodActive] = useState(isPaymentReturnFromUrl);

  // Clear the grace period flag after session has had time to restore
  useEffect(() => {
    if (isPaymentReturnFromUrl) {
      setPaymentReturnGracePeriodActive(true);
      // Extended grace period (5 seconds) for session cookie restoration after external redirect
      const clearFlagTimeout = setTimeout(() => {
        setPaymentReturnGracePeriodActive(false);
      }, 5000);
      return () => clearTimeout(clearFlagTimeout);
    }
  }, [isPaymentReturnFromUrl]);

  // Combined flag: true if URL indicates payment return OR grace period is active
  const isPaymentReturn = isPaymentReturnFromUrl || paymentReturnGracePeriodActive;

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
    // During payment return, never redirect - wait for session to restore
    if (isPaymentReturn) {
      console.log('[DashboardLayout] Payment return detected, skipping auth redirect');
      return;
    }

    if (!loading && !user && !session) {
      console.log('[DashboardLayout] No auth detected, will redirect after delay...');
      // Extended delay to allow auth state to fully settle after external redirects
      const timeoutId = setTimeout(() => {
        console.log('[DashboardLayout] Executing redirect to login');
        router.push('/auth/login?redirect=/dashboard');
      }, 1000); // 1 second delay for better session recovery
      return () => clearTimeout(timeoutId);
    }
  }, [user, session, loading, router, isPaymentReturn]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Loading state - also show during payment return while session recovers
  // This is CRITICAL for payment returns - we must wait for session to restore from cookies
  const showLoading = loading || (isPaymentReturn && !user && !session);

  if (showLoading) {
    console.log('[DashboardLayout] Showing loading state', { loading, isPaymentReturn, hasUser: !!user, hasSession: !!session });
    return (
      <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-circleTel-secondaryNeutral">
            {isPaymentReturn ? 'Completing payment verification...' : 'Loading...'}
          </p>
          {isPaymentReturn && (
            <p className="text-sm text-circleTel-secondaryNeutral/70 mt-2">
              Restoring your session...
            </p>
          )}
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
