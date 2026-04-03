import { createClientWithSession } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardBackLink } from '@/components/dashboard/DashboardBackLink';
import { InvoiceTable } from '@/components/dashboard/InvoiceTable';

interface CustomerInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_type?: string;
  total_amount: number;
  amount_due: number;
  status: string;
  pdf_url?: string;
}

export default async function InvoicesPage() {
  const supabase = await createClientWithSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?redirect=/dashboard/invoices');

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  let invoices: CustomerInvoice[] = [];

  if (customer) {
    const { data } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, invoice_date, invoice_type, total_amount, amount_due, status, pdf_url')
      .eq('customer_id', customer.id)
      .order('invoice_date', { ascending: false })
      .limit(50);

    invoices = (data ?? []) as CustomerInvoice[];
  }

  return (
    <div>
      <DashboardBackLink />
      <h1 className="text-xl font-bold text-slate-900 mb-6">Billing and statements</h1>
      <InvoiceTable invoices={invoices} />
    </div>
  );
}
