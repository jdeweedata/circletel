/**
 * POST /api/admin/b2b/upload-document  (multipart)
 * Admin uploads a compliance document received by email on a clinic's behalf.
 * Find-or-creates the clinic's onboarding_submissions row (a manual shell when
 * none exists), uploads to the kyc-documents bucket, inserts a pending
 * kyc_documents row tagged source: 'admin_email'. Documents-only — no banking.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { svc } from '@/lib/onboarding/onboarding-service';
import { uploadFile } from '@/lib/storage/supabase-upload';
import { validateDocumentUpload } from '@/lib/onboarding/document-upload';
import { addBusinessDays, now } from '@/lib/dates';
import { apiLogger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;
  const perm = requirePermission(auth.adminUser, ['kyc:verify', 'customers:write']);
  if (perm) return perm;

  const form = await request.formData();
  const customerId = form.get('customerId') as string | null;
  const documentType = form.get('documentType') as string | null;
  const submissionIdIn = (form.get('submissionId') as string | null) || null;
  const file = form.get('file') as File | null;

  if (!customerId || !documentType || !file) {
    return NextResponse.json(
      { success: false, error: 'customerId, documentType, file required' },
      { status: 400 }
    );
  }
  const v = validateDocumentUpload({ documentType, fileType: file.type, fileSize: file.size });
  if (!v.valid) {
    return NextResponse.json({ success: false, error: v.error }, { status: 400 });
  }

  const supabase = svc();
  const adminEmail = auth.adminUser.email;

  const { data: customer } = await supabase
    .from('customers')
    .select('business_name, email, phone, onboarding_status')
    .eq('id', customerId)
    .single();
  if (!customer) {
    return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
  }

  let submissionId = submissionIdIn;
  let createdShell = false;
  if (!submissionId) {
    const { data: existing } = await supabase
      .from('onboarding_submissions')
      .select('id')
      .eq('customer_id', customerId)
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      submissionId = existing.id;
    } else {
      const { data: shell, error: shellErr } = await supabase
        .from('onboarding_submissions')
        .insert({
          customer_id: customerId,
          segment: 'unjani',
          status: 'submitted',
          document_vetting_status: 'documents_pending',
          submitted_at: now().toISOString(),
          vetting_due_date: addBusinessDays(now(), 2).toISOString(),
          submission_data: { manual: true, source: 'admin_email', uploaded_by: adminEmail },
        })
        .select('id')
        .single();
      if (shellErr || !shell) {
        apiLogger.error('[Admin Upload] shell create failed', { customerId, error: shellErr });
        return NextResponse.json(
          { success: false, error: shellErr?.message || 'Failed to create submission' },
          { status: 500 }
        );
      }
      submissionId = shell.id;
      createdShell = true;
      await supabase
        .from('customers')
        .update({ onboarding_status: 'submitted' })
        .eq('id', customerId)
        .neq('onboarding_status', 'submitted');
    }
  }

  const up = await uploadFile(file, {
    bucket: 'kyc-documents',
    folder: `onboarding/${customerId}/${documentType}`,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    supabaseClient: supabase,
  });
  if (!up.success) {
    return NextResponse.json({ success: false, error: up.error }, { status: 500 });
  }

  const { data: doc, error: docErr } = await supabase
    .from('kyc_documents')
    .insert({
      customer_type: 'smme',
      customer_id: customerId,
      onboarding_submission_id: submissionId,
      customer_name: customer.business_name ?? 'Clinic',
      company_name: customer.business_name ?? null,
      customer_email: customer.email ?? null,
      customer_phone: customer.phone ?? null,
      document_type: documentType,
      document_title: documentType,
      file_name: file.name,
      file_path: up.path,
      file_size: file.size,
      file_type: file.type,
      verification_status: 'pending',
      is_sensitive: true,
      metadata: { source: 'admin_email', uploaded_by: adminEmail },
    })
    .select('id')
    .single();
  if (docErr || !doc) {
    apiLogger.error('[Admin Upload] kyc_documents insert failed', { customerId, error: docErr });
    return NextResponse.json(
      { success: false, error: docErr?.message || 'Failed to record document' },
      { status: 500 }
    );
  }

  apiLogger.info('[Admin Upload] document uploaded', {
    customerId,
    submissionId,
    documentType,
    createdShell,
    by: adminEmail,
  });
  return NextResponse.json({ success: true, documentId: doc.id, submissionId, createdShell });
}
