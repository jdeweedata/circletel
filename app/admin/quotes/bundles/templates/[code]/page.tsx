import { AdminModernistShell } from '@/components/admin/modernist/AdminModernistShell';
import { AdminPage } from '@/components/backend';
import { BundleTemplateBuilder } from '@/components/admin/quotes/BundleTemplateBuilder';

export default async function EditFlyerPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <AdminModernistShell>
      <AdminPage>
        <BundleTemplateBuilder code={code} />
      </AdminPage>
    </AdminModernistShell>
  );
}
