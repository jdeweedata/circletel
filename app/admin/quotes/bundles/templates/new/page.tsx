import { AdminModernistShell } from '@/components/admin/modernist/AdminModernistShell';
import { AdminPage } from '@/components/backend';
import { BundleTemplateBuilder } from '@/components/admin/quotes/BundleTemplateBuilder';

export default function NewFlyerPage() {
  return (
    <AdminModernistShell>
      <AdminPage>
        <BundleTemplateBuilder />
      </AdminPage>
    </AdminModernistShell>
  );
}
