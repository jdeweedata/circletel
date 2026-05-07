'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PortalAuthProvider, usePortalAuth } from '@/lib/portal/portal-auth-provider';
import {
  PiSquaresFourBold,
  PiBuildings,
  PiCurrencyDollarBold,
  PiLifebuoyBold,
  PiSignOutBold,
  PiListBold,
  PiXBold,
  PiCaretDownBold,
} from 'react-icons/pi';
import { useState } from 'react';

const adminNavItems = [
  { href: '/portal', label: 'Dashboard', icon: PiSquaresFourBold, exact: true },
  { href: '/portal/sites', label: 'Sites', icon: PiBuildings },
  { href: '/portal/billing', label: 'Billing', icon: PiCurrencyDollarBold },
  { href: '/portal/support', label: 'Support', icon: PiLifebuoyBold },
];

const siteUserNavItems = [
  { href: '/portal', label: 'Dashboard', icon: PiSquaresFourBold, exact: true },
  { href: '/portal/billing', label: 'Billing', icon: PiCurrencyDollarBold },
  { href: '/portal/support', label: 'Support', icon: PiLifebuoyBold },
];

function PortalNav() {
  const { user, isAdmin, signOut } = usePortalAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = isAdmin ? adminNavItems : siteUserNavItems;

  if (!user) return null;

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/portal" className="flex items-center gap-2">
            <span className="text-xl font-bold text-circleTel-orange">CircleTel</span>
            <span className="text-sm text-gray-500">Portal</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
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

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-circleTel-orange/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-circleTel-orange">
                    {user.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                    {user.display_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[140px]">
                    {user.organisation_name}
                  </p>
                </div>
                <PiCaretDownBold className="w-4 h-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-3 border-b">
                      <p className="text-sm font-medium text-gray-900">{user.display_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-circleTel-orange/10 text-circleTel-orange capitalize">
                        {user.role === 'admin' ? 'Head Office' : 'Site User'}
                      </span>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <PiSignOutBold className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <PiXBold className="w-6 h-6" /> : <PiListBold className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t bg-white p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
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
  );
}

function PortalContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = usePortalAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === '/portal/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>&copy; 2026 CircleTel. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="hover:text-circleTel-orange">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-circleTel-orange">Terms of Service</Link>
              <Link href="/contact" className="hover:text-circleTel-orange">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PortalLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthProvider>
      <PortalContent>{children}</PortalContent>
    </PortalAuthProvider>
  );
}
