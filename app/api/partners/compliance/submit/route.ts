import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  BusinessType,
  DocumentCategory,
  isComplianceComplete,
} from '@/lib/partners/compliance-requirements';

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
      .select('id, business_type, compliance_status, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json(
        { success: false, error: 'Partner registration not found' },
        { status: 404 }
      );
    }

    // Check if already submitted or approved
    if (partner.compliance_status === 'verified') {
      return NextResponse.json(
        { success: false, error: 'Compliance already verified' },
        { status: 400 }
      );
    }

    if (partner.compliance_status === 'under_review') {
      return NextResponse.json(
        { success: false, error: 'Documents already under review' },
        { status: 400 }
      );
    }

    // Get uploaded documents
    const { data: documents, error: docsError } = await supabase
      .from('partner_compliance_documents')
      .select('document_category')
      .eq('partner_id', partner.id);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch uploaded documents' },
        { status: 500 }
      );
    }

    // Check if all required documents are uploaded
    const uploadedCategories = documents.map(doc => doc.document_category as DocumentCategory);
    const isComplete = isComplianceComplete(partner.business_type as BusinessType, uploadedCategories);

    if (!isComplete) {
      return NextResponse.json(
        { success: false, error: 'Not all required documents have been uploaded' },
        { status: 400 }
      );
    }

    // Update compliance status to under_review
    const { error: updateError } = await supabase
      .from('partners')
      .update({
        compliance_status: 'under_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', partner.id);

    if (updateError) {
      console.error('Error updating compliance status:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to submit for review' },
        { status: 500 }
      );
    }

    // TODO: Send email notification to admin for review
    // TODO: Send confirmation email to partner

    return NextResponse.json(
      {
        success: true,
        message: 'Documents submitted for review successfully',
        data: {
          complianceStatus: 'under_review',
          submittedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Submit for review error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
