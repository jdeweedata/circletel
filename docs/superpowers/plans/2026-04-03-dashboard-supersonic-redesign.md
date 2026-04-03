# Dashboard SuperSonic Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the customer dashboard with flat card navigation, 2-panel ticket view, enriched invoice table, and rich service card — removing the sidebar in favour of a sticky top nav.

**Architecture:** 7 new components replace existing navigation/cards; `layout.tsx` swaps sidebar for `DashboardTopNav`; `page.tsx` uses new `AccountStatsRow` + `QuickActionGrid` + `ServiceCard`; `invoices/page.tsx` uses `InvoiceTable`; `tickets/page.tsx` uses `TicketConversationPanel`. All existing service sub-components (`ConnectionStatusWidget`, `ServiceManageDropdown`, `PPPoECredentialsCard`) are reused as-is.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, React Icons (`react-icons/pi`), Supabase cookie auth

---

## File Map

### New Files
| File | Purpose |
|------|---------|
| `components/dashboard/DashboardTopNav.tsx` | Sticky top nav: logo, links, avatar dropdown |
| `components/dashboard/DashboardBackLink.tsx` | Shared `← Back to dashboard` text link |
| `components/dashboard/AccountStatsRow.tsx` | 4-chip stats (Services, Orders, Tickets, Balance) |
| `components/dashboard/QuickActionGrid.tsx` | 4×2 action card grid replacing QuickActionCards |
| `components/dashboard/ServiceCard.tsx` | Rich service card shell wrapping existing sub-components |
| `components/dashboard/InvoiceTable.tsx` | 6-column invoice table with type + status badges |
| `components/dashboard/TicketConversationPanel.tsx` | 2-panel Gmail-style ticket conversation view |

### Modified Files
| File | Change |
|------|--------|
| `app/dashboard/layout.tsx` | Remove `DashboardSidebar` + `MobileBottomNav`, add `DashboardTopNav` |
| `app/dashboard/page.tsx` | Flat layout: `AccountStatsRow` + `QuickActionGrid` + `ServiceCard` |
| `app/dashboard/invoices/page.tsx` | Replace 4-col table with `InvoiceTable` component |
| `app/dashboard/tickets/page.tsx` | Replace card list with `TicketConversationPanel` |

### Unchanged (reused as-is)
- `components/dashboard/ConnectionStatusWidget.tsx`
- `components/dashboard/ServiceManageDropdown.tsx`
- `components/dashboard/PPPoECredentialsCard.tsx`
- `components/dashboard/OnboardingBanner.tsx`
- `components/dashboard/navigation/DashboardNavContext.tsx` (still used by DashboardTopNav)
- All API routes

---

## Task 1: DashboardTopNav Component

**Files:**
- Create: `components/dashboard/DashboardTopNav.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/DashboardTopNav.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run type-check:memory 2>&1 | grep -i "DashboardTopNav" | head -10
```

Expected: no errors mentioning `DashboardTopNav`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/DashboardTopNav.tsx
git commit -m "feat(dashboard): add DashboardTopNav sticky top nav component"
```

---

## Task 2: DashboardBackLink Component

**Files:**
- Create: `components/dashboard/DashboardBackLink.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/DashboardBackLink.tsx
import Link from 'next/link';

export function DashboardBackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
    >
      ← Back to dashboard
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/DashboardBackLink.tsx
git commit -m "feat(dashboard): add DashboardBackLink shared back-link component"
```

---

## Task 3: AccountStatsRow Component

**Files:**
- Create: `components/dashboard/AccountStatsRow.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/AccountStatsRow.tsx
import Link from 'next/link';

interface AccountStatsRowProps {
  activeServices: number;
  totalOrders: number;
  openTickets: number;
  accountBalance: number;
}

