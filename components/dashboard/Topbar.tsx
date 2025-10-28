'use client';

import { Menu, Search, Bell } from 'lucide-react';
import Image from 'next/image';

type Props = {
  onToggleSidebar: () => void;
  displayName: string;
  email: string;
};

export default function Topbar({ onToggleSidebar, displayName, email }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-14">
        {/* Mobile menu */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white hover:bg-gray-50"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>

        {/* Brand (compact) */}
        <div className="flex items-center gap-2 lg:hidden">
          <Image src="/lovable-uploads/0d94be75-5c0a-44bf-95fa-777a85da966e.png" alt="CircleTel" width={24} height={24} />
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              placeholder="Search"
              className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white hover:bg-gray-50" aria-label="Notifications">
            <Bell className="h-5 w-5 text-gray-700" />
          </button>
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-gray-900">{displayName}</span>
            <span className="text-xs text-gray-500">{email}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-200 overflow-hidden" aria-hidden>
            <Image src="/icons/avatar-placeholder.svg" alt="" width={36} height={36} />
          </div>
        </div>
      </div>
    </header>
  );
}
