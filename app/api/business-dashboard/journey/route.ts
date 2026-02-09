/**
 * Business Dashboard Journey API
 *
 * GET /api/business-dashboard/journey - Get journey status for current user
 *
 * @module app/api/business-dashboard/journey/route
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessJourneyService } from '@/lib/business/journey-service';
import { apiLogger } from '@/lib/logging/logger';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get business customer record
    const { data: businessCustomer, error: customerError } = await supabase
      .from('business_customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !businessCustomer) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No business customer record found',
      });
    }

    // Get journey status
    const journey = await BusinessJourneyService.getJourneyStatus(businessCustomer.id);

    if (!journey) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Journey not initialized',
      });
    }

    // Get detailed stage information
    const { data: stages } = await supabase
      .from('business_journey_stages')
      .select('*')
      .eq('business_customer_id', businessCustomer.id)
      .order('step_number', { ascending: true });

    return NextResponse.json({
      success: true,
      data: {
        ...journey,
        stageDetails: stages || [],
      },
    });
  } catch (error) {
    apiLogger.error('Error fetching journey status', { error });
    return NextResponse.json(
      { error: 'Failed to fetch journey status' },
      { status: 500 }
    );
  }
}
