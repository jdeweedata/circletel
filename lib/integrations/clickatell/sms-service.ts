/**
 * Clickatell SMS Service
 * Handles sending SMS messages via Clickatell REST API
 */

interface ClickatellConfig {
  apiKey: string;
  apiId: string;
  baseUrl: string;
}

interface SendSMSParams {
  to: string; // Phone number in international format (e.g., 27821234567)
  text: string;
}

interface ClickatellResponse {
  messages: Array<{
    apiMessageId?: string;
    accepted?: boolean;
    to: string;
    error?: {
      code: string;
      description: string;
    };
  }>;
  error?: {
    code: string;
    description: string;
  };
}

export class ClickatellService {
  private config: ClickatellConfig;

  constructor() {
    this.config = {
      apiKey: process.env.CLICKATELL_API_KEY || '',
      apiId: process.env.CLICKATELL_API_ID || '',
      baseUrl: process.env.CLICKATELL_BASE_URL || 'https://platform.clickatell.com/v1/message',
    };

    if (!this.config.apiKey) {
      throw new Error('Clickatell API key is not configured');
    }
  }

  /**
   * Send SMS message via Clickatell Platform API v1
   */
  async sendSMS({ to, text }: SendSMSParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Ensure phone number is in international format (remove leading 0, add country code)
      const formattedPhone = this.formatPhoneNumber(to);

      console.log(`[ClickaTell] Sending SMS to ${formattedPhone}`);

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this.config.apiKey, // Platform API uses direct API key, not Bearer
        },
        body: JSON.stringify({
          messages: [
            {
              channel: 'sms',
              to: formattedPhone,
              content: text,
            }
          ]
        }),
      });

      const data: ClickatellResponse = await response.json();

      if (!response.ok) {
        console.error('Clickatell API error:', data);
        const errorMsg = data.error?.description || data.messages?.[0]?.error?.description || `HTTP ${response.status}: Failed to send SMS`;
        return {
          success: false,
          error: errorMsg,
        };
      }

      const message = data.messages[0];

      // Check if message has an error
      if (message.error) {
        return {
          success: false,
          error: message.error.description || 'Message was not accepted',
        };
      }

      // Success
      return {
        success: true,
        messageId: message.apiMessageId || 'sent',
      };

    } catch (error) {
      console.error('Error sending SMS via Clickatell:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }

  /**
   * Send OTP code via SMS
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const message = `Your CircleTel verification code is: ${otp}. This code will expire in 10 minutes.`;
    
    const result = await this.sendSMS({
      to: phoneNumber,
      text: message,
    });

    return {
      success: result.success,
      error: result.error,
    };
  }

  /**
   * Format phone number to international format
   * Converts South African numbers (0821234567) to international format (27821234567)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, replace with 27 (South Africa)
    if (cleaned.startsWith('0')) {
      cleaned = '27' + cleaned.substring(1);
    }

    // If doesn't start with country code, assume South Africa
    if (!cleaned.startsWith('27') && !cleaned.startsWith('+')) {
      cleaned = '27' + cleaned;
    }

    // Remove + if present
    cleaned = cleaned.replace('+', '');

    return cleaned;
  }
}

// Export singleton instance
export const clickatellService = new ClickatellService();
