'use client';
import { PiCaretDownBold, PiCaretLeftBold, PiCaretRightBold } from 'react-icons/pi';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  featureSections,
  bottomSections,
  getVisibleSections,
  hasChildren,
  type NavItem,
  type NavSection,
} from '@/lib/admin/feature-registry';

interface User {
  full_name?: string;
  role?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: User;
}

export function Sidebar({ isOpen, onToggle, user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'product_manager';

  // Get visible sections based on admin role
  const visibleSections = getVisibleSections(featureSections, { isAdmin });
  const visibleBottomSections = getVisibleSections(bottomSections, { isAdmin });

  // State to manage which dropdowns are expanded
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand dropdowns that contain the current active page
    const expanded: string[] = [];
    visibleSections.forEach((section) => {
      section.items.forEach((item) => {
        if (hasChildren(item)) {
          const isCurrentlyActive = item.children.some((child) => pathname.startsWith(child.href));
          if (isCurrentlyActive) {
            expanded.push(item.name);
          }
        }
      });
    });
    visibleBottomSections.forEach((section) => {
      section.items.forEach((item) => {
        if (hasChildren(item)) {
          const isCurrentlyActive = item.children.some((child) => pathname.startsWith(child.href));
          if (isCurrentlyActive) {
            expanded.push(item.name);
          }
        }
      });
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
          'lg:flex lg:flex-shrink-0',
          // Always hidden when printing
          'print:hidden'
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
          <PiCaretLeftBold
            className={cn(
              'h-5 w-5 text-gray-500 transition-transform duration-200',
              !isOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleSections.map((section, sectionIndex) => (
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
                                <PiCaretDownBold className="h-4 w-4 transition-transform duration-200" />
                              ) : (
                                <PiCaretRightBold className="h-4 w-4 transition-transform duration-200" />
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
        {visibleBottomSections.length > 0 && (
          <>
            <div className="pt-4 mt-4 border-t border-gray-200">
              {isOpen && (
                <div className="px-3 py-2 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Administration
                </div>
              )}
              {visibleBottomSections.flatMap((section) => section.items).map((item) => (
                <div key={item.name}>
                  {hasChildren(item) ? (
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
                                  <PiCaretDownBold className="h-4 w-4 transition-transform duration-200" />
                                ) : (
                                  <PiCaretRightBold className="h-4 w-4 transition-transform duration-200" />
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