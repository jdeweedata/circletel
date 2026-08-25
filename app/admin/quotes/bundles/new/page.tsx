import { Suspense } from 'react';
import { BundleComposer } from '@/components/admin/quotes/BundleComposer';
import { AdminModernistShell } from '@/components/admin/modernist/AdminModernistShell';
import { AdminPage, LoadingState } from '@/components/backend';

export default function NewBundleQuotePage() {
  return (
    <AdminModernistShell>
      <AdminPage>
        <Suspense fallback={<LoadingState message="Loading composer…" />}>
          <BundleComposer />
        </Suspense>
      </AdminPage>
    </AdminModernistShell>
  );
}
