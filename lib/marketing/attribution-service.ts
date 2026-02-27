/**
 * Attribution Service
 *
 * Handles marketing attribution tracking for ambassadors, partners, and campaigns.
 * Tracks clicks, signups, and conversions with proper attribution.
 */

import { createClient } from '@/lib/supabase/server';

export type SourceType =
  | 'ambassador'
  | 'partner'
  | 'campaign'
  | 'organic'
  | 'direct'
  | 'referral';

export type EventType =
  | 'click'
  | 'signup'
  | 'quote_request'
  | 'order'
  | 'payment';

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export interface AttributionEvent {
  source_type: SourceType;
  source_id?: string;
  tracking_code?: string;
  event_type: EventType;
  customer_id?: string;
  order_id?: string;
  order_type?: 'consumer' | 'business';
  order_value?: number;
  commission_amount?: number;
  commission_status?: CommissionStatus;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface TrackingCode {
  id: string;
  code: string;
  ambassador_id?: string;
  partner_id?: string;
  campaign_id?: string;
  destination_url: string;
  discount_type?: 'percentage' | 'fixed' | 'none';
  discount_value?: number;
  is_active: boolean;
}

/**
 * Look up a tracking code and return attribution info
 */
export async function lookupTrackingCode(
  code: string
): Promise<TrackingCode | null> {
  const supabase = await createClient();

  // Try ambassador codes first
  const { data: ambassadorCode } = await supabase
    .from('ambassador_codes')
    .select('id, code, ambassador_id, destination_url, discount_type, discount_value, is_active')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (ambassadorCode) {
    return {
      id: ambassadorCode.id,
      code: ambassadorCode.code,
      ambassador_id: ambassadorCode.ambassador_id,
      destination_url: ambassadorCode.destination_url || '/',
      discount_type: ambassadorCode.discount_type || undefined,
      discount_value: ambassadorCode.discount_value || undefined,
      is_active: ambassadorCode.is_active,
    };
  }

  // Could extend to check partner codes or campaign codes here
  // const { data: partnerCode } = await supabase...

  return null;
}

/**
 * Track a click event
 */
export async function trackClick(
  code: string,
  metadata: {
    session_id?: string;
    ip_address?: string;
    user_agent?: string;
    referrer_url?: string;
  }
): Promise<{ success: boolean; destination: string; error?: string }> {
  const supabase = await createClient();

  // Look up the code
  const trackingCode = await lookupTrackingCode(code);

  if (!trackingCode) {
    return { success: false, destination: '/', error: 'Invalid tracking code' };
  }

  // Determine source type and ID
  let sourceType: SourceType = 'direct';
  let sourceId: string | undefined;

  if (trackingCode.ambassador_id) {
    sourceType = 'ambassador';
    sourceId = trackingCode.ambassador_id;
  }
  // Could add partner_id, campaign_id checks here

  // Log the click event
  const { error } = await supabase.from('attribution_logs').insert({
    source_type: sourceType,
    source_id: sourceId,
    tracking_code: code.toUpperCase(),
    event_type: 'click',
    session_id: metadata.session_id,
    ip_address: metadata.ip_address,
    user_agent: metadata.user_agent,
    referrer_url: metadata.referrer_url,
  });

  if (error) {
    console.error('Error tracking click:', error);
    // Don't fail the redirect just because tracking failed
  }

  return {
    success: true,
    destination: trackingCode.destination_url,
  };
}

/**
 * Track a conversion event (signup, order, payment)
 */
export async function trackConversion(
  event: Omit<AttributionEvent, 'event_type'> & { event_type: 'signup' | 'quote_request' | 'order' | 'payment' }
): Promise<{ success: boolean; log_id?: string; error?: string }> {
  const supabase = await createClient();

  // Calculate commission if order value provided
  let commissionAmount = event.commission_amount;

  if (event.order_value && event.source_id && !commissionAmount) {
    // Look up source to get commission rate
    if (event.source_type === 'ambassador') {
      const { data: ambassador } = await supabase
        .from('ambassadors')
        .select('commission_rate')
        .eq('id', event.source_id)
        .single();

      if (ambassador) {
        commissionAmount = (event.order_value * ambassador.commission_rate) / 100;
      }
    }
    // Could add partner commission calculation here
  }

  const { data, error } = await supabase
    .from('attribution_logs')
    .insert({
      ...event,
      commission_amount: commissionAmount,
      commission_status: commissionAmount ? 'pending' : undefined,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error tracking conversion:', error);
    return { success: false, error: error.message };
  }

  return { success: true, log_id: data?.id };
}

/**
 * Get attribution stats for an ambassador
 */
export async function getAmbassadorStats(
  ambassadorId: string,
  period?: { start: Date; end: Date }
): Promise<{
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
}> {
  const supabase = await createClient();

  let query = supabase
    .from('attribution_logs')
    .select('event_type, order_value, commission_amount')
    .eq('source_type', 'ambassador')
    .eq('source_id', ambassadorId);

  if (period) {
    query = query
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString());
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error('Error fetching ambassador stats:', error);
    return { clicks: 0, conversions: 0, revenue: 0, commission: 0 };
  }

  const clicks = data.filter((e) => e.event_type === 'click').length;
  const conversions = data.filter((e) =>
    ['order', 'payment'].includes(e.event_type)
  ).length;
  const revenue = data
    .filter((e) => ['order', 'payment'].includes(e.event_type))
    .reduce((sum, e) => sum + (e.order_value || 0), 0);
  const commission = data
    .filter((e) => ['order', 'payment'].includes(e.event_type))
    .reduce((sum, e) => sum + (e.commission_amount || 0), 0);

  return { clicks, conversions, revenue, commission };
}

/**
 * Get top performing codes for an ambassador
 */
export async function getTopCodes(
  ambassadorId: string,
  limit = 5
): Promise<Array<{ code: string; clicks: number; conversions: number }>> {
  const supabase = await createClient();

  const { data: codes } = await supabase
    .from('ambassador_codes')
    .select('code, total_clicks, total_conversions')
    .eq('ambassador_id', ambassadorId)
    .order('total_conversions', { ascending: false })
    .limit(limit);

  return (
    codes?.map((c) => ({
      code: c.code,
      clicks: c.total_clicks,
      conversions: c.total_conversions,
    })) || []
  );
}

/**
 * Attribute a customer to a source based on session
 */
export async function attributeCustomer(
  customerId: string,
  sessionId: string
): Promise<{ attributed: boolean; source_type?: SourceType; source_id?: string }> {
  const supabase = await createClient();

  // Find the most recent click event for this session
  const { data: clickEvent } = await supabase
    .from('attribution_logs')
    .select('source_type, source_id, tracking_code')
    .eq('session_id', sessionId)
    .eq('event_type', 'click')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!clickEvent) {
    return { attributed: false };
  }

  // Log the signup attribution
  await trackConversion({
    source_type: clickEvent.source_type,
    source_id: clickEvent.source_id,
    tracking_code: clickEvent.tracking_code,
    event_type: 'signup',
    customer_id: customerId,
    session_id: sessionId,
  });

  return {
    attributed: true,
    source_type: clickEvent.source_type,
    source_id: clickEvent.source_id,
  };
}

/**
 * Approve commission for a conversion
 */
export async function approveCommission(
  logId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('attribution_logs')
    .update({ commission_status: 'approved' })
    .eq('id', logId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Mark commission as paid
 */
export async function markCommissionPaid(
  logId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the log to update ambassador pending earnings
  const { data: log, error: fetchError } = await supabase
    .from('attribution_logs')
    .select('source_type, source_id, commission_amount')
    .eq('id', logId)
    .single();

  if (fetchError || !log) {
    return { success: false, error: 'Log not found' };
  }

  // Update log status
  const { error: updateError } = await supabase
    .from('attribution_logs')
    .update({ commission_status: 'paid' })
    .eq('id', logId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Update ambassador earnings if applicable
  if (log.source_type === 'ambassador' && log.source_id && log.commission_amount) {
    await supabase.rpc('update_ambassador_earnings_on_payout', {
      p_ambassador_id: log.source_id,
      p_amount: log.commission_amount,
    });
  }

  return { success: true };
}
