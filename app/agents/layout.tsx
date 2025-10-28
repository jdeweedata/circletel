/**
 * Sales Agent Portal Layout
 *
 * Shared layout for all agent portal pages
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sales Agent Portal | CircleTel',
  description: 'Access your sales dashboard, manage quotes, and track performance',
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
