'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MOCK_DATA } from '@/components/prototype/business-portal/mock-data';
import { VariantA } from '@/components/prototype/business-portal/VariantA';
import { VariantB } from '@/components/prototype/business-portal/VariantB';
import { VariantC } from '@/components/prototype/business-portal/VariantC';
import { PrototypeSwitcher } from '@/components/prototype/PrototypeSwitcher';

// PROTOTYPE: 3 variants of the business customer portal, switchable via ?variant=
// Question: "What should the business customer portal look like?"

const VARIANTS = [
  { key: 'A', name: 'Command Center' },
  { key: 'B', name: 'Account Manager' },
  { key: 'C', name: 'Activity Stream' },
];

function PortalContent() {
  const searchParams = useSearchParams();
  const variant = searchParams.get('variant') ?? 'A';

  return (
    <>
      {variant === 'A' && <VariantA data={MOCK_DATA} />}
      {variant === 'B' && <VariantB data={MOCK_DATA} />}
      {variant === 'C' && <VariantC data={MOCK_DATA} />}
      <PrototypeSwitcher variants={VARIANTS} current={variant} />
    </>
  );
}

export default function BusinessPortalPrototype() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500">Loading prototype...</div>}>
      <PortalContent />
    </Suspense>
  );
}
