'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  UserCircle,
  FileText,
  CreditCard,
  Package,
  Ticket,
  Settings,
  HelpCircle,
  BarChart2,
  Network,
  MapPin,
  Building2,
  MessageSquare,
  Box,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Accounts', href: '/dashboard/profile', icon: UserCircle },
  { label: 'Addresses', href: '#', icon: MapPin, disabled: true },
  { label: 'Properties', href: '#', icon: Building2, disabled: true },
  { label: 'Communications', href: '#', icon: MessageSquare, disabled: true },
  { label: 'Inventory', href: '#', icon: Box, disabled: true },
  { label: 'Issues', href: '#', icon: AlertTriangle, disabled: true },
  { label: 'Network', href: '/dashboard/tracking', icon: Network },
  { label: 'Orders', href: '/dashboard/orders', icon: Package },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Tickets', href: '#', icon: Ticket, disabled: true },
  { label: 'Analytics', href: '#', icon: BarChart2, disabled: true },
  { label: 'Help & Support', href: '#', icon: HelpCircle },
  { label: 'Settings', href: '#', icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-[280px] shrink-0 border-r bg-white">
      <div className="flex h-screen sticky top-0 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 px-3 py-2">
          <img src="/lovable-uploads/0d94be75-5c0a-44bf-95fa-777a85da966e.png" alt="CircleTel" className="h-6 w-auto" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {items.map((item) => {
            const active = item.href !== '#' && pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.disabled ? '#' : item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                  active
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  item.disabled && 'opacity-50 pointer-events-none'
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900')} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-2 text-xs text-gray-500">© 2025 CircleTel</div>
      </div>
    </aside>
  );
}
