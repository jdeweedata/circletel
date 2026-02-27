/**
 * Ambassador Authentication Utilities
 *
 * Client-side helpers for ambassador authentication and authorization.
 */

import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

export interface Ambassador {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  social_platform: string | null;
  social_handle: string | null;
  website_url: string | null;
  audience_size: number | null;
  ambassador_number: string | null;
  tier: 'starter' | 'rising' | 'star' | 'elite';
  commission_rate: number;
  status: 'pending' | 'approved' | 'suspended' | 'inactive';
  approved_by: string | null;
  approved_at: string | null;
  total_clicks: number;
  total_conversions: number;
  total_earnings: number;
  pending_earnings: number;
  created_at: string;
  updated_at: string;
}

export type AmbassadorTier = Ambassador['tier'];
export type AmbassadorStatus = Ambassador['status'];

/**
 * Tier configuration with commission rates
 */
export const AMBASSADOR_TIERS: Record<
  AmbassadorTier,
  { label: string; rate: number; minConversions: number }
> = {
  starter: { label: 'Starter', rate: 5, minConversions: 0 },
  rising: { label: 'Rising', rate: 7.5, minConversions: 10 },
  star: { label: 'Star', rate: 10, minConversions: 50 },
  elite: { label: 'Elite', rate: 15, minConversions: 100 },
};

/**
 * Get the current ambassador (client-side)
 */
export async function getCurrentAmbassador(): Promise<Ambassador | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;

  return data as Ambassador;
}

/**
 * Get ambassador by ID (server-side)
 */
export async function getAmbassadorById(
  ambassadorId: string
): Promise<Ambassador | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .eq('id', ambassadorId)
    .single();

  if (error || !data) return null;

  return data as Ambassador;
}

/**
 * Get ambassador by user ID (server-side)
 */
export async function getAmbassadorByUserId(
  userId: string
): Promise<Ambassador | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return data as Ambassador;
}

/**
 * Check if user is an approved ambassador (server-side)
 */
export async function isApprovedAmbassador(userId: string): Promise<boolean> {
  const ambassador = await getAmbassadorByUserId(userId);
  return ambassador?.status === 'approved';
}

/**
 * Calculate the next tier for an ambassador
 */
export function getNextTier(
  currentTier: AmbassadorTier,
  conversions: number
): { tier: AmbassadorTier; conversionsNeeded: number } | null {
  const tierOrder: AmbassadorTier[] = ['starter', 'rising', 'star', 'elite'];
  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === tierOrder.length - 1) {
    return null; // Already at max tier
  }

  const nextTier = tierOrder[currentIndex + 1];
  const conversionsNeeded = AMBASSADOR_TIERS[nextTier].minConversions - conversions;

  return {
    tier: nextTier,
    conversionsNeeded: Math.max(0, conversionsNeeded),
  };
}

/**
 * Update ambassador tier based on conversions (server-side)
 */
export async function updateAmbassadorTier(
  ambassadorId: string
): Promise<AmbassadorTier | null> {
  const supabase = await createServerClient();

  // Get current ambassador
  const { data: ambassador, error: fetchError } = await supabase
    .from('ambassadors')
    .select('total_conversions, tier')
    .eq('id', ambassadorId)
    .single();

  if (fetchError || !ambassador) return null;

  // Determine new tier based on conversions
  let newTier: AmbassadorTier = 'starter';
  const conversions = ambassador.total_conversions;

  if (conversions >= AMBASSADOR_TIERS.elite.minConversions) {
    newTier = 'elite';
  } else if (conversions >= AMBASSADOR_TIERS.star.minConversions) {
    newTier = 'star';
  } else if (conversions >= AMBASSADOR_TIERS.rising.minConversions) {
    newTier = 'rising';
  }

  // Update if tier changed
  if (newTier !== ambassador.tier) {
    const newRate = AMBASSADOR_TIERS[newTier].rate;

    const { error: updateError } = await supabase
      .from('ambassadors')
      .update({
        tier: newTier,
        commission_rate: newRate,
      })
      .eq('id', ambassadorId);

    if (updateError) {
      console.error('Error updating ambassador tier:', updateError);
      return null;
    }
  }

  return newTier;
}

/**
 * Approve an ambassador (admin action)
 */
export async function approveAmbassador(
  ambassadorId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('ambassadors')
    .update({
      status: 'approved',
      approved_by: adminUserId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', ambassadorId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Suspend an ambassador (admin action)
 */
export async function suspendAmbassador(
  ambassadorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('ambassadors')
    .update({ status: 'suspended' })
    .eq('id', ambassadorId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
