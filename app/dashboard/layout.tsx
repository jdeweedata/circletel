'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Button } from '@/components/ui/button';
import SidebarNav from '@/components/dashboard/SidebarNav';
import Topbar from '@/components/dashboard/Topbar';
import {
  Home,
  Package,
  FileText,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  Upload,
  Clock,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Orders', href: '/dashboard/orders', icon: Package },
  { name: 'KYC Documents', href: '/dashboard/kyc', icon: Upload },
  { name: 'Order Tracking', href: '/dashboard/tracking', icon: Clock },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut, loading } = useCustomerAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/order/account');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

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

  if (!user) {
    return null;
  }

  const displayName = (
    [user.user_metadata?.firstName, user.user_metadata?.lastName].filter(Boolean).join(' ') ||
    (user.user_metadata as any)?.full_name ||
    (user.user_metadata as any)?.name ||
    (user.email ? user.email.split('@')[0] : '') ||
    'User'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} displayName={displayName} email={user.email || ''} />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 xl:gap-8">
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
              <div className="fixed top-14 bottom-0 left-0 w-72 bg-white shadow-xl overflow-y-auto">
                <SidebarNav mobile={true} />
              </div>
            </div>
          )}
          <SidebarNav
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>


      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-12">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-circleTel-secondaryNeutral">
            <p>© 2025 CircleTel. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-circleTel-orange transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-circleTel-orange transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-circleTel-orange transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
