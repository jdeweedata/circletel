import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StatementPreview from '@/components/statements/StatementPreview';

export default async function DashboardStatementPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?redirect=/dashboard/statement');
  }

  return (
    <StatementPreview
      customerId=""
      apiEndpoint="/api/dashboard/statement"
      showEmailButton={false}
    />
  );
}
