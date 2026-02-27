/**
 * CPQ AI Analyze API
 *
 * POST /api/cpq/ai/analyze - Analyze pricing and get optimization suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzePricing, createUsageRecord } from '@/lib/cpq/ai-service';
import { getDiscountLimits } from '@/lib/cpq/rule-engine';
import {
  SelectedPackage,
  CustomerDetailsData,
  RoleType,
} from '@/lib/cpq/types';

interface AnalyzeRequest {
  selected_packages: SelectedPackage[];
  customer_details: CustomerDetailsData;
  current_discount_percent?: number;
  subtotal: number;
  session_id?: string;
  role_type: RoleType;
  role_name: string;
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

    const body: AnalyzeRequest = await request.json();

    // Validate input
    if (!body.selected_packages || !Array.isArray(body.selected_packages)) {
      return NextResponse.json(
        { error: 'selected_packages array is required' },
        { status: 400 }
      );
    }

    if (body.selected_packages.length === 0) {
      return NextResponse.json(
        { error: 'At least one package must be selected' },
        { status: 400 }
      );
    }

    if (!body.customer_details || typeof body.customer_details !== 'object') {
      return NextResponse.json(
        { error: 'customer_details object is required' },
        { status: 400 }
      );
    }

    if (typeof body.subtotal !== 'number' || body.subtotal <= 0) {
      return NextResponse.json(
        { error: 'subtotal must be a positive number' },
        { status: 400 }
      );
    }

    if (!body.role_type || !['admin', 'partner'].includes(body.role_type)) {
      return NextResponse.json(
        { error: 'role_type must be "admin" or "partner"' },
        { status: 400 }
      );
    }

    if (!body.role_name) {
      return NextResponse.json(
        { error: 'role_name is required' },
        { status: 400 }
      );
    }

    // Get discount limits for the role
    const discountLimits = await getDiscountLimits(body.role_type, body.role_name);

    if (!discountLimits) {
      return NextResponse.json(
        { error: 'Could not determine discount limits for the specified role' },
        { status: 400 }
      );
    }

    // Analyze pricing
    const result = await analyzePricing(
      body.selected_packages,
      body.customer_details,
      discountLimits,
      body.current_discount_percent || 0,
      body.subtotal
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

      const usageRecord = createUsageRecord('cpq_analyze', result, {
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
          console.error('[cpq-ai-analyze] Usage tracking error:', err);
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
      optimal_discount: result.optimal_discount,
      upsell_opportunities: result.upsell_opportunities,
      margin_analysis: result.margin_analysis,
      close_probability: result.close_probability,
      suggestions: result.suggestions,
      tokens: result.tokens,
      response_time_ms: result.response_time_ms,
    });
  } catch (error) {
    console.error('[cpq-ai-analyze] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
