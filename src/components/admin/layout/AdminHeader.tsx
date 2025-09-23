import { Bell, Menu, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface User {
  full_name?: string
  role?: string
}

interface AdminHeaderProps {
  onMenuClick: () => void
  user: User
}

export function AdminHeader({ onMenuClick, user }: AdminHeaderProps) {
  const { logout } = useAdminAuth()

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Product Catalogue Management
            </h1>
            <p className="text-sm text-gray-500">
              Manage your CircleTel product offerings
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative" data-testid="notification-bell">
                <Bell className="h-5 w-5" />
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-3 py-2 border-b">
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-sm text-gray-500">3 pending approvals</p>
              </div>
              <DropdownMenuItem>
                <div className="flex-1">
                  <p className="font-medium">New product pending approval</p>
                  <p className="text-sm text-gray-500">BizFibre Connect Ultra submitted for review</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex-1">
                  <p className="font-medium">Pricing update request</p>
                  <p className="text-sm text-gray-500">SkyFibre SMB promotional rates</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex-1">
                  <p className="font-medium">Feature update approval</p>
                  <p className="text-sm text-gray-500">Residential packages updated</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}