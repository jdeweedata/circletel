"use client";

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMenu2, IconX, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

import { SidebarProvider, useSidebar } from './context';
import { useSidebarAnimations, useSidebarStyles } from './hooks';
import { SIDEBAR_ANIMATIONS, SIDEBAR_CONFIG } from './constants';
import type {
  SidebarProps,
  SidebarBodyProps,
  SidebarLinkProps,
  SidebarToggleProps,
} from './types';

/**
 * Main Sidebar component with integrated provider
 */
export function Sidebar({
  children,
  className,
  defaultOpen,
  isOpen,
  onOpenChange,
  animate,
  ...props
}: SidebarProps) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      animate={animate}
    >
      <SidebarContainer className={className} {...props}>
        {children}
      </SidebarContainer>
    </SidebarProvider>
  );
}

/**
 * Internal container component that can use the sidebar context
 */
function SidebarContainer({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.ComponentProps<'div'>) {
  return (
    <div className={cn('sidebar-container', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Sidebar body that handles both desktop and mobile layouts
 */
export const SidebarBody = memo(function SidebarBody({
  children,
  className,
  showOnMobile = true,
  ...props
}: SidebarBodyProps) {
  return (
    <>
      <DesktopSidebar className={className} {...props}>
        {children}
      </DesktopSidebar>
      {showOnMobile && (
        <MobileSidebar className={className}>
          {children}
        </MobileSidebar>
      )}
    </>
  );
});

/**
 * Desktop sidebar implementation
 */
const DesktopSidebar = memo(function DesktopSidebar({
  children,
  className,
  ...props
}: SidebarBodyProps) {
  const { isOpen, isAnimated } = useSidebar();
  const { getDesktopWidth } = useSidebarAnimations(isOpen, isAnimated);
  const styles = useSidebarStyles();

  return (
    <motion.div
      className={cn(styles.desktop, className)}
      animate={{ width: getDesktopWidth() }}
      transition={SIDEBAR_ANIMATIONS.DESKTOP_WIDTH}
      {...props}
    >
      {children}
    </motion.div>
  );
});

/**
 * Mobile sidebar implementation
 */
const MobileSidebar = memo(function MobileSidebar({
  children,
  className,
}: Pick<SidebarBodyProps, 'children' | 'className'>) {
  const { isOpen, toggle } = useSidebar();
  const styles = useSidebarStyles();

  return (
    <div className={styles.mobileHeader}>
      <div className="flex justify-end z-20 w-full">
        <IconMenu2
          className="text-neutral-800 dark:text-neutral-200 cursor-pointer"
          onClick={toggle}
          aria-label="Open sidebar menu"
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...SIDEBAR_ANIMATIONS.MOBILE_SLIDE}
            className={cn(styles.mobileOverlay, className)}
          >
            <button
              className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200"
              onClick={toggle}
              aria-label="Close sidebar menu"
            >
              <IconX />
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/**
 * Enhanced sidebar link component
 */
export const SidebarLink = memo(function SidebarLink({
  link,
  className,
  onClick,
  ...props
}: SidebarLinkProps) {
  const { isOpen, isAnimated } = useSidebar();
  const { getTextAnimation } = useSidebarAnimations(isOpen, isAnimated);
  const styles = useSidebarStyles();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      e.preventDefault();
      onClick(link);
    }
  };

  return (
    <a
      href={link.href}
      className={cn(styles.link, className)}
      onClick={handleClick}
      aria-label={link.ariaLabel || link.label}
      title={!isOpen ? link.label : undefined}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={getTextAnimation()}
        transition={SIDEBAR_ANIMATIONS.TEXT_FADE}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>

      {/* Optional badge */}
      {link.badge && isOpen && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="ml-auto px-2 py-1 text-xs bg-neutral-200 dark:bg-neutral-700 rounded-full"
        >
          {link.badge}
        </motion.span>
      )}
    </a>
  );
});

/**
 * Enhanced toggle button component
 */
export const SidebarToggle = memo(function SidebarToggle({
  className,
  openIcon,
  closedIcon,
  showTooltip = true,
  ...props
}: SidebarToggleProps) {
  const { isOpen, toggle } = useSidebar();
  const styles = useSidebarStyles();

  const tooltipText = isOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)';

  return (
    <button
      onClick={toggle}
      className={cn(styles.toggle, className)}
      title={showTooltip ? tooltipText : undefined}
      aria-label={tooltipText}
      {...props}
    >
      {isOpen ? (
        openIcon || <IconChevronLeft className="h-4 w-4 text-neutral-700 dark:text-neutral-200" />
      ) : (
        closedIcon || <IconChevronRight className="h-4 w-4 text-neutral-700 dark:text-neutral-200" />
      )}
    </button>
  );
});

// Display names for debugging
Sidebar.displayName = 'Sidebar';
SidebarBody.displayName = 'SidebarBody';
SidebarLink.displayName = 'SidebarLink';
SidebarToggle.displayName = 'SidebarToggle';