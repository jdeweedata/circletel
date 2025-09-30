'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Import the collapsible sidebar components
import {
  SidebarMotion,
  SidebarMotionBody,
  useSidebarMotion,
} from '@/components/ui/sidebar-motion';

// Clone the AdminHeader from the original admin
import { AdminHeader } from '@/components/admin/layout/AdminHeader';

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

// Demo admin content with collapsible sidebar
function AdminDemoContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, validateSession } = useAdminAuth();
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
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800 h-screen">

        {/* Collapsible Sidebar */}
        <SidebarMotion>
          <SidebarMotionBody className="justify-between gap-10">
            <DemoAdminSidebarContent user={user} />
            <DemoAdminSidebarFooter user={user} />
          </SidebarMotionBody>
        </SidebarMotion>

        {/* Main content */}
        <DemoMainContent user={user} onLogout={handleLogout}>
          {children}
        </DemoMainContent>
      </div>
    </div>
  );
}

// Separate component for main content that can use sidebar context
function DemoMainContent({
  children,
  user,
  onLogout
}: {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <AdminHeader
        onMenuClick={() => {}} // Not needed with our sidebar toggle
        user={user}
        onLogout={onLogout}
      />

      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}

export default function AdminDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminDemoContent>
      {children}
    </AdminDemoContent>
  );
}

// Demo sidebar content that matches the original admin structure
function DemoAdminSidebarContent({ user }: { user: User }) {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
      <DemoAdminSidebarHeader />
      <DemoAdminSidebarNavigation user={user} />
    </div>
  );
}

// Import the sidebar components we need
import {
  SidebarMotionLink,
  SidebarMotionToggle
} from '@/components/ui/sidebar-motion';
import {
  LayoutDashboard,
  Package,
  CheckCircle,
  Users,
  Settings,
  BarChart3,
  FileText,
  Plus,
  List,
  Clock,
  Archive,
  Zap,
  Globe,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  CreditCard,
  Building,
  UserCheck
} from 'lucide-react';
import { usePathname } from 'next/navigation';

function DemoAdminSidebarHeader() {
  return (
    <header className="flex items-center justify-between mb-4">
      <div className="flex-1 min-w-0">
        <DemoAdminLogoWithState />
      </div>
      <SidebarMotionToggle className="shrink-0 ml-2" />
    </header>
  );
}

function DemoAdminLogoWithState() {
  const { open } = useSidebarMotion();
  return open ? <DemoAdminLogo /> : <DemoAdminLogoIcon />;
}

function DemoAdminLogo() {
  return (
    <a
      href="/admin-demo"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
      aria-label="CircleTel Admin Demo"
    >
      <DemoAdminLogoShape />
      <span className="font-medium whitespace-pre">
        CircleTel Admin
      </span>
    </a>
  );
}

function DemoAdminLogoIcon() {
  return (
    <a
      href="/admin-demo"
      className="relative z-20 flex items-center py-1"
      aria-label="CircleTel Admin Demo"
    >
      <DemoAdminLogoShape />
    </a>
  );
}

function DemoAdminLogoShape() {
  return (
    <div className="h-8 w-8 bg-circleTel-orange rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-sm">CT</span>
    </div>
  );
}

// Demo navigation with dropdown support like Splynx
const demoNavigation = [
  {
    name: 'Dashboard',
    href: '/admin-demo',
    icon: LayoutDashboard,
    end: true
  },
  {
    name: 'Customer Management',
    icon: Users,
    children: [
      { name: 'All Customers', href: '/admin-demo/customers', icon: Users },
      { name: 'Add Customer', href: '/admin-demo/customers/new', icon: Plus },
      { name: 'Customer Groups', href: '/admin-demo/customers/groups', icon: Building },
      { name: 'Customer Verification', href: '/admin-demo/customers/verification', icon: UserCheck }
    ]
  },
  {
    name: 'Products & Services',
    icon: Package,
    children: [
      { name: 'All Products', href: '/admin-demo/products', icon: List },
      { name: 'Add Product', href: '/admin-demo/products/new', icon: Plus },
      { name: 'Categories', href: '/admin-demo/products/categories', icon: Archive },
      { name: 'Pricing Plans', href: '/admin-demo/products/pricing', icon: CreditCard }
    ]
  },
  {
    name: 'Orders & Billing',
    icon: ShoppingCart,
    children: [
      { name: 'All Orders', href: '/admin-demo/orders', icon: ShoppingCart },
      { name: 'Pending Orders', href: '/admin-demo/orders/pending', icon: Clock },
      { name: 'Invoices', href: '/admin-demo/billing/invoices', icon: FileText },
      { name: 'Payments', href: '/admin-demo/billing/payments', icon: CreditCard }
    ]
  },
  {
    name: 'Approvals',
    href: '/admin-demo/workflow',
    icon: CheckCircle,
    badge: '3'
  },
  {
    name: 'Analytics',
    href: '/admin-demo/analytics',
    icon: BarChart3
  },
  {
    name: 'CMS Management',
    href: '/admin-demo/cms',
    icon: Globe,
  }
];

