"use client";

import React, { createContext, useContext, useMemo } from 'react';
import type { SidebarContextValue, SidebarProviderProps } from './types';
import { useSidebarState, useIsMobile, useSidebarKeyboard } from './hooks';

/**
 * Sidebar context for managing state across all sidebar components
 */
const SidebarContext = createContext<SidebarContextValue | null>(null);

/**
 * Custom hook to access sidebar context with proper error handling
 */
export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error(
      'useSidebar must be used within a SidebarProvider. ' +
      'Make sure your component is wrapped with <SidebarProvider>.'
    );
  }

  return context;
}

/**
 * Provider component for sidebar state management
 */
export function SidebarProvider({
  children,
  defaultOpen = true,
  isOpen: isOpenProp,
  onOpenChange,
  animate = true,
}: SidebarProviderProps) {
  // State management
  const { isOpen, setIsOpen, toggle, open, close } = useSidebarState(
    defaultOpen,
    isOpenProp,
    onOpenChange
  );

  // Device detection
  const isMobile = useIsMobile();

  // Keyboard shortcuts
  useSidebarKeyboard(toggle);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<SidebarContextValue>(() => ({
    isOpen,
    setIsOpen,
    isAnimated: animate,
    isMobile,
    toggle,
    open,
    close,
  }), [isOpen, setIsOpen, animate, isMobile, toggle, open, close]);

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Display name for debugging
 */
SidebarProvider.displayName = 'SidebarProvider';