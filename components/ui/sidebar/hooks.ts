import { useState, useCallback, useEffect, useMemo } from 'react';
import type { SidebarState, SidebarContextValue } from './types';

/**
 * Custom hooks for sidebar state management and utilities
 */

// Hook for managing sidebar state
export function useSidebarState(
  defaultOpen = true,
  isOpenProp?: boolean,
  onOpenChange?: (open: boolean) => void
): Pick<SidebarContextValue, 'isOpen' | 'setIsOpen' | 'toggle' | 'open' | 'close'> {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalOpen;

  const setIsOpen = useCallback((open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  }, [onOpenChange]);

  const toggle = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  return { isOpen, setIsOpen, toggle, open, close };
}

// Hook for detecting mobile devices
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Initial check
    checkIsMobile();

    // Listen for resize events
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [breakpoint]);

  return isMobile;
}

// Hook for managing sidebar animations
export function useSidebarAnimations(isOpen: boolean, isAnimated: boolean) {
  return useMemo(() => ({
    // Desktop width animation values
    getDesktopWidth: () => isAnimated ? (isOpen ? '300px' : '60px') : '300px',

    // Text animation values
    getTextAnimation: () => ({
      display: isAnimated ? (isOpen ? 'inline-block' : 'none') : 'inline-block',
      opacity: isAnimated ? (isOpen ? 1 : 0) : 1,
    }),

    // Should animate text
    shouldAnimateText: () => isAnimated,
  }), [isOpen, isAnimated]);
}

// Hook for keyboard shortcuts
export function useSidebarKeyboard(toggle: () => void, shortcut = 'b') {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === shortcut &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggle, shortcut]);
}

// Hook for generating stable CSS class names
export function useSidebarStyles() {
  return useMemo(() => ({
    // Desktop sidebar base classes
    desktop: [
      'h-full',
      'px-4',
      'py-4',
      'hidden',
      'md:flex',
      'md:flex-col',
      'bg-neutral-100',
      'dark:bg-neutral-800',
      'w-[300px]',
      'shrink-0'
    ].join(' '),

    // Mobile header classes
    mobileHeader: [
      'h-10',
      'px-4',
      'py-4',
      'flex',
      'flex-row',
      'md:hidden',
      'items-center',
      'justify-between',
      'bg-neutral-100',
      'dark:bg-neutral-800',
      'w-full'
    ].join(' '),

    // Mobile overlay classes
    mobileOverlay: [
      'fixed',
      'h-full',
      'w-full',
      'inset-0',
      'bg-white',
      'dark:bg-neutral-900',
      'p-10',
      'z-[100]',
      'flex',
      'flex-col',
      'justify-between'
    ].join(' '),

    // Link base classes
    link: [
      'flex',
      'items-center',
      'justify-start',
      'gap-2',
      'group/sidebar',
      'py-2'
    ].join(' '),

    // Toggle button classes
    toggle: [
      'flex',
      'h-8',
      'w-8',
      'items-center',
      'justify-center',
      'rounded-md',
      'border',
      'border-neutral-200',
      'bg-white',
      'transition-colors',
      'hover:bg-neutral-100',
      'dark:border-neutral-700',
      'dark:bg-neutral-800',
      'dark:hover:bg-neutral-700'
    ].join(' '),
  }), []);
}