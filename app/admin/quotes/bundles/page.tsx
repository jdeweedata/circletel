import { AdminModernistShell } from '@/components/admin/modernist/AdminModernistShell';
import { AdminPage } from '@/components/backend';
import { BundleTemplateList } from '@/components/admin/quotes/BundleTemplateList';

export default function FlyersPage() {
  return (
    <AdminModernistShell>
      <AdminPage>
        <BundleTemplateList />
      </AdminPage>
    </AdminModernistShell>
  );
}
