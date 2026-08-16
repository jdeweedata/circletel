'use client';

import { cn } from '@/lib/utils';

interface AdminPageProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard page body shell for admin/backend UIs.
 * Parent AdminLayout already supplies horizontal padding and Unjani --pm-*
 * ground (Archivo + navy/orange tokens) — do NOT re-add min-h-screen, max-w-7xl,
 * or extra page-level p-6/p-8 shells.
 */
export function AdminPage({ children, className }: AdminPageProps) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}