export function AccountStatsRow({
  activeServices,
  totalOrders,
  openTickets,
  accountBalance,
}: AccountStatsRowProps) {
  const balanceColor = accountBalance > 0 ? '#dc2626' : '#16a34a';
  const balanceFormatted = new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(accountBalance));

  const chips: Array<{
    label: string;
    value: string | number;
    href?: string;
    valueColor?: string;
  }> = [
    { label: 'Services', value: activeServices },
    { label: 'Orders', value: totalOrders, href: '/dashboard/orders' },
    { label: 'Tickets', value: openTickets },
    {
      label: 'Balance Due',
      value: `R${balanceFormatted}`,
      href: '/dashboard/billing',
      valueColor: balanceColor,
    },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {chips.map((chip) => {
        const inner = (
          <div
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex flex-col items-center min-w-[90px]"
            style={{ borderColor: '#e2e8f0' }}
          >
            <span
              className="text-lg font-bold"
              style={{ color: chip.valueColor ?? '#1e293b' }}
            >
              {chip.value}
            </span>
            <span className="text-xs text-slate-500 mt-0.5">{chip.label}</span>
          </div>
        );

        if (chip.href) {
          return (
            <Link
              key={chip.label}
              href={chip.href}
              className="hover:shadow-md transition-shadow rounded-xl"
            >
              {inner}
            </Link>
          );
        }
        return <div key={chip.label}>{inner}</div>;
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/AccountStatsRow.tsx
git commit -m "feat(dashboard): add AccountStatsRow 4-chip stats component"
```

---

## Task 4: QuickActionGrid Component

**Files:**
- Create: `components/dashboard/QuickActionGrid.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/QuickActionGrid.tsx
import Link from 'next/link';

interface ActionCard {
  label: string;
  icon: string;
  href: string;
  primary?: boolean;
}

const ACTION_CARDS: ActionCard[] = [
  { label: 'Pay Now',               icon: '💳', href: '/dashboard/billing',          primary: true },
  { label: 'Invoices & Statements', icon: '📑', href: '/dashboard/invoices' },
  { label: 'Update Banking',        icon: '🏦', href: '/dashboard/payment-method' },
  { label: 'My Profile',            icon: '👤', href: '/dashboard/profile' },
  { label: 'Log a Ticket',          icon: '🎫', href: '/dashboard/tickets' },
  { label: 'Get Help',              icon: '❓', href: '/dashboard/support' },
  { label: 'Check Usage',           icon: '📊', href: '/dashboard/usage' },
  { label: 'Upgrade Plan',          icon: '⬆️', href: '/dashboard/services/upgrade' },
];

export function QuickActionGrid() {
  return (
    <div>
      <p
        className="text-xs font-bold tracking-wider mb-3"
        style={{ color: '#94a3b8', letterSpacing: '0.05em' }}
      >
        MY ACCOUNT
      </p>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
        {ACTION_CARDS.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group flex flex-col items-center justify-center gap-2 bg-white border rounded-xl py-4 px-2 text-center transition-all hover:shadow-md"
            style={{
              borderColor: '#e2e8f0',
              borderRadius: '12px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#F5831F';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px rgba(245,131,31,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
              (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}
          >
            <span className="text-xl sm:text-[22px] leading-none">{card.icon}</span>
            <span
              className="text-[11px] font-semibold leading-tight"
              style={{ color: card.primary ? '#F5831F' : '#1e293b' }}
            >
              {card.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/QuickActionGrid.tsx
git commit -m "feat(dashboard): add QuickActionGrid 4x2 action card grid"
```

---

## Task 5: ServiceCard Component

**Files:**
- Create: `components/dashboard/ServiceCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/ServiceCard.tsx
'use client';

import { useState } from 'react';
import { ConnectionStatusWidget } from '@/components/dashboard/ConnectionStatusWidget';
import { ServiceManageDropdown } from '@/components/dashboard/ServiceManageDropdown';
import { PPPoECredentialsCard } from '@/components/dashboard/PPPoECredentialsCard';

interface ServiceCardService {
  id: string;
  package_name: string;
  service_type: string;
  status: string;
  monthly_price: number;
  installation_address: string;
  speed_down: number;
  speed_up: number;
}

interface ServiceCardBilling {
  next_billing_date: string;
}

interface ServiceCardProps {
  service: ServiceCardService;
  billing: ServiceCardBilling | null;
}

function StatusDot({ status }: { status: string }) {
  const normalised = status.toLowerCase();
  const isActive = normalised === 'active' || normalised === 'connected' || normalised.includes('billing');
  const color = isActive ? '#16a34a' : '#94a3b8';
  const label = isActive ? 'Connected & Billing' : status;
  return (
    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color }}>
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
      {label}
    </span>
  );
}

function formatAddress(address: string): string {
  // Return suburb + postal code only for short display
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length >= 3) return parts.slice(-2).join(', ');
  return address;
}

export function ServiceCard({ service, billing }: ServiceCardProps) {
  const [showPPPoE, setShowPPPoE] = useState(false);

  const monthlyFormatted = new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(service.monthly_price);

  const nextBillingFormatted = billing?.next_billing_date
    ? new Date(billing.next_billing_date).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div
      className="bg-white rounded-xl border p-4 space-y-4"
      style={{ borderColor: '#e2e8f0', borderRadius: '12px' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <StatusDot status={service.status} />
          <p className="text-sm font-bold text-slate-800 mt-1">{service.package_name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{formatAddress(service.installation_address)}</p>
        </div>
        <ServiceManageDropdown
          serviceId={service.id}
          packageName={service.package_name}
          className="shrink-0"
        />
      </div>

      {/* Speed row */}
      <div className="flex gap-3">
        <div
          className="flex-1 rounded-lg px-3 py-2 text-center"
          style={{ background: '#f0fdf4' }}
        >
          <p className="text-[10px] font-semibold" style={{ color: '#16a34a' }}>↓ Download</p>
          <p className="text-lg font-bold text-slate-800">
            {service.speed_down}
            <span className="text-xs font-normal text-slate-500 ml-0.5">Mbps</span>
          </p>
        </div>
        <div
          className="flex-1 rounded-lg px-3 py-2 text-center"
          style={{ background: '#eff6ff' }}
        >
          <p className="text-[10px] font-semibold" style={{ color: '#3b82f6' }}>↑ Upload</p>
          <p className="text-lg font-bold text-slate-800">
            {service.speed_up}
            <span className="text-xs font-normal text-slate-500 ml-0.5">Mbps</span>
          </p>
        </div>
      </div>

      {/* Network Health + Speed Test row */}
      <div className="flex gap-3">
        <div
          className="flex-1 rounded-lg px-3 py-2"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          <ConnectionStatusWidget compact />
        </div>
        <a
          href="/dashboard/speed-test"
          className="flex-1 rounded-lg px-3 py-2 text-center flex flex-col items-center justify-center gap-0.5 transition-opacity hover:opacity-80"
          style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
        >
          <span className="text-[10px] font-bold" style={{ color: '#f97316' }}>⚡ SPEED TEST</span>
          <span className="text-[10px] text-slate-500">Tap to run</span>
        </a>
      </div>

      {/* PPPoE credentials */}
      <button
        onClick={() => setShowPPPoE((v) => !v)}
        className="text-xs font-medium text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors"
      >
        {showPPPoE ? 'Hide PPPoE credentials' : 'Show PPPoE credentials'}
      </button>
      {showPPPoE && <PPPoECredentialsCard serviceId={service.id} />}

      {/* Monthly fee + next billing */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid #f1f5f9' }}
      >
        <div>
          <p className="text-xs text-slate-500">Monthly fee</p>
          <p className="text-sm font-bold text-slate-800">
            R{monthlyFormatted}{' '}
            <span className="text-[10px] font-normal text-slate-400">incl VAT</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Next billing</p>
          <p className="text-xs font-semibold text-slate-800">{nextBillingFormatted}</p>
        </div>
      </div>
    </div>
  );
}
```

**Note:** `ConnectionStatusWidget` currently accepts no props. The `compact` prop here will be ignored unless the component is updated. The card will still render correctly — network health will display at its normal size. If `compact` needs a specific layout, update `ConnectionStatusWidget` in a separate task.

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/ServiceCard.tsx
git commit -m "feat(dashboard): add ServiceCard rich service card component"
```

---

## Task 6: Rewrite dashboard/layout.tsx

**Files:**
- Modify: `app/dashboard/layout.tsx`

- [ ] **Step 1: Read current layout to verify before editing**

```bash
wc -l app/dashboard/layout.tsx
```

Expected: 206 lines.

- [ ] **Step 2: Replace the layout**

The new layout removes `DashboardSidebar`, `MobileBottomNav`, and the sidebar toggle. It preserves the payment return detection (CRITICAL), auth guard, and `DashboardNavProvider`. It adds `DashboardTopNav`.

Replace the full file:

```tsx
// app/dashboard/layout.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { DashboardErrorBoundary } from '@/components/dashboard/ErrorBoundary';
import { DashboardNavProvider } from '@/components/dashboard/navigation';
import { DashboardTopNav } from '@/components/dashboard/DashboardTopNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session, signOut, loading } = useCustomerAuth();

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

  // Auth redirect - with race condition protection
  useEffect(() => {
    if (isPaymentReturn) {
      console.log('[DashboardLayout] Payment return detected, skipping auth redirect');
      return;
    }
    if (!loading && !user && !session) {
      console.log('[DashboardLayout] No auth detected, will redirect after delay...');
      const timeoutId = setTimeout(() => {
        console.log('[DashboardLayout] Executing redirect to login');
        router.push('/auth/login?redirect=/dashboard');
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [user, session, loading, router, isPaymentReturn]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Loading state — also show during payment return while session recovers
  const showLoading = loading || (isPaymentReturn && !user && !session);

  if (showLoading) {
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

  if (!user && !session && !isPaymentReturn) {
    return null;
  }

  const currentUser = user || session?.user;

  const displayName =
    [currentUser?.user_metadata?.firstName, currentUser?.user_metadata?.lastName]
      .filter(Boolean)
      .join(' ') ||
    (currentUser?.user_metadata as Record<string, unknown>)?.full_name as string ||
    (currentUser?.user_metadata as Record<string, unknown>)?.name as string ||
    (currentUser?.email ? currentUser.email.split('@')[0] : '') ||
    'User';

  return (
    <DashboardNavProvider>
      <div className="min-h-screen flex flex-col" style={{ background: '#f1f5f9' }}>
        <DashboardTopNav
          displayName={displayName}
          email={currentUser?.email || ''}
          onSignOut={handleSignOut}
        />

        <main className="flex-1">
          <div className="max-w-[900px] mx-auto px-5 py-7">
            <DashboardErrorBoundary>{children}</DashboardErrorBoundary>
          </div>
        </main>

        <footer className="border-t bg-white/80 mt-auto">
          <div className="max-w-[900px] mx-auto px-5 py-5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
              <p>&copy; 2025 CircleTel. All rights reserved.</p>
              <div className="flex gap-5">
                <Link href="/privacy-policy" className="hover:text-slate-800 transition-colors">Privacy Policy</Link>
                <Link href="/terms-of-service" className="hover:text-slate-800 transition-colors">Terms of Service</Link>
                <Link href="/contact" className="hover:text-slate-800 transition-colors">Contact Us</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </DashboardNavProvider>
  );
}
```

- [ ] **Step 3: Type check**

```bash
npm run type-check:memory 2>&1 | grep -E "(error|Error)" | grep "layout" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/layout.tsx
git commit -m "feat(dashboard): replace sidebar layout with flat DashboardTopNav layout"
```

---

## Task 7: Rewrite dashboard/page.tsx

**Files:**
- Modify: `app/dashboard/page.tsx`

This rewrite replaces the existing `DashboardContent` render with the new flat layout using `AccountStatsRow`, `QuickActionGrid`, and `ServiceCard`. All data-fetching logic, error/loading states, `EmailVerificationModal`, and `OnboardingBanner` are preserved.

- [ ] **Step 1: Replace the DashboardContent function (lines 281–end)**

The data-fetching portion (lines 1–279) is unchanged. Only the `DashboardContent` function at the bottom needs to be replaced.

Find:
```tsx
function DashboardContent({ data, user, customer, pendingOrders, accessToken }: { data: DashboardData; user: any; customer: any; pendingOrders: number; accessToken: string }) {
```

Replace the entire `DashboardContent` function with:

```tsx
function DashboardContent({ data, user, customer, pendingOrders, accessToken }: {
  data: DashboardData;
  user: unknown;
  customer: Record<string, unknown> | null;
  pendingOrders: number;
  accessToken: string;
}) {
  const isPlaceholder = (name: string | undefined) => {
    if (!name) return true;
    const cleaned = name.trim().toLowerCase();
    return cleaned === 'customer' || cleaned === 'user' || cleaned === '';
  };

  const userMeta = (user as { user_metadata?: Record<string, string> } | null)?.user_metadata;

  const firstName =
    (!isPlaceholder(data.customer.firstName) && data.customer.firstName) ||
    (!isPlaceholder(customer?.first_name as string) && (customer?.first_name as string)) ||
    userMeta?.first_name ||
    userMeta?.full_name?.split(' ')[0] ||
    '';

  const lastName =
    (!isPlaceholder(data.customer.lastName) && data.customer.lastName) ||
    (!isPlaceholder(customer?.last_name as string) && (customer?.last_name as string)) ||
    userMeta?.last_name ||
    userMeta?.full_name?.split(' ').slice(1).join(' ') ||
    '';

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || data.customer.email.split('@')[0];

  return (
    <div className="space-y-6">
      {/* Onboarding banner */}
      {accessToken && <OnboardingBanner accessToken={accessToken} />}

      {/* Welcome header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Hi, {displayName} 👋
        </h1>
        {data.customer.accountNumber && (
          <p className="text-sm text-slate-500 mt-0.5">
            #{data.customer.accountNumber} · Welcome to your CircleTel account.
          </p>
        )}
      </div>

      {/* Stats row */}
      <AccountStatsRow
        activeServices={data.stats.activeServices}
        totalOrders={data.stats.totalOrders}
        openTickets={data.stats.overdueInvoices}
        accountBalance={data.billing?.account_balance ?? 0}
      />

      {/* Action cards */}
      <QuickActionGrid />

      {/* My Connectivity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-xs font-bold tracking-wider"
            style={{ color: '#94a3b8', letterSpacing: '0.05em' }}
          >
            MY CONNECTIVITY
          </p>
          <Link
            href="/packages"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: '#e2e8f0', color: '#F5831F' }}
          >
            + Add Product
          </Link>
        </div>

        {data.services.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700 mb-1">No active services</p>
            <p className="text-xs text-slate-500 mb-4">Get connected with high-speed fibre or wireless.</p>
            <Link
              href="/"
              className="inline-block text-xs font-bold px-4 py-2 rounded-lg text-white"
              style={{ background: '#F5831F' }}
            >
              Check Coverage
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.services.map((service) => (
              <ServiceCard key={service.id} service={service} billing={data.billing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update imports at the top of the file**

Add the new imports after the existing imports block:

```tsx
import { AccountStatsRow } from '@/components/dashboard/AccountStatsRow';
import { QuickActionGrid } from '@/components/dashboard/QuickActionGrid';
import { ServiceCard } from '@/components/dashboard/ServiceCard';
```

Remove the now-unused imports: `QuickActionCards`, `ModernStatCard`, `ConnectionStatusWidget` (if only used in DashboardContent). Keep `PiSpinnerBold`, `PiWarningCircleBold`, `PiPackageBold` for loading/error states.

- [ ] **Step 3: Type check**

```bash
npm run type-check:memory 2>&1 | grep -E "error TS" | grep "dashboard/page" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(dashboard): rewrite page to flat layout with stats row, action grid, service card"
```

---

## Task 8: InvoiceTable Component + invoices/page.tsx rewrite

**Files:**
- Create: `components/dashboard/InvoiceTable.tsx`
- Modify: `app/dashboard/invoices/page.tsx`

- [ ] **Step 1: Create InvoiceTable component**

```tsx
// components/dashboard/InvoiceTable.tsx
import Link from 'next/link';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_type?: string;
  total_amount: number;
  amount_due: number;
  status: string;
  pdf_url?: string;
}

const TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  recurring:    { bg: '#eff6ff', color: '#3b82f6', label: 'Recurring' },
  installation: { bg: '#f0fdf4', color: '#16a34a', label: 'Install' },
  pro_rata:     { bg: '#faf5ff', color: '#7c3aed', label: 'Pro-rata' },
  equipment:    { bg: '#fff7ed', color: '#f97316', label: 'Equipment' },
  adjustment:   { bg: '#f1f5f9', color: '#64748b', label: 'Adjustment' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  paid:     { bg: '#dcfce7', color: '#16a34a' },
  unpaid:   { bg: '#fef9c3', color: '#ca8a04' },
  overdue:  { bg: '#fee2e2', color: '#dc2626' },
  draft:    { bg: '#f1f5f9', color: '#64748b' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function TypeBadge({ type }: { type?: string }) {
  const key = (type ?? 'recurring').toLowerCase();
  const style = TYPE_STYLES[key] ?? TYPE_STYLES['adjustment'];
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const style = STATUS_STYLES[key] ?? STATUS_STYLES['draft'];
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface InvoiceTableProps {
  invoices: Invoice[];
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">No invoices found.</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#e2e8f0' }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b" style={{ borderColor: '#e2e8f0' }}>
            {['Invoice #', 'Date', 'Type', 'Amount', 'Status', 'Actions'].map((col) => (
              <th
                key={col}
                className="text-left px-4 py-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, idx) => {
            const isUnpaid = ['unpaid', 'overdue'].includes(inv.status.toLowerCase());
            return (
              <tr
                key={inv.id}
                className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                style={{ borderColor: '#f1f5f9' }}
              >
                <td className="px-4 py-3 text-xs font-medium" style={{ color: '#3b82f6' }}>
                  {inv.invoice_number}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {formatDate(inv.invoice_date)}
                </td>
                <td className="px-4 py-3">
                  <TypeBadge type={inv.invoice_type} />
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-800">
                  R{formatAmount(inv.total_amount)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={inv.status} />
                </td>
                <td className="px-4 py-3">
                  {isUnpaid ? (
                    <Link
                      href="/dashboard/billing"
                      className="text-xs font-semibold"
                      style={{ color: '#F5831F' }}
                    >
                      Pay Now
                    </Link>
                  ) : inv.pdf_url ? (
                    <a
                      href={inv.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      View PDF
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite invoices/page.tsx**

```tsx
// app/dashboard/invoices/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';
import { InvoiceTable } from '@/components/dashboard/InvoiceTable';

interface CustomerInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_type?: string;
  total_amount: number;
  amount_due: number;
  status: string;
  pdf_url?: string;
}

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?redirect=/dashboard/invoices');

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let invoices: CustomerInvoice[] = [];

  if (customer) {
    const { data } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, invoice_date, invoice_type, total_amount, amount_due, status, pdf_url')
      .eq('customer_id', customer.id)
      .order('invoice_date', { ascending: false })
      .limit(50);

    invoices = (data ?? []) as CustomerInvoice[];
  }

  return (
    <div>
      <DashboardBackLink />
      <h1 className="text-xl font-bold text-slate-900 mb-6">Billing and statements</h1>
      <InvoiceTable invoices={invoices} />
    </div>
  );
}
```

- [ ] **Step 3: Type check**

```bash
npm run type-check:memory 2>&1 | grep -E "error TS" | grep -E "(invoices|InvoiceTable)" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/InvoiceTable.tsx app/dashboard/invoices/page.tsx
git commit -m "feat(dashboard): add InvoiceTable with type/status badges and rewrite invoices page"
```

---

## Task 9: TicketConversationPanel + tickets/page.tsx rewrite

**Files:**
- Create: `components/dashboard/TicketConversationPanel.tsx`
- Modify: `app/dashboard/tickets/page.tsx`

- [ ] **Step 1: Create TicketConversationPanel**

```tsx
// components/dashboard/TicketConversationPanel.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface ZohoDeskComment {
  id: string;
  content: string;
  contentType: 'plainText' | 'html';
  isPublic: boolean;
  createdTime: string;
  authorName: string;
  authorEmail?: string;
}

interface ZohoDeskTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description?: string;
  status: 'Open' | 'On Hold' | 'Escalated' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category?: string;
  createdTime: string;
  modifiedTime: string;
  customerEmail: string;
  customerName: string;
  commentCount?: number;
  comments?: ZohoDeskComment[];
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Open':      { bg: '#dcfce7', color: '#16a34a' },
  'On Hold':   { bg: '#fef9c3', color: '#ca8a04' },
  'Escalated': { bg: '#fee2e2', color: '#dc2626' },
  'Closed':    { bg: '#f1f5f9', color: '#64748b' },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS['Closed'];
  return (
    <span className="text-[10px] font-medium rounded px-1.5 py-0.5" style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}

interface TicketConversationPanelProps {
  tickets: ZohoDeskTicket[];
  customerName: string;
  customerEmail: string;
  accessToken: string;
}

export function TicketConversationPanel({
  tickets,
  customerName,
  customerEmail,
  accessToken,
}: TicketConversationPanelProps) {
  const [selected, setSelected] = useState<ZohoDeskTicket | null>(tickets[0] ?? null);
  const [comments, setComments] = useState<ZohoDeskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load comments when ticket changes
  useEffect(() => {
    if (!selected) return;
    if (selected.comments) {
      setComments(selected.comments);
      return;
    }
    setCommentsLoading(true);
    fetch(`/api/support/tickets/${selected.id}/comments`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setComments(result.data);
        } else {
          setComments([]);
        }
      })
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [selected?.id, accessToken]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${selected.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: replyText }),
      });
      const result = await res.json();
      if (result.success) {
        const newComment: ZohoDeskComment = {
          id: result.data?.id ?? String(Date.now()),
          content: replyText,
          contentType: 'plainText',
          isPublic: true,
          createdTime: new Date().toISOString(),
          authorName: customerName,
          authorEmail: customerEmail,
        };
        setComments((prev) => [...prev, newComment]);
        setReplyText('');
      }
    } catch {
      // silently ignore send errors
    } finally {
      setSending(false);
    }
  };

  const isCustomerMessage = (comment: ZohoDeskComment): boolean => {
    return comment.authorEmail === customerEmail || comment.authorName === customerName;
  };

  return (
    <div className="flex gap-0 bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0', minHeight: '500px' }}>
      {/* Left panel */}
      <div className="w-60 shrink-0 border-r flex flex-col" style={{ borderColor: '#e2e8f0' }}>
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: '#e2e8f0' }}
        >
          <span className="text-sm font-bold text-slate-800">My Requests</span>
          <a
            href="/dashboard/tickets/new"
            className="text-xs font-bold px-2 py-1 rounded-lg text-white"
            style={{ background: '#F5831F' }}
          >
            + New
          </a>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tickets.length === 0 ? (
            <p className="text-xs text-slate-500 p-4">No tickets yet.</p>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full text-left px-4 py-3 border-b last:border-0 transition-colors"
                style={{
                  borderColor: '#f1f5f9',
                  background: selected?.id === t.id ? '#fff7ed' : 'transparent',
                  borderLeft: selected?.id === t.id ? '3px solid #F5831F' : '3px solid transparent',
                }}
              >
                <p className="text-xs font-semibold text-slate-800 truncate">{t.subject}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{formatRelativeDate(t.createdTime)}</p>
                <div className="mt-1">
                  <StatusPill status={t.status} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a conversation
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div
              className="px-5 py-3 border-b"
              style={{ borderColor: '#e2e8f0' }}
            >
              <p className="text-sm font-bold text-slate-800 truncate">{selected.ticketNumber} — {selected.subject}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {selected.category && <>{selected.category} · </>}
                Opened {formatRelativeDate(selected.createdTime)} · <StatusPill status={selected.status} />
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Original description */}
              {selected.description && (
                <div className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                    style={{ background: '#64748b' }}
                  >
                    CT
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 mb-1">CircleTel Support</p>
                    <div
                      className="text-xs text-slate-700 rounded px-3 py-2 max-w-sm"
                      style={{ background: '#f1f5f9', borderRadius: '4px 12px 12px 12px' }}
                    >
                      {selected.description}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">{formatTime(selected.createdTime)}</p>
                  </div>
                </div>
              )}

              {/* Comments */}
              {commentsLoading ? (
                <p className="text-xs text-slate-400">Loading messages…</p>
              ) : (
                comments.map((c) => {
                  const isCustomer = isCustomerMessage(c);
                  return (
                    <div
                      key={c.id}
                      className={`flex gap-3 ${isCustomer ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className="w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                        style={{ background: isCustomer ? '#F5831F' : '#64748b' }}
                      >
                        {isCustomer
                          ? customerName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                          : 'CT'}
                      </div>
                      <div className={isCustomer ? 'items-end flex flex-col' : ''}>
                        <p className="text-[10px] text-slate-500 mb-1">
                          {isCustomer ? 'You' : c.authorName}
                        </p>
                        <div
                          className="text-xs text-slate-700 px-3 py-2 max-w-sm"
                          style={{
                            background: isCustomer ? '#fff7ed' : '#f1f5f9',
                            borderRadius: isCustomer ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                          }}
                        >
                          {c.contentType === 'html' ? (
                            <span dangerouslySetInnerHTML={{ __html: c.content }} />
                          ) : (
                            c.content
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">{formatTime(c.createdTime)}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply input */}
            {selected.status !== 'Closed' && (
              <div
                className="px-5 py-3 border-t flex gap-2"
                style={{ borderColor: '#e2e8f0' }}
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Reply to this ticket…"
                  className="flex-1 text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 min-w-0"
                  style={{ borderColor: '#e2e8f0', focusRingColor: '#F5831F' } as React.CSSProperties}
                />
                <button
                  onClick={handleSend}
                  disabled={!replyText.trim() || sending}
                  className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50 transition-opacity"
                  style={{ background: '#F5831F' }}
                >
                  {sending ? '…' : 'Send'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite tickets/page.tsx**

```tsx
// app/dashboard/tickets/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';
import { TicketConversationPanel } from '@/components/dashboard/TicketConversationPanel';
import { PiSpinnerBold } from 'react-icons/pi';

interface ZohoDeskTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description?: string;
  status: 'Open' | 'On Hold' | 'Escalated' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category?: string;
  createdTime: string;
  modifiedTime: string;
  customerEmail: string;
  customerName: string;
  commentCount?: number;
}

export default function TicketsPage() {
  const { user, session, customer } = useCustomerAuth();
  const [tickets, setTickets] = useState<ZohoDeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;

    const email = user?.email ?? customer?.email;
    if (!email) return;

    fetch(`/api/support/tickets/list?email=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setTickets(result.data);
        } else {
          setError(result.error ?? 'Failed to load tickets');
        }
      })
      .catch(() => setError('Failed to load tickets'))
      .finally(() => setLoading(false));
  }, [session?.access_token, user?.email, customer?.email]);

  const customerName =
    [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'You';
  const customerEmail = user?.email ?? (customer?.email as string | undefined) ?? '';

  return (
    <div>
      <DashboardBackLink />
      <h1 className="text-xl font-bold text-slate-900 mb-6">My Requests</h1>

      {loading && (
        <div className="flex justify-center py-12">
          <PiSpinnerBold className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && (
        <TicketConversationPanel
          tickets={tickets}
          customerName={customerName}
          customerEmail={customerEmail}
          accessToken={session?.access_token ?? ''}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type check**

```bash
npm run type-check:memory 2>&1 | grep -E "error TS" | grep -E "(tickets|TicketConversation)" | head -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/TicketConversationPanel.tsx app/dashboard/tickets/page.tsx
git commit -m "feat(dashboard): add TicketConversationPanel 2-panel view and rewrite tickets page"
```

---

## Task 10: Add DashboardBackLink to sub-pages

**Files:**
- Modify: `app/dashboard/invoices/page.tsx` — already included in Task 8
- Modify: `app/dashboard/profile/page.tsx`
- Modify: `app/dashboard/billing/page.tsx`
- Modify: `app/dashboard/payment-method/page.tsx`
- Modify: `app/dashboard/usage/page.tsx`
- Modify: `app/dashboard/orders/page.tsx`

- [ ] **Step 1: Add DashboardBackLink import + render to each sub-page**

For each file listed, add the import at the top and `<DashboardBackLink />` as the first element in the page's JSX return.

**Pattern to apply to each page:**
```tsx
// Add to imports:
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';

// Add as first element in return:
<DashboardBackLink />
```

Check if each file exists first:
```bash
ls app/dashboard/{profile,billing,payment-method,usage,orders}/page.tsx 2>&1
```

For any missing page, skip it. Only add to pages that exist.

- [ ] **Step 2: Type check**

```bash
npm run type-check:memory 2>&1 | grep -E "error TS" | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/profile/page.tsx app/dashboard/billing/page.tsx app/dashboard/payment-method/page.tsx app/dashboard/usage/page.tsx app/dashboard/orders/page.tsx 2>/dev/null || true
git commit -m "feat(dashboard): add DashboardBackLink to all sub-pages"
```

---

## Task 11: Full type check and build verification

- [ ] **Step 1: Run full type check**

```bash
npm run type-check:memory 2>&1 | tail -20
```

Expected: `Found 0 errors.`

If errors are found, fix them before continuing. Common fixes:
- `unknown` props: add explicit type cast `as string`
- Missing `compact` prop on ConnectionStatusWidget: remove prop or add `compact?: boolean` to ConnectionStatusWidget interface
- `focusRingColor` not a valid CSS property: use `onFocus` handler instead, or remove it

- [ ] **Step 2: Run production build**

```bash
npm run build:memory 2>&1 | tail -30
```

Expected: `✓ Compiled successfully` with no TypeScript errors.

- [ ] **Step 3: Commit build fix if needed**

```bash
git add -p  # stage only fixed files
git commit -m "fix(dashboard): resolve type errors from redesign"
```

---

## Verification Checklist

Run through these manually after the build succeeds:

1. Dashboard loads — no sidebar visible on desktop or mobile
2. Stats row shows correct counts: active services, total orders, balance due (red if > 0, green if 0)
3. All 8 action cards navigate to correct routes
4. My Connectivity section shows async loading (ConnectionStatusWidget handles this)
5. Service card shows speeds (down/upload), network health, speed test button, PPPoE toggle, monthly fee, next billing
6. Manage dropdown on service card shows Upgrade / Downgrade / Relocate / Pause
7. `← Back to dashboard` link visible on invoices, tickets, billing, profile pages
8. Invoice table: Type badge + Status badge on each row
9. "Pay Now" appears for unpaid/overdue invoices; "View PDF" for paid
10. Ticket page: left panel shows ticket list; clicking loads conversation in right panel
11. Reply input sends message; bubble appears immediately
12. "+ New" ticket button links to new ticket form
13. Onboarding banner shown only when `onboarding.complete === false`
14. Mobile: top nav collapses to hamburger, action cards wrap to 2×4 grid
