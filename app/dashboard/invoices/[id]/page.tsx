import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import InvoicePreview from '@/components/invoices/InvoicePreview';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DashboardInvoicePage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?redirect=/dashboard/invoices/${id}`);
  }

  return (
    <InvoicePreview
      invoiceId={id}
      apiEndpoint="/api/dashboard/invoices"
    />
  );
}
