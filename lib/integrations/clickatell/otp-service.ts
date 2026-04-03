/**
 * OTP Service
 * Handles OTP generation, storage, and verification
 */

import { createClient } from '@/integrations/supabase/server';

interface OTPRecord {
  phone: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
}

// In-memory store for OTPs (consider using Redis or database for production)
const otpStore = new Map<string, OTPRecord>();

export class OTPService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 3;

  /**
   * Generate a random 6-digit OTP code
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP for a phone number
   */
  async storeOTP(phone: string, otp: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    otpStore.set(phone, {
      phone,
      otp,
      expiresAt,
      attempts: 0,
    });

    // Also store in database for persistence
    try {
      const supabase = await createClient();
      const now = new Date();

      // Delete any existing unverified OTP for this phone
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('email', phone)
        .eq('verified', false);

      // Insert new OTP
      await supabase.from('otp_verifications').insert({
        email: phone, // Using email column to store phone number
        otp: otp,
        type: 'phone_verification',
        expires_at: expiresAt.toISOString(),
        created_at: now.toISOString(),
        verified: false,
      });
    } catch (error) {
      console.error('Error storing OTP in database:', error);
      // Continue with in-memory storage
    }
  }

  /**
   * Verify OTP code for a phone number.
   * Checks in-memory store first, falls back to database for serverless environments
   * where the verify request may hit a different instance than the send request.
   */
  async verifyOTP(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const record = otpStore.get(phone);

    // --- In-memory path ---
    if (record) {
      if (new Date() > record.expiresAt) {
        otpStore.delete(phone);
        return { success: false, error: 'OTP has expired. Please request a new code.' };
      }
      if (record.attempts >= this.MAX_ATTEMPTS) {
        otpStore.delete(phone);
        return { success: false, error: 'Maximum verification attempts exceeded. Please request a new code.' };
      }

      record.attempts++;
      otpStore.set(phone, record);

      if (record.otp !== otp) {
        return { success: false, error: `Invalid OTP code. ${this.MAX_ATTEMPTS - record.attempts} attempts remaining.` };
      }

      otpStore.delete(phone);
      await this._markVerifiedInDb(phone, otp);
      return { success: true };
    }

    // --- Database fallback (different serverless instance) ---
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('otp, expires_at, verified, attempts')
        .eq('email', phone)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { success: false, error: 'No OTP found for this phone number. Please request a new code.' };
      }

      if (new Date() > new Date(data.expires_at)) {
        return { success: false, error: 'OTP has expired. Please request a new code.' };
      }

      const dbAttempts: number = (data.attempts as number) ?? 0;
      if (dbAttempts >= this.MAX_ATTEMPTS) {
        return { success: false, error: 'Maximum verification attempts exceeded. Please request a new code.' };
      }

      // Increment attempts in DB
      await supabase
        .from('otp_verifications')
        .update({ attempts: dbAttempts + 1 })
        .eq('email', phone)
        .eq('verified', false);

      if (data.otp !== otp) {
        return { success: false, error: `Invalid OTP code. ${this.MAX_ATTEMPTS - (dbAttempts + 1)} attempts remaining.` };
      }

      await this._markVerifiedInDb(phone, otp);
      return { success: true };
    } catch (dbError) {
      console.error('[OTPService] Database fallback verification failed:', dbError);
      return { success: false, error: 'Verification failed. Please request a new code.' };
    }
  }

  private async _markVerifiedInDb(phone: string, otp: string): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase
        .from('otp_verifications')
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq('email', phone)
        .eq('otp', otp);
    } catch (error) {
      console.error('[OTPService] Error marking OTP as verified in database:', error);
    }
  }

  /**
   * Check if phone number has a pending OTP (database-backed for serverless)
   */
  async hasPendingOTP(phone: string): Promise<boolean> {
    // Check in-memory first
    const record = otpStore.get(phone);
    if (record && new Date() <= record.expiresAt) {
      return true;
    }

    // Check database for serverless environment
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('expires_at, created_at')
        .eq('email', phone)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return false;

      const expiresAt = new Date(data.expires_at);
      const createdAt = new Date(data.created_at);
      const now = new Date();

      // Check if expired
      if (now > expiresAt) {
        // Clean up expired OTP
        await supabase
          .from('otp_verifications')
          .delete()
          .eq('email', phone)
          .eq('verified', false);
        return false;
      }

      // Check if OTP was sent recently (within 60 seconds rate limit)
      const secondsSinceCreation = (now.getTime() - createdAt.getTime()) / 1000;

      if (secondsSinceCreation < 60) {
        return true; // Rate limit: 60 seconds between requests
      }

      return false;
    } catch (error) {
      console.error('Error checking pending OTP in database:', error);
      // Fall back to in-memory check
      return !!(record && new Date() <= record.expiresAt);
    }
  }

  /**
   * Check if a phone number was recently verified (within the last 5 minutes).
   * Used by phone-signup to confirm the OTP step completed without re-consuming
   * an already-verified token.
   */
  async verifyRecentlyVerified(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('verified_at')
        .eq('email', phone)
        .eq('verified', true)
        .gte('verified_at', fiveMinutesAgo)
        .order('verified_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { success: false, error: 'Phone verification not found or expired. Please verify your phone number again.' };
      }
      return { success: true };
    } catch (err) {
      console.error('[OTPService] verifyRecentlyVerified failed:', err);
      return { success: false, error: 'Verification check failed. Please try again.' };
    }
  }

  /**
   * Clear OTP for a phone number
   */
  clearOTP(phone: string): void {
    otpStore.delete(phone);
  }
}

// Export singleton instance
export const otpService = new OTPService();
