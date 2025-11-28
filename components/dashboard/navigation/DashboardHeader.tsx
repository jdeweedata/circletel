'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu, Bell, LogOut, ChevronDown, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import DashboardTabs from './DashboardTabs';

interface DashboardHeaderProps {
  displayName: string;
  email: string;
  onSignOut: () => void;
  onMobileMenuToggle?: () => void;
  showSearch?: boolean;
}

export default function DashboardHeader({
  displayName,
  email,
  onSignOut,
  onMobileMenuToggle,
  showSearch = false,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center h-14 px-4 sm:px-6 lg:px-8">
        {/* Mobile: Menu toggle + Logo */}
        <div className="flex items-center gap-3 lg:hidden">
          {onMobileMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileMenuToggle}
              className="h-9 w-9"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </Button>
          )}
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/images/circletel-enclosed-logo.png"
              alt="CircleTel"
              width={28}
              height={28}
            />
          </Link>
        </div>

        {/* Desktop: Logo */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/images/circletel-enclosed-logo.png"
              alt="CircleTel"
              width={32}
              height={32}
            />
            <span className="font-semibold text-circleTel-darkNeutral">
              CircleTel
            </span>
          </Link>
        </div>

        {/* Desktop: Navigation Tabs */}
        <div className="hidden lg:flex flex-1 justify-center">
          <DashboardTabs />
        </div>

        {/* Optional Search - Hidden by default */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-circleTel-orange/20 focus:border-circleTel-orange"
              />
            </div>
          </div>
        )}

        {/* Right side: Notifications + User Menu */}
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex h-9 w-9"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-600" />
          </Button>

          {/* User Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
              {/* User info - hidden on mobile */}
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                  {displayName}
                </span>
                <span className="text-xs text-gray-500 truncate max-w-[120px]">
                  {email}
                </span>
              </div>

              {/* Avatar */}
              <div className="h-9 w-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                <Image
                  src="/icons/avatar-placeholder.svg"
                  alt=""
                  width={36}
                  height={36}
                />
              </div>

              <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onSignOut}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tab indicator line - creates visual separation */}
      <div className="hidden lg:block h-[1px] bg-gray-100" />
    </header>
  );
}
