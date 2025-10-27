'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Users,
  DollarSign,
  FolderOpen,
  User,
  LogOut,
  Handshake,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/partners',
    icon: Home,
    description: 'Overview and key metrics',
  },
  {
    name: 'Leads',
    href: '/partners/leads',
    icon: Users,
    description: 'Manage your assigned leads',
  },
  {
    name: 'Commissions',
    href: '/partners/commissions',
    icon: DollarSign,
    description: 'Track your earnings',
  },
  {
    name: 'Resources',
    href: '/partners/resources',
    icon: FolderOpen,
    description: 'Marketing materials',
  },
  {
    name: 'Profile',
    href: '/partners/profile',
    icon: User,
    description: 'Update your information',
  },
]

export function PartnerNav() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-circleTel-orange flex items-center justify-center">
            <Handshake className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-circleTel-darkNeutral">
              Partner Portal
            </h2>
            <p className="text-xs text-circleTel-secondaryNeutral">
              CircleTel ISP
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/partners' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-circleTel-orange text-white shadow-md'
                  : 'text-circleTel-secondaryNeutral hover:bg-gray-100 hover:text-circleTel-darkNeutral'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 mr-3 flex-shrink-0',
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-circleTel-orange'
                )}
              />
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate')}>
                  {item.name}
                </p>
                <p
                  className={cn(
                    'text-xs truncate',
                    isActive
                      ? 'text-white/80'
                      : 'text-gray-500 group-hover:text-gray-700'
                  )}
                >
                  {item.description}
                </p>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => {
            // TODO: Implement logout
            window.location.href = '/auth/logout'
          }}
        >
          <LogOut className="h-5 w-5 mr-3 text-gray-400" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
