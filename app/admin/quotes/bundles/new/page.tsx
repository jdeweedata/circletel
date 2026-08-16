import { Suspense } from 'react';
import { BundleComposer } from '@/components/admin/quotes/BundleComposer';

export default function NewBundleQuotePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-ui-text-muted">Loading composer…</div>}>
      <BundleComposer />
    </Suspense>
  );
}
