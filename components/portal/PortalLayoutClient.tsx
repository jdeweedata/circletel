'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Archivo } from 'next/font/google';
import { cn } from '@/lib/utils';
import { PortalAuthProvider, usePortalAuth } from '@/lib/portal/portal-auth-provider';
import {
  PortalAppProvider,
  usePortalApp,
  type PortalAppVariant,
} from '@/lib/portal/portal-app-context';
import '@/components/portal/modernist/tokens.css';
import {
  PiSquaresFourBold,
  PiBuildings,
  PiCurrencyDollarBold,
  PiLifebuoyBold,
  PiSignOutBold,
  PiListBold,
  PiXBold,
  PiCaretDownBold,
  PiUsersThreeBold,
  PiMapPinAreaBold,
} from 'react-icons/pi';
import { useState } from 'react';

/**
 * The portal is set in Archivo, matching the modernist mockups. Loaded as the
 * variable font so the 500/700 weights the screens use render as themselves
 * rather than being substituted from a pinned subset.
 */
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

function PortalNav() {
  const { user, isAdmin, signOut } = usePortalAuth();
  const { href, isUnjani } = usePortalApp();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const adminNavItems = [
    { href: href('/'), label: 'Dashboard', icon: PiSquaresFourBold, exact: true },
    { href: href('/sites'), label: 'Sites', icon: PiBuildings },
    ...(isUnjani
      ? [{ href: href('/coverage'), label: 'Coverage', icon: PiMapPinAreaBold }]
      : []),
    { href: href('/billing'), label: 'Billing', icon: PiCurrencyDollarBold },
    { href: href('/support'), label: 'Support', icon: PiLifebuoyBold },
    { href: href('/team'), label: 'Team', icon: PiUsersThreeBold },
  ];

  const siteUserNavItems = [
    { href: href('/'), label: 'Dashboard', icon: PiSquaresFourBold, exact: true },
    { href: href('/billing'), label: 'Billing', icon: PiCurrencyDollarBold },
    { href: href('/support'), label: 'Support', icon: PiLifebuoyBold },
  ];

  const navItems = isAdmin ? adminNavItems : siteUserNavItems;

  if (!user) return null;

  return (
    <header
      className="sticky top-0 z-50 bg-white"
      style={{ borderBottom: '1px solid #E5E7EB' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={href('/')} className="flex items-center gap-2.5">
            <Image
              src="/images/circletel-enclosed-logo.svg"
              alt="CircleTel"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="text-base font-semibold" style={{ color: '#13274A' }}>
              {isUnjani ? 'Unjani Connect' : 'Business portal'}
            </span>
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
                    'rounded-full px-3 py-2 text-sm font-semibold transition-colors flex items-center gap-2',
                    isActive ? 'text-white' : 'hover:bg-black/[0.04]'
                  )}
                  style={
                    isActive
                      ? { background: '#13274A', color: '#FFFFFF' }
                      : { color: '#13274A' }
                  }
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
                className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-black/[0.03]"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: '#FBEEDA' }}
                >
                  <span className="text-sm font-extrabold" style={{ color: '#13274A' }}>
                    {user.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold truncate max-w-[140px]" style={{ color: '#13274A' }}>
                    {user.display_name}
                  </p>
                  <p className="text-xs truncate max-w-[140px]" style={{ color: '#1F2937' }}>
                    {user.organisation_name}
                  </p>
                </div>
                <PiCaretDownBold className="w-4 h-4" style={{ color: '#13274A' }} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div
                    className="rounded-xl absolute right-0 mt-2 w-56 bg-white z-50"
                    style={{ border: '2px solid color-mix(in srgb, #13274A 28%, transparent)' }}
                  >
                    <div
                      className="p-3"
                      style={{ borderBottom: '1px solid color-mix(in srgb, #13274A 28%, transparent)' }}
                    >
                      <p className="text-sm font-extrabold" style={{ color: '#13274A' }}>
                        {user.display_name}
                      </p>
                      <p className="text-xs" style={{ color: '#1F2937' }}>
                        {user.email}
                      </p>
                      <span
                        className="inline-block mt-1 text-xs px-2 py-0.5 font-extrabold"
                        style={{ background: '#13274A', color: '#FFFFFF' }}
                      >
                        {user.role === 'admin' ? 'Super User' : 'Site User'}
                      </span>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium"
                        style={{ color: '#DC2626' }}
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
              className="md:hidden p-2"
              style={{ border: '1px solid color-mix(in srgb, #13274A 28%, transparent)' }}
            >
              {mobileMenuOpen ? <PiXBold className="w-6 h-6" /> : <PiListBold className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          className="md:hidden bg-white p-4"
          style={{ borderTop: '1px solid color-mix(in srgb, #13274A 28%, transparent)' }}
        >
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
                  className="flex items-center gap-3 px-4 py-3 text-sm font-extrabold"
                  style={
                    isActive
                      ? { background: '#13274A', color: '#FFFFFF' }
                      : { color: '#13274A' }
                  }
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
  const { href } = usePortalApp();
  const pathname = usePathname();
  const isLoginPage = pathname === href('/login');

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'color-mix(in srgb, #13274A 7%, #FFFFFF)' }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: '#F5841E', borderTopColor: 'transparent' }}
          />
          <p style={{ color: '#13274A' }}>Loading portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'color-mix(in srgb, #13274A 7%, #FFFFFF)' }}
    >
      <PortalNav />
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {children}
      </main>
      <footer
        className="mt-auto bg-white"
        style={{ borderTop: '2px solid color-mix(in srgb, #13274A 28%, transparent)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div
            className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm"
            style={{ color: '#1F2937' }}
          >
            <p>&copy; 2026 CircleTel. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="hover:opacity-70">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:opacity-70">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:opacity-70">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PortalLayoutClient({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: PortalAppVariant;
}) {
  return (
    <PortalAppProvider variant={variant}>
      <PortalAuthProvider>
        <div className={cn('portal-root', archivo.variable)}>
          <PortalContent>{children}</PortalContent>
        </div>
      </PortalAuthProvider>
    </PortalAppProvider>
  );
}
