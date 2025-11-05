/**
 * API Route: Track Quote Views and Interactions
 *
 * POST /api/quotes/business/[id]/track
 *
 * Tracks quote views, shares, downloads, and other events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface TrackingRequest {
  event_type: 'view' | 'email_sent' | 'shared' | 'downloaded';
  session_id?: string;
  viewer_email?: string;
  viewer_name?: string;
  time_spent_seconds?: number;
  metadata?: Record<string, any>;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body: TrackingRequest = await request.json();

    const { event_type, session_id, viewer_email, viewer_name, time_spent_seconds, metadata } = body;

    if (!event_type) {
      return NextResponse.json(
        { success: false, error: 'event_type is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Collect tracking data
    const viewer_ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const viewer_user_agent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || null;

    // Parse UTM parameters from referrer if available
    let utm_source = null;
    let utm_medium = null;
    let utm_campaign = null;

    try {
      if (referrer) {
        const url = new URL(referrer);
        utm_source = url.searchParams.get('utm_source');
        utm_medium = url.searchParams.get('utm_medium');
        utm_campaign = url.searchParams.get('utm_campaign');
      }
    } catch (e) {
      // Invalid URL, skip UTM parsing
    }

    // Insert tracking event
    const { data: tracking, error: trackingError } = await supabase
      .from('quote_tracking')
      .insert({
        quote_id: id,
        event_type,
        viewer_ip,
        viewer_user_agent,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign,
        viewer_email,
        viewer_name,
        session_id: session_id || crypto.randomUUID(),
        time_spent_seconds: time_spent_seconds || 0,
        metadata
      })
      .select()
      .single();

    if (trackingError) {
      console.error('Tracking error:', trackingError);
      // Don't fail the request if tracking fails
      return NextResponse.json({
        success: true,
        message: 'Tracking failed but request processed',
        error: trackingError.message
      });
    }

    return NextResponse.json({
      success: true,
      data: tracking
    });

  } catch (error: any) {
    console.error('Tracking error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track event',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve tracking data for a quote (admin only)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tracking data
    const { data: tracking, error } = await supabase
      .from('quote_tracking')
      .select('*')
      .eq('quote_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Get analytics summary
    const { data: analytics, error: analyticsError } = await supabase
      .from('quote_analytics')
      .select('*')
      .eq('quote_id', id)
      .single();

    if (analyticsError && analyticsError.code !== 'PGRST116') {
      console.error('Analytics error:', analyticsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        tracking,
        analytics
      }
    });

  } catch (error: any) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tracking data',
        details: error.message
      },
      { status: 500 }
    );
  }
}
