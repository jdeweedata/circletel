/**
 * Admin WhatsApp Stats API
 *
 * Returns WhatsApp notification statistics for the dashboard.
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const supabase = await createClient();

    // Get message stats from whatsapp_message_log
    const { data: messageStats, error: statsError } = await supabase
      .from('whatsapp_message_log')
      .select('status');

    if (statsError) {
      apiLogger.error('[WhatsApp Stats] Failed to fetch message stats', { error: statsError.message });
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    // Count by status
    const stats = {
      totalSent: messageStats?.length || 0,
      delivered: messageStats?.filter(m => m.status === 'delivered').length || 0,
      read: messageStats?.filter(m => m.status === 'read').length || 0,
      failed: messageStats?.filter(m => m.status === 'failed').length || 0,
      customersWithConsent: 0,
    };

    // Get customers with WhatsApp consent
    const { count: consentCount, error: consentError } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('whatsapp_consent', true);

    if (!consentError) {
      stats.customersWithConsent = consentCount || 0;
    }

    return NextResponse.json(stats);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[WhatsApp Stats] Error', { error: errorMsg });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
