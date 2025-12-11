/**
 * Clickatell Mandate SMS Service
 * 
 * Sends eMandate signing links via Clickatell with delivery tracking.
 * This provides visibility into SMS delivery status that NetCash doesn't offer.
 */

import { ClickatellService } from './sms-service';

interface MandateSMSParams {
  phoneNumber: string;
  customerName: string;
  accountReference: string;
  mandateUrl: string;
  amount: number;
}

interface MandateSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveryStatus?: string;
}

interface DeliveryStatusResult {
  success: boolean;
  status?: 'pending' | 'delivered' | 'failed' | 'expired' | 'unknown';
  statusCode?: string;
  statusDescription?: string;
  deliveredAt?: string;
  error?: string;
}

export class MandateSMSService {
  private clickatell: ClickatellService;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.clickatell = new ClickatellService();
    this.apiKey = process.env.CLICKATELL_API_KEY || '';
    this.baseUrl = process.env.CLICKATELL_BASE_URL || 'https://platform.clickatell.com/v1';
  }

  /**
   * Send mandate signing SMS via Clickatell
   */
  async sendMandateSMS(params: MandateSMSParams): Promise<MandateSMSResult> {
    const { phoneNumber, customerName, accountReference, mandateUrl, amount } = params;

    // Build SMS message
    const message = this.buildMandateMessage({
      customerName,
      accountReference,
      mandateUrl,
      amount,
    });

    console.log(`[Mandate SMS] Sending to ${phoneNumber} for account ${accountReference}`);

    const result = await this.clickatell.sendSMS({
      to: phoneNumber,
      text: message,
    });

    if (result.success) {
      console.log(`[Mandate SMS] Sent successfully. MessageId: ${result.messageId}`);
    } else {
      console.error(`[Mandate SMS] Failed to send: ${result.error}`);
    }

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  }

  /**
   * Build the mandate SMS message
   */
  private buildMandateMessage(params: {
    customerName: string;
    accountReference: string;
    mandateUrl: string;
    amount: number;
  }): string {
    const { customerName, accountReference, mandateUrl, amount } = params;
    const firstName = customerName.split(' ')[0];
    const formattedAmount = `R${amount.toFixed(2)}`;

    return `Hi ${firstName}, please authorize your CircleTel debit order (${formattedAmount}/month) for account ${accountReference}. Click here to sign: ${mandateUrl} - CircleTel`;
  }

  /**
   * Check SMS delivery status via Clickatell API
   * 
   * Clickatell provides delivery reports via:
   * 1. Webhook callbacks (recommended)
   * 2. Polling the message status endpoint
   */
  async checkDeliveryStatus(messageId: string): Promise<DeliveryStatusResult> {
    if (!messageId || messageId === 'sent') {
      return {
        success: false,
        error: 'Invalid message ID',
      };
    }

    try {
      // Clickatell Platform API v1 - Get message status
      const response = await fetch(`${this.baseUrl}/message/${messageId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Mandate SMS] Status check failed: ${response.status}`, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      console.log(`[Mandate SMS] Status for ${messageId}:`, data);

      // Map Clickatell status codes to our status
      const status = this.mapClickatellStatus(data.status || data.statusCode);

      return {
        success: true,
        status,
        statusCode: data.statusCode?.toString() || data.status,
        statusDescription: data.statusDescription || data.description,
        deliveredAt: data.timestamp || data.deliveredAt,
      };

    } catch (error) {
      console.error('[Mandate SMS] Error checking delivery status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check status',
      };
    }
  }

  /**
   * Map Clickatell status codes to simplified status
   * 
   * Clickatell status codes:
   * 001 - Message unknown
   * 002 - Message queued
   * 003 - Delivered to gateway
   * 004 - Received by recipient
   * 005 - Error with message
   * 006 - User cancelled message delivery
   * 007 - Error delivering message
   * 008 - OK (message received by gateway)
   * 009 - Routing error
   * 010 - Message expired
   * 011 - Message queued for later delivery
   * 012 - Out of credit
   * 014 - Maximum MT limit exceeded
   */
  private mapClickatellStatus(statusCode: string | number): 'pending' | 'delivered' | 'failed' | 'expired' | 'unknown' {
    const code = statusCode?.toString();
    
    switch (code) {
      case '004':
        return 'delivered';
      case '002':
      case '003':
      case '008':
      case '011':
        return 'pending';
      case '010':
        return 'expired';
      case '005':
      case '006':
      case '007':
      case '009':
      case '012':
      case '014':
        return 'failed';
      default:
        return 'unknown';
    }
  }

  /**
   * Format phone number to international format for Clickatell
   */
  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = '27' + cleaned.substring(1);
    }

    if (!cleaned.startsWith('27') && !cleaned.startsWith('+')) {
      cleaned = '27' + cleaned;
    }

    cleaned = cleaned.replace('+', '');

    return cleaned;
  }
}

export const mandateSMSService = new MandateSMSService();
