import type { ComponentProps, ReactNode } from 'react';
import type { motion } from 'framer-motion';

/**
 * Enhanced type definitions for sidebar components
 */

// Core sidebar link interface
export interface SidebarLink {
  /** Display label for the link */
  label: string;
  /** Navigation URL */
  href: string;
  /** Icon component or element */
  icon: ReactNode;
  /** Optional badge content */
  badge?: string | number;
  /** Whether the link is currently active */
  isActive?: boolean;
  /** Additional accessibility label */
  ariaLabel?: string;
}

// Sidebar state management
export interface SidebarState {
  /** Whether the sidebar is currently open/expanded */
  isOpen: boolean;
  /** Whether animations are enabled */
  isAnimated: boolean;
  /** Device type detection */
  isMobile: boolean;
}

// Context value interface
export interface SidebarContextValue extends SidebarState {
  /** Function to set open state */
  setIsOpen: (open: boolean) => void;
  /** Function to toggle open/closed state */
  toggle: () => void;
  /** Function to open sidebar */
  open: () => void;
  /** Function to close sidebar */
  close: () => void;
}

// Component prop interfaces
export interface SidebarProviderProps {
  children: ReactNode;
  /** Initial open state (default: true) */
  defaultOpen?: boolean;
  /** Controlled open state */
  isOpen?: boolean;
  /** Controlled open state setter */
  onOpenChange?: (open: boolean) => void;
  /** Whether animations are enabled (default: true) */
  animate?: boolean;
}

export interface SidebarProps extends SidebarProviderProps {
  /** Additional CSS class names */
  className?: string;
}

export interface SidebarBodyProps extends Omit<ComponentProps<'div'>, 'ref'> {
  /** Whether to show on mobile (default: true) */
  showOnMobile?: boolean;
  /** Children elements */
  children?: ReactNode;
}

export interface SidebarLinkProps extends Omit<ComponentProps<'a'>, 'onClick'> {
  /** Link configuration object */
  link: SidebarLink;
  /** Custom click handler */
  onClick?: (link: SidebarLink) => void;
}

export interface SidebarToggleProps extends ComponentProps<'button'> {
  /** Custom toggle icon when open */
  openIcon?: ReactNode;
  /** Custom toggle icon when closed */
  closedIcon?: ReactNode;
  /** Show tooltips (default: true) */
  showTooltip?: boolean;
}

// Animation variants
export type AnimationVariant = 'desktop' | 'mobile' | 'text';

// Theme configuration
export interface SidebarThemeConfig {
  background: string;
  mobileBackground: string;
  textPrimary: string;
  textSecondary: string;
  buttonBackground: string;
  buttonBorder: string;
  buttonHover: string;
}