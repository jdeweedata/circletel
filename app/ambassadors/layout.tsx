'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Link2,
  DollarSign,
  FolderOpen,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Ambassador {
  id: string;
  full_name: string;
  email: string;
  ambassador_number: string | null;
  tier: string;
  status: string;
  total_clicks: number;
  total_conversions: number;
  total_earnings: number;
  pending_earnings: number;
}

const navItems = [
  { href: '/ambassadors', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ambassadors/codes', label: 'My Codes', icon: Link2 },
  { href: '/ambassadors/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/ambassadors/assets', label: 'Marketing Assets', icon: FolderOpen },
];

export default function AmbassadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Public routes that don't require authentication
  const publicRoutes = ['/ambassadors/register', '/ambassadors/login'];
  const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route));

  useEffect(() => {
    if (isPublicRoute) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/ambassadors/login');
          return;
        }

        // Fetch ambassador data
        const { data: ambassadorData, error } = await supabase
          .from('ambassadors')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error || !ambassadorData) {
          // User exists but not an ambassador - redirect to register
          router.push('/ambassadors/register');
          return;
        }

        if (ambassadorData.status === 'pending') {
          // Show pending approval message (handled in page)
          if (isMounted) {
            setAmbassador(ambassadorData);
          }
        } else if (ambassadorData.status === 'suspended') {
          // Account suspended
          router.push('/ambassadors/login?error=suspended');
          return;
        } else {
          if (isMounted) {
            setAmbassador(ambassadorData);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/ambassadors/login');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [isPublicRoute, router, supabase, pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Public routes render without layout
  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!ambassador) {
    return null;
  }

  // Pending approval state
  if (ambassador.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Under Review
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for applying to become a CircleTel Ambassador! We&apos;re
            reviewing your application and will notify you once approved.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This usually takes 1-2 business days.
          </p>
          <button
            onClick={handleSignOut}
            className="text-circleTel-orange hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const tierColors: Record<string, string> = {
    starter: 'bg-gray-100 text-gray-700',
    rising: 'bg-blue-100 text-blue-700',
    star: 'bg-purple-100 text-purple-700',
    elite: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/ambassadors" className="flex items-center gap-2">
              <span className="text-xl font-bold text-circleTel-orange">
                CircleTel
              </span>
              <span className="text-sm text-gray-500">Ambassador</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/ambassadors'
                    ? pathname === '/ambassadors'
                    : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                      isActive
                        ? 'bg-circleTel-orange/10 text-circleTel-orange'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Stats Quick View - Desktop */}
              <div className="hidden lg:flex items-center gap-4 text-sm">
                <div className="text-right">
                  <p className="text-gray-500">Pending</p>
                  <p className="font-semibold text-green-600">
                    R{ambassador.pending_earnings.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-circleTel-orange/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-circleTel-orange">
                      {ambassador.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                      {ambassador.full_name}
                    </p>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full capitalize',
                        tierColors[ambassador.tier]
                      )}
                    >
                      {ambassador.tier}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
                      <div className="p-3 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {ambassador.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ambassador.ambassador_number || 'Pending approval'}
                        </p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t bg-white p-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/ambassadors'
                    ? pathname === '/ambassadors'
                    : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium',
                      isActive
                        ? 'bg-circleTel-orange/10 text-circleTel-orange'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>&copy; 2026 CircleTel. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="hover:text-circleTel-orange">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-circleTel-orange">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-circleTel-orange">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
