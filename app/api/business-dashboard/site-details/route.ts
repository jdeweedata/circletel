/**
 * Business Dashboard Site Details API
 *
 * GET /api/business-dashboard/site-details - Get site details
 * POST /api/business-dashboard/site-details - Create site details
 * PUT /api/business-dashboard/site-details - Update site details
 *
 * @module app/api/business-dashboard/site-details/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessJourneyService } from '@/lib/business/journey-service';
import { SiteDetailsService } from '@/lib/business/site-details-service';
import { SiteDetailsFormData, SitePhoto, validateSiteDetailsForSubmission } from '@/types/site-details';
import { apiLogger } from '@/lib/logging/logger';

// ============================================================================
// GET - Fetch site details
// ============================================================================

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
      .select('id, company_name, account_number')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !businessCustomer) {
      return NextResponse.json(
        { error: 'Business customer not found' },
        { status: 404 }
      );
    }

    // Get journey status
    const journey = await BusinessJourneyService.getJourneyStatus(businessCustomer.id);

    // Get site details
    const siteDetails = await SiteDetailsService.getSiteDetails(businessCustomer.id);

    return NextResponse.json({
      success: true,
      data: {
        businessCustomer,
        journey,
        siteDetails,
      },
    });
  } catch (error) {
    apiLogger.error('Error fetching site details', { error });
    return NextResponse.json(
      { error: 'Failed to fetch site details' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create site details
// ============================================================================

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Business customer not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { data, photos, status } = body as {
      data: SiteDetailsFormData;
      photos: SitePhoto[];
      status: 'draft' | 'submitted';
    };

    // Validate if submitting
    if (status === 'submitted') {
      const validation = validateSiteDetailsForSubmission(data, photos);
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Validation failed', errors: validation.errors },
          { status: 400 }
        );
      }
    }

    // Get current journey stage
    const { data: journeyStage } = await supabase
      .from('business_journey_stages')
      .select('id')
      .eq('business_customer_id', businessCustomer.id)
      .eq('stage', 'site_details')
      .single();

    // Create site details
    const siteDetails = await SiteDetailsService.createSiteDetails({
      business_customer_id: businessCustomer.id,
      journey_stage_id: journeyStage?.id,
      data,
      photos,
    });

    // If submitting, also update status and journey
    if (status === 'submitted') {
      const submitted = await SiteDetailsService.submitSiteDetails(siteDetails.id);

      // Update journey stage to in_progress
      if (journeyStage) {
        await supabase
          .from('business_journey_stages')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .eq('id', journeyStage.id);
      }

      return NextResponse.json({
        success: true,
        data: submitted,
        message: 'Site details submitted for review',
      });
    }

    return NextResponse.json({
      success: true,
      data: siteDetails,
      message: 'Site details saved as draft',
    });
  } catch (error) {
    apiLogger.error('Error creating site details', { error });
    return NextResponse.json(
      { error: 'Failed to create site details' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update site details
// ============================================================================

export async function PUT(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Business customer not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { id, data, photos, status } = body as {
      id: string;
      data: Partial<SiteDetailsFormData>;
      photos?: SitePhoto[];
      status: 'draft' | 'submitted';
    };

    if (!id) {
      return NextResponse.json({ error: 'Site details ID required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await SiteDetailsService.getSiteDetailsById(id);
    if (!existing || existing.business_customer_id !== businessCustomer.id) {
      return NextResponse.json({ error: 'Site details not found' }, { status: 404 });
    }

    // Check if editable
    if (existing.status === 'approved' || existing.status === 'under_review') {
      return NextResponse.json(
        { error: 'Cannot edit approved or under-review site details' },
        { status: 400 }
      );
    }

    // Validate if submitting
    if (status === 'submitted') {
      const fullData = { ...existing, ...data } as SiteDetailsFormData;
      const finalPhotos = photos || existing.site_photos;
      const validation = validateSiteDetailsForSubmission(fullData, finalPhotos);
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Validation failed', errors: validation.errors },
          { status: 400 }
        );
      }
    }

    // Update site details
    const updated = await SiteDetailsService.updateSiteDetails({
      id,
      data,
      photos,
    });

    // If submitting, also update status
    if (status === 'submitted') {
      const submitted = await SiteDetailsService.submitSiteDetails(updated.id);

      return NextResponse.json({
        success: true,
        data: submitted,
        message: 'Site details submitted for review',
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Site details updated',
    });
  } catch (error) {
    apiLogger.error('Error updating site details', { error });
    return NextResponse.json(
      { error: 'Failed to update site details' },
      { status: 500 }
    );
  }
}
