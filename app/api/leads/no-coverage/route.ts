/**
 * No Coverage Leads API
 * Captures leads from users in areas without coverage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

interface NoCoverageLeadData {
  full_name: string;
  email: string;
  phone?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  service_type?: string;
  expected_usage?: string;
  budget_range?: string;
  urgency?: string;
  notes?: string;
  marketing_consent?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    const { full_name, email, address } = body as NoCoverageLeadData;
    if (!full_name || !email || !address) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: full_name, email, address' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get client metadata
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Prepare lead data
    const leadData = {
      full_name,
      email: email.toLowerCase().trim(),
      phone: body.phone?.trim() || null,
      address: address.trim(),
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      service_type: body.service_type || 'any',
      expected_usage: body.expected_usage || null,
      budget_range: body.budget_range || null,
      urgency: body.urgency || 'medium',
      notes: body.notes?.trim() || null,
      marketing_consent: body.marketing_consent || false,
      source: 'coverage_check',
      user_agent: userAgent,
      ip_address: ipAddress,
      status: 'new',
    };

    // Insert lead into database
    const { data, error } = await supabase
      .from('no_coverage_leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      apiLogger.error('[No Coverage Lead API] Database error', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to save lead' },
        { status: 500 }
      );
    }

    apiLogger.info('[No Coverage Lead API] Lead captured', {
      id: data.id,
      email: data.email,
      address: data.address,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        message: 'Thank you! We will notify you when service becomes available in your area.',
      },
    });
  } catch (error) {
    apiLogger.error('[No Coverage Lead API] Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
