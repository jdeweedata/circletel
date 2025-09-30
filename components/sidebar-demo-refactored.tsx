"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// Import from the working sidebar-motion components (for now)
import {
  SidebarMotion,
  SidebarMotionBody,
  SidebarMotionLink,
  SidebarMotionToggle,
  useSidebarMotion,
} from "@/components/ui/sidebar-motion";

// Define improved types
interface SidebarLinkType {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  ariaLabel?: string;
}

/**
 * Demo data for sidebar links
 */
const DEMO_LINKS: SidebarLinkType[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <IconBrandTabler className="h-5 w-5 shrink-0" />,
    ariaLabel: "Go to dashboard",
  },
  {
    label: "Profile",
    href: "/profile",
    icon: <IconUserBolt className="h-5 w-5 shrink-0" />,
    badge: "2",
    ariaLabel: "View profile (2 notifications)",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <IconSettings className="h-5 w-5 shrink-0" />,
    ariaLabel: "Open settings",
  },
  {
    label: "Logout",
    href: "/logout",
    icon: <IconArrowLeft className="h-5 w-5 shrink-0" />,
    ariaLabel: "Logout from application",
  },
];

/**
 * User profile data for demo
 */
const DEMO_USER = {
  name: "Manu Arora",
  avatar: "https://assets.aceternity.com/manu.png",
  href: "/profile",
} as const;

/**
 * Refactored sidebar demo component with improved maintainability
 */
export default function SidebarDemoRefactored() {
  // Memoize static content to prevent unnecessary re-renders
  const demoContent = useMemo(() => (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden",
        "rounded-md border border-neutral-200 bg-gray-100 md:flex-row",
        "dark:border-neutral-700 dark:bg-neutral-800",
        "h-[60vh]" // Use h-screen in production
      )}
    >
      <SidebarMotion>
        <SidebarMotionBody className="justify-between gap-10">
          <SidebarContent />
          <SidebarFooter />
        </SidebarMotionBody>
      </SidebarMotion>
      <Dashboard />
    </div>
  ), []);

  return demoContent;
}

/**
 * Main sidebar content component
 */
function SidebarContent() {
  const handleLinkClick = (link: SidebarLinkType) => {
    console.log(`Navigating to: ${link.href}`);
    // Handle navigation logic here
  };

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
      <SidebarHeader />
      <nav className="mt-4 flex flex-col gap-2" role="navigation" aria-label="Main navigation">
        {DEMO_LINKS.map((link) => (
          <SidebarMotionLink
            key={link.href}
            link={link}
          />
        ))}
      </nav>
    </div>
  );
}

/**
 * Sidebar header with logo and toggle
 */
function SidebarHeader() {
  return (
    <header className="flex items-center justify-between mb-4">
      <div className="flex-1 min-w-0">
        <LogoWithState />
      </div>
      <SidebarMotionToggle className="shrink-0 ml-2" />
    </header>
  );
}

/**
 * Sidebar footer with user profile
 */
function SidebarFooter() {
  const userLink: SidebarLinkType = {
    label: DEMO_USER.name,
    href: DEMO_USER.href,
    icon: (
      <img
        src={DEMO_USER.avatar}
        className="h-7 w-7 shrink-0 rounded-full"
        width={28}
        height={28}
        alt={`${DEMO_USER.name} avatar`}
      />
    ),
    ariaLabel: `View ${DEMO_USER.name}'s profile`,
  };

  return (
    <footer>
      <SidebarMotionLink link={userLink} />
    </footer>
  );
}

/**
 * Logo component that adapts to sidebar state
 */
function LogoWithState() {
  const { open } = useSidebarMotion();
  return open ? <Logo /> : <LogoIcon />;
}

/**
 * Full logo component
 */
function Logo() {
  return (
    <a
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
      aria-label="Acet Labs homepage"
    >
      <LogoShape />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="font-medium whitespace-pre"
      >
        Acet Labs
      </motion.span>
    </a>
  );
}

/**
 * Icon-only logo component
 */
function LogoIcon() {
  return (
    <a
      href="/"
      className="relative z-20 flex items-center py-1"
      aria-label="Acet Labs homepage"
    >
      <LogoShape />
    </a>
  );
}

/**
 * Reusable logo shape component
 */
function LogoShape() {
  return (
    <div
      className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white"
      aria-hidden="true"
    />
  );
}

/**
 * Dashboard content area
 */
function Dashboard() {
  // Generate demo content efficiently
  const placeholderBoxes = Array.from({ length: 4 }, (_, idx) => (
    <div
      key={`demo-box-${idx}`}
      className="h-20 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800"
      aria-hidden="true"
    />
  ));

  const placeholderPanels = Array.from({ length: 2 }, (_, idx) => (
    <div
      key={`demo-panel-${idx}`}
      className="h-full w-full animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800"
      aria-hidden="true"
    />
  ));

  return (
    <main className="flex flex-1">
      <div
        className={cn(
          "flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl",
          "border border-neutral-200 bg-white p-2 md:p-10",
          "dark:border-neutral-700 dark:bg-neutral-900"
        )}
      >
        <div className="flex gap-2">
          {placeholderBoxes}
        </div>
        <div className="flex flex-1 gap-2">
          {placeholderPanels}
        </div>
      </div>
    </main>
  );
}

// Add display names for debugging
SidebarDemoRefactored.displayName = 'SidebarDemoRefactored';
SidebarContent.displayName = 'SidebarContent';
SidebarHeader.displayName = 'SidebarHeader';
SidebarFooter.displayName = 'SidebarFooter';