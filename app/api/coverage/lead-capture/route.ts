import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { createZohoLead } from '@/lib/zoho/lead-capture';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import type { CreateCoverageLeadInput } from '@/lib/types/customer-journey';

export async function POST(request: NextRequest) {
  try {
    const body: CreateCoverageLeadInput = await request.json();

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.email || !body.phone || !body.address) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create lead in database
    const { data: lead, error: dbError } = await supabase
      .from('coverage_leads')
      .insert({
        customer_type: body.customer_type || 'consumer',
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        alternate_phone: body.alternate_phone,
        company_name: body.company_name,
        address: body.address,
        suburb: body.suburb,
        city: body.city,
        province: body.province,
        postal_code: body.postal_code,
        coordinates: body.coordinates || null,
        lead_source: body.lead_source || 'coverage_checker',
        status: body.status || 'new',
        service_interest: body.service_interest,
        preferred_contact_method: body.preferred_contact_method || 'email',
        budget_range: body.budget_range,
        urgency_level: body.urgency_level,
        follow_up_date: body.follow_up_date,
        notes: body.notes,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error creating lead:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create lead in database' },
        { status: 500 }
      );
    }

    // Sync to Zoho CRM (async, don't block response)
    createZohoLead(lead, false)
      .then((zohoResult) => {
        if (zohoResult.success) {
          console.log('Lead synced to Zoho:', zohoResult.zohoLeadId);
          // Update lead with Zoho ID
          supabase
            .from('coverage_leads')
            .update({
              zoho_lead_id: zohoResult.zohoLeadId,
              zoho_synced_at: new Date().toISOString(),
            })
            .eq('id', lead.id)
            .then(() => console.log('Lead updated with Zoho ID'));
        } else {
          console.error('Failed to sync to Zoho:', zohoResult.error);
        }
      })
      .catch((error) => {
        console.error('Zoho sync error:', error);
      });

    // Send confirmation email (async, don't block response)
    EmailNotificationService.send({
      to: lead.email,
      subject: 'We\'re expanding to your area!',
      template: 'no_coverage_lead_confirmation',
      data: {
        customer_name: `${lead.first_name} ${lead.last_name}`,
        address: lead.address,
        estimated_timeline: '2-4 weeks',
        lead_id: lead.id,
      },
    })
      .then((emailResult) => {
        if (emailResult.success) {
          console.log('Confirmation email sent to:', lead.email);
        } else {
          console.error('Failed to send email:', emailResult.error);
        }
      })
      .catch((error) => {
        console.error('Email send error:', error);
      });

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        status: lead.status,
      },
      message: 'Lead captured successfully. You will be notified when service is available.',
    });
  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to capture lead',
      },
      { status: 500 }
    );
  }
}
