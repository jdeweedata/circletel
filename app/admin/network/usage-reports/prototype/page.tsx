/**
 * PROTOTYPE (#667) — Site Network Usage Report PDF layout variants.
 *
 * Three variants of the branded Unjani monthly PDF, switchable via ?variant=A|B|C
 * on the future Usage Reports surface (Network → Usage Reports).
 *
 * Run: npm run dev:memory → /admin/network/usage-reports/prototype
 * PDF sample: npm run prototype:site-usage-pdf
 */
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PrototypeSwitcher } from '@/components/prototype/PrototypeSwitcher';
import { VARIANT_META } from '@/components/prototype/site-usage-report/mock-data';
import { VariantA } from '@/components/prototype/site-usage-report/VariantA';
import { VariantB } from '@/components/prototype/site-usage-report/VariantB';
import { VariantC } from '@/components/prototype/site-usage-report/VariantC';

function PrototypeBody() {
  const searchParams = useSearchParams();
  const raw = (searchParams.get('variant') ?? 'A').toUpperCase();
  const variant = VARIANT_META.some((v) => v.key === raw) ? raw : 'A';

  return (
    <div className="min-h-screen bg-stone-200 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 max-w-[210mm] px-4 print:hidden">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Prototype · Issue #667
        </p>
        <h1 className="text-xl font-semibold text-stone-900">
          Site Network Usage Report — PDF layout
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Flip variants with the bar below (or ← →). Sample data: Unjani Alexandra · June 2026
          monthly · Interstellio primary · Patient CSV filled · Staff N/A.
        </p>
      </div>

      {variant === 'A' && <VariantA />}
      {variant === 'B' && <VariantB />}
      {variant === 'C' && <VariantC />}

      <PrototypeSwitcher variants={[...VARIANT_META]} current={variant} />
    </div>
  );
}

export default function SiteUsageReportPrototypePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-stone-500">Loading prototype…</div>}>
      <PrototypeBody />
    </Suspense>
  );
}
