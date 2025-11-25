import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  BusinessType,
  DocumentCategory,
  isComplianceComplete,
} from '@/lib/partners/compliance-requirements';
import { EmailNotificationService } from '@/lib/notifications/notification-service';

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
      .select('id, business_type, compliance_status, status, business_name, contact_person, email, partner_number')
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

    // Get document names for the notification
    const documentNames = uploadedCategories.map(cat =>
      cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    );

    // Send confirmation email to partner
    try {
      await EmailNotificationService.sendPartnerComplianceSubmitted({
        email: partner.email,
        contact_person: partner.contact_person,
        business_name: partner.business_name,
        partner_number: partner.partner_number || undefined,
        documents_submitted: documentNames,
      });
    } catch (emailError) {
      console.error('Failed to send partner compliance email:', emailError);
      // Don't fail the submission if email fails
    }

    // Send notification to admin for review
    try {
      await EmailNotificationService.sendAdminPartnerComplianceReview({
        partner_id: partner.id,
        business_name: partner.business_name,
        partner_number: partner.partner_number || undefined,
        contact_person: partner.contact_person,
        documents_submitted: documentNames,
      });
    } catch (emailError) {
      console.error('Failed to send admin compliance notification:', emailError);
      // Don't fail the submission if email fails
    }

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
