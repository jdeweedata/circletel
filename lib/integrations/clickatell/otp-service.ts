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
   * Verify OTP code for a phone number
   */
  async verifyOTP(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const record = otpStore.get(phone);

    if (!record) {
      return {
        success: false,
        error: 'No OTP found for this phone number. Please request a new code.',
      };
    }

    // Check if expired
    if (new Date() > record.expiresAt) {
      otpStore.delete(phone);
      return {
        success: false,
        error: 'OTP has expired. Please request a new code.',
      };
    }

    // Check max attempts
    if (record.attempts >= this.MAX_ATTEMPTS) {
      otpStore.delete(phone);
      return {
        success: false,
        error: 'Maximum verification attempts exceeded. Please request a new code.',
      };
    }

    // Increment attempts
    record.attempts++;
    otpStore.set(phone, record);

    // Verify OTP
    if (record.otp !== otp) {
      return {
        success: false,
        error: `Invalid OTP code. ${this.MAX_ATTEMPTS - record.attempts} attempts remaining.`,
      };
    }

    // Success - remove from store
    otpStore.delete(phone);

    // Update database
    try {
      const supabase = await createClient();
      await supabase
        .from('otp_verifications')
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq('email', phone)
        .eq('otp', otp);
    } catch (error) {
      console.error('Error updating OTP verification in database:', error);
    }

    return { success: true };
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
   * Clear OTP for a phone number
   */
  clearOTP(phone: string): void {
    otpStore.delete(phone);
  }
}

// Export singleton instance
export const otpService = new OTPService();
