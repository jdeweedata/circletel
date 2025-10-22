import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { sendCoverageLeadAlert } from '@/lib/notifications/sales-alerts';
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

    // Send sales team alert with Zoho CRM integration (async, don't block response)
    sendCoverageLeadAlert({
      id: lead.id,
      customer_type: lead.customer_type,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      company_name: lead.company_name || undefined,
      address: lead.address,
      suburb: lead.suburb || undefined,
      city: lead.city || undefined,
      province: lead.province || undefined,
      postal_code: lead.postal_code || undefined,
      requested_service_type: lead.service_interest || undefined,
      requested_speed: undefined,
      budget_range: lead.budget_range || undefined,
      coordinates: lead.coordinates ? {
        lat: lead.coordinates.lat || lead.coordinates.latitude,
        lng: lead.coordinates.lng || lead.coordinates.longitude
      } : undefined,
      coverage_available: body.metadata?.coverage_available,
      lead_source: lead.lead_source || undefined,
      source_campaign: lead.metadata?.campaign || undefined,
    })
      .then((salesResult) => {
        if (salesResult.success) {
          console.log('Sales alert sent successfully:', {
            emailSent: salesResult.emailSent,
            zohoLeadId: salesResult.zohoLeadId,
          });
        } else {
          console.error('Sales alert failed:', salesResult.errors);
        }
      })
      .catch((error) => {
        console.error('Sales alert error:', error);
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
