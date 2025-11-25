'use client';

import { usePathname } from 'next/navigation';
import { Menu, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from '@/components/admin/notifications/NotificationBell';

interface User {
  full_name?: string;
  role?: string;
}

interface AdminHeaderProps {
  onMenuClick: () => void;
  user: User;
  onLogout: () => void;
  sidebarOpen?: boolean;
}

// Page title and description mapping based on URL path
const getPageInfo = (pathname: string): { title: string; description: string } => {
  // Dashboard
  if (pathname === '/admin' || pathname === '/admin/') {
    return {
      title: 'Dashboard',
      description: 'Overview of your CircleTel admin portal'
    };
  }

  // Products
  if (pathname.startsWith('/admin/products')) {
    if (pathname.includes('/new')) {
      return { title: 'Add New Product', description: 'Create a new product offering' };
    }
    if (pathname.includes('/edit') || pathname.match(/\/admin\/products\/[^/]+$/)) {
      return { title: 'Edit Product', description: 'Update product details and pricing' };
    }
    if (pathname.includes('/drafts')) {
      return { title: 'Product Drafts', description: 'Manage draft products' };
    }
    if (pathname.includes('/archived')) {
      return { title: 'Archived Products', description: 'View archived products' };
    }
    return { title: 'Product Catalogue Management', description: 'Manage your CircleTel product offerings' };
  }

  // Quotes
  if (pathname.startsWith('/admin/quotes')) {
    if (pathname.match(/\/admin\/quotes\/[^/]+$/)) {
      return { title: 'Quote Details', description: 'View and manage quote information' };
    }
    return { title: 'Quote Management', description: 'Manage customer quotes and proposals' };
  }

  // Orders
  if (pathname.startsWith('/admin/orders')) {
    if (pathname.match(/\/admin\/orders\/[^/]+$/)) {
      return { title: 'Order Details', description: 'View and manage order information' };
    }
    return { title: 'Order Management', description: 'Track and manage customer orders' };
  }

  // Customers
  if (pathname.startsWith('/admin/customers')) {
    if (pathname.match(/\/admin\/customers\/[^/]+$/)) {
      return { title: 'Customer Details', description: 'View customer account information' };
    }
    return { title: 'Customer Management', description: 'Manage customer accounts' };
  }

  // Approvals/Workflow
  if (pathname.startsWith('/admin/workflow')) {
    return { title: 'Approval Workflow', description: 'Review and approve pending items' };
  }

  // Forms
  if (pathname.startsWith('/admin/forms')) {
    return { title: 'Client Forms', description: 'Manage client assessment forms' };
  }

  // KYC
  if (pathname.startsWith('/admin/kyc')) {
    return { title: 'KYC Review', description: 'Review customer verification documents' };
  }

  // Notifications
  if (pathname.startsWith('/admin/notifications')) {
    return { title: 'Notifications', description: 'Email templates and notification logs' };
  }

  // Audit Logs
  if (pathname.startsWith('/admin/audit-logs')) {
    return { title: 'Audit Logs', description: 'Monitor admin activities and security events' };
  }

  // Zoho Integration
  if (pathname.startsWith('/admin/zoho')) {
    return { title: 'Zoho Integration', description: 'Manage Zoho CRM, Mail, and Calendar' };
  }

  // CMS
  if (pathname.startsWith('/admin/cms')) {
    return { title: 'CMS Management', description: 'Manage website content' };
  }

  // Coverage
  if (pathname.startsWith('/admin/coverage')) {
    if (pathname.includes('/analytics')) {
      return { title: 'Coverage Analytics', description: 'Analyze coverage check data' };
    }
    if (pathname.includes('/testing')) {
      return { title: 'Coverage Testing', description: 'Test provider integrations' };
    }
    if (pathname.includes('/providers')) {
      return { title: 'Coverage Providers', description: 'Manage network providers' };
    }
    if (pathname.includes('/maps')) {
      return { title: 'Coverage Maps', description: 'View coverage maps' };
    }
    return { title: 'Coverage Management', description: 'Monitor coverage checks and providers' };
  }

  // Billing & Revenue
  if (pathname.startsWith('/admin/billing')) {
    if (pathname.includes('/customers')) {
      return { title: 'Billing Customers', description: 'Manage customer billing' };
    }
    if (pathname.includes('/invoices')) {
      return { title: 'Invoices', description: 'View and manage invoices' };
    }
    if (pathname.includes('/subscriptions')) {
      return { title: 'Subscriptions', description: 'Manage recurring subscriptions' };
    }
    if (pathname.includes('/analytics')) {
      return { title: 'Billing Analytics', description: 'Revenue insights and metrics' };
    }
    if (pathname.includes('/transactions')) {
      return { title: 'Transactions', description: 'View payment transactions' };
    }
    return { title: 'Billing & Revenue', description: 'Manage billing and revenue operations' };
  }

  // Admin section
  if (pathname.startsWith('/admin/orchestrator')) {
    return { title: 'Agent Orchestrator', description: 'AI agent workflows and performance' };
  }

  if (pathname.startsWith('/admin/users')) {
    if (pathname.includes('/roles')) {
      return { title: 'Roles & Permissions', description: 'Manage user roles and access' };
    }
    if (pathname.includes('/activity')) {
      return { title: 'User Activity Log', description: 'Monitor user actions' };
    }
    return { title: 'User Management', description: 'Manage admin users' };
  }

  if (pathname.startsWith('/admin/settings')) {
    return { title: 'Settings', description: 'Configure system settings' };
  }

  // Default fallback
  return {
    title: 'Admin Panel',
    description: 'CircleTel administration dashboard'
  };
};

export function AdminHeader({ onMenuClick, user, onLogout, sidebarOpen }: AdminHeaderProps) {
  const pathname = usePathname();
  const { title, description } = getPageInfo(pathname);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 w-full">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="flex-shrink-0"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* Notifications - New NotificationBell Component */}
          <NotificationBell />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden lg:block text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.role?.replace('_', ' ')}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
