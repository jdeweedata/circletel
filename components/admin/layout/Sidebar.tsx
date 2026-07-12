'use client';
import {
  PiCaretDownBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiCreditCardBold,
  PiGearBold,
  PiGlobeBold,
  PiMegaphoneBold,
  PiTrendUpBold,
  PiUsersBold,
  PiWrenchBold,
} from 'react-icons/pi';
import type { IconType } from 'react-icons';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getWorkspaceNav,
  workspaceForPath,
  hasChildren,
  type NavItem,
  type WorkspaceId,
} from '@/lib/admin/feature-registry';
import type { AdminRole } from '@/lib/auth/constants';
import { getTenantConfig } from '@/lib/tenant';

interface User {
  full_name?: string;
  role?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  user: User;
}

const ADMIN_ROLES: AdminRole[] = ['super_admin', 'product_manager', 'editor', 'viewer'];

const WORKSPACE_ICON: Record<WorkspaceId, IconType> = {
  executive: PiTrendUpBold,
  finance: PiCreditCardBold,
  sales: PiMegaphoneBold,
  ops: PiWrenchBold,
  support: PiUsersBold,
  platform: PiGlobeBold,
  admin: PiGearBold,
};

/**
 * Collapsed-rail (w-16) flyout for a parent item: hover/focus reveals its child
 * links (PR4). Leaf items keep a name Tooltip; expanded rail uses the inline
 * accordion. ponytail: CSS transition (not framer) matches the sidebar's motion
 * vocabulary and `motion-reduce:` handles reduced-motion in one class — swap for
 * motion.div + useReducedMotion() only if spring physics is wanted.
 *
 * The panel is `position: fixed`, positioned from the trigger's
 * getBoundingClientRect (spec §3 escalation). An `absolute left-full` panel is
 * painted BEHIND the main content because the sidebar's `lg:translate-x-0`
 * transform creates a stacking context the panel can't escape (verified live via
 * elementFromPoint). `fixed` lifts it above content; it stays a DOM child of the
 * wrapper so the hover-bridge (icon→panel without a dead-zone) still works, and
 * it re-reads the rect on scroll/resize while open.
 */
function CollapsedFlyout({
  item,
  isActiveLink,
}: {
  item: NavItem;
  isActiveLink: (href: string, end?: boolean) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      // The panel is `position: fixed`, but the sidebar's `lg:translate-x-0`
      // transform makes the SIDEBAR its containing block — so fixed coords are
      // relative to the sidebar box, not the viewport. Subtract the sidebar
      // origin so the panel tracks the trigger at any scroll position (verified:
      // without this, bottom items in a scrolled long page fly off-screen).
      const host = btn.closest('[data-testid="sidebar"]');
      const h = host?.getBoundingClientRect();
      setCoords({ top: r.top - (h?.top ?? 0), left: r.right - (h?.left ?? 0) });
    };
    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open]);

  if (!hasChildren(item)) return null;
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={item.name}
        className="flex w-full items-center justify-center rounded-lg px-0 py-2.5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
      </button>

      <div
        role="menu"
        style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 60 }}
        className={cn(
          'min-w-56 pl-2 transition duration-150 ease-out',
          'motion-reduce:transition-none',
          open
            ? 'visible translate-x-0 opacity-100'
            : 'pointer-events-none invisible -translate-x-1 opacity-0'
        )}
      >
        <div className="rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {item.name}
          </p>
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              role="menuitem"
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                isActiveLink(child.href)
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <child.icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{child.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, onToggle, user }: SidebarProps) {
  const pathname = usePathname();

  // Real admin roles are super_admin | product_manager | editor | viewer.
  // Unknown/absent role falls back to least privilege.
  const role: AdminRole = ADMIN_ROLES.includes(user?.role as AdminRole)
    ? (user!.role as AdminRole)
    : 'viewer';

  // Role-scoped, workspace-grouped nav (feature-registry, PR #613).
  const workspaces = getWorkspaceNav({ role, modules: getTenantConfig().modules });

  const [activeWs, setActiveWs] = useState<WorkspaceId>(
    () => workspaceForPath(pathname) ?? workspaces[0]?.id ?? 'executive'
  );

  // Follow the route into another (accessible) workspace on navigation.
  useEffect(() => {
    const w = workspaceForPath(pathname);
    if (w && w !== activeWs && workspaces.some((x) => x.id === w)) setActiveWs(w);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const active = workspaces.find((w) => w.id === activeWs) ?? workspaces[0];
  const items: NavItem[] = active?.items ?? [];
  const ActiveIcon = active ? WORKSPACE_ICON[active.id] : PiTrendUpBold;

  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Auto-expand the dropdown that contains the active route.
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  useEffect(() => {
    const expanded = items
      .filter(
        (i) =>
          hasChildren(i) &&
          i.children.some((c) => pathname.startsWith(c.href.split('?')[0]))
      )
      .map((i) => i.name);
    if (expanded.length) {
      setExpandedItems((prev) => Array.from(new Set([...prev, ...expanded])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWs, pathname]);

  const isActiveLink = (href: string, end?: boolean) => {
    const base = href.split('?')[0];
    return end ? pathname === base : pathname.startsWith(base);
  };

  const toggleDropdown = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName]
    );
  };

  const isExpanded = (itemName: string) => expandedItems.includes(itemName);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
          'lg:relative lg:z-auto',
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-16',
          'lg:flex lg:flex-shrink-0',
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

        {/* Workspace switcher */}
        <div className="relative border-b border-gray-200 px-2 py-2">
          <button
            onClick={() => setSwitcherOpen((o) => !o)}
            aria-label="Switch workspace"
            aria-expanded={switcherOpen}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50',
              isOpen ? 'px-3' : 'justify-center px-0'
            )}
          >
            <ActiveIcon className="h-5 w-5 flex-shrink-0 text-[#F5841E]" />
            {isOpen && (
              <>
                <span className="flex-1 text-left truncate">{active?.label ?? 'Workspace'}</span>
                <PiCaretDownBold
                  className={cn('h-4 w-4 flex-shrink-0 text-gray-400 transition-transform', switcherOpen && 'rotate-180')}
                />
              </>
            )}
          </button>

          {switcherOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} aria-hidden />
              <div
                className={cn(
                  'absolute z-50 rounded-lg border border-gray-200 bg-white p-1 shadow-lg',
                  isOpen ? 'inset-x-2 top-full mt-1' : 'left-full top-0 ml-2 w-56'
                )}
                role="menu"
              >
                {workspaces.map((w) => {
                  const Icon = WORKSPACE_ICON[w.id];
                  return (
                    <button
                      key={w.id}
                      role="menuitem"
                      onClick={() => {
                        setActiveWs(w.id);
                        setSwitcherOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                        w.id === active?.id
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left truncate">{w.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Navigation — active workspace's items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <div key={item.name}>
              {hasChildren(item) ? (
                !isOpen ? (
                  <CollapsedFlyout item={item} isActiveLink={isActiveLink} />
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer transition-all"
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {isExpanded(item.name) ? (
                        <PiCaretDownBold className="h-4 w-4 transition-transform duration-200" />
                      ) : (
                        <PiCaretRightBold className="h-4 w-4 transition-transform duration-200" />
                      )}
                    </button>

                    {isExpanded(item.name) && (
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
                )
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
                      {isOpen && <span className="flex-1">{item.name}</span>}
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
                <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
