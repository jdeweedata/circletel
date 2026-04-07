import InvoicePreview from '@/components/invoices/InvoicePreview';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminBillingInvoicePreviewPage({ params }: Props) {
  const { id } = await params;
  return (
    <InvoicePreview
      invoiceId={id}
      apiEndpoint="/api/admin/billing/invoices"
      pdfEndpoint="/api/admin/invoices"
    />
  );
}
