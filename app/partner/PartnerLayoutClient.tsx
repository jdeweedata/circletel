'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  PartnerNavProvider,
  PartnerHeader,
  PartnerSidebar,
  PartnerMobileNav,
} from '@/components/partners/navigation';

interface Partner {
  id: string;
  business_name: string;
  status: string;
  email: string;
}

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Public routes that don't require authentication
  const isPublicRoute =
    pathname?.startsWith('/partner/onboarding') || pathname === '/partner/login';

  // Initialize sidebar state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('partner-sidebar-collapsed');
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
          'partner-sidebar-collapsed',
          JSON.stringify(newValue)
        );
      }
      return newValue;
    });
  };

  // Get user session and partner data
  useEffect(() => {
    const supabase = createClient();

    const getPartnerData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Fetch partner record for this user
          const { data: partnerData, error } = await supabase
            .from('partners')
            .select('id, business_name, status, email')
            .eq('user_id', user.id)
            .single();

          if (!error && partnerData) {
            setPartner(partnerData);
          }
        }
      } catch (error) {
        console.error('Error getting partner data:', error);
      } finally {
        setLoading(false);
      }
    };

    getPartnerData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setPartner(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/partner/login');
  };

  // If it's a public onboarding route, render without auth
  if (isPublicRoute) {
    return <>{children}</>;
  }

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

  // Not authenticated - redirect to login
  if (!user) {
    router.push('/partner/login');
    return null;
  }

  // No partner record - redirect to onboarding
  if (!partner) {
    router.push('/partner/onboarding');
    return null;
  }

  // Partner not approved - show pending/rejected message
  if (partner.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-circleTel-lightNeutral flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {partner.status === 'pending' ? 'Application Under Review' : 'Application Status'}
          </h2>
          <p className="text-gray-600 mb-6">
            {partner.status === 'pending'
              ? 'Your partner application is currently being reviewed. We\'ll notify you once it\'s approved.'
              : partner.status === 'rejected'
                ? 'Unfortunately, your application was not approved. Please contact support for more information.'
                : `Your application status is: ${partner.status}`}
          </p>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-circleTel-orange transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Get user display name
  const displayName =
    partner.business_name ||
    [user?.user_metadata?.firstName, user?.user_metadata?.lastName]
      .filter(Boolean)
      .join(' ') ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Partner';

  // Approved partner - show full portal
  return (
    <PartnerNavProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header with tabs (desktop) */}
        <PartnerHeader
          displayName={displayName}
          email={partner.email || user?.email || ''}
          onSignOut={handleSignOut}
        />

        {/* Main content area */}
        <div className="flex flex-1">
          {/* Context-aware sidebar - desktop only */}
          <PartnerSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
          />

          {/* Page content */}
          <main className="flex-1 min-w-0">
            <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">{children}</div>
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <PartnerMobileNav />
      </div>
    </PartnerNavProvider>
  );
}
