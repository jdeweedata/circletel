'use client';

import dynamic from 'next/dynamic';

const CoverageCheck = dynamic(
  () => import('@/components/coverage/CoverageCheck'),
  { ssr: false, loading: () => <div className="h-16 bg-white/5 animate-pulse rounded-none" /> }
);

export default function CoverageCheckClient() {
  return <CoverageCheck />;
}
