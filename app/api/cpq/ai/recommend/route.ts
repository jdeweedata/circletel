/**
 * CPQ AI Recommend API
 *
 * POST /api/cpq/ai/recommend - Get AI-powered package recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPackageRecommendations, createUsageRecord } from '@/lib/cpq/ai-service';
import {
  NeedsAssessmentData,
  CoverageCheckResult,
  ServicePackage,
} from '@/lib/cpq/types';

interface RecommendRequest {
  requirements: NeedsAssessmentData;
  locations?: Array<{
    latitude?: number;
    longitude?: number;
    address?: string;
    coverage_result?: CoverageCheckResult;
  }>;
  budget?: {
    min: number;
    max: number;
  };
  session_id?: string;
  package_ids?: string[]; // Optional: limit to specific packages
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RecommendRequest = await request.json();

    // Validate input
    if (!body.requirements || typeof body.requirements !== 'object') {
      return NextResponse.json(
        { error: 'requirements object is required' },
        { status: 400 }
      );
    }

    // Get available packages
    let packagesQuery = supabase
      .from('service_packages')
      .select('*')
      .eq('active', true)
      .eq('customer_type', 'business'); // CPQ is for B2B

    // Optionally filter by specific package IDs
    if (body.package_ids && body.package_ids.length > 0) {
      packagesQuery = packagesQuery.in('id', body.package_ids);
    }

    const { data: packages, error: packagesError } = await packagesQuery;

    if (packagesError) {
      console.error('[cpq-ai-recommend] Packages query error:', packagesError);
      return NextResponse.json(
        { error: 'Failed to fetch available packages' },
        { status: 500 }
      );
    }

    if (!packages || packages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No packages available for recommendations' },
        { status: 400 }
      );
    }

    // Extract coverage results if provided
    const coverageResults = body.locations
      ?.filter((loc) => loc.coverage_result)
      .map((loc) => loc.coverage_result as CoverageCheckResult);

    // Get recommendations
    const result = await getPackageRecommendations(
      body.requirements,
      packages as ServicePackage[],
      coverageResults,
      body.budget
    );

    // Track usage
    if (result.tokens) {
      let partnerId: string | undefined;
      let adminUserId: string | undefined;

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (adminUser) {
        adminUserId = user.id;
      } else {
        const { data: partner } = await supabase
          .from('partners')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (partner) {
          partnerId = partner.id;
        }
      }

      const usageRecord = createUsageRecord('cpq_recommend', result, {
        session_id: body.session_id,
        partner_id: partnerId,
        admin_user_id: adminUserId,
      });

      // Track usage asynchronously (don't block response)
      void (async () => {
        try {
          await supabase.from('partner_ai_usage').insert({
            partner_id: usageRecord.partner_id || usageRecord.admin_user_id,
            request_type: usageRecord.request_type,
            model_used: usageRecord.model_used,
            input_tokens: usageRecord.input_tokens,
            output_tokens: usageRecord.output_tokens,
            response_time_ms: usageRecord.response_time_ms,
            success: usageRecord.success,
          });
        } catch (err) {
          console.error('[cpq-ai-recommend] Usage tracking error:', err);
        }
      })();
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      recommendations: result.recommendations,
      tokens: result.tokens,
      response_time_ms: result.response_time_ms,
    });
  } catch (error) {
    console.error('[cpq-ai-recommend] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
