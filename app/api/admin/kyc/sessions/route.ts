/**
 * Admin KYC Sessions API Route
 * Fetches all KYC sessions for admin review with customer data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    // Use service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const verificationResult = searchParams.get('verification_result');

    // Build query to fetch KYC sessions with related customer data
    let query = supabase
      .from('kyc_sessions')
      .select(`
        *,
        quote:business_quotes (
          id,
          contact_name,
          contact_email,
          contact_phone,
          customer_id,
          company_name
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by verification result if provided
    if (verificationResult && verificationResult !== 'all') {
      query = query.eq('verification_result', verificationResult);
    }

    const { data: sessions, error } = await query;

    if (error) {
      apiLogger.error('Database error', { error });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch KYC sessions' },
        { status: 500 }
      );
    }

    // Enrich sessions with order data if stored in extracted_data
    const enrichedSessions = await Promise.all(
      (sessions || []).map(async (session) => {
        let orderData = null;

        // Try to get order data from extracted_data
        const orderId = session.extracted_data?.order_id;
        if (orderId) {
          const { data: order } = await supabase
            .from('consumer_orders')
            .select('id, order_number, email, first_name, last_name, phone, status')
            .eq('id', orderId)
            .single();

          orderData = order;
        }

        return {
          ...session,
          order: orderData,
          customer_name: orderData?.first_name && orderData?.last_name
            ? `${orderData.first_name} ${orderData.last_name}`
            : session.quote?.contact_name || 'Unknown',
          customer_email: orderData?.email || session.quote?.contact_email || 'N/A',
          customer_phone: orderData?.phone || session.quote?.contact_phone || 'N/A',
        };
      })
    );

    return NextResponse.json({
      success: true,
      sessions: enrichedSessions,
    });
  } catch (error: any) {
    apiLogger.error('API error', { error });
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
