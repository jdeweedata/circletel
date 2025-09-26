'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/admin/layout/Sidebar';
import { AdminHeader } from '@/components/admin/layout/AdminHeader';
import { Loader2 } from 'lucide-react';

// Mock user type for now - will be replaced with real auth
interface User {
  full_name?: string;
  role?: string;
}

// Mock auth hook - will be replaced with real implementation
function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock authentication check
    setTimeout(() => {
      setUser({
        full_name: 'Admin User',
        role: 'product_manager'
      });
      setIsLoading(false);
    }, 500);
  }, []);

  const logout = () => {
    setUser(null);
    // Redirect to login
  };

  const validateSession = () => {
    // Mock session validation
  };

  return { user, isLoading, logout, validateSession };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, validateSession } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    validateSession();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (!user) {
    // In a real implementation, redirect to login
    router.push('/admin/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <AdminHeader
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          onLogout={handleLogout}
        />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}