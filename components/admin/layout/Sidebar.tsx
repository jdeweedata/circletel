'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RandSign } from '@/components/ui/icons/rand-sign';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  TrendingUp,
  Radio,
  Map,
  Activity,
  TestTube,
  Building2,
  Network,
  ShieldCheck,
  ShoppingCart,
  Bell,
  Target,
  Handshake,
  UserPlus,
  LinkIcon,
  MapPin,
  Calendar,
  Wrench,
  ImageIcon,
  PanelTop,
  AlertCircle,
  RefreshCw,
  Truck,
  Box,
  Briefcase,
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

// Type definitions for navigation items
interface NavChild {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItemWithHref {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  description?: string;
  adminOnly?: boolean;
}

interface NavItemWithChildren {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavChild[];
  description?: string;
  adminOnly?: boolean;
}

type NavItem = NavItemWithHref | NavItemWithChildren;

interface NavSection {
  label: string | null;
  items: NavItem[];
}

// Type guard to check if item has children
function hasChildren(item: NavItem): item is NavItemWithChildren {
  return 'children' in item && Array.isArray(item.children);
}

// Navigation organized by category
const navigationSections: NavSection[] = [
  {
    label: null, // No label for first section (Dashboard)
    items: [
      {
        name: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        end: true
      },
    ]
  },
  {
    label: 'Core Operations',
    items: [
      {
        name: 'Products',
        icon: Package,
        children: [
          { name: 'All Products', href: '/admin/products', icon: List },
          { name: 'Add Product', href: '/admin/products/new', icon: Plus },
          { name: 'MTN Dealer Products', href: '/admin/mtn-dealer-products', icon: Handshake },
          { name: 'Drafts', href: '/admin/products/drafts', icon: FileText },
          { name: 'Archived', href: '/admin/products/archived', icon: Archive }
        ]
      },
      {
        name: 'Quotes',
        icon: FileText,
        children: [
          { name: 'All Quotes', href: '/admin/quotes', icon: List },
          { name: 'Pending Approval', href: '/admin/quotes?status=pending_approval', icon: Clock },
          { name: 'Accepted', href: '/admin/quotes?status=accepted', icon: CheckCircle }
        ]
      },
      {
        name: 'Orders',
        href: '/admin/orders',
        icon: ShoppingCart,
        description: 'Manage customer orders'
      },
      {
        name: 'Field Operations',
        icon: Wrench,
        children: [
          { name: 'Dashboard', href: '/admin/field-ops', icon: LayoutDashboard },
          { name: 'Technicians', href: '/admin/field-ops/technicians', icon: Users },
          { name: 'Jobs', href: '/admin/field-ops/jobs', icon: Briefcase },
          { name: 'Installation Schedule', href: '/admin/orders/installations', icon: Calendar }
        ]
      },
      {
        name: 'Customers',
        href: '/admin/customers',
        icon: Users,
        description: 'Manage customer accounts'
      },
      {
        name: 'B2B Customers',
        icon: Building2,
        description: 'Business customer journey',
        children: [
          { name: 'All B2B Customers', href: '/admin/b2b-customers', icon: Building2 },
          { name: 'Site Details', href: '/admin/b2b-customers/site-details', icon: MapPin },
          { name: 'Journey Overview', href: '/admin/b2b-customers?view=journey', icon: TrendingUp },
          { name: 'Blocked', href: '/admin/b2b-customers?status=blocked', icon: AlertCircle }
        ]
      },
      {
        name: 'Corporate Clients',
        icon: Briefcase,
        description: 'Enterprise multi-site accounts',
        children: [
          { name: 'All Corporates', href: '/admin/corporate', icon: Building2 },
          { name: 'Add Corporate', href: '/admin/corporate/new', icon: Plus },
        ]
      },
      {
        name: 'Suppliers',
        icon: Truck,
        children: [
          { name: 'All Suppliers', href: '/admin/suppliers', icon: Truck },
          { name: 'Product Catalog', href: '/admin/suppliers/products', icon: Box }
        ]
      },
    ]
  },
  {
    label: 'Sales & Partners',
    items: [
      {
        name: 'Partners',
        icon: Handshake,
        children: [
          { name: 'All Partners', href: '/admin/partners', icon: Users },
          { name: 'Pending Approvals', href: '/admin/partners/approvals', icon: Clock },
        ]
      },
      {
        name: 'Competitor Analysis',
        icon: Target,
        children: [
          { name: 'Dashboard', href: '/admin/competitor-analysis', icon: LayoutDashboard },
          { name: 'Providers', href: '/admin/competitor-analysis/providers', icon: Building2 },
          { name: 'Matching', href: '/admin/competitor-analysis/matching', icon: LinkIcon }
        ]
      },
    ]
  },
  {
    label: 'Compliance',
    items: [
      {
        name: 'Approvals',
        href: '/admin/workflow',
        icon: CheckCircle
      },
      {
        name: 'KYC Review',
        href: '/admin/kyc',
        icon: ShieldCheck,
        description: 'Review customer verification documents'
      },
      {
        name: 'KYB Compliance',
        href: '/admin/compliance/kyb',
        icon: ShieldCheck,
        description: 'View KYB subject KYC status and risk'
      },
    ]
  },
  {
    label: 'Network',
    items: [
      {
        name: 'Coverage',
        icon: Radio,
        children: [
          { name: 'Dashboard', href: '/admin/coverage', icon: LayoutDashboard },
          { name: 'Analytics', href: '/admin/coverage/analytics', icon: Activity },
          { name: 'Testing', href: '/admin/coverage/testing', icon: TestTube },
          { name: 'Providers', href: '/admin/coverage/providers', icon: Building2 },
          { name: 'Maps', href: '/admin/coverage/maps', icon: Map },
          { name: 'Base Stations', href: '/admin/coverage/base-stations', icon: MapPin }
        ]
      },
      {
        name: 'Diagnostics',
        href: '/admin/diagnostics',
        icon: Activity,
        description: 'Monitor subscriber connection health'
      },
    ]
  },
  {
    label: 'Finance',
    items: [
      {
        name: 'Billing & Revenue',
        icon: CreditCard,
        children: [
          { name: 'Dashboard', href: '/admin/billing', icon: LayoutDashboard },
          { name: 'Customers', href: '/admin/billing/customers', icon: UserCheck },
          { name: 'Invoices', href: '/admin/billing/invoices', icon: Receipt },
          { name: 'Outstanding', href: '/admin/finance/outstanding', icon: AlertCircle },
          { name: 'AR Analytics', href: '/admin/finance/ar-analytics', icon: TrendingUp },
        ]
      },
      {
        name: 'Payments',
        icon: RandSign,
        children: [
          { name: 'Provider Monitoring', href: '/admin/payments/monitoring', icon: Activity },
          { name: 'Transactions', href: '/admin/payments/transactions', icon: Receipt },
          { name: 'Reconciliation', href: '/admin/finance/reconciliation', icon: RefreshCw },
          { name: 'Webhooks', href: '/admin/payments/webhooks', icon: Zap },
          { name: 'Settings', href: '/admin/payments/settings', icon: Settings }
        ]
      }
    ]
  },
  {
    label: 'Platform',
    items: [
      {
        name: 'Notifications',
        href: '/admin/notifications',
        icon: Bell,
        description: 'Email templates and notification logs'
      },
      {
        name: 'Zoho Integration',
        href: '/admin/zoho',
        icon: Zap,
        description: 'Manage Zoho CRM, Mail, and Calendar'
      },
      {
        name: 'Integrations',
        icon: LinkIcon,
        children: [
          { name: 'Overview', href: '/admin/integrations', icon: LayoutDashboard },
          { name: 'Interstellio RADIUS', href: '/admin/integrations/interstellio', icon: Radio },
          { name: 'OAuth Tokens', href: '/admin/integrations/oauth', icon: Settings },
          { name: 'Webhooks', href: '/admin/integrations/webhooks', icon: Zap },
          { name: 'API Health', href: '/admin/integrations/apis', icon: Activity },
          { name: 'Cron Jobs', href: '/admin/integrations/cron', icon: Clock }
        ]
      },
      {
        name: 'CMS Management',
        icon: Globe,
        children: [
          { name: 'Pages', href: '/admin/cms', icon: FileText },
          { name: 'Media Library', href: '/admin/cms/media', icon: ImageIcon },
          { name: 'Page Builder', href: '/admin/cms/builder', icon: PanelTop }
        ]
      },
    ]
  },
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
    navigationSections.forEach((section) => {
      section.items.forEach((item) => {
        if (hasChildren(item)) {
          const isCurrentlyActive = item.children.some((child: NavChild) => pathname.startsWith(child.href));
          if (isCurrentlyActive) {
            expanded.push(item.name);
          }
        }
      });
    });
    adminNavigation.forEach((item) => {
      if ('children' in item && item.children) {
        const isCurrentlyActive = item.children.some((child: NavChild) => pathname.startsWith(child.href));
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
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
          // Mobile: Full overlay sidebar that slides in/out
          'lg:relative lg:z-auto',
          isOpen
            ? 'translate-x-0 w-64'
            : '-translate-x-full lg:translate-x-0 lg:w-16',
          // On desktop (lg+), sidebar is part of the layout
          'lg:flex lg:flex-shrink-0'
        )}
        data-testid="sidebar"
      >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 flex items-center justify-center">
              <Image
                src="/images/circletel-enclosed-logo.png"
                alt="CircleTel Logo"
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
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
        {navigationSections.map((section, sectionIndex) => (
          <div key={section.label || 'main'}>
            {/* Section Label */}
            {section.label && isOpen && (
              <div className={cn(
                'px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider',
                sectionIndex > 0 && 'mt-4 pt-4 border-t border-gray-200'
              )}>
                {section.label}
              </div>
            )}
            {section.label && !isOpen && sectionIndex > 0 && (
              <div className="my-2 border-t border-gray-200" />
            )}

            {/* Section Items */}
            {section.items.map((item) => (
              <div key={item.name}>
                {hasChildren(item) ? (
                  <div className="space-y-1">
                    {/* Dropdown Header - Clickable */}
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      </TooltipTrigger>
                      {!isOpen && (
                        <TooltipContent side="right" className="font-medium">
                          {item.name}
                        </TooltipContent>
                      )}
                    </Tooltip>

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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all',
                          isActiveLink(item.href, item.end)
                            ? 'bg-gray-100 text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {isOpen && (
                          <span className="flex-1">{item.name}</span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {!isOpen && (
                      <TooltipContent side="right" className="font-medium">
                        {item.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
              </div>
            ))}
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
                      <Tooltip>
                        <TooltipTrigger asChild>
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
                        </TooltipTrigger>
                        {!isOpen && (
                          <TooltipContent side="right" className="font-medium">
                            {item.name}
                          </TooltipContent>
                        )}
                      </Tooltip>

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
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      </TooltipTrigger>
                      {!isOpen && (
                        <TooltipContent side="right" className="font-medium">
                          {item.name}
                        </TooltipContent>
                      )}
                    </Tooltip>
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
    </TooltipProvider>
  );
}