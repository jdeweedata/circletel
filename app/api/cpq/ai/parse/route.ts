/**
 * CPQ AI Parse API
 *
 * POST /api/cpq/ai/parse - Parse natural language into structured requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseNaturalLanguage, createUsageRecord } from '@/lib/cpq/ai-service';

interface ParseRequest {
  text: string;
  context?: {
    customerType?: 'business' | 'residential';
  };
  session_id?: string;
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

    const body: ParseRequest = await request.json();

    // Validate input
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'text is required and must be a string' },
        { status: 400 }
      );
    }

    if (body.text.length > 5000) {
      return NextResponse.json(
        { error: 'text must be 5000 characters or less' },
        { status: 400 }
      );
    }

    // Parse the natural language
    const result = await parseNaturalLanguage(body.text, body.context);

    // Track usage
    if (result.tokens) {
      // Determine user context
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

      const usageRecord = createUsageRecord('cpq_parse', result, {
        session_id: body.session_id,
        partner_id: partnerId,
        admin_user_id: adminUserId,
      });

      // Insert usage record (don't block on this)
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
          console.error('[cpq-ai-parse] Usage tracking error:', err);
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
      data: result.data,
      confidence: result.confidence,
      tokens: result.tokens,
      response_time_ms: result.response_time_ms,
    });
  } catch (error) {
    console.error('[cpq-ai-parse] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
