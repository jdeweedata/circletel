'use client';

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

export function AdminHeader({ onMenuClick, user, onLogout, sidebarOpen }: AdminHeaderProps) {
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
              Product Catalogue Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate hidden sm:block">
              Manage your CircleTel product offerings
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
