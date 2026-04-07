import InvoicePreview from '@/components/invoices/InvoicePreview';

interface Props {
  params: Promise<{ id: string; invoiceId: string }>;
}

export default async function AdminCustomerInvoicePage({ params }: Props) {
  const { invoiceId } = await params;
  return (
    <InvoicePreview
      invoiceId={invoiceId}
      apiEndpoint="/api/admin/billing/invoices"
      pdfEndpoint="/api/admin/invoices"
    />
  );
}
