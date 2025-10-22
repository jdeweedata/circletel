'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  CheckCircle,
  Users,
  Settings,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  Clock,
  Archive,
  Zap,
  Globe,
  CreditCard,
  Receipt,
  UserCheck,
  DollarSign,
  TrendingUp,
  Radio,
  Map,
  Activity,
  TestTube,
  Building2,
  Network,
  ShieldCheck
} from 'lucide-react';

interface User {
  full_name?: string;
  role?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: User;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    end: true
  },
  {
    name: 'Products',
    icon: Package,
    children: [
      { name: 'All Products', href: '/admin/products', icon: List },
      { name: 'Add Product', href: '/admin/products/new', icon: Plus },
      { name: 'Drafts', href: '/admin/products/drafts', icon: FileText },
      { name: 'Archived', href: '/admin/products/archived', icon: Archive }
    ]
  },
  {
    name: 'Approvals',
    href: '/admin/workflow',
    icon: CheckCircle,
    badge: 'pending_count'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3
  },
  {
    name: 'Client Forms',
    href: '/admin/forms',
    icon: FileText,
    description: 'Manage client assessment forms'
  },
  {
    name: 'KYC Review',
    href: '/admin/kyc',
    icon: ShieldCheck,
    description: 'Review customer verification documents'
  },
  {
    name: 'Zoho Integration',
    href: '/admin/zoho',
    icon: Zap,
    description: 'Manage Zoho CRM, Mail, and Calendar'
  },
  {
    name: 'CMS Management',
    href: '/admin/cms',
    icon: Globe,
    description: 'Manage Strapi content'
  },
  {
    name: 'Coverage',
    icon: Radio,
    children: [
      { name: 'Dashboard', href: '/admin/coverage', icon: LayoutDashboard },
      { name: 'Analytics', href: '/admin/coverage/analytics', icon: Activity },
      { name: 'Testing', href: '/admin/coverage/testing', icon: TestTube },
      { name: 'Providers', href: '/admin/coverage/providers', icon: Building2 },
      { name: 'Maps', href: '/admin/coverage/maps', icon: Map }
    ]
  },
  {
    name: 'Billing & Revenue',
    icon: CreditCard,
    children: [
      { name: 'Dashboard', href: '/admin/billing', icon: LayoutDashboard },
      { name: 'Customers', href: '/admin/billing/customers', icon: UserCheck },
      { name: 'Invoices', href: '/admin/billing/invoices', icon: Receipt },
      { name: 'Subscriptions', href: '/admin/billing/subscriptions', icon: List },
      { name: 'Analytics', href: '/admin/billing/analytics', icon: TrendingUp },
      { name: 'Transactions', href: '/admin/billing/transactions', icon: DollarSign }
    ]
  }
];

const adminNavigation = [
  {
    name: 'Orchestrator',
    href: '/admin/orchestrator',
    icon: Network,
    adminOnly: true,
    description: 'AI agent workflows and performance'
  },
  {
    name: 'Users',
    icon: Users,
    adminOnly: true,
    children: [
      { name: 'All Users', href: '/admin/users', icon: Users },
      { name: 'Roles & Permissions', href: '/admin/users/roles', icon: UserCheck },
      { name: 'Activity Log', href: '/admin/users/activity', icon: Clock }
    ]
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    adminOnly: true
  }
];

export function Sidebar({ isOpen, onToggle, user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'product_manager';

  // State to manage which dropdowns are expanded
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand dropdowns that contain the current active page
    const expanded: string[] = [];
    navigation.forEach((item) => {
      if (item.children) {
        const isCurrentlyActive = item.children.some((child) => pathname.startsWith(child.href));
        if (isCurrentlyActive) {
          expanded.push(item.name);
        }
      }
    });
    adminNavigation.forEach((item) => {
      if (item.children) {
        const isCurrentlyActive = item.children.some((child) => pathname.startsWith(child.href));
        if (isCurrentlyActive) {
          expanded.push(item.name);
        }
      }
    });
    return expanded;
  });

  const isActiveLink = (href: string, end?: boolean) => {
    if (end) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const toggleDropdown = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isExpanded = (itemName: string) => expandedItems.includes(itemName);

  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        isOpen ? 'w-64' : 'w-16'
      )}
      data-testid="sidebar"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-circleTel-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CT</span>
            </div>
            <span className="font-semibold text-gray-900">Admin Panel</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft
            className={cn(
              'h-5 w-5 text-gray-500 transition-transform duration-200',
              !isOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <div className="space-y-1">
                {/* Dropdown Header - Clickable */}
                <button
                  onClick={() => isOpen && toggleDropdown(item.name)}
                  className={cn(
                    'flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all',
                    'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    isOpen && 'cursor-pointer',
                    !isOpen && 'cursor-default'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {isOpen && (
                    <>
                      <span className="flex-1 text-left">{item.name}</span>
                      {isExpanded(item.name) ? (
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                      )}
                    </>
                  )}
                </button>

                {/* Dropdown Content */}
                {isOpen && isExpanded(item.name) && (
                  <div className="ml-9 space-y-1 pl-4">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm rounded-lg transition-all',
                          isActiveLink(child.href)
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <child.icon className="mr-2 h-4 w-4" />
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href!}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all',
                  isActiveLink(item.href!, item.end)
                    ? 'bg-gray-100 text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {isOpen && (
                  <span className="flex-1">{item.name}</span>
                )}
                {isOpen && item.badge && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    3
                  </span>
                )}
              </Link>
            )}
          </div>
        ))}

        {/* Admin-only navigation */}
        {isAdmin && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200">
              {isOpen && (
                <div className="px-3 py-2 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Administration
                </div>
              )}
              {adminNavigation.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <div className="space-y-1">
                      {/* Admin Dropdown Header - Clickable */}
                      <button
                        onClick={() => isOpen && toggleDropdown(item.name)}
                        className={cn(
                          'flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all',
                          'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                          isOpen && 'cursor-pointer',
                          !isOpen && 'cursor-default'
                        )}
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {isOpen && (
                          <>
                            <span className="flex-1 text-left">{item.name}</span>
                            {isExpanded(item.name) ? (
                              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                            ) : (
                              <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                            )}
                          </>
                        )}
                      </button>

                      {/* Admin Dropdown Content */}
                      {isOpen && isExpanded(item.name) && (
                        <div className="ml-9 space-y-1 pl-4">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                'flex items-center px-3 py-2 text-sm rounded-lg transition-all',
                                isActiveLink(child.href)
                                  ? 'bg-gray-100 text-gray-900 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              )}
                            >
                              <child.icon className="mr-2 h-4 w-4" />
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href!}
                      className={cn(
                        'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all',
                        isActiveLink(item.href!)
                          ? 'bg-gray-100 text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {isOpen && item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User info */}
      {isOpen && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}