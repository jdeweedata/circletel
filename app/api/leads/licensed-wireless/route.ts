import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      companyName,
      contactPerson,
      email,
      phone,
      businessType,
      requirements,
      serviceAddress,
      coordinates,
      coverageLeadId,
    } = body;

    // Validate required fields
    if (!companyName || !contactPerson || !email || !phone || !serviceAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create or update coverage lead with licensed_wireless service type
    let leadId = coverageLeadId;

    if (!leadId) {
      // Create new coverage lead
      const { data: newLead, error: leadError } = await supabase
        .from('coverage_leads')
        .insert([
          {
            address: serviceAddress,
            coordinates: coordinates || null,
            customer_type: businessType || 'enterprise',
            coverage_status: 'licensed_wireless_quote_requested',
            metadata: {
              serviceType: 'licensed_wireless',
              quoteRequested: true,
              requiresSiteSurvey: true,
            },
          },
        ])
        .select()
        .single();

      if (leadError) {
        apiLogger.error('Error creating coverage lead', { error: leadError });
        return NextResponse.json(
          { error: 'Failed to create coverage lead' },
          { status: 500 }
        );
      }

      leadId = newLead.id;
    } else {
      // Update existing coverage lead
      await supabase
        .from('coverage_leads')
        .update({
          coverage_status: 'licensed_wireless_quote_requested',
          metadata: {
            serviceType: 'licensed_wireless',
            quoteRequested: true,
            requiresSiteSurvey: true,
          },
        })
        .eq('id', leadId);
    }

    // Create business lead in a dedicated table (if you have one) or use metadata
    const { data: businessLead, error: businessError } = await supabase
      .from('coverage_leads')
      .update({
        metadata: {
          serviceType: 'licensed_wireless',
          quoteRequested: true,
          requiresSiteSurvey: true,
          businessDetails: {
            companyName,
            contactPerson,
            email,
            phone,
            businessType,
            requirements,
            requestedAt: new Date().toISOString(),
          },
        },
      })
      .eq('id', leadId)
      .select()
      .single();

    if (businessError) {
      apiLogger.error('Error updating business lead', { error: businessError });
      return NextResponse.json(
        { error: 'Failed to save business details' },
        { status: 500 }
      );
    }

    // TODO: Send notification email to sales team
    // TODO: Create task in CRM (Zoho)
    // TODO: Send confirmation email to customer

    apiLogger.info('Licensed wireless quote request received', {
      leadId,
      companyName,
      email,
      serviceAddress,
    });

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Quote request submitted successfully',
    });
  } catch (error) {
    apiLogger.error('Error processing licensed wireless lead', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
