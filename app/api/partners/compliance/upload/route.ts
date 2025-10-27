import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DocumentCategory } from '@/lib/partners/compliance-requirements';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/zip',
  'application/x-zip-compressed',
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get partner record
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, business_type, compliance_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json(
        { success: false, error: 'Partner registration not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as DocumentCategory;
    const documentType = formData.get('documentType') as string;

    if (!file || !category || !documentType) {
      return NextResponse.json(
        { success: false, error: 'File, category, and document type are required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Accepted: PDF, JPG, PNG, ZIP' },
        { status: 400 }
      );
    }

    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${partner.id}/${category}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('partner-compliance-documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Create database record
    const { data: document, error: dbError } = await supabase
      .from('partner_compliance_documents')
      .insert({
        partner_id: partner.id,
        document_category: category,
        document_type: documentType,
        document_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        verification_status: 'pending',
        is_required: true, // Will be updated based on business type
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);

      // Clean up uploaded file
      await supabase.storage
        .from('partner-compliance-documents')
        .remove([fileName]);

      return NextResponse.json(
        { success: false, error: 'Failed to save document record' },
        { status: 500 }
      );
    }

    // Update partner compliance status if this is first document
    if (partner.compliance_status === 'incomplete') {
      await supabase
        .from('partners')
        .update({ compliance_status: 'submitted' })
        .eq('id', partner.id);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Document uploaded successfully',
        data: {
          id: document.id,
          category: document.document_category,
          fileName: document.document_name,
          fileSize: document.file_size,
          uploadedAt: document.uploaded_at,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
