import { NextRequest, NextResponse } from 'next/server';
import { requirePortalCapability } from '@/lib/portal/require-portal-user';
import { buildNpcInvoicePdf } from '@/lib/billing/unjani-npc-pack';
import { pdfDisposition } from '@/lib/portal/billing-period';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await requirePortalCapability('billing.read');
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;
  const disposition = pdfDisposition(request.nextUrl.searchParams.get('disposition'));

  const { data: invoice, error } = await adminDb
    .from('customer_invoices')
    .select('id, invoice_number, pdf_url, corporate_account_id')
    .eq('id', id)
    .eq('corporate_account_id', portalUser.organisation_id)
    .maybeSingle();

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const filename = `${invoice.invoice_number}.pdf`;
  const headers = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${disposition}; filename="${filename}"`,
  };

  if (invoice.pdf_url) {
    try {
      const pdfResponse = await fetch(invoice.pdf_url);
      if (pdfResponse.ok) {
        const pdfBuffer = await pdfResponse.arrayBuffer();
        return new NextResponse(pdfBuffer, { headers });
      }
    } catch (err) {
      console.error('[Portal billing download] stored pdf_url fetch failed:', err);
    }
  }

  try {
    const { bytes } = await buildNpcInvoicePdf(adminDb, invoice.id);
    return new NextResponse(new Uint8Array(bytes), { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Portal billing download] PDF generation failed:', message);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
