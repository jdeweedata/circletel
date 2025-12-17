'use client';

/**
 * Business Dashboard Header
 *
 * Top navigation bar for B2B customer portal.
 *
 * @module components/business-dashboard/navigation/BusinessDashboardHeader
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Building2,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { BUSINESS_NAV_ITEMS, BUSINESS_SECONDARY_NAV } from './nav-config';
import { cn } from '@/lib/utils';

interface BusinessDashboardHeaderProps {
  displayName: string;
  companyName: string;
  email: string;
  onSignOut: () => void;
}

export function BusinessDashboardHeader({
  displayName,
  companyName,
  email,
  onSignOut,
}: BusinessDashboardHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Company */}
        <div className="flex items-center gap-4">
          <Link href="/business/dashboard" className="flex items-center gap-2">
            <Image
              src="/circletel-logo.png"
              alt="CircleTel"
              width={120}
              height={36}
              className="h-8 w-auto"
            />
          </Link>
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l">
            <Building2 className="h-4 w-4 text-circleTel-orange" />
            <span className="text-sm font-medium text-gray-700">
              {companyName}
            </span>
            <Badge variant="secondary" className="text-xs">
              Business
            </Badge>
          </div>
        </div>

        {/* Desktop Navigation - Quick Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {BUSINESS_NAV_ITEMS.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === item.href
                  ? 'bg-circleTel-orange/10 text-circleTel-orange'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hidden sm:flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-circleTel-orange/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-circleTel-orange" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[150px]">
                    {email}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{displayName}</span>
                  <span className="text-xs font-normal text-gray-500">
                    {email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/business/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onSignOut}
                className="text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-circleTel-orange" />
                  {companyName}
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {BUSINESS_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      pathname === item.href
                        ? 'bg-circleTel-orange/10 text-circleTel-orange'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <div className="my-2 border-t" />
                {BUSINESS_SECONDARY_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      pathname === item.href
                        ? 'bg-circleTel-orange/10 text-circleTel-orange'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
