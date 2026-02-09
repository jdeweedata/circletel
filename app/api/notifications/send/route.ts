/**
 * Notification Send API
 *
 * POST /api/notifications/send
 *
 * Manually trigger a notification for a quote event
 * Useful for testing and admin actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { QuoteNotificationService } from '@/lib/notifications/quote-notifications';
import type { NotificationEvent } from '@/lib/notifications/types';
import { notificationLogger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    if (!body.event || !body.quote_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: event, quote_id'
        },
        { status: 400 }
      );
    }

    // Validate event type
    const validEvents: NotificationEvent[] = [
      'quote_created',
      'quote_approved',
      'quote_sent',
      'quote_viewed',
      'quote_accepted',
      'quote_rejected',
      'quote_expired'
    ];

    if (!validEvents.includes(body.event)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid event. Must be one of: ${validEvents.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Send notification
    const result = await QuoteNotificationService.sendForQuoteEvent(
      body.event,
      body.quote_id,
      body.context || {}
    );

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          notification_id: result.notification_id,
          message: `Notification sent for ${body.event}`
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send notification'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    notificationLogger.error('Error in POST /api/notifications/send', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

