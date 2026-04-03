'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PiListBold, PiXBold } from 'react-icons/pi';

interface DashboardTopNavProps {
  displayName: string;
  email: string;
  onSignOut: () => void;
}

export function DashboardTopNav({ displayName, email, onSignOut }: DashboardTopNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/packages', label: 'Products' },
    { href: '/#deals', label: 'Deals' },
    { href: '/support', label: 'Support' },
  ];

  const dropdownItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/profile', label: 'My Profile' },
    { href: '/dashboard/billing', label: 'Billing' },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-10 bg-white border-b border-slate-200"
        style={{ borderBottomColor: '#e2e8f0' }}
      >
        <div className="max-w-[900px] mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-1 font-bold text-lg">
            <span style={{ color: '#F5831F' }}>Circle</span>
            <span className="text-slate-800">Tel</span>
            <span style={{ color: '#F5831F' }}>.</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-slate-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: avatar + hamburger */}
          <div className="flex items-center gap-3">
            {/* Avatar dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{ backgroundColor: '#F5831F' }}
                aria-label="User menu"
              >
                {initials}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{email}</p>
                  </div>
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-slate-100 mt-1">
                    <button
                      onClick={() => { setDropdownOpen(false); onSignOut(); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hamburger (mobile only) */}
            <button
              className="md:hidden p-1 text-slate-600"
              onClick={() => setDrawerOpen((o) => !o)}
              aria-label="Open menu"
            >
              {drawerOpen ? <PiXBold className="w-5 h-5" /> : <PiListBold className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile slide-down drawer */}
        {drawerOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-5 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-3 text-sm text-slate-700 border-b border-slate-50 last:border-0"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
