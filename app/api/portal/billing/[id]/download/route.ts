import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClientWithSession();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: invoice, error } = await supabase
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
