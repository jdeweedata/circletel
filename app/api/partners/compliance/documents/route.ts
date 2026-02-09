import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
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
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json(
        { success: false, error: 'Partner registration not found' },
        { status: 404 }
      );
    }

    // Get all uploaded documents
    const { data: documents, error: docsError } = await supabase
      .from('partner_compliance_documents')
      .select('*')
      .eq('partner_id', partner.id)
      .order('uploaded_at', { ascending: false });

    if (docsError) {
      apiLogger.error('Error fetching documents', { error: docsError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Format response
    const formattedDocs = documents.map(doc => ({
      id: doc.id,
      category: doc.document_category,
      documentType: doc.document_type,
      fileName: doc.document_name,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      verificationStatus: doc.verification_status,
      uploadedAt: doc.uploaded_at,
      verifiedAt: doc.verified_at,
      rejectionReason: doc.rejection_reason,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedDocs,
      },
      { status: 200 }
    );

  } catch (error) {
    apiLogger.error('Documents fetch error', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

