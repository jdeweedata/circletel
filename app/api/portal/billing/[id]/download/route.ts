import { NextRequest, NextResponse } from 'next/server';
import { requirePortalCapability } from '@/lib/portal/require-portal-user';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await requirePortalCapability('billing.read');
  if (!auth.ok) return auth.response;

  const { adminDb } = auth;

  const { data: invoice, error } = await adminDb
    .from('customer_invoices')
    .select('id, invoice_number, pdf_url')
    .eq('id', id)
    .maybeSingle();

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (!invoice.pdf_url) {
    return NextResponse.json({ error: 'PDF not yet generated' }, { status: 404 });
  }

  const pdfResponse = await fetch(invoice.pdf_url);
  if (!pdfResponse.ok) {
    return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 502 });
  }

  const pdfBuffer = await pdfResponse.arrayBuffer();

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
