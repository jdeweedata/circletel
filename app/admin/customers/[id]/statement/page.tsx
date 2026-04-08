import StatementPreview from '@/components/statements/StatementPreview';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminCustomerStatementPage({ params }: Props) {
  const { id } = await params;
  return (
    <StatementPreview
      customerId={id}
      apiEndpoint="/api/admin/billing/statements"
      pdfEndpoint="/api/admin/billing/statements"
      showEmailButton={false}
    />
  );
}
