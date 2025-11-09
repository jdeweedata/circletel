/**
 * Test Email API Endpoint
 * Test React Email templates and notification system
 */

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedEmailService } from '@/lib/emails/enhanced-notification-service';
import { EmailRenderer, type EmailTemplateId } from '@/lib/emails/email-renderer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =============================================================================
// POST /api/emails/test
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, to, templateId, props } = body;

    // Action: Send email
    if (action === 'send') {
      if (!to) {
        return NextResponse.json(
          { error: 'Email address (to) is required' },
          { status: 400 }
        );
      }

      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        );
      }

      const result = await EnhancedEmailService.sendEmail({
        to,
        templateId: templateId as EmailTemplateId,
        props: props || {},
      });

      return NextResponse.json(result);
    }

    // Action: Preview HTML
    if (action === 'preview') {
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        );
      }

      const { html, text, subject } = await EmailRenderer.renderTemplate({
        templateId: templateId as EmailTemplateId,
        props: props || {},
        pretty: true,
      });

      return NextResponse.json({ html, text, subject });
    }

    // Action: Send test to Shaun
    if (action === 'send-test-shaun') {
      const result = await EnhancedEmailService.sendOrderConfirmation({
        id: 'test-order-id',
        order_number: 'ORD-TEST-20251108',
        email: 'shaunr07@gmail.com',
        first_name: 'Shaun',
        last_name: 'Robertson',
        package_name: '100Mbps Fibre',
        package_speed: '100Mbps',
        package_price: 799.00,
        installation_fee: 0.00,
        installation_address: '123 Test Street, Cape Town',
        installation_date: '15 November 2025',
      });

      return NextResponse.json(result);
    }

    // Action: List templates
    if (action === 'list') {
      const templates = EmailRenderer.getAvailableTemplates();
      return NextResponse.json({
        templates: templates.map((id) => EmailRenderer.getTemplateInfo(id)),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: send, preview, send-test-shaun, or list' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET /api/emails/test
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // List all available templates
  if (action === 'list' || !action) {
    const templates = EmailRenderer.getAvailableTemplates();
    return NextResponse.json({
      count: templates.length,
      templates: templates.map((id) => EmailRenderer.getTemplateInfo(id)),
    });
  }

  // Preview a template
  if (action === 'preview') {
    const templateId = searchParams.get('template') as EmailTemplateId;
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID required' },
        { status: 400 }
      );
    }

    const html = await EmailRenderer.previewTemplate(templateId, {
      customerName: 'Preview User',
      orderNumber: 'ORD-PREVIEW-001',
      orderUrl: 'https://www.circletel.co.za/orders/preview',
      packageName: '100Mbps Fibre',
      packageSpeed: '100Mbps',
      monthlyAmount: 'R 799.00',
      installationFee: 'R 0.00',
      totalAmount: 'R 799.00',
      installationAddress: '123 Preview Street, Cape Town',
      installationDate: 'To be scheduled',
      // Add more default props as needed
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