const demoAdminNavigation = [
  {
    name: 'Users',
    href: '/admin-demo/users',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/admin-demo/settings',
    icon: Settings,
  }
];

function DemoAdminSidebarNavigation({ user }: { user: User }) {
  const pathname = usePathname();
  const { open } = useSidebarMotion();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'product_manager';
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isActiveLink = (href: string, end?: boolean) => {
    if (end) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isExpanded = (itemName: string) => expandedItems.includes(itemName);

  const renderNavigationItem = (item: any, isNested = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemExpanded = isExpanded(item.name);
    const isActive = item.href ? isActiveLink(item.href, item.end) : false;

    // For parent items with children, check if any child is active
    const hasActiveChild = hasChildren && item.children.some((child: any) => isActiveLink(child.href));

    if (hasChildren) {
      return (
        <div key={item.name} className="space-y-1">
          {/* Parent Item */}
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`
              w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors group
              ${hasActiveChild || isActive
                ? 'bg-circleTel-orange text-white'
                : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }
            `}
          >
            <div className="flex items-center">
              <item.icon className="h-5 w-5 mr-3 shrink-0" />
              {open && (
                <span className="flex-1 text-left">{item.name}</span>
              )}
            </div>
            {open && (
              <div className="ml-2">
                {isItemExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}
            {item.badge && open && (
              <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                {item.badge}
              </span>
            )}
          </button>

          {/* Children Items */}
          {hasChildren && isItemExpanded && open && (
            <div className="ml-6 space-y-1">
              {item.children.map((child: any) => (
                <SidebarMotionLink
                  key={child.href}
                  link={{
                    label: child.name,
                    href: child.href,
                    icon: <child.icon className="h-4 w-4 shrink-0" />,
                    ariaLabel: `Go to ${child.name}`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      );
    } else {
      // Single item without children
      return (
        <SidebarMotionLink
          key={item.href}
          link={{
            label: item.name,
            href: item.href,
            icon: <item.icon className="h-5 w-5 shrink-0" />,
            badge: item.badge,
            ariaLabel: `Go to ${item.name}`,
          }}
        />
      );
    }
  };

  const adminLinks = demoAdminNavigation.map(item => ({
    label: item.name,
    href: item.href,
    icon: <item.icon className="h-5 w-5 shrink-0" />,
    ariaLabel: `Go to ${item.name}`,
  }));

  return (
    <nav className="mt-4 flex flex-col gap-1" role="navigation" aria-label="Demo admin navigation">
      {demoNavigation.map((item) => renderNavigationItem(item))}

      {/* Admin-only navigation */}
      {isAdmin && (
        <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
          {open && (
            <div className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Administration
            </div>
          )}
          {adminLinks.map((link) => (
            <SidebarMotionLink
              key={link.href}
              link={link}
            />
          ))}
        </div>
      )}
    </nav>
  );
}

function DemoAdminSidebarFooter({ user }: { user: User }) {
  const userLink = {
    label: user.full_name || 'User',
    href: '/admin-demo/profile',
    icon: (
      <div className="h-7 w-7 bg-gray-300 rounded-full flex items-center justify-center shrink-0">
        <span className="text-sm font-medium text-gray-700">
          {user?.full_name?.charAt(0) || 'U'}
        </span>
      </div>
    ),
    ariaLabel: `View ${user.full_name || 'user'}'s profile`,
  };

  return (
    <footer>
      <SidebarMotionLink link={userLink} />
    </footer>
  );
}