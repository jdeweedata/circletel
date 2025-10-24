'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';
import { Button } from '@/components/ui/button';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';
import { cn } from '@/lib/utils';
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
    <div className="min-h-screen bg-gradient-to-br from-circleTel-lightNeutral via-white to-blue-50/20">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <img src="/lovable-uploads/0d94be75-5c0a-44bf-95fa-777a85da966e.png" alt="CircleTel" className="h-8 w-auto" />
            </Link>

            <div className="flex items-center gap-4">
              {/* User Info - Desktop */}
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-circleTel-darkNeutral">
                    {displayName}
                  </p>
                  <p className="text-xs text-circleTel-secondaryNeutral">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-circleTel-secondaryNeutral hover:text-circleTel-orange"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 pb-32 lg:pb-32">
        <div className="flex flex-col gap-6">

          {/* Mobile Sidebar */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
              <aside className="fixed top-16 left-0 right-0 bottom-0 bg-white overflow-y-auto">
                <nav className="p-4">
                  <div className="mb-6 p-4 bg-gradient-to-br from-circleTel-orange to-orange-600 text-white rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{displayName}</p>
                        <p className="text-xs text-white/80 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-circleTel-secondaryNeutral hover:bg-orange-50 hover:text-circleTel-orange transition-all"
                        >
                          <item.icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSidebarOpen(false);
                        handleSignOut();
                      }}
                      className="w-full justify-start text-circleTel-secondaryNeutral hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </nav>
              </aside>
            </div>
          )}

          {/* Main Content */}
          <main className="w-full">
            {children}
          </main>
        </div>
      </div>

      {/* Animated Dock Navigation - Desktop */}
      <div className="hidden lg:block fixed bottom-4 left-0 right-0 z-50">
        <Dock magnification={60} distance={100} className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <DockItem>
                <DockLabel>{item.name}</DockLabel>
                <DockIcon>
                  <div className={cn(
                    'flex items-center justify-center w-full h-full rounded-xl transition-colors',
                    pathname === item.href 
                      ? 'bg-circleTel-orange text-white' 
                      : 'bg-gray-100 text-circleTel-secondaryNeutral hover:bg-orange-50 hover:text-circleTel-orange'
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                </DockIcon>
              </DockItem>
            </Link>
          ))}
          <div className="h-8 w-px bg-gray-300 mx-2" />
          <DockItem>
            <DockLabel>Sign Out</DockLabel>
            <DockIcon>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-full h-full rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </DockIcon>
          </DockItem>
        </Dock>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-6">
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
