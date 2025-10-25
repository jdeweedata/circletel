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
      await supabase.from('otp_verifications').upsert({
        email: phone, // Using email column to store phone number
        otp: otp,
        type: 'phone_verification',
        expires_at: expiresAt.toISOString(),
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
   * Check if phone number has a pending OTP
   */
  hasPendingOTP(phone: string): boolean {
    const record = otpStore.get(phone);
    if (!record) return false;
    
    // Check if expired
    if (new Date() > record.expiresAt) {
      otpStore.delete(phone);
      return false;
    }

    return true;
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
