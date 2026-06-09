import { NextRequest, NextResponse } from 'next/server';
import { resolveToken, svc } from '@/lib/onboarding/onboarding-service';
import { uploadFile } from '@/lib/storage/supabase-upload';

export async function POST(request: NextRequest) {
  const supabase = svc();
  const form = await request.formData();
  const token = form.get('token') as string;
  const documentType = form.get('documentType') as string;
  const submissionId = form.get('submissionId') as string | null;
  const file = form.get('file') as File;
  if (!token || !documentType || !file) {
    return NextResponse.json(
      { success: false, error: 'token, documentType, file required' },
      { status: 400 }
    );
  }

  const resolved = await resolveToken(token);
  if (!resolved) {
    return NextResponse.json(
      { success: false, error: 'invalid_or_expired' },
      { status: 401 }
    );
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('business_name, email, phone')
    .eq('id', resolved.customerId)
    .single();

  const up = await uploadFile(file, {
    bucket: 'kyc-documents',
    folder: `onboarding/${resolved.customerId}/${documentType}`,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    supabaseClient: supabase,
  });
  if (!up.success) {
    return NextResponse.json({ success: false, error: up.error }, { status: 500 });
  }

  const { data: doc, error } = await supabase
    .from('kyc_documents')
    .insert({
      customer_type: 'smme',
      customer_id: resolved.customerId,
      onboarding_submission_id: submissionId || null,
      company_name: customer?.business_name ?? null,
      customer_email: customer?.email ?? null,
      customer_phone: customer?.phone ?? null,
      document_type: documentType,
      document_title: documentType,
      file_name: file.name,
      file_path: up.path,
      file_size: file.size,
      file_type: file.type,
      verification_status: 'pending',
      is_sensitive: true,
    })
    .select('id')
    .single();
  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, documentId: doc.id });
}
