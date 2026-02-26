import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import {
  chat,
  extractData,
  createUsageRecord,
} from '@/lib/partners/feasibility-ai-service';
import { ChatMessage, ChatResponse } from '@/lib/partners/feasibility-types';

/**
 * POST /api/partners/feasibility/chat
 *
 * Send a message to the AI assistant and get a response
 */
export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body = await request.json();
    const { message, request_id, extract } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabaseAuth = await createClientWithSession();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get partner record and verify approved status
    const supabase = await createClient();
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, business_name, status')
      .eq('user_id', user.id)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    if (partner.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Partner must be approved to use this feature' },
        { status: 403 }
      );
    }

    // Get chat history if request_id provided
    let chatHistory: ChatMessage[] = [];
    if (request_id) {
      const { data: requestData, error: requestError } = await supabase
        .from('partner_feasibility_requests')
        .select('chat_history')
        .eq('id', request_id)
        .eq('partner_id', partner.id)
        .single();

      if (requestError) {
        apiLogger.warn('Could not load chat history', { error: requestError.message });
      } else if (requestData?.chat_history) {
        chatHistory = requestData.chat_history;
      }
    }

    // Call AI service
    const result = await chat(message, chatHistory, {
      partner_name: partner.business_name,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Build new message entries
    const timestamp = new Date().toISOString();
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp,
    };
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: result.response!,
      timestamp,
    };

    // If extract flag is set, run extraction
    let extractedData = undefined;
    if (extract) {
      const extractionResult = await extractData([...chatHistory, userMessage, assistantMessage]);
      if (extractionResult.success && extractionResult.data) {
        extractedData = extractionResult.data;
        assistantMessage.extracted_data = extractedData;

        // Log extraction usage
        const extractionUsage = createUsageRecord(
          partner.id,
          'extraction',
          extractionResult,
          request_id
        );
        await supabase.from('partner_ai_usage').insert(extractionUsage);
      }
    }

    // Save chat history if request_id exists
    if (request_id) {
      const updatedHistory = [...chatHistory, userMessage, assistantMessage];
      await supabase
        .from('partner_feasibility_requests')
        .update({ chat_history: updatedHistory })
        .eq('id', request_id)
        .eq('partner_id', partner.id);
    }

    // Log AI usage
    const usageRecord = createUsageRecord(partner.id, 'chat', result, request_id);
    await supabase.from('partner_ai_usage').insert(usageRecord);

    return NextResponse.json({
      success: true,
      response: result.response,
      extracted_data: extractedData,
    });
  } catch (error) {
    apiLogger.error('[feasibility/chat] Error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
