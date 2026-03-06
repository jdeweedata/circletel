// lib/content/types.ts
import { IconType } from 'react-icons';
import { ReactNode } from 'react';

/**
 * A single content section (e.g., "1. Service Description")
 */
export interface ContentSection {
  /** URL anchor: "service-description" */
  id: string;
  /** Section title: "1. Service Description" */
  title: string;
  /** Optional icon for navigation */
  icon?: IconType;
  /** JSX content (paragraphs, lists, subsections) */
  content: ReactNode;
}

/**
 * A key point for sidebar (optional highlights)
 */
export interface KeyPoint {
  icon: IconType;
  title: string;
  description?: string;
}

/**
 * Page metadata for SEO and schema generation
 */
export interface ContentPageMeta {
  /** Page title: "Terms of Service" */
  title: string;
  /** Full SEO title: "Terms of Service | CircleTel" */
  pageTitle: string;
  /** Meta description */
  description: string;
  /** Last updated: "March 2026" */
  lastUpdated: string;
  /** Canonical path: "/terms-of-service" */
  canonicalPath: string;
}

/**
 * Complete page data structure
 */
export interface ContentPageData {
  meta: ContentPageMeta;
  intro: {
    /** Optional sidebar intro heading */
    title?: string;
    /** Sidebar intro text */
    description: string;
  };
  /** Optional key highlights for sidebar */
  keyPoints?: KeyPoint[];
  /** Main content sections */
  sections: ContentSection[];
}

/**
 * Props for SidebarNav component
 */
export interface SidebarNavSection {
  id: string;
  title: string;
  icon?: IconType;
}
