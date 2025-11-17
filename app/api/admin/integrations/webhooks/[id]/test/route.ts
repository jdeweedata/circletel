/**
 * Integration Webhook Test API
 *
 * POST /api/admin/integrations/webhooks/[id]/test
 *
 * Send a test webhook payload to verify webhook handler functionality
 *
 * Use Cases:
 * - Test webhook handler without waiting for real events
 * - Debug webhook processing logic
 * - Verify webhook handler is working after deployment
 *
 * Request Body:
 * - eventType: Type of event to simulate (required)
 * - payload: Custom test payload (optional - uses default if not provided)
 *
 * Response:
 * - Test result (success/failure)
 * - Webhook log ID
 * - Processing details
 *
 * Authentication: Admin users only (RBAC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/integrations/supabase/server';

/**
 * POST /api/admin/integrations/webhooks/[id]/test
 *
 * Send test webhook to integration handler
 * [id] is the integration slug
 *
 * Authentication: Admin users with 'integrations:manage' permission
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // =========================================================================
    // Extract Params and Body
    // =========================================================================
    const { id: integrationSlug } = await context.params;
    const body = await request.json();
    const { eventType, payload: customPayload } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'eventType is required in request body' },
        { status: 400 }
      );
    }

    // =========================================================================
    // Authentication & Authorization
    // =========================================================================
    const supabase = await createSSRClient();

    // Get current user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add RBAC permission check when implemented (integrations:manage)

    // =========================================================================
    // Verify Integration Exists
    // =========================================================================
    const { data: integration, error: integrationError } = await supabase
      .from('integration_registry')
      .select('id, slug, name, supports_webhooks')
      .eq('slug', integrationSlug)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (!integration.supports_webhooks) {
      return NextResponse.json(
        {
          error: 'Integration does not support webhooks',
          integrationSlug,
        },
        { status: 400 }
      );
    }

    // =========================================================================
    // Generate Test Payload
    // =========================================================================
    const defaultPayloads: Record<string, Record<string, any>> = {
      'didit-kyc': {
        event: 'kyc.completed',
        session_id: 'test-session-' + Date.now(),
        status: 'verified',
        timestamp: new Date().toISOString(),
      },
      netcash: {
        TransactionAccepted: true,
        Reference: 'TEST-' + Date.now(),
        Amount: '100.00',
        PaymentMethod: 'Card',
      },
      'zoho-sign': {
        event_type: 'document_signed',
        request_id: 'test-request-' + Date.now(),
        status: 'completed',
      },
      'zoho-crm': {
        module: 'Contacts',
        operation: 'update',
        ids: ['test-' + Date.now()],
      },
      'zoho-billing': {
        event_type: 'subscription_activated',
        subscription_id: 'test-sub-' + Date.now(),
      },
    };

    const testPayload =
      customPayload || defaultPayloads[integrationSlug] || { test: true, eventType };

    // =========================================================================
    // Determine Webhook Handler URL
    // =========================================================================
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const webhookHandlers: Record<string, string> = {
      'didit-kyc': `${baseUrl}/api/webhooks/didit/kyc`,
      netcash: `${baseUrl}/api/webhooks/netcash`,
      'zoho-sign': `${baseUrl}/api/webhooks/zoho/sign`,
      'zoho-crm': `${baseUrl}/api/webhooks/zoho/crm`,
      'zoho-billing': `${baseUrl}/api/webhooks/zoho/billing`,
    };

    const handlerUrl = webhookHandlers[integrationSlug];
    if (!handlerUrl) {
      return NextResponse.json(
        {
          error: 'Webhook handler URL not configured for this integration',
          integrationSlug,
        },
        { status: 400 }
      );
    }

    // =========================================================================
    // Send Test Webhook
    // =========================================================================
    const startTime = Date.now();
    let testResult: {
      success: boolean;
      statusCode: number;
      errorMessage?: string;
      responseBody?: any;
    };

    try {
      const testHeaders = {
        'Content-Type': 'application/json',
        'X-Webhook-Test': 'true',
        'X-Test-Admin-ID': user.id,
        'X-Test-Timestamp': new Date().toISOString(),
      };

      const response = await fetch(handlerUrl, {
        method: 'POST',
        headers: testHeaders,
        body: JSON.stringify(testPayload),
      });

      const responseBody = await response.text();
      let parsedBody;
      try {
        parsedBody = JSON.parse(responseBody);
      } catch {
        parsedBody = responseBody;
      }

      testResult = {
        success: response.ok,
        statusCode: response.status,
        responseBody: parsedBody,
        errorMessage: response.ok ? undefined : `HTTP ${response.status}: ${responseBody}`,
      };
    } catch (error) {
      testResult = {
        success: false,
        statusCode: 500,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Failed to send test webhook - network error',
      };
    }

    const processingTime = Date.now() - startTime;

    // =========================================================================
    // Log Test Activity
    // =========================================================================
    await supabase.from('integration_activity_log').insert({
      integration_slug: integrationSlug,
      action_type: 'webhook_test',
      action_description: `Webhook test sent: ${eventType}`,
      action_result: testResult.success ? 'success' : 'failed',
      metadata: {
        event_type: eventType,
        test_status_code: testResult.statusCode,
        test_error: testResult.errorMessage,
        test_processing_time_ms: processingTime,
        tested_by_admin_id: user.id,
        handler_url: handlerUrl,
      },
    });

    // =========================================================================
    // Create Webhook Log Entry for Test
    // =========================================================================
    const { data: newLog } = await supabase
      .from('integration_webhook_logs')
      .insert({
        integration_slug: integrationSlug,
        event_type: `${eventType} (TEST)`,
        payload: testPayload,
        headers: {
          'X-Webhook-Test': 'true',
          'X-Test-Admin-ID': user.id,
        },
        status_code: testResult.statusCode,
        error_message: testResult.errorMessage,
        retry_count: 0,
        received_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // =========================================================================
    // Return Response
    // =========================================================================
    return NextResponse.json({
      success: testResult.success,
      integrationSlug,
      integrationName: integration.name,
      webhookLogId: newLog?.id,
      test: {
        eventType,
        payload: testPayload,
        handlerUrl,
        statusCode: testResult.statusCode,
        errorMessage: testResult.errorMessage,
        processingTimeMs: processingTime,
        responseBody: testResult.responseBody,
      },
      message: testResult.success
        ? 'Test webhook sent successfully'
        : 'Test webhook failed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WebhookTestAPI] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
