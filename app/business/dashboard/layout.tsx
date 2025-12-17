'use client';

/**
 * Business Dashboard Layout
 *
 * Provides layout and authentication guard for B2B customer dashboard.
 * Uses the same CustomerAuthProvider as consumer dashboard.
 *
 * @module app/business/dashboard/layout
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { DashboardErrorBoundary } from '@/components/dashboard/ErrorBoundary';
import {
  BusinessDashboardHeader,
  BusinessDashboardSidebar,
  BusinessMobileNav,
} from '@/components/business-dashboard/navigation';

export default function BusinessDashboardLayout({
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
      const stored = localStorage.getItem('business-sidebar-collapsed');
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
          'business-sidebar-collapsed',
          JSON.stringify(newValue)
        );
      }
      return newValue;
    });
  };

  // Auth redirect
  useEffect(() => {
    if (!loading && !user && !session) {
      console.log('[BusinessDashboardLayout] No auth detected, redirecting...');
      const timeoutId = setTimeout(() => {
        router.push('/auth/login?redirect=/business/dashboard');
      }, 1500);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your business portal...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
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
    'Business User';

  // Get company name if available
  const companyName =
    (currentUser?.user_metadata as any)?.company_name || 'Your Business';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <BusinessDashboardHeader
        displayName={displayName}
        companyName={companyName}
        email={currentUser?.email || ''}
        onSignOut={handleSignOut}
      />

      {/* Main content area */}
      <div className="flex flex-1">
        {/* Sidebar - desktop only */}
        <BusinessDashboardSidebar
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

      {/* Footer - hidden on mobile */}
      <footer className="hidden lg:block border-t bg-white/80 backdrop-blur-sm mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>&copy; 2025 CircleTel Business. All rights reserved.</p>
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
      <BusinessMobileNav />
    </div>
  );
}
